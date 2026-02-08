require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const seedHubOrders = async () => {
    try {
        console.log('Connecting to DB...');
        await connectDB();

        // 1. Create Mock Users
        console.log('Ensuring mock users...');
        
        let seller = await User.findOne({ email: 'hub_seller@mock.com' });
        if (!seller) {
            seller = new User({
                name: 'Hub Mock Seller',
                email: 'hub_seller@mock.com',
                password: 'password123',
                role: 'seller',
                sellerStatus: 'approved'
            });
            await seller.save();
        }

        let buyer = await User.findOne({ email: 'hub_buyer@mock.com' });
        if (!buyer) {
            buyer = new User({
                name: 'Hub Mock Buyer',
                email: 'hub_buyer@mock.com',
                password: 'password123',
                role: 'user'
            });
            await buyer.save();
        }

        // 1.5 Create Hub Manager
        let hubManager = await User.findOne({ email: 'manager@adama.com' });
        if (!hubManager) {
            hubManager = new User({
                name: 'Adama Manager',
                email: 'manager@adama.com',
                password: 'password123',
                role: 'hub_manager',
                hubAssignment: 'Adama'
            });
            await hubManager.save();
            console.log('Created Hub Manager: manager@adama.com');
        }

        // 2. Create Mock Product
        console.log('Ensuring one mock product...');
        let product = await Product.findOne({ name: 'Hub Test Sofa' });
        if (!product) {
            product = await Product.create({
                name: 'Hub Test Sofa',
                description: 'A comfortable sofa waiting at the hub.',
                category: 'Living Room',
                price: 5000,
                stock: 10,
                seller: seller._id,
                imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
            });
        }

        // 3. Create Orders "Arrived at Hub"
        console.log('Creating "Arrived at Hub" orders...');
        
        const orderData = [
            {
                pickupHub: 'Adama',
                minsAgo: 30
            },
            {
                pickupHub: 'Adama', // Should likely match the hub manager's hub if we enforced it, but currently UI fetches all pending
                minsAgo: 120
            },
            {
                pickupHub: 'Addis Ababa',
                minsAgo: 2
            }
        ];

        for (const data of orderData) {
            const order = await Order.create({
                buyer: buyer._id,
                seller: seller._id,
                items: [
                    {
                        product: product._id,
                        quantity: 1,
                        priceAtPurchase: product.price
                    }
                ],
                totalAmount: product.price,
                status: 'Arrived at Hub',
                pickupHub: data.pickupHub,
                history: [
                    { status: 'Pending', at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) },
                    { status: 'Paid', at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
                    { status: 'Shipped', at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) },
                    { status: 'Arrived at Hub', at: new Date(Date.now() - 1000 * 60 * data.minsAgo) }
                ]
            });
            console.log(`Created Order ${order._id} for Hub: ${data.pickupHub}`);
        }

        console.log('✅ Mock data seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedHubOrders();
