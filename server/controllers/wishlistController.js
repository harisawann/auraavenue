const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get current user's wishlist, populated with live product data
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    match: { isActive: true },
    select: 'name price images slug stock ratingsAverage ratingsCount'
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  res.json({ success: true, wishlist });
});

// @desc    Add a product to the wishlist
// @route   POST /api/wishlist/items
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId is required' });
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  const alreadyIn = wishlist.products.some((p) => p.toString() === productId);
  if (!alreadyIn) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  const populated = await Wishlist.findById(wishlist._id).populate({
    path: 'products',
    match: { isActive: true },
    select: 'name price images slug stock ratingsAverage ratingsCount'
  });

  res.status(201).json({ success: true, wishlist: populated });
});

// @desc    Remove a product from the wishlist
// @route   DELETE /api/wishlist/items/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    return res.status(404).json({ success: false, message: 'Wishlist not found' });
  }

  wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
  await wishlist.save();

  const populated = await Wishlist.findById(wishlist._id).populate({
    path: 'products',
    match: { isActive: true },
    select: 'name price images slug stock ratingsAverage ratingsCount'
  });

  res.json({ success: true, wishlist: populated });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
