const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    maxDiscountAmount: {
      type: Number,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    usageLimit: {
      type: Number,
      default: null
    },
    usageLimitPerUser: {
      type: Number,
      default: 1
    },
    timesUsed: {
      type: Number,
      default: 0
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

couponSchema.methods.isCurrentlyValid = function () {
  if (!this.isActive) return false;
  const now = new Date();
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;
  if (this.usageLimit !== null && this.timesUsed >= this.usageLimit) return false;
  return true;
};

module.exports = mongoose.model('Coupon', couponSchema);
