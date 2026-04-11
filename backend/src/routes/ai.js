// src/routes/ai.js
const ar = require('express').Router();
const c  = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

ar.use(authenticate);

// Provider info (no rate limit — just metadata)
ar.get('/provider',               c.getProvider);
ar.get('/internal/capabilities',  c.getCapabilities);

// Conversations
ar.get ('/conversations',         c.getConversations);
ar.get ('/conversations/:id',     c.getConversation);
ar.delete('/conversations/:id',   c.deleteConversation);

// AI Features (all support ?provider=internal|external)
ar.post('/chat',                  aiLimiter, c.chat);
ar.post('/summarize',             aiLimiter, c.summarizePdf);
ar.post('/quiz',                  aiLimiter, c.generateQuiz);
ar.post('/quiz/submit',           c.submitQuizResult);
ar.post('/study-plan',            aiLimiter, c.generateStudyPlan);
ar.post('/ask-file',              aiLimiter, c.answerFromFile);

module.exports = ar;
