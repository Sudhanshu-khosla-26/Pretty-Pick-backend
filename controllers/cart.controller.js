const Cart = require('../models/cart.model');

exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) {
    return res.json({ items: [] });
  }
  // Map items to include size explicitly
  const items = cart.items.map(item => ({
    product: item.product,
    quantity: item.quantity,
    Size: item.Size
  }));
  res.json({ items });
};

exports.addToCart = async (req, res) => {
  const { product, quantity, Size } = req.body;
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [{ product, quantity, Size }] });
  } else {

    const index = cart.items.findIndex(i => i.product == product);
    if (index >= 0) {
      cart.items[index].quantity = Number(cart.items[index].quantity) + Number(quantity);
      cart.items[index].Size = Size;
    } else {
      cart.items.push({ product, quantity, Size });
    }
  }
  await cart.save();
  res.json(cart);
};

exports.removeFromCart = async (req, res) => {
  const { productId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });
  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  await cart.save();
  res.json(cart);
};

exports.clearCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ message: 'Cart cleared' });
}