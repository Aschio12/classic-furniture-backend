require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const disconnect = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

const seedAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('Missing ADMIN_NAME, ADMIN_EMAIL, or ADMIN_PASSWORD in environment.');
      process.exit(1);
    }

    await connectDB();

    const email = ADMIN_EMAIL.toLowerCase();
    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role === 'admin') {
        console.log('Admin already exists.');
      } else {
        existing.name = existing.name || ADMIN_NAME;
        existing.role = 'admin';
        existing.password = ADMIN_PASSWORD; // Will be hashed by pre-save hook
        await existing.save();
        console.log('Existing user promoted to admin.');
      }
      await disconnect();
      process.exit(0);
    }

    await User.create({
      name: ADMIN_NAME,
      email,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });

    console.log('Admin Created');
    await disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Admin seed failed:', err.message);
    await disconnect();
    process.exit(1);
  }
};

seedAdmin();
