// src/middleware/imageOptimizer.js
// Server-side image optimization using Sharp (Node.js only).
// This is the CORRECT place for image processing — never in frontend.
'use strict';

let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = null;
}

const logger = require('../utils/logger');

/**
 * Resize + convert an image buffer to WebP for server-side optimisation.
 * Falls back gracefully if sharp is unavailable.
 * @param {Buffer} buffer  - raw image buffer
 * @param {object} opts    - { width, height, quality }
 * @returns {Promise<Buffer>}
 */
async function optimizeImage(buffer, opts = {}) {
  if (!sharp) {
    logger.warn('[ImageOptimizer] sharp not available — returning original buffer');
    return buffer;
  }
  const { width = 1200, height, quality = 80 } = opts;
  try {
    let pipeline = sharp(buffer).resize(width, height || null, { withoutEnlargement: true });
    return await pipeline.webp({ quality }).toBuffer();
  } catch (err) {
    logger.error('[ImageOptimizer] Failed to optimise image:', err.message);
    return buffer;
  }
}

/**
 * Express middleware: optimises uploaded image files before they are saved.
 * Attach after multer/busboy but before storage logic.
 */
async function optimizeUploadMiddleware(req, res, next) {
  if (!req.file || !req.file.buffer) return next();
  const mime = req.file.mimetype || '';
  if (!mime.startsWith('image/')) return next();

  try {
    req.file.buffer   = await optimizeImage(req.file.buffer, { width: 1600, quality: 82 });
    req.file.mimetype = 'image/webp';
    req.file.originalname = req.file.originalname.replace(/\.[^.]+$/, '.webp');
  } catch (err) {
    logger.warn('[ImageOptimizer] Skipping optimisation:', err.message);
  }
  next();
}

module.exports = { optimizeImage, optimizeUploadMiddleware };
