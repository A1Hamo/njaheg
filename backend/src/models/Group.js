'use strict';
const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId:   { type: String, required: true },
  name:     String,
  email:    String,
  avatar:   String,
  joinedAt: { type: Date, default: Date.now },
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

  // Activation status — paid groups start 'pending' until teacher pays listing fee
  status: {
    type:    String,
    enum:    ['active', 'pending_payment', 'suspended'],
    default: 'active',
  },

  color:  { type: String, default: '#7C3AED' },
  emoji:  { type: String, default: '📚' },
  privacy:{ type: String, enum: ['public', 'private'], default: 'public' },

  // Pricing
  isPaid: { type: Boolean, default: false },
  price:  { type: Number, default: 0 },

  // Platform fee configuration (set at creation time from env)
  platformFeePercent: { type: Number, default: 5 },

  // Listing / activation fee paid by teacher
  listingFeePaid:      { type: Boolean, default: false },
  listingFeeTransactionId: { type: String, default: null },

  curriculumLinked: { type: String, default: null },
}, { timestamps: true });

groupSchema.index({ teacherId: 1, isActive: 1 });
groupSchema.index({ 'students.userId': 1 });

module.exports = mongoose.model('Group', groupSchema);
