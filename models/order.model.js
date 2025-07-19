const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number
  }],
  totalAmount: Number,
  status: { type: String, enum: ['Placed', 'Packed', 'Shipped', 'Delivered'], default: 'Placed' },
  deliveryAddress: {
    street: String, city: String, state: String, pincode: String, phone: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
