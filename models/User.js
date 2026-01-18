const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: 'Invalid email address',
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'seller', 'hub_manager'],
      default: 'user',
    },
    hubAssignment: {
      type: String,
      enum: ['Addis Ababa', 'Adama', 'Hawassa', 'Bahir Dar', 'Dire Dawa', ''],
      default: '',
    },
    sellerStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    businessLicense: {
      type: String,
      default: '',
    },
    paymentDetails: {
      telebirrNumber: { type: String, default: '' },
      bankAccountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
