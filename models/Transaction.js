const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    paymentMethod: {
      type: String,
      enum: ['Telebirr', 'CBE', 'Mastercard'],
      required: true,
    },
    transactionReference: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['Pending', 'Success', 'Failed'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
