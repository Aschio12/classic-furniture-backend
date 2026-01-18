const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');

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
    const first_name = order.buyer?.name || 'Buyer';

    const tx_ref = `order_${orderId}_${Date.now()}`;

    const payload = {
      amount: order.totalAmount,
      currency: 'ETB',
      email,
      first_name,
      tx_ref,
      callback_url: 'https://webhook.site/your-unique-id',
      return_url: 'http://localhost:5000/api-docs',
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
const chapaWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-chapa-signature'];
    if (!signature) {
      return res.status(401).json({ message: 'Missing signature' });
    }
    if (!process.env.CHAPA_WEBHOOK_SECRET) {
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const computed = crypto.createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET).update(rawBody).digest('hex');

    const signatureBuf = Buffer.from(signature);
    const computedBuf = Buffer.from(computed);
    if (signatureBuf.length !== computedBuf.length || !crypto.timingSafeEqual(signatureBuf, computedBuf)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const event = req.body?.event || req.body?.status || req.body?.data?.status;
    const tx_ref = req.body?.data?.tx_ref || req.body?.tx_ref;

    if (event !== 'success') {
      return res.json({ received: true });
    }

    if (!tx_ref) {
      return res.status(400).json({ message: 'tx_ref missing in webhook payload' });
    }

    const transaction = await Transaction.findOne({ transactionReference: tx_ref });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const order = await Order.findById(transaction.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'Paid';
    order.history.push({ status: 'Paid', handledBy: null, note: 'Payment confirmed via webhook' });
    await order.save();

    transaction.status = 'Success';
    await transaction.save();

    return res.json({ received: true });
  } catch (err) {
    return res.status(500).json({ message: 'Webhook handling failed', error: err.message });
  }
};

module.exports = { initializePayment, chapaWebhook };
