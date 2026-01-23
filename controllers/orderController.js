const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const mongoose = require('mongoose');
const { payoutToSeller } = require('../services/paymentService');

// POST /api/orders/checkout
const checkout = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentMethod, transactionReference, pickupHub } = req.body;

    if (!paymentMethod || !transactionReference || !pickupHub) {
      return res.status(400).json({ message: 'paymentMethod, transactionReference, and pickupHub are required' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product', 'price seller');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const items = cart.items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      priceAtPurchase: item.product.price,
    }));

    const totalAmount = items.reduce((sum, it) => sum + it.priceAtPurchase * it.quantity, 0);

    const firstSeller = cart.items[0]?.product?.seller;
    const allSameSeller = cart.items.every((it) => String(it.product.seller) === String(firstSeller));
    if (!allSameSeller) {
      return res.status(400).json({ message: 'Cart contains items from multiple sellers' });
    }

    const order = await Order.create({
      buyer: userId,
      seller: firstSeller,
      items,
      totalAmount,
      pickupHub,
      status: 'Pending',
      history: [{ status: 'Pending', handledBy: userId, note: 'Order created' }],
    });

    const transaction = await Transaction.create({
      orderId: order._id,
      paymentMethod,
      transactionReference,
      status: 'Pending',
    });

    return res.status(201).json({ order, transaction });
  } catch (err) {
    return res.status(500).json({ message: 'Checkout failed', error: err.message });
  }
};

// PATCH /api/orders/hub/complete
const completeHubDelivery = async (req, res) => {
  try {
    const { orderId, verificationCode } = req.body;
    if (!orderId || !verificationCode) {
      return res.status(400).json({ message: 'orderId and verificationCode are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const managerHub = req.user.hubAssignment;
    if (!managerHub || order.pickupHub !== managerHub) {
      return res.status(403).json({ message: 'Order does not belong to your hub' });
    }

    if (order.verificationCode !== String(verificationCode)) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    order.status = 'Completed';
    order.history.push({ status: 'Completed', handledBy: req.user._id, note: 'Pickup confirmed' });

    // TODO: Trigger Payout to Seller

    await order.save();
    return res.json({ message: 'Delivery confirmed', order });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to complete delivery', error: err.message });
  }
};

// PATCH /api/orders/hub/arrived/:id
const markAsArrivedAtHub = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const managerHub = req.user.hubLocation || req.user.hubAssignment;
    if (!managerHub || order.pickupHub !== managerHub) {
      return res.status(403).json({ message: 'Order does not belong to your hub' });
    }

    if (order.status !== 'Shipped') {
      return res.status(400).json({ message: 'Order is not in Shipped status' });
    }

    order.status = 'Arrived at Hub';
    order.history.push({ status: 'Arrived at Hub', handledBy: req.user._id, note: 'Arrived at hub' });

    // TODO: Send notification to Buyer: Your order is ready for pickup!

    await order.save();
    return res.json({ message: 'Order marked as arrived at hub', order });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark as arrived', error: err.message });
  }
};

// PATCH /api/orders/confirm
const confirmFinalDelivery = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId, verificationCode } = req.body;
    if (!orderId || !verificationCode) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'orderId and verificationCode are required' });
    }

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Arrived at Hub') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Order is not ready for final confirmation' });
    }

    if (order.verificationCode !== String(verificationCode)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const sellerShare = Number(order.totalAmount) * 0.9;
    const payoutSuccess = await payoutToSeller({ sellerId: order.seller, amount: sellerShare });

    if (!payoutSuccess) {
      await session.abortTransaction();
      session.endSession();
      return res.status(502).json({ message: 'Payout failed, order not completed' });
    }

    const sellerDoc = await User.findById(order.seller).select('name');
    const sellerName = sellerDoc?.name || 'Seller';
    console.log(`Sandbox Transfer Simulated: ${sellerShare.toFixed(2)} sent to ${sellerName}`);

    order.status = 'Completed';
    order.history.push({ status: 'Completed', handledBy: req.user._id, note: 'Final delivery confirmed' });

    await order.save({ session });

    await User.findByIdAndUpdate(
      order.seller,
      { $inc: { balance: sellerShare } },
      { session, new: true }
    );

    // TODO: Send notification to Seller: Money received
    // TODO: Send notification to Buyer: Transaction closed

    await session.commitTransaction();
    session.endSession();

    return res.json({ message: 'Final delivery confirmed', order });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: 'Failed to confirm final delivery', error: err.message });
  }
};

module.exports = { checkout, completeHubDelivery, markAsArrivedAtHub, confirmFinalDelivery };
