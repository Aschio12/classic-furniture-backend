
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

const setupTest = async () => {
  try {
    console.log('🔄 Connecting to Database...');
    await connectDB();

    console.log('\n--- 1. Checking Users ---');
    // Ensure Hub Manager
    let manager = await User.findOne({ email: 'manager@adama.com' });
    if (!manager) {
      manager = await User.create({
        name: 'Adama Manager',
        email: 'manager@adama.com',
        password: 'password123',
        role: 'hub_manager',
        hubAssignment: 'Adama'
      });
      console.log('✅ Created Hub Manager: manager@adama.com / password123');
    } else {
      console.log('✅ Found Hub Manager: manager@adama.com / password123');
    }

    // Ensure Seller
    let seller = await User.findOne({ email: 'hub_seller@mock.com' });
    if (!seller) {
      seller = await User.create({
        name: 'Hub Mock Seller',
        email: 'hub_seller@mock.com',
        password: 'password123',
        role: 'seller',
        sellerStatus: 'approved',
        balance: 0
      });
      console.log('✅ Created Seller: hub_seller@mock.com / password123');
    } else {
      console.log(`✅ Found Seller: hub_seller@mock.com / password123 (Current Balance: ${seller.balance} ETB)`);
    }

    // Ensure Buyer
    let buyer = await User.findOne({ email: 'hub_buyer@mock.com' });
    if (!buyer) {
      buyer = await User.create({
        name: 'Hub Mock Buyer',
        email: 'hub_buyer@mock.com',
        password: 'password123',
        role: 'user'
      });
      console.log('✅ Created Buyer');
    }

    // Ensure Product
    let product = await Product.findOne({ seller: seller._id });
    if (!product) {
       product = await Product.create({
        name: 'Test Setup Sofa',
        description: 'Test',
        category: 'Living Room',
        price: 5000,
        stock: 10,
        seller: seller._id,
        imageUrl: 'https://via.placeholder.com/150'
       });
    }

    console.log('\n--- 2. Setting up Test Order ---');
    // Find or Create Order
    let order = await Order.findOne({ 
      pickupHub: 'Adama', 
      status: 'Arrived at Hub',
      verificationCode: '1234'
    });

    if (!order) {
      order = await Order.create({
        buyer: buyer._id,
        seller: seller._id,
        items: [{ product: product._id, quantity: 1, priceAtPurchase: 5000 }],
        totalAmount: 5000,
        pickupHub: 'Adama',
        status: 'Arrived at Hub',
        verificationCode: '1234', // KNOWN CODE
        history: [{ status: 'Arrived at Hub', handledBy: manager._id, note: 'Test Setup' }]
      });
      console.log('✅ Created NEW Test Order properly configured.');
    } else {
      console.log('✅ Found Existing Test Order properly configured.');
    }

    console.log('\n======================================================');
    console.log('🚀 READY TO TEST! Follow these steps:');
    console.log('======================================================');
    console.log('1.  Log in to Frontend as Hub Manager:');
    console.log('    Email:    manager@adama.com');
    console.log('    Password: password123');
    console.log('');
    console.log('2.  You should see an Order (ID: ' + order._id + ') on the Dashboard.');
    console.log('');
    console.log('3.  Click "Verify Handover".');
    console.log('');
    console.log('4.  Enter the PIN Code: 1 2 3 4');
    console.log('');
    console.log('5.  After Success Animation, refresh this script or check database.');
    console.log('    Seller (hub_seller@mock.com) Balance should increase by: ' + (5000 * 0.9) + ' ETB');
    console.log('======================================================');

    process.exit(0);
  } catch (error) {
    console.error('Error setting up test:', error);
    process.exit(1);
  }
};

setupTest();
