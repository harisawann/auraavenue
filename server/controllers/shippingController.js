const ShippingConfig = require('../models/ShippingConfig');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get the current shipping configuration (rates + policy text)
// @route   GET /api/shipping-config
// @access  Public
const getShippingConfig = asyncHandler(async (req, res) => {
  const config = await ShippingConfig.getConfig();
  res.json({ success: true, config });
});

// @desc    Update the shipping configuration
// @route   PUT /api/shipping-config
// @access  Private/Admin
const updateShippingConfig = asyncHandler(async (req, res) => {
  const config = await ShippingConfig.getConfig();

  const allowedFields = ['defaultFee', 'freeShippingThreshold', 'zoneRates', 'defaultEstimatedDays', 'shippingPolicyText'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) config[field] = req.body[field];
  });

  await config.save();
  res.json({ success: true, config });
});

module.exports = { getShippingConfig, updateShippingConfig };
