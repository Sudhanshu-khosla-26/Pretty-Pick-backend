const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');
const { sendEmail } = require('../utils/sendEmail');

exports.placeOrder = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart empty' });

  let total = 0;
  for (const item of cart.items) {
    total += item.product.price * item.quantity;
    item.product.stock -= item.quantity;
    if (item.product.stock <= 0) item.product.isAvailable = false;
    await item.product.save();
  }

  const order = await Order.create({
    user: req.user._id,
    items: cart.items.map(item => ({ product: item.product._id, quantity: item.quantity })),
    totalAmount: total,
    deliveryAddress: req.body.deliveryAddress
  });

  cart.items = [];
  await cart.save();

  await sendEmail(req.user.email, 'Order Placed', `<h1>Order #${order._id}</h1>`);

  res.status(201).json(order);
};

exports.getOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('items.product');
  res.json(orders);
};

exports.updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.status = req.body.status;
  await order.save();

  if (order.status === 'Delivered') {
    await sendEmail(order.user.email, 'Order Delivered', `<h1>Your order ${order._id} has been delivered.</h1>`);
  }

  res.json(order);
};
