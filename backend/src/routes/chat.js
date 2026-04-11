// src/routes/chat.js
const cr = require('express').Router();
const { Message } = require('../config/mongo');
const { authenticate } = require('../middleware/auth');
cr.use(authenticate);
cr.get('/rooms', (_req,res) => {
  const subjects=['mathematics','science','arabic','english','social_studies','b_games','physics','chemistry','biology','history','geography'];
  res.json({ rooms: subjects.map(s=>({ key:s, name:s.replace('_',' ') })) });
});
cr.get('/:subject/messages', async (req,res) => {
  const { before,limit=50 }=req.query;
  const q={ roomId:`room:${req.params.subject.toLowerCase()}` };
  if (before) q.createdAt={ $lt: new Date(before) };
  const msgs=await Message.find(q).sort({ createdAt:-1 }).limit(Number(limit)).lean();
  res.json({ messages: msgs.reverse() });
});
module.exports = cr;
