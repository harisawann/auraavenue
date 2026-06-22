const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
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

const reviewValidation = [
  body('productId').notEmpty().withMessage('productId is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 120 }),
  body('comment').optional().trim().isLength({ max: 2000 })
];

// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name')
    .sort('-createdAt');
  res.json({ success: true, reviews });
});

// @desc    Create a review for a product. Automatically marked as a
//          verified purchase if the user has a delivered order containing
//          this product.
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { productId, rating, title, comment } = req.body;

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) {
    return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
  }

  const verifiedPurchase = await Order.exists({
    user: req.user._id,
    'items.product': productId,
    orderStatus: 'delivered'
  });

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    title,
    comment,
    isVerifiedPurchase: !!verifiedPurchase
  });

  const populated = await review.populate('user', 'name');
  res.status(201).json({ success: true, review: populated });
});

// @desc    Delete a review (the review's own author, or admin)
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
  }

  await Review.findOneAndDelete({ _id: review._id }); // triggers the post-delete rating recalculation hook
  res.json({ success: true, message: 'Review deleted' });
});

// @desc    Get all reviews (admin moderation view)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
const getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const reviews = await Review.find({}).populate('user', 'name email').populate('product', 'name slug').sort('-createdAt');
  res.json({ success: true, reviews });
});

module.exports = { getProductReviews, createReview, deleteReview, getAllReviewsAdmin, reviewValidation };
