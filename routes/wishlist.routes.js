const router = require('express').Router();
const controller = require('../controllers/wishlist.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, controller.getWishlist);
router.post('/:productId', protect, controller.addToWishlist);
router.delete('/:productId', protect, controller.removeFromWishlist);

module.exports = router;