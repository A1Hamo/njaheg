'use strict';
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  groupId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  teacherId:   { type: String, required: true },
  teacherName: { type: String },
  title:       { type: String, required: true, trim: true, maxlength: 120 },
  body:        { type: String, required: true, maxlength: 3000 },
  pinned:      { type: Boolean, default: false },
  readBy:      [{ type: String }],  // array of userId strings
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
