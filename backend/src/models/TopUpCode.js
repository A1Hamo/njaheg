const mongoose = require('mongoose');

const topUpCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  amount: { type: Number, required: true },
  isUsed: { type: Boolean, default: false },
  usedBy: { type: String }, // UUID from Postgres
  usedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TopUpCode', topUpCodeSchema);
