const express = require('express');
const { checkout, completeHubDelivery, markAsArrivedAtHub, confirmFinalDelivery, retryPayout } = require('../controllers/orderController');
const { protect, userOnly, hubManagerOnly, admin } = require('../middleware/authMiddleware');

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

/**
 * @swagger
 * /api/orders/hub/arrived/{id}:
 *   patch:
 *     summary: Mark order as arrived at hub (hub manager)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order marked as arrived
 *       400:
 *         description: Order not in Shipped status
 *       403:
 *         description: Order not in manager hub
 *       404:
 *         description: Order not found
 */
router.patch('/hub/arrived/:id', protect, hubManagerOnly, markAsArrivedAtHub);

/**
 * @swagger
 * /api/orders/confirm:
 *   patch:
 *     summary: Confirm final delivery (buyer)
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
 *         description: Final delivery confirmed
 *       400:
 *         description: Invalid verification code or status
 *       404:
 *         description: Order not found
 */
router.patch('/confirm', protect, userOnly, confirmFinalDelivery);

/**
 * @swagger
 * /api/orders/{id}/retry-payout:
 *   post:
 *     summary: Retry payout for failed orders (admin only)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payout retry successful
 *       400:
 *         description: Order not in Payout Failed status
 *       404:
 *         description: Order not found
 */
router.post('/:id/retry-payout', protect, admin, retryPayout);

module.exports = router;
