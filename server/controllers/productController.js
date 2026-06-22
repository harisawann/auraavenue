const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { asyncHandler } = require('../middleware/errorHandler');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    return false;
  }
  return true;
};

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('discountPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100')
];

// @desc    Get all products with search, category filter, sort, pagination
// @route   GET /api/products?search=&category=&sort=&page=&limit=&minPrice=&maxPrice=&tags=
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, sort = '-createdAt', page = 1, limit = 12, minPrice, maxPrice, tags } = req.query;

  const query = { isActive: true };

  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (tags) query.tags = { $in: tags.split(',').map((t) => t.trim().toLowerCase()) };

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query).populate('category', 'name slug').sort(sort).skip(skip).limit(limitNum),
    Product.countDocuments(query)
  ]);

  res.json({
    success: true,
    products,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
  });
});

// @desc    Get featured products (homepage section)
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 8);
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(limit);
  res.json({ success: true, products });
});

// @desc    Get newest products (homepage "New Arrivals" section)
// @route   GET /api/products/new-arrivals
// @access  Public
const getNewArrivals = asyncHandler(async (req, res) => {
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 8);
  const products = await Product.find({ isActive: true })
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(limit);
  res.json({ success: true, products });
});

// @desc    Get best-selling products (homepage section)
// @route   GET /api/products/best-sellers
// @access  Public
const getBestSellers = asyncHandler(async (req, res) => {
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 8);
  const products = await Product.find({ isActive: true, isBestSeller: true })
    .populate('category', 'name slug')
    .sort('-ratingsAverage')
    .limit(limit);
  res.json({ success: true, products });
});

// @desc    Get related products (same category, excluding the current product)
// @route   GET /api/products/:slug/related
// @access  Public
const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true
  })
    .populate('category', 'name slug')
    .limit(8);

  res.json({ success: true, products: related });
});

// @desc    Get a single product by slug, with its reviews
// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name slug');

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  res.json({ success: true, product });
});

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const allowedFields = [
    'name', 'description', 'features', 'specifications', 'dimensions',
    'price', 'compareAtPrice', 'discountPercentage', 'category', 'tags',
    'images', 'videos', 'countryOfOrigin', 'sku', 'stock',
    'estimatedDeliveryDays', 'isFeatured', 'isBestSeller', 'metaTitle', 'metaDescription'
  ];

  const data = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) data[field] = req.body[field];
  });

  const product = await Product.create(data);
  res.status(201).json({ success: true, product });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const allowedFields = [
    'name', 'description', 'features', 'specifications', 'dimensions',
    'price', 'compareAtPrice', 'discountPercentage', 'category', 'tags',
    'images', 'videos', 'countryOfOrigin', 'sku', 'stock',
    'estimatedDeliveryDays', 'isActive', 'isFeatured', 'isBestSeller',
    'metaTitle', 'metaDescription'
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  res.json({ success: true, product });
});

// @desc    Delete a product (soft delete — marks inactive rather than removing)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  product.isActive = false;
  await product.save();

  res.json({ success: true, message: 'Product removed' });
});

// @desc    Get all products for admin (includes inactive)
// @route   GET /api/products/admin/all
// @access  Private/Admin
const getProductsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find({}).populate('category', 'name slug').sort('-createdAt').skip(skip).limit(limitNum),
    Product.countDocuments({})
  ]);

  res.json({
    success: true,
    products,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
  });
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getRelatedProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsAdmin,
  productValidation
};
