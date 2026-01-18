const express = require('express');
const { getLogisticsOverview } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/admin/logistics:
 *   get:
 *     summary: Logistics overview by hub and status (admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Counts per hub for Shipped and Arrived at Hub
 */
router.get('/logistics', protect, admin, getLogisticsOverview);

module.exports = router;
