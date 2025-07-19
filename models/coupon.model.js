const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: String,
  discountType: { type: String, enum: ['flat', 'percent'] },
  discountValue: Number,
  expiresAt: Date,
  minOrderAmount: Number
});

module.exports = mongoose.model('Coupon', couponSchema);
