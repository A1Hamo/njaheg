// backend/src/ai/core/IntentAnalyzer.js
// BUG #7 FIX: Replaced heavy Xenova/Transformers.js model with a fast rule-based engine.
// No startup download, no 500MB model, instant classification.
'use strict';
const logger = require('../../utils/logger');

class IntentAnalyzer {
  constructor() {
    this.isReady = true;
  }

  async init() {
    logger.info('✅ Smart Intent Analyzer ready (rule-based, instant boot).');
  }

  async analyze(message) {
    const isArabic = /[\u0600-\u06FF]/.test(message);

    const patterns = [
      {
        intent: 'request_for_quiz',
        regex: /اختبار|quiz|test|أسئلة تدريبية|questions|اختبرني|امتحنني|trivia/i,
        needsResearch: false,
      },
      {
        intent: 'explanation_request',
        regex: /اشرح|explain|ما هو|what is|ما معنى|كيف يعمل|how does|لماذا|why/i,
        needsResearch: false,
      },
      {
        intent: 'math_problem',
        regex: /احسب|حل|solve|calculate|=\s*\?|find\s+x|جد|برهن|prove|\d+[\+\-\×\÷\*\/\^]\d+/i,
        needsResearch: false,
      },
      {
        intent: 'homework_help',
        regex: /واجب|homework|assignment|مسألة|problem|سؤال رقم|question \d/i,
        needsResearch: false,
      },
      {
        intent: 'study_plan',
        regex: /خطة|plan|جدول|schedule|مذاكرة|study|كيف أذاكر|how to study/i,
        needsResearch: false,
      },
      {
        intent: 'research_request',
        regex: /ابحث|search|أخبار|news|اكتشف|latest|حديث|recent|2024|2025|2026/i,
        needsResearch: true,
      },
      {
        intent: 'emotional_support',
        regex: /تعبان|مش فاهم|confused|صعب|hard|محبط|frustrated|مش قادر|can't|مش عارف/i,
        needsResearch: false,
      },
      {
        intent: 'lesson_plan',
        regex: /خطة درس|lesson plan|درس عن|محاضرة عن/i,
        needsResearch: false,
      },
      {
        intent: 'greeting',
        regex: /^(مرحب|هاي|hello|hi|أهلاً|السلام عليكم|صباح|مساء|hey|good morning)/i,
        needsResearch: false,
      },
    ];

    for (const p of patterns) {
      if (p.regex.test(message)) {
        return {
          primaryIntent: p.intent,
          confidence:    0.9,
          needsResearch: p.needsResearch,
          isArabic,
        };
      }
    }

    // Fallback
    const isQuestion = /\?|؟/.test(message);
    return {
      primaryIntent: isQuestion ? 'general_question' : 'general_statement',
      confidence:    0.6,
      needsResearch: false,
      isArabic,
    };
  }
}

module.exports = IntentAnalyzer;
