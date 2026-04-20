'use strict';
const logger = require('../../utils/logger');

class ExecutionPlanner {
  constructor() {
    this.isReady = true;
  }

  async createPlan(intent, mindset, context) {
    logger.info('🧠 Cognitive Core: Planning execution...');
    
    let needsSearch = false;
    let strategy = 'standard';
    let promptModifier = '';

    // 1. Decide if we need internet research
    if (intent.needsResearch) {
      needsSearch = true;
    } else if (intent.primaryIntent === 'factual_question' && context.confidence < 0.6) {
      needsSearch = true;
    } else if (mindset.confusionLevel > 0.8 && intent.primaryIntent === 'factual_question') {
      needsSearch = true; // deeper research to provide a better explanation
    }

    // 2. Decide the teaching strategy based on mindset
    if (mindset.confusionLevel > 0.8) {
      strategy = 'step-by-step';
      promptModifier = 'The user is highly confused. Break down your answer into 3 simple micro-steps. Use analogies. Praise their effort.';
    } else if (mindset.confidenceLevel > 0.8 && mindset.dominantEmotion === 'confident') {
      strategy = 'challenge';
      promptModifier = 'The user is confident. Provide the core answer, then ask a provocative follow-up question to test their understanding.';
    } else if (mindset.dominantEmotion === 'anxious') {
      strategy = 'supportive';
      promptModifier = 'The user is anxious. Use a highly reassuring tone. Validate their question before answering.';
    } else if (mindset.fatigueLevel > 0.7) {
      strategy = 'interactive_brief';
      promptModifier = 'The user is tired/bored. Keep the answer extremely brief. Add an interactive scenario or analogy to wake them up.';
    }

    // 3. Assemble the plan
    const plan = {
      toolsToExecute: [],
      synthesisStrategy: strategy,
      promptModifier
    };

    if (needsSearch) {
      plan.toolsToExecute.push({ name: 'InternetResearcher', priority: 1 });
    }

    if (intent.primaryIntent === 'request_for_quiz_or_test') {
      plan.toolsToExecute.push({ name: 'QuizGenerator', priority: 2 });
    }

    logger.info(`📋 Execution Plan: Search=${needsSearch}, Strategy=${strategy}`);
    return plan;
  }
}

module.exports = ExecutionPlanner;
