const router = require('express').Router();
const { createReview, getReviews } = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createReview);
router.get('/:productId', getReviews);

module.exports = router;
