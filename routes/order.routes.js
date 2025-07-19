const router = require('express').Router();
const controller = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');

router.post('/', protect, controller.placeOrder);
router.get('/', protect, controller.getOrders);
router.put('/:orderId/status', protect, isAdmin, controller.updateOrderStatus);

module.exports = router;
