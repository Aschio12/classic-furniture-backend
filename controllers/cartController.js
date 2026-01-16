const Cart = require('../models/Cart');

// Ensure a cart exists for the user
const ensureCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// POST /api/cart (body: { productId, quantity })
const addToCart = async (req, res) => {
  try {
    if (req.user?.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot maintain a shopping cart.' });
    }

    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }
    const qty = Number(quantity) || 1;
    if (qty < 1) {
      return res.status(400).json({ message: 'quantity must be >= 1' });
    }

    const cart = await ensureCart(userId);
    const existing = cart.items.find((it) => String(it.product) === String(productId));

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product', 'name price imageUrl');
    return res.status(200).json(populated);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to add to cart', error: err.message });
  }
};

// GET /api/cart
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await ensureCart(userId);
    const populated = await Cart.findById(cart._id).populate('items.product', 'name price imageUrl');

    const total = populated.items.reduce((sum, it) => {
      const price = it.product?.price || 0;
      return sum + price * it.quantity;
    }, 0);

    return res.json({ cart: populated, total });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get cart', error: err.message });
  }
};

// GET /api/cart/all - admin only
const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find()
      .populate('user', 'name email role')
      .populate('items.product', 'name price imageUrl');

    return res.json(carts);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch carts', error: err.message });
  }
};

// DELETE /api/cart/:productId
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: 'productId param is required' });
    }

    const cart = await ensureCart(userId);
    cart.items = cart.items.filter((it) => String(it.product) !== String(productId));
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product', 'name price imageUrl');
    const total = populated.items.reduce((sum, it) => {
      const price = it.product?.price || 0;
      return sum + price * it.quantity;
    }, 0);

    return res.json({ cart: populated, total });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to remove from cart', error: err.message });
  }
};

// PUT /api/cart/:productId (body: { quantity })
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId param is required' });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ message: 'quantity must be >= 1' });
    }

    const cart = await ensureCart(userId);
    const existing = cart.items.find((it) => String(it.product) === String(productId));
    if (!existing) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    existing.quantity = qty;
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product', 'name price imageUrl');
    const total = populated.items.reduce((sum, it) => {
      const price = it.product?.price || 0;
      return sum + price * it.quantity;
    }, 0);

    return res.json({ cart: populated, total });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update cart item', error: err.message });
  }
};

module.exports = { addToCart, getCart, removeFromCart, updateCartItem, getAllCarts };
