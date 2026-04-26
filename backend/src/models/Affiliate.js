const mongoose = require('mongoose');

const affiliateSchema = new mongoose.Schema({
  teacherId: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true, index: true },
  commissionRate: { type: Number, default: 10 }, // e.g. 10%
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  earnedAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Affiliate', affiliateSchema);
