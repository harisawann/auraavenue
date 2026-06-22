const mongoose = require('mongoose');
const slugify = require('slugify');

const dimensionsSchema = new mongoose.Schema(
  {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' },
    weightUnit: { type: String, enum: ['g', 'kg', 'lb'], default: 'g' }
  },
  { _id: false }
);

// Free-form key/value specs (e.g. "Material": "Stainless Steel", "Capacity": "1.5L")
// so each product category can have its own relevant spec fields without a
// schema migration every time a new product type is added.
const specificationSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const videoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // Cloudinary-hosted video URL
    thumbnailUrl: { type: String },
    alt: { type: String, default: '' }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    // Short bullet-point features, distinct from full description/specs —
    // matches the spec's separate "Product Features" section on product pages.
    features: [{ type: String, trim: true }],

    specifications: [specificationSchema],
    dimensions: dimensionsSchema, // optional — display only if provided

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    compareAtPrice: {
      type: Number,
      min: 0
    },
    // Stored explicitly rather than always computed, so admin can set a
    // specific promotional percentage independent of compareAtPrice rounding.
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true
    },
    tags: [{ type: String, trim: true, lowercase: true }],

    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: '' }
      }
    ],
    videos: [videoSchema],

    countryOfOrigin: {
      type: String,
      trim: true,
      default: 'Pakistan'
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative']
    },

    // Estimated delivery window in days, e.g. {min: 2, max: 5} -> "2-5 business days"
    estimatedDeliveryDays: {
      min: { type: Number, default: 2, min: 0 },
      max: { type: Number, default: 5, min: 0 }
    },

    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    // "New Arrival" badge is computed from createdAt in queries rather than
    // stored as a boolean, so it doesn't need manual upkeep — see
    // productController's getNewArrivals. isFeatured/isBestSeller stay as
    // explicit admin-controlled flags since those are curation decisions,
    // not date-derived facts.

    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10
    },
    ratingsCount: {
      type: Number,
      default: 0
    },

    // SEO fields, used by the planned sitemap/meta-tag pass
    metaTitle: { type: String, trim: true, maxlength: 70 },
    metaDescription: { type: String, trim: true, maxlength: 160 }
  },
  { timestamps: true }
);

productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  next();
});

// Text index enables search across name/description/tags
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
