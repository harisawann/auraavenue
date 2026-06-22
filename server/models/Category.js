const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: 100
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    image: {
      url: { type: String },
      alt: { type: String, default: '' }
    },
    // Self-reference allows future subcategories (e.g. "Cookware" > "Pots & Pans")
    // without a schema change — supports the "scalable, no rebuild" requirement.
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
