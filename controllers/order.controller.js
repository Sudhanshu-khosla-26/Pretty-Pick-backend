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
  const name = req.user.name || req.user.email.split('@')[0];
  const options = {
    to: req.user.email,
    subject: '🎉 Order Placed - Pretty Pick!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; max-width: 520px; margin: 40px auto; padding: 32px 28px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); border: 1px solid #ececec;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://i.imgur.com/4M7IWwP.png" alt="Pretty Pick Logo" style="width: 64px; height: 64px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.06);" />
        </div>
        <h2 style="color: #2d3748; text-align: center; margin-bottom: 8px;">Thank you for your <span style="color: #e75480;">Order</span>!</h2>
        <p style="color: #444; font-size: 17px;">Hi <b>${name}</b>,</p>
        <p style="color: #444; font-size: 16px; margin-bottom: 18px;">
          Your order <b>#${order._id}</b> has been placed successfully.<br>
          We appreciate your trust in <b>Pretty Pick</b>!
        </p>
        <div style="background: #e75480; color: #fff; border-radius: 8px; padding: 16px 18px; margin-bottom: 18px; text-align: center; font-size: 16px;">
          We'll notify you once your order is shipped.
        </div>
        <p style="color: #666; font-size: 15px;">
          If you have any questions, feel free to contact our support team.<br>
          We're always here to help!
        </p>
        <p style="color: #888; font-size: 14px; margin-top: 32px;">
          Best regards,<br/>
          <span style="color: #e75480;">The Pretty Pick Team</span>
        </p>
      </div>
    `
  };

  await sendEmail(options);

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
    // Get user email and name
    const user = await require('../models/user.model').findById(order.user);
    const email = user.email;
    const name = user.name || email.split('@')[0];

    const options = {
      to: email,
      subject: '🎉 Order Delivered - Pretty Pick!',
      html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; max-width: 520px; margin: 40px auto; padding: 32px 28px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); border: 1px solid #ececec;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://i.imgur.com/4M7IWwP.png" alt="Pretty Pick Logo" style="width: 64px; height: 64px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.06);" />
        </div>
        <h2 style="color: #2d3748; text-align: center; margin-bottom: 8px;">Your <span style="color: #e75480;">Order</span> is Delivered!</h2>
        <p style="color: #444; font-size: 17px;">Hi <b>${name}</b>,</p>
        <p style="color: #444; font-size: 16px; margin-bottom: 18px;">
          We're excited to let you know that your order <b>#${order._id}</b> has been delivered.<br>
          We hope you enjoy your purchase from <b>Pretty Pick</b>!
        </p>
        <div style="background: #e75480; color: #fff; border-radius: 8px; padding: 16px 18px; margin-bottom: 18px; text-align: center; font-size: 16px;">
          Thank you for shopping with us!
        </div>
        <p style="color: #666; font-size: 15px;">
          If you have any questions or feedback, feel free to contact our support team.<br>
          We're always here to help!
        </p>
        <p style="color: #888; font-size: 14px; margin-top: 32px;">
          Best regards,<br/>
          <span style="color: #e75480;">The Pretty Pick Team</span>
        </p>
      </div>
      `
    };

    await sendEmail(options);
  }

  res.json(order);
};
