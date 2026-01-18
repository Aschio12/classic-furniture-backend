const express = require('express');
const { initializePayment, chapaWebhook } = require('../controllers/paymentController');
const { protect, userOnly } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/payments/initialize:
 *   post:
 *     summary: Initialize Chapa payment
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
 */
router.post('/initialize', protect, userOnly, initializePayment);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Chapa webhook callback
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/webhook', chapaWebhook);

module.exports = router;
