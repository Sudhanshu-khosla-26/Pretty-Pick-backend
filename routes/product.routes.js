const router = require('express').Router();
const productController = require('../controllers/product.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');

router.get('/', productController.getAllProducts);
router.post('/', protect, isAdmin, productController.createProduct);
router.put('/:id', protect, productController.updateProduct);
// router.put('/:id', protect, productController.getProduct);
router.delete('/:id', protect, isAdmin, productController.deleteProduct);

module.exports = router;
