const axios = require('axios');
const Order = require('../models/Order');

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

    const tx_ref = `order_${orderId}_${Date.now()}`;

    const payload = {
      amount: order.totalAmount,
      currency: 'ETB',
      email,
      tx_ref,
      callback_url: 'https://example.com/chapa/callback',
      return_url: 'https://example.com/checkout/success',
    };

    const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', payload, {
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const checkoutUrl = response?.data?.data?.checkout_url;
    if (!checkoutUrl) {
      return res.status(502).json({ message: 'Invalid response from Chapa' });
    }

    return res.json({ checkout_url: checkoutUrl, tx_ref });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to initialize payment', error: err.message });
  }
};

module.exports = { initializePayment };
