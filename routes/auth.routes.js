const router = require('express').Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword
} = require('../controllers/auth.controller');

// @route   POST /api/auth/register
router.post('/register', register);

// @route   POST /api/auth/login
router.post('/login', login);

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword);

module.exports = router;
