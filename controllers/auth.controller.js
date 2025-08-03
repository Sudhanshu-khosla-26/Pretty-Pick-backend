const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/sendEmail');

const generateToken = (id) => jwt.sign({ id }, "PrettyPickEcommerceMobileApplication", { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });

    if (!user) {
      return res.status(500).json({ message: 'User registration failed' });
    }

    const options = {
      to: email,
      subject: '🎉 Welcome to Pretty Pick!',
      html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; max-width: 520px; margin: 40px auto; padding: 32px 28px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); border: 1px solid #ececec;">
        <div style="text-align: center; margin-bottom: 24px;">
        <img src="https://i.imgur.com/4M7IWwP.png" alt="Pretty Pick Logo" style="width: 64px; height: 64px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.06);" />
        </div>
        <h2 style="color: #2d3748; text-align: center; margin-bottom: 8px;">Welcome to <span style="color: #e75480;">Pretty Pick</span>!</h2>
        <p style="color: #444; font-size: 17px;">Hi <b>${name}</b>,</p>
        <p style="color: #444; font-size: 16px; margin-bottom: 18px;">
        Thank you for registering with <b>Pretty Pick</b>.<br>
        We're thrilled to have you join our community!
        </p>
        <div style="background: #e75480; color: #fff; border-radius: 8px; padding: 16px 18px; margin-bottom: 18px; text-align: center; font-size: 16px;">
        Start exploring our products and enjoy your shopping experience.
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
    }

    await sendEmail(options);

    res.json({ user, token: generateToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = await generateToken(user._id);
  res.json({ user, token: token });
};

exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const token = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  const resetUrl = `http://yourfrontend.com/reset-password/${token}`;
  const options = {
    to: user.email,
    subject: 'Reset Your Pretty Pick Password',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; max-width: 520px; margin: 40px auto; padding: 32px 28px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); border: 1px solid #ececec;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://i.imgur.com/4M7IWwP.png" alt="Pretty Pick Logo" style="width: 64px; height: 64px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.06);" />
        </div>
        <h2 style="color: #2d3748; text-align: center; margin-bottom: 8px;">Reset Your <span style="color: #e75480;">Pretty Pick</span> Password</h2>
        <p style="color: #444; font-size: 17px;">Hi <b>${user.name || 'there'}</b>,</p>
        <p style="color: #444; font-size: 16px; margin-bottom: 18px;">
          We received a request to reset your password.<br>
          Click the button below to set a new password.
        </p>
        <div style="text-align: center; margin-bottom: 18px;">
          <a href="${resetUrl}" style="background: #e75480; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 16px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 15px;">
          If you did not request this, please ignore this email.<br>
          This link will expire in 1 hour.
        </p>
        <p style="color: #888; font-size: 14px; margin-top: 32px;">
          Best regards,<br/>
          <span style="color: #e75480;">The Pretty Pick Team</span>S
        </p>
      </div>
    `
  };

  await sendEmail(options);
  res.json({ message: 'Reset link sent to email' });
};

exports.resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successful' });
};


exports.updateProfile = async (req, res) => {
  const { profilePicture, pincode, address, city, state, country, accountNumber, accountHolder, ifsc } = req.body;
  const userId = req.user ? req.user._id : req.body.userId;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture, pincode, address, city, state, country, accountNumber, accountHolder, ifsc },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};