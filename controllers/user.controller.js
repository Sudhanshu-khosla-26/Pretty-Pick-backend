const User = require('../models/user.model');

exports.updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  if (req.body.password) {
    user.password = req.body.password;
  }
  await user.save();
  res.json({ message: 'Profile updated', user });
};
exports.toggleWishlist = async (req, res) => {
  const user = await User.findById(req.user._id);
  const { productId } = req.body;

  const exists = user.wishlist.includes(productId);
  if (exists) {
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  } else {
    user.wishlist.push(productId);
  }
  await user.save();
  res.json(user.wishlist);
};
