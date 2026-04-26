// src/routes/analytics.js
const router = require('express').Router();
const { pool } = require('../config/postgres');
const { authenticate } = require('../middleware/auth');
const { cacheGet, cacheSet } = require('../config/redis');
router.use(authenticate);

router.get('/dashboard', async (req, res) => {
  const uid  = req.user.id;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const cacheKey = `analytics:${uid}:${today}`;

  // Return cached result if available (5-minute TTL)
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const [sessions, subjectProgress, weeklyActivity, recentQuizzes, pomodoros] = await Promise.all([
    pool.query(`SELECT subject, COUNT(*) as count, COALESCE(SUM(duration),0) as total_mins,
                COUNT(*) FILTER(WHERE status='completed') as completed
                FROM study_sessions WHERE user_id=$1 AND created_at > NOW()-INTERVAL '30 days'
                GROUP BY subject ORDER BY count DESC`, [uid]),
    pool.query(`SELECT subject,sessions,progress,last_study FROM user_subject_progress WHERE user_id=$1`, [uid]),
    pool.query(`SELECT DATE(start_time) as date, COUNT(*) as sessions,
                COALESCE(SUM(duration) FILTER(WHERE status='completed'),0) as minutes
                FROM study_sessions WHERE user_id=$1 AND start_time > NOW()-INTERVAL '7 days'
                GROUP BY DATE(start_time) ORDER BY date`, [uid]),
    pool.query(`SELECT subject,score_pct,created_at FROM quiz_attempts
                WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5`, [uid]),
    pool.query(`SELECT type, COUNT(*) as count, COALESCE(SUM(duration),0) as total_mins
                FROM pomodoro_sessions WHERE user_id=$1 AND created_at > NOW()-INTERVAL '30 days'
                AND completed=true GROUP BY type`, [uid]),
  ]);

  const result = {
    subjectBreakdown: sessions.rows,
    subjectProgress:  subjectProgress.rows,
    weeklyActivity:   weeklyActivity.rows,
    recentQuizzes:    recentQuizzes.rows,
    pomodoroStats:    pomodoros.rows,
  };

  // Cache for 5 minutes (300 seconds)
  await cacheSet(cacheKey, result, 300);
  res.json(result);
});

router.get('/streak-history', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT DATE(start_time) as date, COUNT(*) as sessions
    FROM study_sessions WHERE user_id=$1 AND status='completed'
      AND start_time > NOW()-INTERVAL '90 days'
    GROUP BY DATE(start_time) ORDER BY date
  `, [req.user.id]);
  res.json({ history: rows });
});

module.exports = router;
