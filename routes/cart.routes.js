const router = require('express').Router();
const controller = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

// Contract
router.get('/', protect, controller.getCart);
router.post('/items', protect, controller.addToCart);
router.patch('/items/:itemId', protect, controller.updateCartItemQuantity);
router.delete('/items/:itemId', protect, controller.removeCartItem);
router.delete('/', protect, controller.clearCart);

// Legacy/back-compat
router.post('/', protect, controller.addToCart);
router.delete('/:productId', protect, controller.removeFromCart);
router.post('/clear', protect, controller.clearCart);

module.exports = router;
