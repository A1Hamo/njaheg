// src/routes/notifications.js
const notifR = require('express').Router();
const { pool } = require('../config/postgres');
const { authenticate } = require('../middleware/auth');
notifR.use(authenticate);
notifR.get('/', async (req,res) => {
  const { unread,page=1,limit=20 }=req.query;
  const offset=(Number(page)-1)*Number(limit);
  let q='SELECT * FROM notifications WHERE user_id=$1',p=[req.user.id],i=2;
  if (unread==='true') q+=' AND is_read=false';
  q+=` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`; p.push(Number(limit),offset);
  const { rows }=await pool.query(q,p);
  const { rows:cnt }=await pool.query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false',[req.user.id]);
  res.json({ notifications:rows, unreadCount:parseInt(cnt[0].count) });
});
notifR.patch('/read-all', async (req,res) => {
  await pool.query('UPDATE notifications SET is_read=true WHERE user_id=$1',[req.user.id]);
  res.json({ message:'All read' });
});
notifR.patch('/:id/read', async (req,res) => {
  await pool.query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);
  res.json({ message:'Read' });
});
notifR.delete('/:id', async (req,res) => {
  await pool.query('DELETE FROM notifications WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);
  res.json({ message:'Deleted' });
});
module.exports = notifR;
