const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    // Only verified purchasers can review in this app — see reviewController
    isVerifiedPurchase: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// After saving/removing a review, recalculate the product's average rating
reviewSchema.statics.recalculateProductRating = async function (productId) {
  const Product = mongoose.model('Product');
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: stats[0].avgRating,
      ratingsCount: stats[0].count
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingsCount: 0
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.recalculateProductRating(this.product);
});

reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) doc.constructor.recalculateProductRating(doc.product);
});

module.exports = mongoose.model('Review', reviewSchema);
