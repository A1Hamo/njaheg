// src/routes/quiz.js  (re-exports from achievements.js module trick won't work — standalone)
const qr = require('express').Router();
const { pool } = require('../config/postgres');
const { authenticate } = require('../middleware/auth');
qr.use(authenticate);
qr.get('/history', async (req,res) => {
  const { subject, limit=20 } = req.query;
  let q='SELECT * FROM quiz_attempts WHERE user_id=$1', p=[req.user.id], i=2;
  if (subject) { q+=` AND subject=$${i++}`; p.push(subject); }
  q+=` ORDER BY created_at DESC LIMIT $${i}`; p.push(Number(limit));
  const { rows } = await pool.query(q, p);
  res.json({ attempts: rows });
});
qr.get('/stats', async (req,res) => {
  const { rows } = await pool.query(`
    SELECT subject, COUNT(*) as attempts, ROUND(AVG(score_pct),1) as avg_score,
           MAX(score_pct) as best_score, COUNT(*) FILTER(WHERE score_pct=100) as perfect
    FROM quiz_attempts WHERE user_id=$1 GROUP BY subject ORDER BY attempts DESC
  `,[req.user.id]);
  res.json({ stats: rows });
});
module.exports = qr;
