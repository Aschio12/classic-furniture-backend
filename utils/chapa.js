const axios = require('axios');

const initializeChapaPayment = async ({ amount, email, first_name, orderId }) => {
  if (!process.env.CHAPA_TEST_SECRET_KEY) {
    throw new Error('CHAPA_TEST_SECRET_KEY is not set');
  }
  if (!amount || !email || !first_name || !orderId) {
    throw new Error('amount, email, first_name, and orderId are required');
  }

  const tx_ref = `order_${orderId}_${Date.now()}`;

  const payload = {
    amount,
    currency: 'ETB',
    email,
    first_name,
    tx_ref,
    callback_url: 'https://your-frontend-domain.com/chapa/callback',
    return_url: 'http://localhost:5001/api-docs',
  };

  const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', payload, {
    headers: {
      Authorization: `Bearer ${process.env.CHAPA_TEST_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return response?.data;
};

module.exports = { initializeChapaPayment };
