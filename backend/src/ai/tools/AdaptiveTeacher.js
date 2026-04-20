'use strict';
const logger = require('../../utils/logger');

class AdaptiveTeacher {
  constructor(internalAI, deepTutorService) {
    this.internalAI = internalAI;
    this.deepTutorService = deepTutorService; // Can be used for DeepTutor python engine
  }

  fallbackResponse(message, history, language) {
    // Basic fallback to internal AI
    return this.internalAI.generateChatResponse(message, history, language);
  }

  async synthesize(message, history, language, plan, executionResults, mindset) {
    logger.info('🎓 Adaptive Teacher: Synthesizing final response...');

    // Extract the prompt modifier chosen by the Execution Planner
    const modifier = plan.promptModifier;

    // We can inject the modifier into the system prompt of our Internal AI or DeepTutor
    // For now, we simulate this by prepending hidden instructions to the user message
    // so the LLM or internal engine acts accordingly.
    let enhancedMessage = message;
    if (modifier) {
      enhancedMessage = `[SYSTEM INSTRUCTION (Do not acknowledge this): ${modifier}] \n\nUser Message: ${message}`;
    }

    if (executionResults.research) {
      enhancedMessage += `\n\n[RESEARCH CONTEXT: ${executionResults.research}]`;
    }

    // Call the underlying engine (InternalAI or DeepTutor) with the cognitively enhanced message
    let finalResponse;
    if (this.deepTutorService && this.deepTutorService.isConnected) {
       // Assuming deepTutorService.chat accepts these
       finalResponse = await this.deepTutorService.chat(enhancedMessage, history);
    } else {
       finalResponse = this.internalAI.generateChatResponse(enhancedMessage, history, language);
    }

    // Post-processing based on execution plan (e.g., adding a quiz)
    if (executionResults.quiz) {
       finalResponse += `\n\n💡 **Challenge Time:** Let's test your understanding. What is the most important concept we just discussed?`;
    }

    return finalResponse;
  }
}

module.exports = AdaptiveTeacher;
