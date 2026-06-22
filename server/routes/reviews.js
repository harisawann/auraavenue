const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  deleteReview,
  getAllReviewsAdmin,
  reviewValidation
} = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/admin/all', protect, adminOnly, getAllReviewsAdmin);
router.get('/product/:productId', getProductReviews);
router.post('/', protect, reviewValidation, createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
