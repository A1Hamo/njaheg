'use strict';
const { pipeline } = require('@xenova/transformers');
const logger = require('../../utils/logger');

class IntentAnalyzer {
  constructor() {
    this.classifier = null;
    this.isReady = false;
  }

  async init() {
    try {
      logger.info('Initializing Cognitive Core: Deep Intent Analyzer...');
      // Using a zero-shot classifier to deeply understand user intent
      this.classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-small');
      this.isReady = true;
      logger.info('✅ Deep Intent Analyzer ready.');
    } catch (err) {
      logger.error('Failed to init Intent Analyzer:', err.message);
    }
  }

  async analyze(message) {
    if (!this.isReady || !this.classifier) {
      return { primaryIntent: 'general_question', confidence: 0.5, needsResearch: false };
    }

    const categories = [
      'factual question',
      'request for explanation',
      'request for quiz or test',
      'emotional expression or frustration',
      'casual greeting',
      'request for deep internet research'
    ];

    try {
      const result = await this.classifier(message, categories);
      const topIntent = result.labels[0];
      const confidence = result.scores[0];

      return {
        primaryIntent: topIntent.replace(/ /g, '_'),
        confidence,
        needsResearch: topIntent.includes('research'),
        isEmotional: topIntent.includes('emotional'),
        allScores: result
      };
    } catch (err) {
      logger.warn('Intent detection failed:', err.message);
      return { primaryIntent: 'general_question', confidence: 0.5, needsResearch: false };
    }
  }
}

module.exports = IntentAnalyzer;
