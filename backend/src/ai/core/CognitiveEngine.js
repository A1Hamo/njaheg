'use strict';
const IntentAnalyzer = require('./IntentAnalyzer');
const MindsetTracker = require('./MindsetTracker');
const ExecutionPlanner = require('./ExecutionPlanner');
const logger = require('../../utils/logger');
// Placeholder for tools and memory system
const AdaptiveTeacher = require('../tools/AdaptiveTeacher');
const geminiAI = require('../../services/geminiAI');

class CognitiveEngine {
  constructor(internalAI, deepTutorService) {
    this.intentAnalyzer = new IntentAnalyzer();
    this.mindsetTracker = new MindsetTracker();
    this.executionPlanner = new ExecutionPlanner();
    this.adaptiveTeacher = new AdaptiveTeacher(internalAI, deepTutorService);
    this.isReady = false;
  }

  async init() {
    logger.info('🚀 Booting Najah Cognitive Core...');
    await this.intentAnalyzer.init();
    await this.mindsetTracker.init();
    this.isReady = true;
    logger.info('✅ Najah Cognitive Core is fully online.');
  }

  async processMessage(user, message, language = 'en', history = []) {
    if (!this.isReady) {
      logger.warn('Cognitive Core not ready, falling back to basic engine.');
      return this.adaptiveTeacher.fallbackResponse(message, history, language);
    }

    try {
      // 1. Analyze State
      const intent = await this.intentAnalyzer.analyze(message);
      const mindset = await this.mindsetTracker.evaluate(user._id || 'anonymous', message);
      
      // 2. Mock Memory Context (to be expanded later)
      const context = { confidence: 0.8, topics: [] }; // Mocked for now
      
      // 3. Plan Execution
      const plan = await this.executionPlanner.createPlan(intent, mindset, context);
      
      // 4. Execute Tools
      const results = await this.executePlan(plan, message);
      
      // 5. Synthesize & Respond
      return await this.adaptiveTeacher.synthesize(message, history, language, plan, results, mindset);

    } catch (err) {
      logger.error('Cognitive Core Error:', err);
      return this.adaptiveTeacher.fallbackResponse(message, history, language);
    }
  }

  async executePlan(plan, message) {
    const results = {};
    for (const tool of plan.toolsToExecute) {
      if (tool.name === 'InternetResearcher') {
        logger.info('🌐 Executing Internet Research Layer...');
        if (geminiAI.isAvailable()) {
          try {
            results.research = await geminiAI.searchAndAnswer(message, 'en');
          } catch (e) {
            logger.warn('Internet Research failed:', e.message);
          }
        } else {
          results.research = "No direct internet search available yet. Relying on deep tutor engine.";
        }
      }
      if (tool.name === 'QuizGenerator') {
        logger.info('📝 Executing Quiz Generator Layer...');
        results.quiz = true;
      }
    }
    return results;
  }
}

module.exports = CognitiveEngine;
