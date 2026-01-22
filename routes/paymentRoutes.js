const express = require('express');
const { initializePayment, verifyWebhook } = require('../controllers/paymentController');
const { protect, userOnly } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/payments/initialize:
 *   post:
 *     summary: Start a furniture purchase transaction
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout URL returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkout_url:
 *                   type: string
 *                 tx_ref:
 *                   type: string
 */
router.post('/initialize', protect, userOnly, initializePayment);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Chapa Payment Confirmation (Server-to-Server)
 *     description: This is the endpoint Chapa calls. To test locally, you can send a mock payload here.
 *     tags: [Payments]
 *     parameters:
 *       - in: header
 *         name: x-chapa-signature
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           example:
 *             status: success
 *             tx_ref: order_65f1b2c3d4e5f6a7b8c9d0e1_1700000000000
 *             amount: 1200
 *             currency: ETB
 *             data:
 *               status: success
 *               tx_ref: order_65f1b2c3d4e5f6a7b8c9d0e1_1700000000000
 *               amount: 1200
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/webhook', verifyWebhook);

module.exports = router;
