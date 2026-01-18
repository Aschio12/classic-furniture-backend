const express = require('express');
const { checkout, completeHubDelivery } = require('../controllers/orderController');
const { protect, userOnly, hubManagerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/orders/checkout:
 *   post:
 *     summary: Checkout cart and create order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentMethod, transactionReference, pickupHub]
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [Telebirr, CBE, Mastercard]
 *               transactionReference:
 *                 type: string
 *               pickupHub:
 *                 type: string
 *                 enum: [Addis Ababa, Adama, Hawassa, Bahir Dar, Dire Dawa]
 *     responses:
 *       201:
 *         description: Order and transaction created
 */
router.post('/checkout', protect, userOnly, checkout);

/**
 * @swagger
 * /api/orders/hub/complete:
 *   patch:
 *     summary: Confirm delivery at hub (hub manager)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, verificationCode]
 *             properties:
 *               orderId:
 *                 type: string
 *               verificationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Delivery confirmed
 *       400:
 *         description: Invalid verification code
 *       403:
 *         description: Order not in manager hub
 *       404:
 *         description: Order not found
 */
router.patch('/hub/complete', protect, hubManagerOnly, completeHubDelivery);

module.exports = router;
