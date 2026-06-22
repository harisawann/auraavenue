const { body, validationResult } = require('express-validator');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/errorHandler');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    return false;
  }
  return true;
};

const couponValidation = [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('discountType must be percentage or fixed'),
  body('discountValue').isFloat({ min: 0 }).withMessage('discountValue must be a positive number')
];

// @desc    Validate a coupon code for the current user + cart subtotal,
//          without creating an order. Used by the checkout page to show
//          the discount before the customer commits to placing the order.
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Coupon code is required' });
  }
  if (typeof subtotal !== 'number' || subtotal < 0) {
    return res.status(400).json({ success: false, message: 'A valid subtotal is required' });
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon code not found' });
  }
  if (!coupon.isCurrentlyValid()) {
    return res.status(400).json({ success: false, message: 'This coupon is no longer valid' });
  }
  if (subtotal < coupon.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: `This coupon requires a minimum order of Rs. ${coupon.minOrderAmount}`
    });
  }

  const timesUsedByUser = await Order.countDocuments({
    user: req.user._id,
    'coupon.code': coupon.code,
    paymentStatus: { $ne: 'failed' }
  });
  if (timesUsedByUser >= coupon.usageLimitPerUser) {
    return res.status(400).json({ success: false, message: 'You have already used this coupon' });
  }

  let discountAmount =
    coupon.discountType === 'percentage' ? Math.round(subtotal * (coupon.discountValue / 100) * 100) / 100 : coupon.discountValue;
  if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  discountAmount = Math.min(discountAmount, subtotal);

  res.json({
    success: true,
    coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
    discountAmount
  });
});

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const allowedFields = [
    'code', 'description', 'discountType', 'discountValue', 'maxDiscountAmount',
    'minOrderAmount', 'usageLimit', 'usageLimitPerUser', 'validFrom', 'validUntil'
  ];
  const data = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) data[field] = req.body[field];
  });

  const coupon = await Coupon.create(data);
  res.status(201).json({ success: true, coupon });
});

// @desc    Get all coupons (admin)
// @route   GET /api/coupons/admin/all
// @access  Private/Admin
const getCouponsAdmin = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort('-createdAt');
  res.json({ success: true, coupons });
});

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }

  const allowedFields = [
    'code', 'description', 'discountType', 'discountValue', 'maxDiscountAmount',
    'minOrderAmount', 'usageLimit', 'usageLimitPerUser', 'validFrom', 'validUntil', 'isActive'
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) coupon[field] = req.body[field];
  });

  await coupon.save();
  res.json({ success: true, coupon });
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }
  await coupon.deleteOne();
  res.json({ success: true, message: 'Coupon deleted' });
});

module.exports = {
  validateCoupon,
  createCoupon,
  getCouponsAdmin,
  updateCoupon,
  deleteCoupon,
  couponValidation
};
