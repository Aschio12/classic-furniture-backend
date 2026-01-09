const express = require('express');
const { getUsers, getUserById } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, admin, getUsers);
router.get('/:id', protect, admin, getUserById);

module.exports = router;
