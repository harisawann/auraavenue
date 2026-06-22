const mongoose = require('mongoose');

// Most homepage sections (Featured, New Arrivals, Best Sellers) are driven
// directly by Product flags/dates and don't need their own collection. This
// model exists for the genuinely admin-managed, non-derived content: the
// hero banner, and optional manual overrides/ordering for sections.
const homepageSectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: '' },
        linkUrl: { type: String }
      }
    ],
    ctaText: { type: String, trim: true },
    ctaUrl: { type: String, trim: true },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomepageSection', homepageSectionSchema);
