// src/middleware/upload.js
const multer = require('multer');

const ALLOWED = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg', 'image/jpg': 'jpg',
  'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
  // Audio (for voice messages)
  'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/wav': 'wav',
  'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a',
  'audio/aac': 'aac', 'audio/x-m4a': 'm4a',
  // Video
  'video/webm': 'webm', 'video/mp4': 'mp4',
  // Documents
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
};

const ALLOWED_MSG = 'File type not allowed. Allowed: PDF, JPEG, PNG, GIF, WEBP, Audio (WebM/MP3/WAV/OGG), Video (MP4), Documents';

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 200;

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    ALLOWED[file.mimetype] ? cb(null, true) : cb(new Error(ALLOWED_MSG));
  },
});

const uploadSingle  = upload.single('file');
const uploadAvatar  = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null,true) : cb(new Error('Only images allowed for avatars')),
}).single('avatar');

module.exports = { upload, uploadSingle, uploadAvatar, ALLOWED };
