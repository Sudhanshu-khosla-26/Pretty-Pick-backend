
const Wishlist = require('../models/wishlist.model');
const { toAbsoluteUrl } = require('../utils/assetUrls');

const toWishlistItemDTO = (productDocOrId, req) => {
    if (!productDocOrId) return null;
    if (typeof productDocOrId === 'string') {
        return { productId: productDocOrId };
    }
    const obj = productDocOrId.toObject ? productDocOrId.toObject() : productDocOrId;
    return {
        productId: obj._id?.toString?.() || obj.id,
        product: {
            id: obj._id?.toString?.() || obj.id,
            name: obj.name,
            price: obj.price,
            image: toAbsoluteUrl(req, obj.primaryImage || (obj.images && obj.images[0]) || null),
        }
    };
};

// GET /api/wishlist
exports.getWishlist = async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
    if (!wishlist) return res.json({ items: [] });
    const items = (wishlist.products || []).map((p) => toWishlistItemDTO(p, req)).filter(Boolean);
    res.json({ items });
};

// POST /api/wishlist (preferred)
exports.addToWishlist = async (req, res) => {
    const productId = req.body?.productId || req.params?.productId;
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
        wishlist = new Wishlist({ user: req.user._id, products: [productId] });
    } else {
        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
        }
    }

    await wishlist.save();
    await wishlist.populate('products');
    const added = wishlist.products.find(p => p._id.toString() === productId.toString()) || null;
    res.json({ item: toWishlistItemDTO(added, req) });
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
    res.json({ ok: true });
};