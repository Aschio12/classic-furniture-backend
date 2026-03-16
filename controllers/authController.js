const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
// Registers a new customer (role forced to 'user')
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase();

    // Security check: Prevent registration with restricted keywords or official admin email
    const restrictedTerms = ['admin', 'hub', 'manager', 'hub_manager', 'system', 'root'];
    const hasRestrictedTerm = restrictedTerms.some(term => normalizedEmail.includes(term));
    const isEnvAdmin = process.env.ADMIN_EMAIL && normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase();

    if (hasRestrictedTerm || isEnvAdmin) {
      return res.status(403).json({ 
        message: 'Security error: Email contains restricted keywords or matches system credentials. Registration denied.'
      });
    }

    // Explicitly reject if user tries to spoof a role in the payload
    if (req.body.role && req.body.role !== 'user') {
      return res.status(403).json({ message: 'Security error: Role assignment is forbidden during customer registration.' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash the password before creating the user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
    });

    const token = generateToken(user._id.toString());
    const { password: _, ...safe } = user.toObject();
    return res.status(201).json({ token, user: safe, role: safe.role });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// POST /api/auth/login
// Logs in user or admin, returns JWT token and role
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString());
    const { password: _, ...safe } = user.toObject();
    return res.json({ token, user: safe, role: user.role });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// GET /api/auth/logout
// Stateless JWT logout: respond success; if cookies are used, clear 'token'
const logout = async (req, res) => {
  try {
    // If you later store JWT in cookies, clear it
    // Note: res.clearCookie works without cookie-parser
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  } catch (_) {
    // ignore errors clearing cookie
  }
  return res.json({ message: 'Logged out successfully' });
};

module.exports = { registerUser, loginUser, logout };
