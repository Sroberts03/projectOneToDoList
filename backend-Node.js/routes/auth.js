const express = require('express');
const router = express.Router();
const { register, login, forgotPassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Register endpoint
router.post('/register', register);

// Login endpoint (accepts username or email)
router.post('/login', login);

// Forgot password endpoint (MVP: just respond success if user exists)
router.post('/forgot-password', forgotPassword);

module.exports = { router, authenticateToken };
