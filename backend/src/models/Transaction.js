const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: false },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'EGP' },
  gateway: { type: String, enum: ['card', 'instapay', 'fawry', 'wallet'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  orderId: { type: String, required: true }, // Paymob Order ID
  transactionId: { type: String }, // Gateway Transaction ID
  referenceCode: { type: String }, // E.g., Fawry Ref Code or InstaPay Address
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
