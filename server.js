const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// MongoDB Connection Logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Start Server
const startServer = async () => {
  // Only try to connect if MONGO_URI is provided
  if (process.env.MONGO_URI) {
    await connectDB();
  } else {
    console.warn('WARNING: MONGO_URI not found in .env. Skipping database connection.');
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
