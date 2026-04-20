// src/controllers/aiController.js  — Gemini-first AI controller
'use strict';
const pdfParse   = require('pdf-parse');
const fetch      = require('node-fetch');

const { pool }               = require('../config/postgres');
const { AIConversation }     = require('../config/mongo');
const { cacheSet, cacheGet } = require('../config/redis');
const { checkAchievements }  = require('../services/achievementService');
const localAI                = require('../services/localAI');
const internalAI             = require('../services/internalAI');
const deepTutor              = require('../services/deepTutorService');
const geminiAI               = require('../services/geminiAI');
const CognitiveEngine        = require('../ai/core/CognitiveEngine');
const logger                 = require('../utils/logger');

const cognitiveEngine = new CognitiveEngine(internalAI, deepTutor);
cognitiveEngine.init().catch(e => logger.error('Failed to init CognitiveEngine:', e));

// ── PDF text fetch ───────────────────────────────────────────
async function fetchPdfText(fileUrl, maxChars = 10000) {
  const resp = await fetch(fileUrl);
  if (!resp.ok) throw new Error('Failed to fetch file');
  const buf  = Buffer.from(await resp.arrayBuffer());
  const data = await pdfParse(buf);
  return { text: data.text.slice(0, maxChars), pages: data.numpages };
}

// ── Provider Info ────────────────────────────────────────────
async function getProvider(req, res) {
  res.json({
    gemini: {
      available:      false,
      name:           'Deprecated External AI',
      description:    'Replaced by Najah Local AI',
      requiresApiKey: false,
    },
    internal: {
      available:      true,
      name:           'Najah Massive In-House AI',
      description:    'Fully autonomous, local AI engine powered by Xenova Transformers running in-house',
      requiresApiKey: false,
    },
    deeptutor: {
      available:      true,
      name:           'HKUDS DeepTutor Engine',
      description:    'Advanced Socratic AI framework adapted for 100% Arabic educational interactions.',
      requiresApiKey: false,
    },
  });
}

async function getCapabilities(req, res) {
  res.json({
    engine:          'Najah Massive In-House AI',
    geminiAvailable: false,
    features: {
      chat:         { supported: true },
      stream:       { supported: false },
      search:       { supported: false, note: 'External search disabled for privacy' },
      summary:      { supported: true },
      quiz:         { supported: true },
      studyPlan:    { supported: true },
      askFile:      { supported: true },
      youtube:      { supported: true },
      imageAnalysis:{ supported: false },
    },
  });
}

// ── Helper: save/update conversation ────────────────────────
async function saveToConversation(convId, userId, userMsg, replyMsg, language, title) {
  try {
    let conv = convId
      ? await AIConversation.findOne({ _id: convId, userId })
      : null;
    if (!conv) conv = new AIConversation({ userId, messages: [], language, provider: 'gemini' });
    conv.messages.push({ role: 'user',      content: userMsg  });
    conv.messages.push({ role: 'assistant', content: replyMsg });
    if (!conv.title || conv.title === 'New Chat') {
      conv.title = title || userMsg.slice(0, 60);
    }
    await conv.save();
    return conv;
  } catch (err) {
    logger.warn('Conversation save failed (MongoDB may be down):', err.message);
    return null;
  }
}

// ── Chat ─────────────────────────────────────────────────────
async function chat(req, res) {
  const { message, conversationId, language = 'en', withFollowUps = true } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  // Load history from DB
  let history = [];
  if (conversationId) {
    try {
      const conv = await AIConversation.findOne({ _id: conversationId, userId: req.user.id });
      history = conv?.messages?.slice(-20) || [];
    } catch {}
  }

  // Process via Unified Cognitive Core
  reply = await cognitiveEngine.processMessage(req.user, message, language, history);
  usedProvider = 'najah_cognitive_core';

  // Generate follow-up suggestions using internal AI heuristic
  let suggestions = [
    language === 'ar' ? 'اشرح لي المزيد عن هذا.' : 'Can you explain more about this?',
    language === 'ar' ? 'أعطني مثالاً.' : 'Give me an example.',
  ];

  // Save conversation
  const conv = await saveToConversation(conversationId, req.user.id, message, reply, language, null);

  // XP
  try {
    await pool.query('UPDATE users SET xp_points = xp_points + 5 WHERE id = $1', [req.user.id]);
    await checkAchievements(req.user.id, 'ai_chat');
  } catch {}

  res.json({
    reply,
    conversationId: conv?._id || conversationId,
    title:          conv?.title,
    provider:       usedProvider,
    suggestions,
    usage:          { total_tokens: 0 },
  });
}

// ── Streaming Chat ────────────────────────────────────────────
async function chatStream(req, res) {
  const { message, conversationId, language = 'en' } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  // SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Load history
  let history = [];
  if (conversationId) {
    try {
      const conv = await AIConversation.findOne({ _id: conversationId, userId: req.user.id });
      history = conv?.messages?.slice(-20) || [];
    } catch {}
  }

  // Since we rely entirely on in-house AI, we don't stream Transformers output yet,
  // we just yield the entire generated response directly as a chunk to maintain UI compatibility.
  try {
    let fullText;
    if (localAI.isReady && localAI.models.generator) {
      fullText = await localAI.chat(message, history, language);
    } else {
      fullText = internalAI.generateChatResponse(message, history, language);
    }
    
    res.write(`data: ${JSON.stringify({ chunk: fullText })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, fullText: fullText, provider: 'najah_inhouse' })}\n\n`);
    res.end();
    
    saveToConversation(conversationId, req.user.id, message, fullText, language, null).catch(() => {});
    pool.query('UPDATE users SET xp_points = xp_points + 5 WHERE id = $1', [req.user.id]).catch(() => {});
  } catch (err) {
    logger.error('In-house stream error:', err.message);
    const reply = internalAI.generateChatResponse(message, history, language);
    res.write(`data: ${JSON.stringify({ chunk: reply })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, fullText: reply, provider: 'najah_heuristics' })}\n\n`);
    res.end();
  }
}

// ── Web Search ────────────────────────────────────────────────
async function webSearch(req, res) {
  const { query, language = 'en' } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  if (geminiAI.isAvailable()) {
    try {
      const answer = await geminiAI.searchAndAnswer(query, language);
      return res.json({ answer, provider: 'gemini-2.0-flash' });
    } catch (err) {
      logger.error('Gemini Web Search failed:', err.message);
      return res.status(500).json({ error: 'Search engine encountered an error' });
    }
  }

  // Fallback if Gemini is not available
  return res.status(503).json({ error: 'Web Search is currently offline. Please configure the Cloud AI.' });
}

// ── Conversations ─────────────────────────────────────────────
async function getConversations(req, res) {
  try {
    const convs = await AIConversation
      .find({ userId: req.user.id })
      .select('title language createdAt updatedAt provider')
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();
    res.json({ conversations: convs });
  } catch (err) {
    res.json({ conversations: [] });
  }
}

async function getConversation(req, res) {
  try {
    const conv = await AIConversation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation: conv });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversation' });
  }
}

async function deleteConversation(req, res) {
  try {
    await AIConversation.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Conversation deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete' });
  }
}

// ── Summarize PDF ─────────────────────────────────────────────
async function summarizePdf(req, res) {
  const { fileId, language = 'en' } = req.body;
  if (!fileId) return res.status(400).json({ error: 'fileId is required' });

  const cacheKey = `summary:${fileId}:${language}:gemini`;
  const cached   = await cacheGet(cacheKey).catch(() => null);
  if (cached) return res.json(cached);

  const { rows } = await pool.query(
    `SELECT * FROM files WHERE id = $1 AND (user_id = $2 OR is_public = true) AND mime_type = 'application/pdf'`,
    [fileId, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'PDF not found' });

  const { text, pages } = await fetchPdfText(rows[0].file_url);

  let summary, usedProvider;
  if (localAI.isReady && localAI.models.summarizer) {
    try {
      summary = await localAI.summarize(text);
      usedProvider = 'najah_inhouse';
    } catch (err) {
      logger.warn('Local summarization failed:', err.message);
    }
  }
  if (!summary) {
    summary = internalAI.summarizeText(text, language, pages);
    usedProvider = 'najah_heuristics';
  }

  const result = { fileId, fileName: rows[0].original_name, summary, pages, language, provider: usedProvider };
  await cacheSet(cacheKey, result, 7200).catch(() => {});
  res.json(result);
}

// ── Generate Quiz ─────────────────────────────────────────────
async function generateQuiz(req, res) {
  const { subject, topic, difficulty = 'medium', count = 10, language = 'en', fileId } = req.body;

  let context = '';
  if (fileId) {
    try {
      const { rows } = await pool.query(
        `SELECT file_url FROM files WHERE id = $1 AND (user_id = $2 OR is_public = true) AND mime_type = 'application/pdf'`,
        [fileId, req.user.id]
      );
      if (rows[0]) {
        const { text } = await fetchPdfText(rows[0].file_url, 4000);
        context = text;
      }
    } catch {}
  }

  let quiz = internalAI.generateQuiz({ subject, difficulty, count: parseInt(count), language });
  let usedProvider = 'najah_heuristics';

  await checkAchievements(req.user.id, 'quiz_generated').catch(() => {});
  res.json({ subject, topic, difficulty, language, count: quiz.questions?.length, ...quiz, provider: usedProvider });
}

// ── Submit Quiz Result ────────────────────────────────────────
async function submitQuizResult(req, res) {
  const { subject, topic, totalQ, correctQ, difficulty, timeTaken, questions } = req.body;
  const scorePct = Math.round((correctQ / totalQ) * 100);

  const { rows } = await pool.query(`
    INSERT INTO quiz_attempts
      (user_id, subject, topic, total_q, correct_q, score_pct, difficulty, time_taken, questions)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
  `, [req.user.id, subject, topic || null, totalQ, correctQ, scorePct,
      difficulty || 'medium', timeTaken || null, JSON.stringify(questions || [])]);

  const xpEarned = Math.max(10, Math.round(scorePct / 10) * 10);
  await pool.query('UPDATE users SET xp_points = xp_points + $1 WHERE id = $2', [xpEarned, req.user.id]);

  if (scorePct === 100) await checkAchievements(req.user.id, 'perfect_quiz').catch(() => {});
  await checkAchievements(req.user.id, 'quiz_submitted').catch(() => {});

  res.json({ attempt: rows[0], xpEarned });
}

// ── Study Plan ────────────────────────────────────────────────
async function generateStudyPlan(req, res) {
  const { subject, deadline, dailyHours = 2, currentLevel = 'beginner', language = 'en' } = req.body;
  if (!subject)  return res.status(400).json({ error: 'subject is required' });
  if (!deadline) return res.status(400).json({ error: 'deadline is required' });

  const daysUntil = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (daysUntil < 1) return res.status(400).json({ error: 'Deadline must be in the future' });

  let plan = internalAI.generateStudyPlan({ subject, daysUntil, dailyHours: parseInt(dailyHours), currentLevel, language });
  let usedProvider = 'najah_heuristics';

  res.json({ ...plan, subject, deadline, daysUntil, dailyHours, currentLevel, provider: usedProvider });
}

// ── Answer from File ──────────────────────────────────────────
async function answerFromFile(req, res) {
  const { question, fileId, language = 'en' } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });
  if (!fileId)   return res.status(400).json({ error: 'fileId is required' });

  const { rows } = await pool.query(
    `SELECT * FROM files WHERE id = $1 AND (user_id = $2 OR is_public = true)`,
    [fileId, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'File not found' });

  const { text } = await fetchPdfText(rows[0].file_url, 8000);

  let answer, usedProvider;
  if (localAI.isReady && localAI.models.generator) {
    try {
      const contextChunk = text.slice(0, 3000);
      answer = await localAI.chat(`Answer the question based on this document: ${contextChunk}\n\nQuestion: ${question}`, [], language);
      usedProvider = 'najah_inhouse';
    } catch (err) {
      logger.warn('Local file Q&A failed:', err.message);
    }
  }
  if (!answer) {
    answer = internalAI.generateChatResponse(`${question}\n\nDocument context:\n${text.slice(0, 2000)}`, [], language);
    usedProvider = 'najah_heuristics';
  }

  res.json({ question, answer, fileId, fileName: rows[0].original_name, provider: usedProvider });
}

// ── YouTube Summarize ─────────────────────────────────────────
async function youtubeSummarize(req, res) {
  const { url, language = 'en' } = req.body;
  if (!url) return res.status(400).json({ error: 'YouTube URL is required' });

  let transcriptItems;
  try {
    const mod = await import('youtube-transcript');
    const YoutubeTranscript = mod.YoutubeTranscript || mod.default?.YoutubeTranscript;
    transcriptItems = await YoutubeTranscript.fetchTranscript(url);
  } catch (err) {
    logger.error('YouTube transcript fetch failed:', err.message);
    return res.status(400).json({ error: 'Could not fetch transcript. The video may not have captions.' });
  }

  const fullText = transcriptItems.map(t => t.text).join(' ').slice(0, 18000);

  let summary, usedProvider;
  if (localAI.isReady && localAI.models.summarizer) {
    try {
      summary = await localAI.summarize(fullText);
      usedProvider = 'najah_inhouse';
    } catch (err) {
      logger.warn('Local YouTube summarize failed:', err.message);
    }
  }
  if (!summary) {
    summary = internalAI.summarizeText(fullText, language, 1);
    usedProvider = 'najah_heuristics';
  }

  res.json({ summary, url, language, provider: usedProvider });
}

// ── Image Analyze ─────────────────────────────────────────────
async function analyzeImage(req, res) {
  res.status(400).json({ error: 'Image analysis is not available in this version. Please upload a PDF instead.' });
}

module.exports = {
  chat, chatStream, webSearch,
  getConversations, getConversation, deleteConversation,
  summarizePdf, generateQuiz, submitQuizResult, generateStudyPlan,
  answerFromFile, getProvider, getCapabilities, youtubeSummarize, analyzeImage,
};
