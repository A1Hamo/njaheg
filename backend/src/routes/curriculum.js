const express = require('express');
const { authenticate } = require('../middleware/auth');
const { pool } = require('../config/postgres');

const router = express.Router();

router.use(authenticate);

// Get grades
router.get('/grades', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM grade_levels ORDER BY level_order');
    res.json({ grades: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// Get subjects for a grade
router.get('/grades/:gradeId/subjects', async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { rows } = await pool.query('SELECT * FROM subjects WHERE grade_id = $1 ORDER BY name', [gradeId]);
    res.json({ subjects: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get units for a subject
router.get('/subjects/:subjectId/units', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { rows } = await pool.query('SELECT * FROM curriculum_units WHERE subject_id = $1 ORDER BY order_index', [subjectId]);
    res.json({ units: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// Get lessons for a unit
router.get('/units/:unitId/lessons', async (req, res) => {
  try {
    const { unitId } = req.params;
    const { rows } = await pool.query('SELECT * FROM lessons WHERE unit_id = $1 ORDER BY id', [unitId]);
    res.json({ lessons: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

module.exports = router;
