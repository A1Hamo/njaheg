'use strict';
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const Group        = require('../models/Group');
const Announcement = require('../models/Announcement');
const Assignment   = require('../models/Assignment');

// Simple in-process auth middleware (re-uses the JWT from the auth routes)
const jwt    = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'najah_secret';

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(h.slice(7), SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function teacherOnly(req, res, next) {
  if (req.user?.role !== 'teacher') return res.status(403).json({ error: 'Teachers only' });
  next();
}

async function ownerOnly(req, res, next) {
  try {
    const groupId = req.params.id || req.params.groupId;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const uid = req.user.id || req.user.userId;
    if (group.teacherId !== uid) return res.status(403).json({ error: 'Forbidden. Owner only.' });
    req.group = group; // Pass it along to save a DB call if needed
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error check ownership' });
  }
}

// ── Helper: generate unique 6-char code ──────────────────────
async function uniqueCode() {
  let code, exists = true;
  while (exists) {
    code = nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 6);
    exists = await Group.exists({ code });
  }
  return code;
}

/* ═══════════════════════════════════════════════════════
   GROUPS
═══════════════════════════════════════════════════════ */

// POST /api/groups  — any authenticated user creates a group
router.post('/', auth, async (req, res) => {
  const { name, description, subject, institutionType, institution, maxStudents, color, emoji } = req.body;
  if (!name || !subject) return res.status(400).json({ error: 'Name and subject are required' });

  const code  = await uniqueCode();
  const group = await Group.create({
    name, description, subject, code,
    institutionType: institutionType || 'school',
    institution,
    maxStudents: maxStudents || 50,
    color: color || '#7C3AED',
    emoji: emoji || '📚',
    teacherId:   req.user.id || req.user.userId,
    teacherName: req.user.name || '',
  });

  res.status(201).json({ group });
});

// GET /api/groups  — teacher: own groups | student: joined groups
router.get('/', auth, async (req, res) => {
  const uid = req.user.id || req.user.userId;

  let groups;
  if (req.user.role === 'teacher') {
    groups = await Group.find({ teacherId: uid, isActive: true }).sort({ createdAt: -1 });
  } else {
    groups = await Group.find({ 
      $or: [ { 'students.userId': uid }, { teacherId: uid } ],
      isActive: true 
    }).sort({ createdAt: -1 });
  }

  res.json({ groups });
});

// GET /api/groups/:id
router.get('/:id', auth, async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const uid = req.user.id || req.user.userId;
  const isMember = group.teacherId === uid || group.students.some(s => s.userId === uid);
  if (!isMember) return res.status(403).json({ error: 'Not a member of this group' });

  res.json({ group });
});

// POST /api/groups/join  — student joins by code
router.post('/join', auth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Invite code required' });

  const group = await Group.findOne({ code: code.toUpperCase(), isActive: true });
  if (!group) return res.status(404).json({ error: 'Invalid invite code' });

  const uid = req.user.id || req.user.userId;
  if (group.students.some(s => s.userId === uid))
    return res.status(409).json({ error: 'Already a member of this group' });

  if (group.students.length >= group.maxStudents)
    return res.status(400).json({ error: 'Group is full' });

  group.students.push({
    userId:   uid,
    name:     req.user.name || '',
    email:    req.user.email || '',
    joinedAt: new Date(),
  });
  await group.save();

  res.json({ group });
});

// DELETE /api/groups/:id/members/:userId  — owner removes a student
router.delete('/:id/members/:userId', auth, ownerOnly, async (req, res) => {
  const group = req.group;
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (group.teacherId !== (req.user.id || req.user.userId))
    return res.status(403).json({ error: 'Forbidden' });

  group.students = group.students.filter(s => s.userId !== req.params.userId);
  await group.save();
  res.json({ ok: true });
});

// DELETE /api/groups/:id  — owner deletes group
router.delete('/:id', auth, ownerOnly, async (req, res) => {
  const group = req.group;
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (group.teacherId !== (req.user.id || req.user.userId))
    return res.status(403).json({ error: 'Forbidden' });

  group.isActive = false;
  await group.save();
  res.json({ ok: true });
});

// PATCH /api/groups/:id  — owner updates group
router.patch('/:id', auth, ownerOnly, async (req, res) => {
  const group = req.group;
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (group.teacherId !== (req.user.id || req.user.userId))
    return res.status(403).json({ error: 'Forbidden' });

  const allowed = ['name', 'description', 'subject', 'maxStudents', 'color', 'emoji'];
  allowed.forEach(k => { if (req.body[k] != null) group[k] = req.body[k]; });
  await group.save();
  res.json({ group });
});

/* ═══════════════════════════════════════════════════════
   ANNOUNCEMENTS
═══════════════════════════════════════════════════════ */

// POST /api/groups/:id/announcements
router.post('/:id/announcements', auth, ownerOnly, async (req, res) => {
  const { title, body, pinned } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

  const ann = await Announcement.create({
    groupId:     req.params.id,
    teacherId:   req.user.id || req.user.userId,
    teacherName: req.user.name || '',
    title, body,
    pinned: pinned || false,
  });
  res.status(201).json({ announcement: ann });
});

// GET /api/groups/:id/announcements
router.get('/:id/announcements', auth, async (req, res) => {
  const anns = await Announcement.find({ groupId: req.params.id })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(50);
  res.json({ announcements: anns });
});

// PATCH /api/groups/:groupId/announcements/:annId/pin
router.patch('/:groupId/announcements/:annId/pin', auth, ownerOnly, async (req, res) => {
  const ann = await Announcement.findById(req.params.annId);
  if (!ann) return res.status(404).json({ error: 'Announcement not found' });
  ann.pinned = !ann.pinned;
  await ann.save();
  res.json({ announcement: ann });
});

// DELETE /api/groups/:groupId/announcements/:annId
router.delete('/:groupId/announcements/:annId', auth, ownerOnly, async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.annId);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════
   ASSIGNMENTS
═══════════════════════════════════════════════════════ */

// POST /api/groups/:id/assignments
router.post('/:id/assignments', auth, ownerOnly, async (req, res) => {
  const { title, description, dueDate, maxScore } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const assignment = await Assignment.create({
    groupId:   req.params.id,
    teacherId: req.user.id || req.user.userId,
    title, description,
    dueDate:  dueDate ? new Date(dueDate) : undefined,
    maxScore: maxScore || 100,
  });
  res.status(201).json({ assignment });
});

// GET /api/groups/:id/assignments
router.get('/:id/assignments', auth, async (req, res) => {
  const assignments = await Assignment.find({ groupId: req.params.id })
    .sort({ dueDate: 1, createdAt: -1 });
  res.json({ assignments });
});

// POST /api/groups/:id/assignments/:aId/submit  — student submits
router.post('/:id/assignments/:aId/submit', auth, async (req, res) => {
  const { content } = req.body;
  const assignment = await Assignment.findById(req.params.aId);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const uid = req.user.id || req.user.userId;
  const existing = assignment.submissions.find(s => s.studentId === uid);
  if (existing) {
    existing.content     = content;
    existing.submittedAt = new Date();
    existing.status      = assignment.dueDate && new Date() > assignment.dueDate ? 'late' : 'submitted';
  } else {
    assignment.submissions.push({
      studentId:   uid,
      studentName: req.user.name || '',
      content,
      status: assignment.dueDate && new Date() > assignment.dueDate ? 'late' : 'submitted',
    });
  }
  await assignment.save();
  res.json({ ok: true });
});

// PATCH /api/groups/:id/assignments/:aId/submissions/:sId  — owner grades
router.patch('/:id/assignments/:aId/submissions/:sId', auth, ownerOnly, async (req, res) => {
  const { score, feedback } = req.body;
  const assignment = await Assignment.findById(req.params.aId);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const sub = assignment.submissions.id(req.params.sId);
  if (!sub) return res.status(404).json({ error: 'Submission not found' });

  sub.score    = score;
  sub.feedback = feedback;
  sub.status   = 'graded';
  sub.gradedAt = new Date();
  await assignment.save();
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════
   INSIGHTS (teacher only)
═══════════════════════════════════════════════════════ */

// GET /api/groups/:id/insights
router.get('/:id/insights', auth, ownerOnly, async (req, res) => {
  const group = req.group;
  if (!group) return res.status(404).json({ error: 'Not found' });

  const assignments = await Assignment.find({ groupId: req.params.id });
  const totalStudents = group.students.length;

  let totalSubmissions = 0;
  let gradedSubmissions = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  assignments.forEach(a => {
    totalSubmissions += a.submissions.length;
    a.submissions.forEach(s => {
      if (s.status === 'graded') {
        gradedSubmissions++;
        scoreSum  += (s.score / a.maxScore) * 100;
        scoreCount++;
      }
    });
  });

  res.json({
    insights: {
      totalStudents,
      totalAssignments:    assignments.length,
      avgScore:            scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null,
      submissionRate:      assignments.length > 0 && totalStudents > 0
        ? Math.round((totalSubmissions / (assignments.length * totalStudents)) * 100)
        : 0,
    }
  });
});

module.exports = router;
