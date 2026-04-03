const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { registerUser, loginUser, getMe, logoutUser } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 attempts per window
  message: { message: 'Too many login attempts, please try again after 5 minutes' }
});

router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], registerUser);

router.post('/login', loginLimiter, [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], loginUser);

router.post('/logout', logoutUser);

router.get('/me', protect, getMe);

module.exports = router;
