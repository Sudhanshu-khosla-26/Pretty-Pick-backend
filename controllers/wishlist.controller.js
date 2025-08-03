
const Wishlist = require('../models/wishlist.model');

// GET /api/wishlist
exports.getWishlist = async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
    if (!wishlist) return res.json({ products: [] });
    res.json({ products: wishlist.products });
};

// POST /api/wishlist/:productId
exports.addToWishlist = async (req, res) => {
    const { productId } = req.params;
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
        wishlist = new Wishlist({ user: req.user._id, products: [productId] });
    } else {
        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
        }
    }

    await wishlist.save();
    res.json({ message: 'Product added to wishlist', products: wishlist.products });
};

// DELETE /api/wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });

    wishlist.products = wishlist.products.filter(
        pid => pid.toString() !== productId
    );

    await wishlist.save();
    res.json({ message: 'Product removed from wishlist', products: wishlist.products });
};