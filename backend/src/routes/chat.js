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
cr.get('/recent', async (req, res) => {
  try {
    const { PrivateMessage } = require('../config/mongo');
    const { pool } = require('../config/postgres');
    const uid = req.user.id;

    // Aggregate to find the latest message per conversation partner
    const messages = await PrivateMessage.aggregate([
      { $match: { $or: [{ senderId: uid }, { receiverId: uid }] } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: {
            $cond: [ { $eq: ["$senderId", uid] }, "$receiverId", "$senderId" ]
          },
          lastMsg: { $first: "$$ROOT" },
          unreadCount: { 
            $sum: { $cond: [ { $and: [ { $eq: ["$receiverId", uid] }, { $ne: ["$status", "read"] } ] }, 1, 0 ] } 
          }
      }}
    ]);

    if (!messages.length) return res.json({ recentChats: [] });

    const partnerIds = messages.map(m => m._id);
    const { rows: users } = await pool.query(
      'SELECT id, name, avatar_url as avatar FROM users WHERE id = ANY($1::uuid[])',
      [partnerIds]
    );

    const userMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});

    const recentChats = messages.map(m => {
      const u = userMap[m._id] || { id: m._id, name: 'Unknown User', avatar: null };
      return {
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        lastMsgText: m.lastMsg.type === 'text' ? m.lastMsg.content : `sent a ${m.lastMsg.type}`,
        lastMsgTime: m.lastMsg.createdAt,
        lastMsgStatus: m.lastMsg.status,
        lastMsgIsMine: m.lastMsg.senderId === uid,
        unreadCount: m.unreadCount
      };
    }).sort((a,b) => new Date(b.lastMsgTime) - new Date(a.lastMsgTime));

    res.json({ recentChats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent chats' });
  }
});
module.exports = cr;
