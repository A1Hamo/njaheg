// src/routes/subjects.js
const router = require('express').Router();
const { pool } = require('../config/postgres');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM subjects ORDER BY name_en');
  res.json({ subjects: rows });
});

module.exports = router;
