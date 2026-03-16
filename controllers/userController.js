const User = require('../models/User');
const supabase = require('../config/supabaseClient');

// GET /api/users - admin only
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// GET /api/users/:id - admin only
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

// POST /api/users/seller/request (user only)
// Requires multipart/form-data with license file and payment details
const requestSellerAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { telebirrNumber, bankAccountName, accountNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Business license file is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.sellerStatus === 'pending') {
      return res.status(400).json({ message: 'Seller verification already pending' });
    }

    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `license-${userId}-${Date.now()}${fileExt ? `.${fileExt}` : ''}`;
    const filePath = `seller-licenses/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('furniture-images')
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) {
      return res.status(500).json({ message: 'Failed to upload license', error: uploadError.message });
    }

    const { data: publicData } = supabase.storage.from('furniture-images').getPublicUrl(filePath);

    user.businessLicense = publicData?.publicUrl || '';
    user.paymentDetails = {
      telebirrNumber: telebirrNumber || '',
      bankAccountName: bankAccountName || '',
      accountNumber: accountNumber || '',
    };
    user.sellerStatus = 'pending';

    await user.save();
    return res.json({ message: 'Seller verification requested', sellerStatus: user.sellerStatus });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to request seller account', error: err.message });
  }
};

// PATCH /api/users/seller/verify/:id (admin only)
// Body: { status: 'approved' | 'rejected' | 'pending' }
const verifySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.sellerStatus = status;
    if (status === 'approved') {
      user.role = 'seller';
    }

    await user.save();
    return res.json({ message: 'Seller status updated', sellerStatus: user.sellerStatus, role: user.role });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to verify seller', error: err.message });
  }
};

// PATCH /api/users/profile (any authenticated user)
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, password } = req.body;

    if (name !== undefined) {
      user.name = name;
    }

    if (email !== undefined && email !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (password !== undefined && password !== '') {
      user.password = password;
    }

    await user.save();

    const updated = user.toObject();
    delete updated.password;

    return res.json({ user: updated });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

module.exports = { getUsers, getUserById, requestSellerAccount, verifySeller, updateProfile };
