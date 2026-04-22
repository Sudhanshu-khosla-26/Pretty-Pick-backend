const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderNumber: { type: String, unique: true, index: true },
  status: { type: String, default: 'placed' },
  currency: { type: String, default: 'USD' },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      image: { type: String },
      quantity: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, required: true, min: 0 },
      lineTotal: { type: Number, required: true, min: 0 },
    }
  ],
  subtotal: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  shippingAddress: {
    fullName: String,
    phone: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  payment: {
    provider: { type: String, default: 'mock' },
    status: { type: String, default: 'paid' },
    paidAt: { type: Date },
  },

  // Back-compat fields
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalAmount: Number,
  deliveryAddress: {
    street: String, city: String, state: String, pincode: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);





