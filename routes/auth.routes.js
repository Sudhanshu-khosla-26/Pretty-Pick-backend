const router = require('express').Router();
const {
  register,
  login,
  forgotPassword,
  updateProfile,
  resetPassword,
  me,
  logout
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// @route   POST /api/auth/register
router.post('/register', register);

// @route   POST /api/auth/login
router.post('/login', login);

// @route   GET /api/auth/me
router.get('/me', protect, me);

// @route   POST /api/auth/logout (optional)
router.post('/logout', protect, logout);

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword);

router.post("/update-profile", protect, updateProfile);

module.exports = router;
