const router = require('express').Router();
const controller = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

router.put('/profile', protect, controller.updateProfile);

module.exports = router;
router.post('/wishlist', protect, controller.toggleWishlist);
