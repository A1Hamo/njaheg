'use strict';
const WebSocket = require('ws');
const logger = require('../utils/logger');

/**
 * DeepTutor Service Integration (HKUDS/DeepTutor)
 * This service connects to the local DeepTutor Python server via WebSocket.
 */
class DeepTutorService {
  constructor() {
    this.wsUrl = process.env.DEEPTUTOR_WS_URL || 'ws://localhost:8001/api/v1/chat';
    this.isReady = true;
  }

  /**
   * Send a message to DeepTutor and force an Arabic response.
   * @param {string} message The student's message
   * @param {Array} history Conversation history
   * @param {string} subject The academic subject
   */
  chat(message, history = [], subject = 'general') {
    return new Promise((resolve, reject) => {
      // Append a system instruction to force Arabic Socratic response
      const augmentedMessage = `[System Context: You are a Najah Platform tutor for the subject: ${subject}. You MUST respond entirely in Arabic using Socratic pedagogical methods.]\n\nStudent: ${message}`;

      const ws = new WebSocket(this.wsUrl);
      let finalResult = null;

      // Timeout fallback
      const timer = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) ws.close();
        if (!finalResult) reject(new Error('DeepTutor WS Timeout'));
      }, 30000);

      ws.on('open', () => {
        ws.send(JSON.stringify({
          message: augmentedMessage,
          session_id: null, // Create new session or manage it here
          history: history,
          kb_name: '',
          enable_rag: false,
          enable_web_search: false
        }));
      });

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'result') {
            finalResult = parsed.content;
            ws.close();
          } else if (parsed.type === 'error') {
            reject(new Error(parsed.message));
            ws.close();
          }
        } catch (e) {
          logger.error('Failed to parse DeepTutor WS message:', e);
        }
      });

      ws.on('close', () => {
        clearTimeout(timer);
        if (finalResult) {
          resolve(finalResult);
        } else {
          resolve(null); // Fallback to localAI if DeepTutor failed
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timer);
        logger.error('DeepTutor WS Error:', err.message);
        resolve(null); // Fallback to localAI gracefully
      });
    });
  }
}

module.exports = new DeepTutorService();
