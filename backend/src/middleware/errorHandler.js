// src/middleware/errorHandler.js
const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  logger.error(`[${req.method}] ${req.path} :: ${err.message}`);
  
  if (err.name === 'ValidationError' || err.message.includes('validation')) {
    return res.status(400).json({ success: false, status: 400, message: err.message, details: err.errors || null });
  }
  if (err.code === '23505') {
    return res.status(409).json({ success: false, status: 409, message: 'Resource already exists' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, status: 400, message: 'Referenced record not found' });
  }
  if (err.name === 'UnauthorizedError' || err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, status: 403, message: err.message });
  }

  const response = {
    success: false,
    status,
    message: process.env.NODE_ENV === 'production' && status === 500 
      ? 'Internal server error' 
      : err.message || 'An unexpected error occurred',
  };

  if (process.env.NODE_ENV !== 'production' && status === 500) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

module.exports = { errorHandler };
