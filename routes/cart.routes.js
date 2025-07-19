const router = require('express').Router();
const controller = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, controller.getCart);
router.post('/', protect, controller.addToCart);
router.delete('/:productId', protect, controller.removeFromCart);

module.exports = router;
