const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { toAbsoluteUrl } = require('../utils/assetUrls');

const toCartItemDTO = (item, req) => {
  const product = item.productId;
  const productObj = product?.toObject ? product.toObject() : product;
  const image = productObj?.primaryImage || (productObj?.images && productObj.images[0]) || null;

  const unitPrice = item.unitPrice;
  const quantity = item.quantity;
  return {
    itemId: item._id.toString(),
    product: {
      id: (productObj?._id || productObj?.id)?.toString?.() || productObj?.id,
      name: productObj?.name,
      price: unitPrice,
      image: toAbsoluteUrl(req, image),
    },
    quantity,
    lineTotal: Number((unitPrice * quantity).toFixed(2)),
  };
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, user: userId, items: [] });
  }
  return cart;
};

exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
  if (!cart) {
    return res.json({ items: [], subtotal: 0, currency: 'USD' });
  }

  const items = cart.items.map((i) => toCartItemDTO(i, req));
  const subtotal = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
  res.json({ items, subtotal, currency: cart.currency || 'USD' });
};

exports.addToCart = async (req, res) => {
  // Contract: { productId, quantity }
  const productId = req.body?.productId || req.body?.product;
  const quantity = Number(req.body?.quantity || 1);

  if (!productId) return res.status(400).json({ message: 'productId is required' });
  if (!Number.isFinite(quantity) || quantity < 1) {
    return res.status(400).json({ message: 'quantity must be >= 1' });
  }

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const cart = await getOrCreateCart(req.user._id);

  const existing = cart.items.find(i => i.productId.toString() === productId.toString());
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      productId,
      quantity,
      unitPrice: product.price,
      addedAt: new Date(),
    });
  }

  await cart.save();
  await cart.populate('items.productId');

  const added = cart.items.find(i => i.productId._id.toString() === productId.toString());
  res.status(201).json({ item: toCartItemDTO(added, req) });
};

exports.updateCartItemQuantity = async (req, res) => {
  const { itemId } = req.params;
  const quantity = Number(req.body?.quantity);
  if (!Number.isFinite(quantity) || quantity < 1) {
    return res.status(400).json({ message: 'quantity must be >= 1' });
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(itemId);
  if (!item) return res.status(404).json({ message: 'Cart item not found' });

  item.quantity = quantity;
  await cart.save();
  await cart.populate('items.productId');

  res.json({ item: toCartItemDTO(cart.items.id(itemId), req) });
};

exports.removeCartItem = async (req, res) => {
  const { itemId } = req.params;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(itemId);
  if (!item) return res.status(404).json({ message: 'Cart item not found' });

  item.deleteOne();
  await cart.save();
  res.json({ ok: true });
};

exports.removeFromCart = async (req, res) => {
  // Legacy route: DELETE /api/cart/:productId
  const { productId } = req.params;
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter(item => item.productId.toString() !== productId);
  await cart.save();
  res.json({ ok: true });
};

exports.clearCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) return res.json({ ok: true });
  cart.items = [];
  await cart.save();
  res.json({ ok: true });
}