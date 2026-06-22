const HomepageSection = require('../models/HomepageSection');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all active homepage sections
// @route   GET /api/homepage-sections
// @access  Public
const getHomepageSections = asyncHandler(async (req, res) => {
  const sections = await HomepageSection.find({ isActive: true });
  res.json({ success: true, sections });
});

// @desc    Create or update a homepage section by key (upsert — admin can
//          edit the hero banner etc. without needing to know if it exists yet)
// @route   PUT /api/homepage-sections/:key
// @access  Private/Admin
const upsertHomepageSection = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const allowedFields = ['title', 'subtitle', 'images', 'ctaText', 'ctaUrl', 'isActive'];

  const data = { key };
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) data[field] = req.body[field];
  });

  const section = await HomepageSection.findOneAndUpdate({ key }, data, {
    new: true,
    upsert: true,
    runValidators: true
  });

  res.json({ success: true, section });
});

module.exports = { getHomepageSections, upsertHomepageSection };
