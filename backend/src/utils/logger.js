// src/utils/logger.js
const winston = require('winston');
const path    = require('path');

const fmt = winston.format;

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fmt.combine(
    fmt.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    fmt.errors({ stack: true }),
    fmt.json()
  ),
  transports: [
    new winston.transports.Console({
      format: fmt.combine(
        fmt.colorize(),
        fmt.printf(({ level, message, timestamp }) =>
          `${timestamp} [${level}] ${message}`
        )
      ),
    }),
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error', maxsize: 10485760, maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 10485760, maxFiles: 10,
    }),
  ],
});

module.exports = logger;
