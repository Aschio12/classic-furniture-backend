const Product = require('../models/Product');
const User = require('../models/User');

// GET /api/products - public
const getProducts = async (req, res) => {
  try {
    const { seller } = req.query;
    const filter = {};
    if (seller) {
      filter.seller = seller;
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', 'name email role');
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
};

// POST /api/products - admin only
const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, stock, imageUrl, sellerId } = req.body;

    if (!name || !description || !category || price == null || !sellerId) {
      return res.status(400).json({ message: 'name, description, category, price, and sellerId are required' });
    }

    const seller = await User.findById(sellerId).select('name email role');
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const product = await Product.create({
      name,
      description,
      category,
      price,
      stock: stock ?? 0,
      imageUrl: imageUrl || '',
      seller: seller._id,
    });

    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
};

// PUT /api/products/:id - admin only
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate(
      'seller',
      'name email role'
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
};

// DELETE /api/products/:id - admin only
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json({ message: 'Product deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
