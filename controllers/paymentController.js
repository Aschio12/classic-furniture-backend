const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

// POST /api/payments/initialize
const initializePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const order = await Order.findById(orderId).populate('buyer', 'email name');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const email = order.buyer?.email || req.user?.email;
    if (!email) {
      return res.status(400).json({ message: 'Buyer email not found' });
    }
    const fullName = order.buyer?.name || 'Buyer';
    const nameParts = fullName.trim().split(/\s+/);
    const first_name = nameParts[0] || 'Buyer';
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : first_name;

    const tx_ref = `order_${orderId}_${Date.now()}`;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3003';
    const backendUrl = process.env.BACKEND_URL || 'https://classic-furniture-backend.onrender.com';

    const payload = {
      amount: order.totalAmount,
      currency: 'ETB',
      email,
      first_name,
      last_name,
      tx_ref,
      callback_url: `${backendUrl}/api/payments/webhook`,
      return_url: `${frontendUrl}/payment-success?tx_ref=${tx_ref}`,
      customization: {
        title: 'Classic Furniture',
        description: `Payment for Order #${String(orderId).slice(-8).toUpperCase()}`,
      },
    };

    const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', payload, {
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_TEST_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const checkoutUrl = response?.data?.data?.checkout_url;
    if (!checkoutUrl) {
      return res.status(502).json({ message: 'Invalid response from Chapa' });
    }

    await Transaction.findOneAndUpdate(
      { orderId: order._id },
      { transactionReference: tx_ref },
      { new: true }
    );

    return res.json({ checkout_url: checkoutUrl, tx_ref });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to initialize payment', error: err.message });
  }
};

// POST /api/payments/webhook
const verifyWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-chapa-signature'];
    if (!signature) {
      return res.status(401).json({ message: 'Missing signature' });
    }
    const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET || process.env.CHAPA_SECRET_KEY;
    if (!webhookSecret) {
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const computed = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    const signatureBuf = Buffer.from(signature);
    const computedBuf = Buffer.from(computed);
    if (signatureBuf.length !== computedBuf.length || !crypto.timingSafeEqual(signatureBuf, computedBuf)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const status = req.body?.status || req.body?.data?.status || req.body?.event;
    const tx_ref = req.body?.data?.tx_ref || req.body?.tx_ref;

    if (status !== 'success') {
      return res.json({ received: true });
    }

    if (!tx_ref) {
      return res.status(400).json({ message: 'tx_ref missing in webhook payload' });
    }

    let orderId = null;
    const match = String(tx_ref).match(/^order_([^_]+)_/);
    if (match && match[1]) {
      orderId = match[1];
    }
    const order = orderId ? await Order.findById(orderId) : null;
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'Paid';
    order.history.push({ status: 'Paid', handledBy: null, note: 'Payment confirmed via webhook' });

    const transaction = await Transaction.create({
      orderId: order._id,
      paymentMethod: 'Telebirr',
      transactionReference: tx_ref,
      status: 'Success',
    });

    const bulk = order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: -item.quantity } },
      },
    }));

    await Product.bulkWrite(bulk);
    await order.save();
    await transaction.save();

    return res.json({ received: true });
  } catch (err) {
    return res.status(500).json({ message: 'Webhook handling failed', error: err.message });
  }
};

// GET /api/payments/verify/:tx_ref
const verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;
    if (!tx_ref) {
      return res.status(400).json({ message: 'Transaction reference is required' });
    }

    // Check if order is already paid locally
    const transaction = await Transaction.findOne({ transactionReference: tx_ref });
    if (transaction && transaction.status === 'Success') {
      const order = await Order.findById(transaction.orderId);
      return res.json({ 
        status: 'success', 
        message: 'Payment already verified', 
        data: { tx_ref, orderId: order._id } 
      });
    }

    const chapaKey = process.env.CHAPA_TEST_SECRET_KEY || process.env.CHAPA_SECRET_KEY;
    const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: {
        Authorization: `Bearer ${chapaKey}`,
      },
    });

    if (response.data.status !== 'success') {
      return res.status(400).json({ message: 'Payment verification failed at Chapa' });
    }

    // Extract Order ID
    let orderId = null;
    const match = String(tx_ref).match(/^order_([^_]+)_/);
    if (match && match[1]) {
      orderId = match[1];
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If order is not yet paid, process it (similar to webhook)
    if (order.status !== 'Paid') {
        order.status = 'Paid';
        order.history.push({ 
            status: 'Paid', 
            handledBy: req.user ? req.user._id : null, 
            note: 'Payment verified by client request' 
        });

        const newTransaction = await Transaction.create({
            orderId: order._id,
            paymentMethod: 'Telebirr', // Or derive from Chapa response
            transactionReference: tx_ref,
            status: 'Success',
        });

        // Decrement Stock
        const bulk = order.items.map((item) => ({
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { stock: -item.quantity } },
            },
        }));

        await Product.bulkWrite(bulk);
        await order.save();
        await newTransaction.save();
    }

    return res.json({ 
        status: 'success', 
        message: 'Payment verified successfully', 
        data: { tx_ref, orderId: order._id } 
    });

  } catch (err) {
    console.error('Verify Payment Error:', err.message);
    return res.status(500).json({ message: 'Verification failed', error: err.message });
  }
};

module.exports = { initializePayment, verifyWebhook, verifyPayment };
