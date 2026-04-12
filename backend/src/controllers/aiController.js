// src/controllers/aiController.js  — WITH INTERNAL AI ENGINE
'use strict';
const OpenAI     = require('openai');
const pdfParse   = require('pdf-parse');
const fetch      = require('node-fetch');

const { pool }               = require('../config/postgres');
const { AIConversation }     = require('../config/mongo');
const { cacheSet, cacheGet } = require('../config/redis');
const { checkAchievements }  = require('../services/achievementService');
const internalAI             = require('../services/internalAI');
const logger                 = require('../utils/logger');

// ── OpenAI Setup ────────────────────────────────────────
let openai = null;
const MODEL   = process.env.OPENAI_MODEL   || 'gpt-4o-mini';
const MAX_TOK = parseInt(process.env.OPENAI_MAX_TOKENS) || 1500;

if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    logger.info('✅ OpenAI initialized');
    const origCreate = openai.chat.completions.create.bind(openai.chat.completions);
    openai.chat.completions.create = async (args) => {
      try {
        return await origCreate(args);
      } catch (err) {
        if (err.status === 429 || err.status === 401 || err.status === 403) {
          logger.warn('Mocking OpenAI response due to quota/auth error: ' + err.message);
          const isJson = args.response_format?.type === 'json_object';
          const msgsStr = JSON.stringify(args.messages || []);
          let content = "This is a mocked AI response because your API key is out of credits.";
          if (isJson) {
            if (msgsStr.includes('questions')) {
              content = JSON.stringify({ questions: [{ question: "Mocked Question: What is 2 + 2?", options: ["3", "4", "5", "6"], correct: 1, explanation: "This is a mocked explanation." }] });
            } else {
              content = JSON.stringify({ plan: [{ day: 1, date: "2026-04-01", sessions: [{ time: "09:00", duration: 60, topic: "Mocked Topic", goal: "Mocked Goal", type: "study" }] }], tips: ["Focus on your weak areas"], totalHours: 10, weakAreas: [] });
            }
          }
          return { choices: [{ message: { content } }], usage: { total_tokens: 0 } };
        }
        throw err;
      }
    };
  } catch (err) {
    logger.error('❌ OpenAI init error:', err.message);
  }
} else {
  logger.warn('⚠️  OPENAI_API_KEY not found — Internal AI will be the default provider');
}

const SYSTEM_EN = `You are an expert educational assistant for Egyptian school students
(primary grades 1–6, preparatory 1–3, secondary 1–3). You follow the Egyptian
Ministry of Education curriculum. Be clear, encouraging, and age-appropriate.
Support both Arabic and English. Use simple language with real-life examples
relevant to Egyptian culture and context.`;

const SYSTEM_AR = SYSTEM_EN + ' الرد باللغة العربية دائماً.';

async function fetchPdfText(fileUrl, maxChars = 8000) {
  const resp = await fetch(fileUrl);
  if (!resp.ok) throw new Error('Failed to fetch file');
  const buf  = Buffer.from(await resp.arrayBuffer());
  const data = await pdfParse(buf);
  return { text: data.text.slice(0, maxChars), pages: data.numpages };
}

// ── Provider Info ───────────────────────────────────────
async function getProvider(req, res) {
  res.json({
    internal: {
      available:       true,
      name:            'Najah Internal AI',
      description:     'Built-in AI engine — always available, no API key required',
      requiresApiKey:  false,
      capabilities:    internalAI.getCapabilities(),
    },
    external: {
      available:       !!openai,
      name:            'OpenAI GPT-4o',
      description:     'Premium AI powered by OpenAI — requires a valid API key',
      requiresApiKey:  true,
      model:           MODEL,
    },
  });
}

async function getCapabilities(req, res) {
  res.json(internalAI.getCapabilities());
}

// ── Chat ────────────────────────────────────────────────
async function chat(req, res) {
  const { message, conversationId, language = 'en', provider = 'external' } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  // ── Internal provider ──
    try {
      let conv = conversationId
        ? await AIConversation.findOne({ _id: conversationId, userId: req.user.id })
        : null;
      if (!conv) conv = new AIConversation({ userId: req.user.id, messages: [], language, provider: 'internal' });

      const history = conv.messages.slice(-12);
      const reply   = internalAI.generateChatResponse(message, history, language);

      conv.messages.push({ role: 'user', content: message });
      conv.messages.push({ role: 'assistant', content: reply });
      if (!conv.title || conv.title === 'New Chat') conv.title = message.slice(0, 50);
      await conv.save();

      await pool.query('UPDATE users SET xp_points = xp_points + 5 WHERE id = $1', [req.user.id]);
      await checkAchievements(req.user.id, 'ai_chat');

      return res.json({ reply, conversationId: conv._id, title: conv.title, provider: 'internal', usage: { total_tokens: 0 } });
    } catch (dbErr) {
      logger.error('Internal AI Chat DB Error:', dbErr.message);
      return res.status(503).json({ 
        error: 'Database connection failed', 
        message: 'The AI service is temporarily limited. Please ensure Docker services (MongoDB) are running and restart the backend.' 
      });
    }

  // ── External provider (OpenAI) ──
  try {
    let conv = conversationId
      ? await AIConversation.findOne({ _id: conversationId, userId: req.user.id })
      : null;
    if (!conv) conv = new AIConversation({ userId: req.user.id, messages: [], language, provider: 'external' });

    const history  = conv.messages.slice(-12).map(m => ({ role: m.role, content: m.content }));
    const sysPrompt = language === 'ar' ? SYSTEM_AR : SYSTEM_EN;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: MODEL, max_tokens: MAX_TOK, temperature: 0.7,
        messages: [{ role: 'system', content: sysPrompt }, ...history, { role: 'user', content: message }],
      });
    } catch (err) {
      if (err.status === 429) {
        // Fallback to internal
        logger.warn('OpenAI quota exceeded — falling back to internal AI');
        const reply = internalAI.generateChatResponse(message, conv.messages.slice(-12), language);
        conv.messages.push({ role: 'user', content: message });
        conv.messages.push({ role: 'assistant', content: reply });
        if (!conv.title || conv.title === 'New Chat') conv.title = message.slice(0, 50);
        await conv.save();
        return res.json({ reply, conversationId: conv._id, title: conv.title, provider: 'internal_fallback', usage: { total_tokens: 0 } });
      }
      throw err;
    }

    const reply = completion.choices[0].message.content;
    conv.messages.push({ role: 'user', content: message });
    conv.messages.push({ role: 'assistant', content: reply });
    if (!conv.title || conv.title === 'New Chat') conv.title = message.slice(0, 50);
    await conv.save();

    await pool.query('UPDATE users SET xp_points = xp_points + 5 WHERE id = $1', [req.user.id]);
    await checkAchievements(req.user.id, 'ai_chat');
    res.json({ reply, conversationId: conv._id, title: conv.title, provider: 'external', usage: completion.usage });
  } catch (dbErr) {
    logger.error('External AI Chat DB Error:', dbErr.message);
    return res.status(503).json({ 
      error: 'Database connection failed', 
      message: 'The AI service is temporarily limited. Please ensure Docker services (MongoDB) are running and restart the backend.' 
    });
  }
}

// ── Conversations ───────────────────────────────────────
async function getConversations(req, res) {
  const convs = await AIConversation
    .find({ userId: req.user.id })
    .select('title language createdAt updatedAt provider')
    .sort({ updatedAt: -1 })
    .limit(30)
    .lean();
  res.json({ conversations: convs });
}

async function getConversation(req, res) {
  const conv = await AIConversation.findOne({ _id: req.params.id, userId: req.user.id });
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  res.json({ conversation: conv });
}

async function deleteConversation(req, res) {
  await AIConversation.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.json({ message: 'Conversation deleted' });
}

// ── Summarize PDF ───────────────────────────────────────
async function summarizePdf(req, res) {
  const { fileId, language = 'en', provider = 'external' } = req.body;
  if (!fileId) return res.status(400).json({ error: 'fileId is required' });

  const cacheKey = `summary:${fileId}:${language}:${provider}`;
  const cached   = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query(
    `SELECT * FROM files WHERE id = $1 AND (user_id = $2 OR is_public = true) AND mime_type = 'application/pdf'`,
    [fileId, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'PDF not found' });

  const { text, pages } = await fetchPdfText(rows[0].file_url);

  // Internal provider
  if (provider === 'internal' || !openai) {
    const summary = internalAI.summarizeText(text, language, pages);
    const result  = { fileId, fileName: rows[0].original_name, summary, pages, language, provider: 'internal' };
    await cacheSet(cacheKey, result, 7200);
    return res.json(result);
  }

  // External provider
  const prompt = language === 'ar'
    ? `لخص هذا المحتوى التعليمي بوضوح وتنظيم باللغة العربية مع النقاط الرئيسية والمفاهيم المهمة:\n\n${text}`
    : `Summarize this educational content clearly. Include: key concepts, important facts, formulas if any, and exam tips:\n\n${text}`;

  const completion = await openai.chat.completions.create({
    model: MODEL, max_tokens: 1500, temperature: 0.4,
    messages: [{ role: 'system', content: language === 'ar' ? SYSTEM_AR : SYSTEM_EN }, { role: 'user', content: prompt }],
  });

  const result = {
    fileId, fileName: rows[0].original_name,
    summary: completion.choices[0].message.content,
    pages, language, provider: 'external',
  };
  await cacheSet(cacheKey, result, 7200);
  res.json(result);
}

// ── Generate Quiz ───────────────────────────────────────
async function generateQuiz(req, res) {
  const { subject, topic, difficulty = 'medium', count = 10, language = 'en', fileId, provider = 'external' } = req.body;

  // Internal provider
  if (provider === 'internal' || !openai) {
    const quiz = internalAI.generateQuiz({ subject, difficulty, count: parseInt(count), language });
    await checkAchievements(req.user.id, 'quiz_generated');
    return res.json({ ...quiz, provider: 'internal' });
  }

  // External provider
  let context = '';
  if (fileId) {
    const { rows } = await pool.query(
      `SELECT file_url FROM files WHERE id = $1 AND (user_id = $2 OR is_public = true) AND mime_type = 'application/pdf'`,
      [fileId, req.user.id]
    );
    if (rows[0]) {
      const { text } = await fetchPdfText(rows[0].file_url, 4000);
      context = `\n\nBase the quiz on this content:\n${text}`;
    }
  }

  const prompt = language === 'ar'
    ? `أنشئ ${count} أسئلة اختيار متعدد باللغة العربية عن ${subject}${topic ? ' - ' + topic : ''} بمستوى ${difficulty} لطلاب مصريين.\nأرجع JSON فقط: {"questions":[{"question":"...","options":["أ)...","ب)...","ج)...","د)..."],"correct":0,"explanation":"..."}]}${context}`
    : `Create exactly ${count} multiple-choice questions about ${subject}${topic ? ' - ' + topic : ''} at ${difficulty} level for Egyptian school students.\nReturn ONLY valid JSON: {"questions":[{"question":"...","options":["A)...","B)...","C)...","D)..."],"correct":0,"explanation":"..."}]}${context}`;

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: MODEL, max_tokens: 2500, temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: 'Return ONLY valid JSON. No markdown. No extra text.' }, { role: 'user', content: prompt }],
    });
  } catch (err) {
    if (err.status === 429) {
      logger.warn('OpenAI quota — falling back to internal quiz generator');
      const quiz = internalAI.generateQuiz({ subject, difficulty, count: parseInt(count), language });
      return res.json({ ...quiz, provider: 'internal_fallback' });
    }
    throw err;
  }

  const quiz = JSON.parse(completion.choices[0].message.content);
  await checkAchievements(req.user.id, 'quiz_generated');
  res.json({ subject, topic, difficulty, language, count: quiz.questions?.length, ...quiz, provider: 'external' });
}

// ── Submit Quiz Result ──────────────────────────────────
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

  if (scorePct === 100) await checkAchievements(req.user.id, 'perfect_quiz');
  await checkAchievements(req.user.id, 'quiz_submitted');

  res.json({ attempt: rows[0], xpEarned });
}

// ── Generate Study Plan ─────────────────────────────────
async function generateStudyPlan(req, res) {
  const { subject, deadline, dailyHours = 2, currentLevel = 'beginner', language = 'en', provider = 'external' } = req.body;
  if (!subject)  return res.status(400).json({ error: 'subject is required' });
  if (!deadline) return res.status(400).json({ error: 'deadline is required' });

  const daysUntil = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (daysUntil < 1) return res.status(400).json({ error: 'Deadline must be in the future' });

  // Internal provider
  if (provider === 'internal' || !openai) {
    const plan = internalAI.generateStudyPlan({ subject, daysUntil, dailyHours: parseInt(dailyHours), currentLevel, language });
    return res.json({ ...plan, deadline, provider: 'internal' });
  }

  // External provider
  const { rows: hist } = await pool.query(`
    SELECT subject, COUNT(*) AS cnt, ROUND(AVG(duration)) AS avg_dur
    FROM study_sessions
    WHERE user_id = $1 AND status = 'completed' AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY subject
  `, [req.user.id]);
  const histCtx = hist.length ? `Student's recent history: ${JSON.stringify(hist)}` : '';

  const prompt = language === 'ar'
    ? `أنشئ خطة دراسية محسّنة لـ ${daysUntil} يوماً لطالب مصري يدرس ${subject}.\nالمدخلات: ${dailyHours} ساعات/يوم، مستوى: ${currentLevel}، ${histCtx}.\nأرجع JSON فقط:\n{"plan":[{"day":1,"date":"YYYY-MM-DD","sessions":[{"time":"HH:MM","duration":60,"topic":"...","goal":"...","type":"study|review|practice|rest"}]}],"tips":["..."],"totalHours":N,"weakAreas":["..."]}`
    : `Create an optimised ${daysUntil}-day study plan for an Egyptian student studying ${subject}.\nParams: ${dailyHours}h/day, ${currentLevel} level. ${histCtx}\nReturn ONLY valid JSON:\n{"plan":[{"day":1,"date":"YYYY-MM-DD","sessions":[{"time":"HH:MM","duration":60,"topic":"...","goal":"...","type":"study|review|practice|rest"}]}],"tips":["..."],"totalHours":N,"weakAreas":["..."]}`;

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: MODEL, max_tokens: 3000, temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: 'Return ONLY valid JSON.' }, { role: 'user', content: prompt }],
    });
  } catch (err) {
    if (err.status === 429) {
      logger.warn('OpenAI quota — falling back to internal study plan generator');
      const plan = internalAI.generateStudyPlan({ subject, daysUntil, dailyHours: parseInt(dailyHours), currentLevel, language });
      return res.json({ ...plan, deadline, provider: 'internal_fallback' });
    }
    throw err;
  }

  res.json({
    subject, deadline, daysUntil, dailyHours, currentLevel,
    ...JSON.parse(completion.choices[0].message.content),
    provider: 'external',
  });
}

// ── Answer from File ────────────────────────────────────
async function answerFromFile(req, res) {
  const { question, fileId, language = 'en', provider = 'external' } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });
  if (!fileId)   return res.status(400).json({ error: 'fileId is required' });

  const { rows } = await pool.query(
    `SELECT * FROM files WHERE id = $1 AND (user_id = $2 OR is_public = true)`,
    [fileId, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'File not found' });

  const { text } = await fetchPdfText(rows[0].file_url, 6000);

  if (provider === 'internal' || !openai) {
    const answer = internalAI.generateChatResponse(`${question}\n\nDocument context:\n${text.slice(0, 2000)}`, [], language);
    return res.json({ question, answer, fileId, fileName: rows[0].original_name, provider: 'internal' });
  }

  const prompt = language === 'ar'
    ? `استناداً إلى هذا المحتوى:\n${text}\n\nأجب على هذا السؤال بالعربية: ${question}`
    : `Based on this document:\n${text}\n\nAnswer this question clearly: ${question}`;

  const completion = await openai.chat.completions.create({
    model: MODEL, max_tokens: 800, temperature: 0.5,
    messages: [{ role: 'system', content: language === 'ar' ? SYSTEM_AR : SYSTEM_EN }, { role: 'user', content: prompt }],
  });

  res.json({ question, answer: completion.choices[0].message.content, fileId, fileName: rows[0].original_name, provider: 'external' });
}

// ── Summarize YouTube ───────────────────────────────────
async function youtubeSummarize(req, res) {
  const { url, language = 'en', provider = 'external' } = req.body;
  if (!url) return res.status(400).json({ error: 'YouTube URL is required' });

  let transcriptItems;
  try {
    const mod = await import('youtube-transcript');
    const YoutubeTranscript = mod.YoutubeTranscript || mod.default?.YoutubeTranscript;
    transcriptItems = await YoutubeTranscript.fetchTranscript(url);
  } catch (err) {
    logger.error('YouTube transcript fetch failed: ' + err.message);
    return res.status(400).json({ error: 'Could not fetch transcript for this video. It might not have captions.' });
  }

  // Combine transcript text (limit to ~20000 chars to avoid massive token limits)
  const fullText = transcriptItems.map(t => t.text).join(' ').slice(0, 20000);

  // Use internal provider if requested or OpenAI is unavailable
  if (provider === 'internal' || !openai) {
    const summary = internalAI.summarizeText(fullText, language, 1);
    return res.json({ summary, url, language, provider: 'internal' });
  }

  // Use OpenAI
  const prompt = language === 'ar'
    ? `لخص محتوى فيديو اليوتيوب هذا للطلاب. استخرج النقاط الرئيسية ورتبها في نقاط:\n\n${fullText}`
    : `Summarize this YouTube video transcript for a student. Extract the key learnings, format them with bullet points:\n\n${fullText}`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL, max_tokens: 1500, temperature: 0.5,
      messages: [{ role: 'system', content: language === 'ar' ? SYSTEM_AR : SYSTEM_EN }, { role: 'user', content: prompt }],
    });
    res.json({ summary: completion.choices[0].message.content, url, language, provider: 'external' });
  } catch (err) {
    if (err.status === 429 || err.status === 401 || err.status === 403) {
      logger.warn('OpenAI quota — falling back to internal YouTube summarizer');
      const summary = internalAI.summarizeText(fullText, language, 1);
      return res.json({ summary, url, language, provider: 'internal_fallback' });
    }
    throw err;
  }
}

// ── Analyze Image (Visual OCR / Vision AI) ────────────────
async function analyzeImage(req, res) {
  const { fileId, language = 'en', provider = 'external' } = req.body;
  if (!fileId) return res.status(400).json({ error: 'fileId is required' });

  // Internal AI doesn't support Vision capabilities right now.
  if (!openai || provider === 'internal') {
    return res.status(400).json({ error: 'Image analysis requires OpenAI. Please switch provider or add an API key.' });
  }

  const { rows } = await pool.query(
    `SELECT * FROM files WHERE id = $1 AND (user_id = $2 OR is_public = true) AND mime_type LIKE 'image/%'`,
    [fileId, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Image file not found or unsupported format' });

  const imageUrl = rows[0].file_url;
  const prompt = language === 'ar'
    ? 'أنت مساعد تعليمي ذكي (Visual Scholar). قم بتحليل وتحويل النص في هذه الصورة. إذا كان هناك أسئلة، قم بحلها. إذا كان هناك مخططات، اشرحها بوضوح.'
    : 'You are an intelligent educational assistant (Visual Scholar). Read, analyze, and extract the text from this image. If it contains questions, solve them. If it contains diagrams, explain them clearly.';

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL, // gpt-4o-mini natively supports vision
      max_tokens: 1500,
      temperature: 0.4,
      messages: [
        { role: 'system', content: language === 'ar' ? SYSTEM_AR : SYSTEM_EN },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });
    res.json({
      summary: completion.choices[0].message.content,
      fileId,
      fileName: rows[0].original_name,
      language,
      provider: 'external'
    });
  } catch (err) {
    if (err.status === 429 || err.status === 401 || err.status === 403) {
      logger.warn('OpenAI quota hit for Image Analysis.');
      return res.status(429).json({ error: 'OpenAI quota exceeded. Cannot perform image analysis.' });
    }
    logger.error('analyzeImage Error:', err);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
}

module.exports = {
  chat, getConversations, getConversation, deleteConversation,
  summarizePdf, generateQuiz, submitQuizResult, generateStudyPlan,
  answerFromFile, getProvider, getCapabilities, youtubeSummarize,
  analyzeImage
};
