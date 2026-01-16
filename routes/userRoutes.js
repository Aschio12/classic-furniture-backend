const express = require('express');
const { getUsers, getUserById } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Admin access required
 */
router.get('/', protect, admin, getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by id (admin only)
 *     tags: [Users]
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
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', protect, admin, getUserById);

module.exports = router;
