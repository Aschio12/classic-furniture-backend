const Product = require('../models/Product');
const User = require('../models/User');
const supabase = require('../config/supabaseClient');

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
    const { name, description, category, price, stock, imageUrl, sellerId, seller: sellerAlt } = req.body;
    const resolvedSellerId = sellerId || sellerAlt;

    if (!name || !description || !category || price == null || !resolvedSellerId) {
      return res.status(400).json({ message: 'name, description, category, price, and sellerId are required' });
    }

    const seller = await User.findById(resolvedSellerId).select('name email role');
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    let finalImageUrl = imageUrl || '';

    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt ? `.${fileExt}` : ''}`;
      const filePath = `products/${resolvedSellerId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('furniture-images')
        .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) {
        return res.status(500).json({ message: 'Failed to upload image', error: uploadError.message });
      }

      const { data: publicData } = supabase.storage.from('furniture-images').getPublicUrl(filePath);
      if (publicData?.publicUrl) {
        finalImageUrl = publicData.publicUrl;
      }
    }

    const product = await Product.create({
      name,
      description,
      category,
      price,
      stock: stock ?? 0,
      imageUrl: finalImageUrl,
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
