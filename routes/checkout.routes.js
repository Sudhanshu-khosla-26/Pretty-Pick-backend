const router = require('express').Router();
const { protect } = require('../middlewares/auth.middleware');
const orderController = require('../controllers/order.controller');

// POST /api/checkout
router.post('/', protect, orderController.checkout);

module.exports = router;
