const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    return false;
  }
  return true;
};

const categoryValidation = [body('name').trim().notEmpty().withMessage('Category name is required')];

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('displayOrder name');
  res.json({ success: true, categories });
});

// @desc    Get a single category by slug
// @route   GET /api/categories/:slug
// @access  Public
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  res.json({ success: true, category });
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const { name, description, image, parent, displayOrder } = req.body;
  const category = await Category.create({ name, description, image, parent: parent || null, displayOrder });
  res.status(201).json({ success: true, category });
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  const allowedFields = ['name', 'description', 'image', 'parent', 'displayOrder', 'isActive'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) category[field] = req.body[field];
  });

  await category.save();
  res.json({ success: true, category });
});

// @desc    Delete a category (soft delete; blocked if products still reference it)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  const productCount = await Product.countDocuments({ category: category._id, isActive: true });
  if (productCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete — ${productCount} active product(s) still use this category. Reassign or remove them first.`
    });
  }

  category.isActive = false;
  await category.save();
  res.json({ success: true, message: 'Category removed' });
});

// @desc    Get all categories including inactive (admin)
// @route   GET /api/categories/admin/all
// @access  Private/Admin
const getCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).sort('displayOrder name');
  res.json({ success: true, categories });
});

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesAdmin,
  categoryValidation
};
