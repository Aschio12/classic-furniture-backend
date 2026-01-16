const express = require('express');
const { addToCart, getCart, removeFromCart, updateCartItem, getAllCarts } = require('../controllers/cartController');
const { protect, admin, userOnly } = require('../middleware/authMiddleware');

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
 * /api/cart/all:
 *   get:
 *     summary: Get all carts (admin only)
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of carts
 */
router.get('/all', protect, admin, getAllCarts);

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
router.post('/', protect, userOnly, addToCart);

/**
 * @swagger
 * /api/cart/{productId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.put('/:productId', protect, userOnly, updateCartItem);

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
router.delete('/:productId', protect, userOnly, removeFromCart);

module.exports = router;
