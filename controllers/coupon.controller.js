const Coupon = require('../models/coupon.model');

exports.createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(coupon);
};

exports.validateCoupon = async (req, res) => {
  const { code, total } = req.body;

  const coupon = await Coupon.findOne({ code });
  if (!coupon) return res.status(404).json({ message: 'Invalid coupon' });
  if (new Date() > coupon.expiresAt) return res.status(400).json({ message: 'Coupon expired' });
  if (total < coupon.minOrderAmount) return res.status(400).json({ message: 'Cart total too low' });

  let discount = coupon.discountType === 'flat'
    ? coupon.discountValue
    : (coupon.discountValue / 100) * total;

  res.json({ valid: true, discount });
};
