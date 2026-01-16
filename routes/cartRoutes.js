const express = require('express');
const { addToCart, getCart, removeFromCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get logged-in user's cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart and total
 */
router.get('/', protect, getCart);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.post('/', protect, addToCart);

/**
 * @swagger
 * /api/cart/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.delete('/:productId', protect, removeFromCart);

module.exports = router;
