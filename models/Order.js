const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Shipped', 'Arrived at Hub', 'Completed', 'Cancelled', 'Payout Failed'],
      required: true,
    },
    at: { type: Date, default: Date.now },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    pickupHub: {
      type: String,
      enum: ['Addis Ababa', 'Adama', 'Hawassa', 'Bahir Dar', 'Dire Dawa'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Shipped', 'Arrived at Hub', 'Completed', 'Cancelled', 'Payout Failed'],
      default: 'Pending',
    },
    verificationCode: { type: String, default: '' },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
