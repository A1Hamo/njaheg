// ════════════════════════════════════════
// src/config/mongo.js
// ════════════════════════════════════════
const mongoose = require('mongoose');
const logger   = require('../utils/logger');

async function connectMongo() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  logger.info('✅ MongoDB connected');
}

const messageSchema = new mongoose.Schema({
  roomId:    { type: String, required: true, index: true },
  subject:   { type: String, required: true },
  userId:    { type: String, required: true },
  userName:  { type: String, required: true },
  avatarUrl: String,
  content:   { type: String, required: true },
  type:      { type: String, enum: ['text','file','image','audio','quiz_share'], default: 'text' },
  fileUrl:   String,
  reactions: [{ emoji: String, userId: String }],
  replyTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
}, { timestamps: true });

const aiConversationSchema = new mongoose.Schema({
  userId:    { type: String, required: true, index: true },
  title:     { type: String, default: 'New Chat' },
  messages:  [{ role: String, content: String, timestamp: { type: Date, default: Date.now } }],
  context:   String,
  fileId:    String,
  language:  { type: String, default: 'en' },
}, { timestamps: true });

const privateMessageSchema = new mongoose.Schema({
  senderId:   { type: String, required: true, index: true },
  receiverId: { type: String, required: true, index: true },
  content:    { type: String, required: true },
  type:       { type: String, enum: ['text','file','image','audio'], default: 'text' },
  fileUrl:    String,
  isRead:     { type: Boolean, default: false },
}, { timestamps: true });

// Index for conversation retrieval
privateMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

const Message        = mongoose.model('Message',        messageSchema);
const AIConversation = mongoose.model('AIConversation', aiConversationSchema);
const PrivateMessage = mongoose.model('PrivateMessage', privateMessageSchema);

module.exports = { connectMongo, Message, AIConversation, PrivateMessage };
