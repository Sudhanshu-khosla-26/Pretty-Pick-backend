const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  // Back-compat field (older controllers/emails may still read `name`)
  name: { type: String, trim: true },
  profilePicture: String,
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // Stored as a bcrypt hash (name kept as `password` for back-compat)
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isAdmin: { type: Boolean, default: false },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  pincode: String,
  address: String,
  city: String,
  state: String,
  country: String,
  accountNumber: String,
  accountHolder: String,
  ifsc: String
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.pre('save', function () {
  if (this.role === 'admin') this.isAdmin = true;
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
