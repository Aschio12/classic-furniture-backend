const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: String, required: true, default: 'System' },
    type: {
      type: String,
      enum: ['Payment', 'Shipping', 'Arrival', 'Payout'],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
