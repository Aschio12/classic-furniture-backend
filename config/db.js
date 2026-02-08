const mongoose = require('mongoose');

const connectDB = async () => {
  const dbURI = process.env.MONGO_URI;

  console.log('DB URI starts with:', dbURI?.substring(0, 10));

  if (!dbURI || !dbURI.startsWith('mongodb')) {
    console.error('Database URI is improperly configured in Environment Variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbURI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
