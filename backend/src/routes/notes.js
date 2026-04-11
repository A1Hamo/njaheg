// src/routes/notes.js
const nr   = require('express').Router();
const { pool } = require('../config/postgres');
const { authenticate } = require('../middleware/auth');
const { checkAchievements } = require('../services/achievementService');
const logger = require('../utils/logger'); // FIXED: added logger

nr.use(authenticate);

nr.get('/', async (req,res) => {
  try {
    const { subject, search, pinned, page=1, limit=30 } = req.query;
    const offset=(Number(page)-1)*Number(limit), p=[req.user.id]; 
    let q='SELECT * FROM notes WHERE user_id=$1', i=2;
    if (subject) { q+=` AND subject=$${i++}`; p.push(subject); }
    if (pinned==='true') { q+=' AND is_pinned=true'; }
    if (search)  { q+=` AND (title ILIKE $${i} OR content ILIKE $${i})`; p.push(`%${search}%`); i++; }
    q+=` ORDER BY is_pinned DESC, updated_at DESC LIMIT $${i++} OFFSET $${i}`; 
    p.push(Number(limit),offset);
    const { rows } = await pool.query(q,p);
    res.json({ notes: rows });
  } catch (err) {
    logger.error('GET /notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

nr.post('/', async (req,res) => {
  const { title, content, subject, linked_file, tags, color = 'default' } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  
  try {
    const wordCount = content ? content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0;
    const { rows } = await pool.query(
      `INSERT INTO notes (user_id, title, content, subject, linked_file, tags, color, word_count) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, title, content || '', subject || 'general', linked_file || null, tags || [], color, wordCount]
    );
    await checkAchievements(req.user.id, 'note_created');
    res.status(201).json({ note: rows[0] });
  } catch (err) {
    logger.error('POST /notes error:', err);
    res.status(500).json({ error: 'Failed to create note. ' + err.message });
  }
});

nr.get('/:id', async (req,res) => {
  const { rows }=await pool.query('SELECT * FROM notes WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);
  if (!rows[0]) return res.status(404).json({ error:'Not found' });
  res.json({ note: rows[0] });
});

nr.put('/:id', async (req,res) => {
  const { title,content,subject,tags,color,is_pinned } = req.body;
  const wordCount = content ? content.replace(/<[^>]*>/g,'').split(/\s+/).filter(Boolean).length : 0;
  const { rows } = await pool.query(`
    UPDATE notes SET
      title=COALESCE($1,title), content=COALESCE($2,content),
      subject=COALESCE($3,subject), tags=COALESCE($4,tags),
      color=COALESCE($5,color), is_pinned=COALESCE($6,is_pinned),
      word_count=$7, updated_at=NOW()
    WHERE id=$8 AND user_id=$9 RETURNING *
  `,[title,content,subject,tags,color,is_pinned,wordCount,req.params.id,req.user.id]);
  if (!rows[0]) return res.status(404).json({ error:'Not found' });
  res.json({ note: rows[0] });
});

nr.delete('/:id', async (req,res) => {
  const { rowCount }=await pool.query('DELETE FROM notes WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);
  if (!rowCount) return res.status(404).json({ error:'Not found' });
  res.json({ message:'Deleted' });
});

module.exports = nr;
