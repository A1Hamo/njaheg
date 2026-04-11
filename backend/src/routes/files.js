// src/routes/files.js  — FIXED: uploadLimiter from rateLimiter.js (not upload.js)
'use strict';
const router = require('express').Router();
const fc     = require('../controllers/filesController');
const { authenticate }               = require('../middleware/auth');
const { uploadSingle }               = require('../middleware/upload');
const { uploadLimiter }              = require('../middleware/rateLimiter');

router.use(authenticate);

router.get ('/',            fc.listFiles);
router.post('/',            uploadLimiter, uploadSingle, fc.uploadFile);
router.get ('/:id',         fc.getFile);
router.patch('/:id',        fc.updateFile);
router.delete('/:id',       fc.deleteFile);
router.get ('/:id/extract', fc.extractPdfText);

module.exports = router;
