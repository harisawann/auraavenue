const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// Reused across requests; verifyIdToken() takes the audience per-call so a
// single client instance is fine even without GOOGLE_CLIENT_ID set yet.
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Shared validation rules, used in routes/auth.js
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

const loginValidation = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    return false;
  }
  return true;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'An account with that email already exists' });
  }

  const user = await User.create({ name, email, password });
  const token = user.generateToken();

  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { email, password } = req.body;

  // Explicitly select password since schema has select:false on it
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'This account has been deactivated' });
  }

  const token = user.generateToken();

  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

// @desc    Sign in (or sign up) with a Google ID token
// @route   POST /api/auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Missing Google credential' });
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ success: false, message: 'Google sign-in is not configured on this server' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired Google credential' });
  }

  const { sub: googleId, email, name, picture } = payload;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Google account has no email' });
  }

  // Match an existing account by googleId first, then fall back to email so a
  // user who originally registered with a password can still link Google.
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      googleId,
      authProvider: 'google',
      avatarUrl: picture
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
    if (!user.avatarUrl) user.avatarUrl = picture;
    await user.save();
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'This account has been deactivated' });
  }

  const token = user.generateToken();

  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl }
  });
});


const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @desc    Update current user's profile (name, phone, addresses)
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, addresses } = req.body;

  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (addresses !== undefined) req.user.addresses = addresses;

  await req.user.save();

  res.json({ success: true, user: req.user });
});

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  updateMe,
  registerValidation,
  loginValidation
};
