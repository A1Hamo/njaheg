const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId:         { type: String, required: true, index: true },
  group:          { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: false },
  amount:         { type: Number, required: true },
  currency:       { type: String, default: 'EGP' },
  gateway:        { type: String, enum: ['card', 'instapay', 'fawry', 'wallet'], required: true },
  status:         { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  orderId:        { type: String, required: true },
  transactionId:  { type: String },
  referenceCode:  { type: String },
  // Platform fee tracking
  platformFeePercent: { type: Number, default: 10 },
  platformFeeAmount:  { type: Number, default: 0 },
  teacherPayout:      { type: Number, default: 0 },
  type:           { type: String, enum: ['group_join', 'subscription', 'one_time'], default: 'one_time' },
  affiliateRef:   { type: String, index: true },
  affiliateCommission: { type: Number, default: 0 },
  metadata:       { type: Object, default: {} },
}, { timestamps: true });

// Auto-compute fee fields before save
transactionSchema.pre('save', function(next) {
  const fee = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10');
  this.platformFeePercent = fee;
  this.platformFeeAmount  = parseFloat((this.amount * fee / 100).toFixed(2));
  this.teacherPayout      = parseFloat((this.amount - this.platformFeeAmount).toFixed(2));
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
