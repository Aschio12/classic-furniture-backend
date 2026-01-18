const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect: Requires a valid Bearer token; attaches user (sans password) to req.user
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }

    // Expect token payload to include user id as decoded.id
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user; // available to subsequent handlers
    return next();
  } catch (err) {
    return res.status(500).json({ message: 'Auth error', error: err.message });
  }
};

// Admin: Requires req.user.role === 'admin'
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
};

// User: Requires req.user.role === 'user'
const userOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'User access required' });
  }
  return next();
};

// Hub Manager: Requires req.user.role === 'hub_manager'
const hubManagerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  if (req.user.role !== 'hub_manager') {
    return res.status(403).json({ message: 'Hub manager access required' });
  }
  return next();
};

module.exports = { protect, admin, userOnly, hubManagerOnly };
