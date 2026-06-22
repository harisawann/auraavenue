const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' }, // e.g. "Home", "Office"
    fullName: { type: String, trim: true },
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'Pakistan' },
    phone: { type: String, trim: true },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true } // _id is auto-included by default, needed to edit/delete individual addresses
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      // Not required: Google OAuth users authenticate without a local password.
      minlength: 8,
      select: false
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows many documents with no googleId (email/password users)
      index: true
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    avatarUrl: {
      type: String
    },
    phone: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    addresses: [addressSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Hash password before saving, only if it was modified and present
// (Google-auth users may never set a password at all)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare candidate password to hashed password.
// Returns false (rather than throwing) if the account has no password set,
// e.g. a Google-only account — prevents a confusing crash if someone tries
// the "forgot password" flow incorrectly against an OAuth-only account.
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: sign a JWT for this user
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = mongoose.model('User', userSchema);
