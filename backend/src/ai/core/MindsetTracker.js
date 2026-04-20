'use strict';
const { pipeline } = require('@xenova/transformers');
const logger = require('../../utils/logger');

class MindsetTracker {
  constructor() {
    this.emotionClassifier = null;
    this.isReady = false;
    // In-memory store of user mindsets
    this.userStates = new Map(); 
  }

  async init() {
    try {
      logger.info('Initializing Cognitive Core: Mindset Tracker...');
      this.emotionClassifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
      this.isReady = true;
      logger.info('✅ Mindset Tracker ready.');
    } catch (err) {
      logger.error('Failed to init Mindset Tracker:', err.message);
    }
  }

  async evaluate(userId, message) {
    let state = this.userStates.get(userId) || {
      confusionLevel: 0.0,
      confidenceLevel: 0.5,
      fatigueLevel: 0.0,
      messageCount: 0
    };

    state.messageCount += 1;

    // Detect sentiment
    let sentimentLabel = 'NEUTRAL';
    let sentimentScore = 0.5;
    
    if (this.isReady && this.emotionClassifier) {
      try {
        const result = await this.emotionClassifier(message);
        sentimentLabel = result[0].label;
        sentimentScore = result[0].score;
      } catch (err) {
        logger.warn('Emotion detection failed:', err.message);
      }
    }

    // Heuristic adjustments based on message content & sentiment
    const lowerMsg = message.toLowerCase();
    
    // Confusion triggers
    if (lowerMsg.includes('don\'t understand') || lowerMsg.includes('confused') || lowerMsg.includes('hard') || lowerMsg.includes('not getting it')) {
      state.confusionLevel = Math.min(1.0, state.confusionLevel + 0.4);
      state.confidenceLevel = Math.max(0.0, state.confidenceLevel - 0.3);
    }

    // Fatigue triggers
    if (state.messageCount > 10) {
      state.fatigueLevel = Math.min(1.0, state.fatigueLevel + 0.1);
    }
    if (lowerMsg.includes('tired') || lowerMsg.includes('boring') || lowerMsg.includes('too long')) {
      state.fatigueLevel = Math.min(1.0, state.fatigueLevel + 0.5);
    }

    // Determine Dominant Emotion
    let dominantEmotion = 'neutral';
    if (sentimentLabel === 'NEGATIVE') {
      if (state.confusionLevel > 0.6) dominantEmotion = 'frustrated';
      else dominantEmotion = 'anxious';
    } else if (sentimentLabel === 'POSITIVE') {
      dominantEmotion = 'confident';
      state.confidenceLevel = Math.min(1.0, state.confidenceLevel + 0.2);
      state.confusionLevel = Math.max(0.0, state.confusionLevel - 0.2);
    }

    // Decay fatigue and confusion slightly on new messages
    state.fatigueLevel = Math.max(0.0, state.fatigueLevel - 0.05);
    state.confusionLevel = Math.max(0.0, state.confusionLevel - 0.05);

    this.userStates.set(userId, state);

    return {
      ...state,
      dominantEmotion
    };
  }
}

module.exports = MindsetTracker;
