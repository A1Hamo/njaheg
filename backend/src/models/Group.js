'use strict';
const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  name:      String,
  email:     String,
  avatar:    String,
  joinedAt:  { type: Date, default: Date.now },
}, { _id: false });

const groupSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true, maxlength: 80 },
  description:     { type: String, maxlength: 500 },
  code:            { type: String, required: true, unique: true, uppercase: true, length: 6 },
  teacherId:       { type: String, required: true, index: true },
  teacherName:     { type: String },
  subject:         { type: String, required: true },
  grade:           { type: String },
  institutionType: { type: String, enum: ['school', 'college', 'university'], default: 'school' },
  institution:     { type: String },
  students:        [memberSchema],
  maxStudents:     { type: Number, default: 50 },
  isActive:        { type: Boolean, default: true },
  color:           { type: String, default: '#7C3AED' },
  emoji:           { type: String, default: '📚' },
  privacy:         { type: String, enum: ['public', 'private'], default: 'public' },
  isPaid:          { type: Boolean, default: false },
  price:           { type: Number, default: 0 },
  curriculumLinked:{ type: String, default: null },
}, { timestamps: true });

groupSchema.index({ teacherId: 1, isActive: 1 });
groupSchema.index({ 'students.userId': 1 });

module.exports = mongoose.model('Group', groupSchema);
