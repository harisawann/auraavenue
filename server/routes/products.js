const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

// IMPORTANT: specific routes must come before the /:slug catch-all
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/admin/all', protect, adminOnly, getProductsAdmin);

router.get('/', getProducts);
router.post('/', protect, adminOnly, productValidation, createProduct);

router.get('/:slug/related', getRelatedProducts);
router.get('/:slug', getProductBySlug);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
