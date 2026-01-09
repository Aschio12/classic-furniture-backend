const Product = require('../models/Product');

// GET /api/products - public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).populate('createdBy', 'name email role');
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
};

// POST /api/products - admin only
const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, stock, imageUrl } = req.body;

    if (!name || !description || !category || price == null) {
      return res.status(400).json({ message: 'name, description, category, and price are required' });
    }

    const product = await Product.create({
      name,
      description,
      category,
      price,
      stock: stock ?? 0,
      imageUrl: imageUrl || '',
      createdBy: req.user._id,
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

    const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
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
