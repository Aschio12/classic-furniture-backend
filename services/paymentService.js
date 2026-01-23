const axios = require('axios');
const User = require('../models/User');

const payoutToSeller = async ({ sellerId, amount }) => {
  if (!sellerId || amount == null) {
    throw new Error('sellerId and amount are required');
  }

  const seller = await User.findById(sellerId).select('paymentDetails');
  if (!seller) {
    throw new Error('Seller not found');
  }

  const { bankCode, accountNumber, bankAccountName } = seller.paymentDetails || {};
  if (!bankCode || !accountNumber || !bankAccountName) {
    throw new Error('Seller bank details are incomplete');
  }

  if (!process.env.CHAPA_TEST_SECRET_KEY) {
    throw new Error('CHAPA_TEST_SECRET_KEY is not set');
  }

  const payoutAmount = Number(amount) * 0.9;
  if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
    throw new Error('Invalid payout amount');
  }

  const payload = {
    amount: payoutAmount.toFixed(2),
    currency: 'ETB',
    account_name: bankAccountName,
    account_number: accountNumber,
    bank_code: bankCode,
    reference: `payout_${sellerId}_${Date.now()}`,
  };

  const response = await axios.post('https://api.chapa.co/v1/transfers', payload, {
    headers: {
      Authorization: `Bearer ${process.env.CHAPA_TEST_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const success = response?.data?.status === 'success';
  return Boolean(success);
};

module.exports = { payoutToSeller };
