// src/services/achievementService.js
'use strict';
const { pool }            = require('../config/postgres');
const { pushNotification} = require('../config/socket');
const logger              = require('../utils/logger');

const DEFS = [
  { key:'first_login',     title:'First Steps',       icon:'🚀', xp:100,  cat:'general',    event:'register' },
  { key:'first_session',   title:'Study Starter',      icon:'📖', xp:100,  cat:'study',      event:'session_complete', count:1 },
  { key:'ten_sessions',    title:'Dedicated Learner',  icon:'🎯', xp:300,  cat:'study',      event:'session_complete', count:10 },
  { key:'fifty_sessions',  title:'Study Machine',      icon:'⚡', xp:1000, cat:'study',      event:'session_complete', count:50 },
  { key:'first_upload',    title:'Uploader',           icon:'📁', xp:50,   cat:'files',      event:'file_upload', count:1 },
  { key:'ten_uploads',     title:'Bookworm',            icon:'📚', xp:200,  cat:'files',      event:'file_upload', count:10 },
  { key:'streak_3',        title:'3-Day Streak',        icon:'🔥', xp:150,  cat:'streak',     event:'streak', count:3 },
  { key:'streak_7',        title:'7-Day Streak',        icon:'🔥', xp:500,  cat:'streak',     event:'streak', count:7 },
  { key:'streak_30',       title:'Month Champion',      icon:'🌟', xp:2000, cat:'streak',     event:'streak', count:30 },
  { key:'first_quiz',      title:'Quiz Time!',          icon:'🧠', xp:100,  cat:'quiz',       event:'quiz_generated', count:1 },
  { key:'perfect_quiz',    title:'Quiz Master',         icon:'💯', xp:500,  cat:'quiz',       event:'perfect_quiz' },
  { key:'ten_quizzes',     title:'Quiz Veteran',        icon:'🏅', xp:300,  cat:'quiz',       event:'quiz_submitted', count:10 },
  { key:'first_board',     title:'Contributor',         icon:'📋', xp:150,  cat:'community',  event:'board_post', count:1 },
  { key:'hundred_likes',   title:'Influencer',          icon:'👑', xp:1000, cat:'community',  event:'total_likes', count:100 },
  { key:'ten_pomodoros',   title:'Focused',             icon:'⏱️', xp:250,  cat:'focus',      event:'pomodoro', count:10 },
  { key:'fifty_pomodoros', title:'Deep Worker',         icon:'🧘', xp:1000, cat:'focus',      event:'pomodoro', count:50 },
  { key:'ai_explorer',     title:'AI Explorer',         icon:'🤖', xp:100,  cat:'ai',         event:'ai_chat', count:1 },
  { key:'level_10',        title:'Rising Star',         icon:'⭐', xp:0,    cat:'level',      event:'level', count:10 },
  { key:'level_20',        title:'Scholar',             icon:'🎓', xp:0,    cat:'level',      event:'level', count:20 },
  { key:'level_50',        title:'Master',              icon:'👨‍🎓',xp:0,    cat:'level',      event:'level', count:50 },
  { key:'first_note',      title:'Note Taker',          icon:'✏️', xp:50,   cat:'notes',      event:'note_created', count:1 },
  { key:'twenty_notes',    title:'Writer',              icon:'📝', xp:300,  cat:'notes',      event:'note_created', count:20 },
];

async function seedAchievements() {
  try {
    if (!process.env.DATABASE_URL) {
      logger.info('Skipping achievement seeding - no DATABASE_URL');
      return;
    }
    for (const a of DEFS) {
      await pool.query(`
        INSERT INTO achievements (key,title,icon,xp_reward,category,condition)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (key) DO UPDATE SET title=$2,icon=$3,xp_reward=$4,category=$5,condition=$6
      `, [a.key, a.title, a.icon, a.xp, a.cat, JSON.stringify({ event: a.event, count: a.count || 1 })]);  
    }
    logger.info('Achievements seeded');
  } catch (err) {
    logger.warn('Achievement seeding skipped:', err.message);
  }
}

async function checkAchievements(userId, event) {
  try {
    const { rows: candidates } = await pool.query(`
      SELECT a.* FROM achievements a
      WHERE (a.condition->>'event')=$1
        AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.achievement_id=a.id AND ua.user_id=$2)
    `, [event, userId]);

    for (const ach of candidates) {
      const cond  = ach.condition;
      const need  = cond.count || 1;
      let earned  = false;

      if (event === 'register' || event === 'perfect_quiz') {
        earned = true;
      } else if (event === 'session_complete') {
        const { rows } = await pool.query(`SELECT COUNT(*) FROM study_sessions WHERE user_id=$1 AND status='completed'`, [userId]);
        earned = parseInt(rows[0].count) >= need;
      } else if (event === 'file_upload') {
        const { rows } = await pool.query(`SELECT COUNT(*) FROM files WHERE user_id=$1`, [userId]);
        earned = parseInt(rows[0].count) >= need;
      } else if (event === 'pomodoro') {
        const { rows } = await pool.query(`SELECT COUNT(*) FROM pomodoro_sessions WHERE user_id=$1 AND completed=true AND type='focus'`, [userId]);
        earned = parseInt(rows[0].count) >= need;
      } else if (event === 'streak') {
        const { rows } = await pool.query(`SELECT streak_days FROM users WHERE id=$1`, [userId]);
        earned = parseInt(rows[0].streak_days) >= need;
      } else if (event === 'quiz_generated' || event === 'quiz_submitted' || event === 'ai_chat') {
        const tbl = event === 'quiz_submitted' ? 'quiz_attempts' : null;
        if (tbl) {
          const { rows } = await pool.query(`SELECT COUNT(*) FROM ${tbl} WHERE user_id=$1`, [userId]);
          earned = parseInt(rows[0].count) >= need;
        } else { earned = true; }
      } else if (event === 'board_post') {
        const { rows } = await pool.query(`SELECT COUNT(*) FROM board_posts WHERE user_id=$1`, [userId]);
        earned = parseInt(rows[0].count) >= need;
      } else if (event === 'note_created') {
        const { rows } = await pool.query(`SELECT COUNT(*) FROM notes WHERE user_id=$1`, [userId]);
        earned = parseInt(rows[0].count) >= need;
      } else if (event === 'level') {
        const { rows } = await pool.query(`SELECT level FROM users WHERE id=$1`, [userId]);
        earned = parseInt(rows[0].level) >= need;
      }

      if (earned) {
        await pool.query(`INSERT INTO user_achievements (user_id,achievement_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [userId, ach.id]);
        if (ach.xp_reward > 0) {
          await pool.query(`UPDATE users SET xp_points=xp_points+$1 WHERE id=$2`, [ach.xp_reward, userId]);
        }
        await checkLevelUp(userId);
        await pool.query(`
          INSERT INTO notifications (user_id,type,title,body,data)
          VALUES ($1,'achievement',$2,$3,$4)
        `, [userId, `🏆 Achievement: ${ach.title}`, `You earned "${ach.title}" — +${ach.xp_reward} XP!`, JSON.stringify({ key: ach.key, icon: ach.icon })]);
        pushNotification(userId, { type: 'achievement', title: `🏆 ${ach.title}`, body: `+${ach.xp_reward} XP unlocked!`, icon: ach.icon });
        logger.info(`Achievement [${ach.key}] unlocked for ${userId}`);
      }
    }
  } catch (err) {
    logger.error('Achievement check error:', err);
  }
}

async function checkLevelUp(userId) {
  const { rows } = await pool.query(`SELECT xp_points, level FROM users WHERE id=$1`, [userId]);
  const { xp_points, level } = rows[0];
  const needed = level * 200;
  if (xp_points >= needed) {
    const newLevel = level + 1;
    await pool.query(`UPDATE users SET level=$1 WHERE id=$2`, [newLevel, userId]);
    await pool.query(`INSERT INTO notifications (user_id,type,title,body) VALUES ($1,'level_up',$2,$3)`,
      [userId, `⬆️ Level Up! You are now Level ${newLevel}`, 'Keep studying to reach the next level!']);
    pushNotification(userId, { type: 'level_up', title: `⬆️ Level ${newLevel}!`, body: 'You leveled up! Keep going! 🎉' });
    await checkAchievements(userId, 'level');
  }
}

module.exports = { checkAchievements, seedAchievements };
