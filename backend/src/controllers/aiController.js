// src/controllers/aiController.js  — Gemini-first AI controller
'use strict';
const pdfParse   = require('pdf-parse');
const fetch      = require('node-fetch');

const { pool }               = require('../config/postgres');
const { AIConversation }     = require('../config/mongo');
const { cacheSet, cacheGet } = require('../config/redis');
const { checkAchievements }  = require('../services/achievementService');
const geminiAI               = require('../services/geminiAI');
const internalAI             = require('../services/internalAI');
const logger                 = require('../utils/logger');

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
      available:      geminiAI.isAvailable(),
      name:           'Najah AI (Gemini 2.0 Flash)',
      description:    'Powered by Google Gemini — intelligent, human-like, web-search capable',
      requiresApiKey: true,
      model:          geminiAI.getModelName(),
    },
    internal: {
      available:      true,
      name:           'Internal Fallback AI',
      description:    'Built-in keyword engine — always available, used when Gemini is unavailable',
      requiresApiKey: false,
    },
  });
}

async function getCapabilities(req, res) {
  res.json({
    engine:          geminiAI.isAvailable() ? 'Gemini 2.0 Flash' : 'Internal Fallback',
    geminiAvailable: geminiAI.isAvailable(),
    features: {
      chat:         { supported: true },
      stream:       { supported: geminiAI.isAvailable() },
      search:       { supported: geminiAI.isAvailable() },
      summary:      { supported: true },
      quiz:         { supported: true },
      studyPlan:    { supported: true },
      askFile:      { supported: true },
      youtube:      { supported: true },
      imageAnalysis:{ supported: false, note: 'Coming soon' },
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

  let reply, usedProvider;

  // Try Gemini first
  if (geminiAI.isAvailable()) {
    try {
      reply = await geminiAI.chat(message, history, language);
      usedProvider = 'gemini';
    } catch (err) {
      logger.warn('Gemini chat failed, falling back to internal:', err.message);
    }
  }

  // Fallback to internal AI
  if (!reply) {
    reply = internalAI.generateChatResponse(message, history, language);
    usedProvider = 'internal_fallback';
  }

  // Generate follow-up suggestions
  let suggestions = [];
  if (withFollowUps && geminiAI.isAvailable() && usedProvider === 'gemini') {
    suggestions = await geminiAI.generateFollowUps(message, reply, language).catch(() => []);
  }

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

  if (!geminiAI.isAvailable()) {
    // Fallback: send full response as single chunk
    const reply = internalAI.generateChatResponse(message, history, language);
    res.write(`data: ${JSON.stringify({ chunk: reply })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, fullText: reply, provider: 'internal_fallback' })}\n\n`);
    res.end();
    await saveToConversation(conversationId, req.user.id, message, reply, language, null);
    return;
  }

  try {
    const fullText = await geminiAI.chatStream(message, history, res);
    // Save asynchronously
    if (fullText) {
      saveToConversation(conversationId, req.user.id, message, fullText, language, null).catch(() => {});
      pool.query('UPDATE users SET xp_points = xp_points + 5 WHERE id = $1', [req.user.id]).catch(() => {});
    }
  } catch (err) {
    logger.error('Stream error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'Stream failed', message: err.message })}\n\n`);
    res.end();
  }
}

// ── Web Search ────────────────────────────────────────────────
async function webSearch(req, res) {
  const { query, language = 'en' } = req.body;
  if (!query?.trim()) return res.status(400).json({ error: 'query is required' });

  if (!geminiAI.isAvailable()) {
    return res.status(503).json({ error: 'Search requires Gemini AI. Please set GEMINI_API_KEY.' });
  }

  try {
    const answer = await geminiAI.searchAndAnswer(query, language);
    res.json({ answer, query, language });
  } catch (err) {
    logger.error('Web search error:', err.message);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
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
  if (geminiAI.isAvailable()) {
    try {
      summary = await geminiAI.summarize(text, language, pages);
      usedProvider = 'gemini';
    } catch (err) {
      logger.warn('Gemini summarize failed:', err.message);
    }
  }
  if (!summary) {
    summary = internalAI.summarizeText(text, language, pages);
    usedProvider = 'internal_fallback';
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

  let quiz, usedProvider;
  if (geminiAI.isAvailable()) {
    try {
      const raw = await geminiAI.generateQuiz({ subject, topic, difficulty, count: parseInt(count), language, context });
      quiz = raw;
      usedProvider = 'gemini';
    } catch (err) {
      logger.warn('Gemini quiz failed:', err.message);
    }
  }
  if (!quiz) {
    quiz = internalAI.generateQuiz({ subject, difficulty, count: parseInt(count), language });
    usedProvider = 'internal_fallback';
  }

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

  let plan, usedProvider;
  if (geminiAI.isAvailable()) {
    try {
      const raw = await geminiAI.generateStudyPlan({ subject, daysUntil, dailyHours: parseInt(dailyHours), currentLevel, language });
      plan = raw;
      usedProvider = 'gemini';
    } catch (err) {
      logger.warn('Gemini study plan failed:', err.message);
    }
  }
  if (!plan) {
    plan = internalAI.generateStudyPlan({ subject, daysUntil, dailyHours: parseInt(dailyHours), currentLevel, language });
    usedProvider = 'internal_fallback';
  }

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
  if (geminiAI.isAvailable()) {
    try {
      answer = await geminiAI.answerFromContext(question, text, language);
      usedProvider = 'gemini';
    } catch (err) {
      logger.warn('Gemini file Q&A failed:', err.message);
    }
  }
  if (!answer) {
    answer = internalAI.generateChatResponse(`${question}\n\nDocument context:\n${text.slice(0, 2000)}`, [], language);
    usedProvider = 'internal_fallback';
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
  if (geminiAI.isAvailable()) {
    try {
      summary = await geminiAI.summarizeYoutube(fullText, language);
      usedProvider = 'gemini';
    } catch (err) {
      logger.warn('Gemini YouTube summarize failed:', err.message);
    }
  }
  if (!summary) {
    summary = internalAI.summarizeText(fullText, language, 1);
    usedProvider = 'internal_fallback';
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
