const router = require('express').Router();
const controller = require('../controllers/coupon.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');

router.post('/', protect, isAdmin, controller.createCoupon);
router.post('/validate', protect, controller.validateCoupon);

module.exports = router;
