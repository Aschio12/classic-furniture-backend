const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');

// POST /api/orders/checkout
const checkout = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentMethod, transactionReference, shippingAddress } = req.body;

    if (!paymentMethod || !transactionReference || !shippingAddress) {
      return res.status(400).json({ message: 'paymentMethod, transactionReference, and shippingAddress are required' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product', 'price');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const items = cart.items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      priceAtPurchase: item.product.price,
    }));

    const totalAmount = items.reduce((sum, it) => sum + it.priceAtPurchase * it.quantity, 0);

    const order = await Order.create({
      user: userId,
      items,
      totalAmount,
      status: 'Pending',
      shippingAddress,
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

module.exports = { checkout };
