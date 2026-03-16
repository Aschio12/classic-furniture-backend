const express = require('express');
const { getUsers, getUserById, requestSellerAccount, verifySeller, updateProfile } = require('../controllers/userController');
const { protect, admin, userOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

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
 * /api/users/profile:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user profile
 *       400:
 *         description: Email already in use
 *       404:
 *         description: User not found
 */
router.patch('/profile', protect, updateProfile);

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

// Seller verification
/**
 * @swagger
 * /api/users/seller/request:
 *   post:
 *     summary: Request seller verification (user only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [license]
 *             properties:
 *               license:
 *                 type: string
 *                 format: binary
 *               telebirrNumber:
 *                 type: string
 *               bankAccountName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seller verification requested
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/seller/request', protect, userOnly, upload.single('license'), requestSellerAccount);

/**
 * @swagger
 * /api/users/seller/verify/{id}:
 *   patch:
 *     summary: Verify seller status (admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, pending]
 *     responses:
 *       200:
 *         description: Seller status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: User not found
 */
router.patch('/seller/verify/:id', protect, admin, verifySeller);

module.exports = router;
