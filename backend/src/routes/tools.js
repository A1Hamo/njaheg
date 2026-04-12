'use strict';
// src/routes/tools.js — Free API Proxy Routes (no API keys needed)
const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');
const { authenticate } = require('../middleware/auth');
const { cacheGet, cacheSet } = require('../config/redis');
const logger = require('../utils/logger');

// ── DICTIONARY (dictionaryapi.dev) ─────────────────────────────
// GET /api/tools/dictionary?word=algebra&lang=en
router.get('/dictionary', authenticate, async (req, res) => {
  const { word, lang = 'en' } = req.query;
  if (!word?.trim()) return res.status(400).json({ error: 'word is required' });

  const cacheKey = `dict:${lang}:${word.toLowerCase()}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  // dictionaryapi.dev supports en only; for Arabic we fall back to English + note
  const apiLang = lang === 'ar' ? 'en' : lang;
  try {
    const resp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${apiLang}/${encodeURIComponent(word.trim())}`);
    if (!resp.ok) return res.status(404).json({ error: 'Word not found' });
    const data = await resp.json();

    const entry = data[0];
    const result = {
      word:       entry.word,
      phonetic:   entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '',
      audioUrl:   entry.phonetics?.find(p => p.audio)?.audio || null,
      meanings:   (entry.meanings || []).slice(0, 3).map(m => ({
        partOfSpeech: m.partOfSpeech,
        definitions:  (m.definitions || []).slice(0, 3).map(d => ({
          definition: d.definition,
          example:    d.example || null,
          synonyms:   (d.synonyms || []).slice(0, 5),
        })),
      })),
      lang: apiLang,
    };
    await cacheSet(cacheKey, result, 86400); // 24h
    res.json(result);
  } catch (err) {
    logger.error('Dictionary API error:', err.message);
    res.status(502).json({ error: 'Dictionary service unavailable' });
  }
});

// ── OPEN TRIVIA DB (opentdb.com) ───────────────────────────────
// GET /api/tools/trivia?subject=mathematics&count=5&difficulty=easy
// Subject-to-category mapping for Egyptian curriculum
const TRIVIA_CATEGORIES = {
  mathematics:  19,  // Mathematics
  science:      17,  // Science & Nature
  english:      10,  // Books (literature)
  geography:    22,  // Geography
  history:      23,  // History
  computers:    18,  // Computers
  general:       9,  // General Knowledge
  arabic:        9,  // fallback to general
};

router.get('/trivia', authenticate, async (req, res) => {
  const { subject = 'general', count = 5, difficulty = 'medium' } = req.query;
  const category  = TRIVIA_CATEGORIES[subject.toLowerCase()] || 9;
  const amount    = Math.min(parseInt(count) || 5, 20);
  const diff      = ['easy','medium','hard'].includes(difficulty) ? difficulty : 'medium';

  const cacheKey = `trivia:${category}:${amount}:${diff}`;
  // Don't cache trivia long — we want variety
  // Cache for only 10 minutes to get rotating questions
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${diff}&type=multiple`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (data.response_code !== 0 || !data.results?.length) {
      // Fallback to general category
      const fallback = await fetch(`https://opentdb.com/api.php?amount=${amount}&difficulty=${diff}&type=multiple`);
      const fallbackData = await fallback.json();
      if (fallbackData.response_code !== 0) {
        return res.status(502).json({ error: 'Trivia service returned no results' });
      }
      data.results = fallbackData.results;
    }

    // Decode HTML entities and format
    const decode = str => str.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&ldquo;/g,'"').replace(/&rdquo;/g,'"');

    const questions = data.results.map(q => {
      const options = [...q.incorrect_answers, q.correct_answer].map(decode).sort(() => Math.random() - 0.5);
      return {
        question:    decode(q.question),
        options,
        correct:     options.indexOf(decode(q.correct_answer)),
        explanation: `The correct answer is: ${decode(q.correct_answer)}`,
        category:    decode(q.category),
        difficulty:  q.difficulty,
      };
    });

    const result = { subject, count: questions.length, difficulty: diff, questions, source: 'opentdb' };
    await cacheSet(cacheKey, result, 600); // 10 min
    res.json(result);
  } catch (err) {
    logger.error('Trivia API error:', err.message);
    res.status(502).json({ error: 'Trivia service unavailable' });
  }
});

// ── WIKIPEDIA (wikipedia.org REST API) ─────────────────────────
// GET /api/tools/wikipedia?query=photosynthesis&lang=en
router.get('/wikipedia', authenticate, async (req, res) => {
  const { query, lang = 'en' } = req.query;
  if (!query?.trim()) return res.status(400).json({ error: 'query is required' });

  const apiLang = lang === 'ar' ? 'ar' : 'en';
  const cacheKey = `wiki:${apiLang}:${query.toLowerCase().replace(/\s+/g,'-')}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    // Step 1: Search for the page
    const searchUrl = `https://${apiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.trim())}`;
    const resp = await fetch(searchUrl, { headers: { 'User-Agent': 'Najah-Platform/1.0' } });

    if (!resp.ok) {
      // Try search endpoint to find the right article
      const searchResp = await fetch(
        `https://${apiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1`,
        { headers: { 'User-Agent': 'Najah-Platform/1.0' } }
      );
      const searchData = await searchResp.json();
      const topResult = searchData?.query?.search?.[0];
      if (!topResult) return res.status(404).json({ error: 'No Wikipedia article found' });

      // Fetch that article
      const articleResp = await fetch(
        `https://${apiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topResult.title)}`,
        { headers: { 'User-Agent': 'Najah-Platform/1.0' } }
      );
      if (!articleResp.ok) return res.status(404).json({ error: 'Wikipedia article not found' });

      const article = await articleResp.json();
      const result = formatWikiResult(article, apiLang);
      await cacheSet(cacheKey, result, 3600);
      return res.json(result);
    }

    const article = await resp.json();
    const result = formatWikiResult(article, apiLang);
    await cacheSet(cacheKey, result, 3600);
    res.json(result);
  } catch (err) {
    logger.error('Wikipedia API error:', err.message);
    res.status(502).json({ error: 'Wikipedia service unavailable' });
  }
});

function formatWikiResult(article, lang) {
  return {
    title:     article.title,
    summary:   article.extract,
    thumbnail: article.thumbnail?.source || null,
    url:       article.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(article.title)}`,
    lang,
  };
}

// ── DAILY QUOTE (quotable.io) ──────────────────────────────────
// GET /api/tools/quote
router.get('/quote', authenticate, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `quote:${today}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const resp = await fetch('https://api.quotable.io/random?tags=education,wisdom,success,motivation&maxLength=150');
    if (!resp.ok) throw new Error('Quotable API failed');
    const data = await resp.json();
    const result = { quote: data.content, author: data.author, tags: data.tags };
    await cacheSet(cacheKey, result, 86400); // new quote each day
    res.json(result);
  } catch (err) {
    // Fallback local quotes about education
    const fallbacks = [
      { quote: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
      { quote: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
      { quote: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
      { quote: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
      { quote: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', author: 'Mahatma Gandhi' },
    ];
    const result = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    res.json(result);
  }
});

module.exports = router;
