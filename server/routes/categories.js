const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesAdmin,
  categoryValidation
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/admin/all', protect, adminOnly, getCategoriesAdmin);

router.get('/', getCategories);
router.post('/', protect, adminOnly, categoryValidation, createCategory);

router.get('/:slug', getCategoryBySlug);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
