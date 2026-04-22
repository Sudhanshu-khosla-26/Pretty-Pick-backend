const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');
const { sendEmail } = require('../utils/sendEmail');

const toOrderDTO = (orderDoc) => {
  const obj = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  return {
    id: obj._id?.toString?.() || obj.id,
    userId: (obj.userId || obj.user)?._id?.toString?.() || (obj.userId || obj.user)?.toString?.() || obj.userId,
    orderNumber: obj.orderNumber,
    status: obj.status,
    currency: obj.currency || 'USD',
    items: (obj.items || []).map((i) => ({
      productId: (i.productId || i.product)?._id?.toString?.() || (i.productId || i.product)?.toString?.() || i.productId,
      name: i.name,
      image: i.image,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    subtotal: obj.subtotal,
    shipping: obj.shipping,
    tax: obj.tax,
    total: obj.total,
    shippingAddress: obj.shippingAddress,
    payment: obj.payment,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const yyyymmdd = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
};

const generateOrderNumber = () => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `BB-${yyyymmdd()}-${rand}`;
};

const safeSendOrderEmail = async ({ to, subject, html }) => {
  try {
    await sendEmail({ to, subject, html });
  } catch (err) {
    // Don't fail checkout/order creation due to email configuration issues
    console.warn('Order email failed to send:', err.message);
  }
};

exports.checkout = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: 'Cart empty' });
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.productId;
    if (!product) {
      return res.status(400).json({ message: 'A cart item references a missing product' });
    }

    const requestedQty = Number(item.quantity);
    const availableQty =
      typeof product.inventory?.quantity === 'number'
        ? product.inventory.quantity
        : typeof product.stock === 'number'
          ? product.stock
          : 0;

    if (requestedQty > availableQty) {
      return res.status(400).json({
        message: `Insufficient inventory for ${product.name}`,
        productId: product._id.toString(),
        available: availableQty,
        requested: requestedQty,
      });
    }

    const unitPrice = item.unitPrice;
    const lineTotal = Number((unitPrice * requestedQty).toFixed(2));
    subtotal += lineTotal;

    orderItems.push({
      productId: product._id,
      name: product.name,
      image: product.primaryImage || (product.images && product.images[0]) || null,
      quantity: requestedQty,
      unitPrice,
      lineTotal,
    });
  }

  subtotal = Number(subtotal.toFixed(2));
  const shipping = 0;
  const tax = 0;
  const total = Number((subtotal + shipping + tax).toFixed(2));

  // Decrement inventory
  for (const item of cart.items) {
    const product = item.productId;
    const requestedQty = Number(item.quantity);

    if (typeof product.inventory?.quantity === 'number') {
      product.inventory.quantity = Math.max(0, product.inventory.quantity - requestedQty);
      product.inventory.inStock = product.inventory.quantity > 0;
    }

    if (typeof product.stock === 'number') {
      product.stock = Math.max(0, product.stock - requestedQty);
      product.isAvailable = product.stock > 0;
    }

    await product.save();
  }

  let orderNumber;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateOrderNumber();
    // eslint-disable-next-line no-await-in-loop
    const exists = await Order.findOne({ orderNumber: candidate }).select('_id');
    if (!exists) {
      orderNumber = candidate;
      break;
    }
  }

  const shippingAddress = req.body?.shippingAddress || {};

  const order = await Order.create({
    userId: req.user._id,
    user: req.user._id,
    orderNumber,
    status: 'placed',
    currency: cart.currency || 'USD',
    items: orderItems,
    subtotal,
    shipping,
    tax,
    total,
    shippingAddress,
    payment: {
      provider: 'mock',
      status: 'paid',
      paidAt: new Date(),
    },
    // Back-compat
    totalAmount: total,
    deliveryAddress: {
      street: shippingAddress.address1,
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.postalCode,
    },
  });

  // Clear cart
  cart.items = [];
  await cart.save();

  const name = req.user.fullName || req.user.name || req.user.email?.split('@')?.[0] || 'there';
  await safeSendOrderEmail({
    to: req.user.email,
    subject: '🎉 Order Placed - BubbleBuy!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; max-width: 520px; margin: 40px auto; padding: 32px 28px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); border: 1px solid #ececec;">
        <h2 style="color: #2d3748; text-align: center; margin-bottom: 8px;">Thank you for your <span style="color: #e75480;">Order</span>!</h2>
        <p style="color: #444; font-size: 17px;">Hi <b>${name}</b>,</p>
        <p style="color: #444; font-size: 16px; margin-bottom: 18px;">Your order <b>${order.orderNumber || order._id}</b> has been placed successfully.</p>
        <p style="color: #666; font-size: 15px;">Total: <b>${order.currency} ${order.total}</b></p>
      </div>
    `,
  });

  res.status(201).json({ order: toOrderDTO(order) });
};

exports.placeOrder = async (req, res) => {
  // Legacy alias for checkout
  return exports.checkout(req, res);
};

exports.getOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ items: orders.map(toOrderDTO) });
};

exports.getOrderById = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ order: toOrderDTO(order) });
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
      subject: '🎉 Order Delivered - BubbleBuy!',
      html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; max-width: 520px; margin: 40px auto; padding: 32px 28px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); border: 1px solid #ececec;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://i.imgur.com/4M7IWwP.png" alt="BubbleBuy Logo" style="width: 64px; height: 64px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.06);" />
        </div>
        <h2 style="color: #2d3748; text-align: center; margin-bottom: 8px;">Your <span style="color: #e75480;">Order</span> is Delivered!</h2>
        <p style="color: #444; font-size: 17px;">Hi <b>${name}</b>,</p>
        <p style="color: #444; font-size: 16px; margin-bottom: 18px;">
          We're excited to let you know that your order <b>#${order._id}</b> has been delivered.<br>
          We hope you enjoy your purchase from <b>BubbleBuy</b>!
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
          <span style="color: #e75480;">The BubbleBuy Team</span>
        </p>
      </div>
      `
    };

    await sendEmail(options);
  }

  res.json(order);
};
