const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  createCoupon,
  getCouponsAdmin,
  updateCoupon,
  deleteCoupon,
  couponValidation
} = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect); // coupon validation requires login too (tied to per-user usage limits)

router.post('/validate', validateCoupon);

router.get('/admin/all', adminOnly, getCouponsAdmin);
router.post('/', adminOnly, couponValidation, createCoupon);
router.put('/:id', adminOnly, updateCoupon);
router.delete('/:id', adminOnly, deleteCoupon);

module.exports = router;
