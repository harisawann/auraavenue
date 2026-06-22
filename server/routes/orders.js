const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  checkoutValidation
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect); // everything below requires a logged-in user

router.get('/admin/all', adminOnly, getAllOrders);
router.put('/:id/status', adminOnly, updateOrderStatus);
router.put('/:id/payment-status', adminOnly, updatePaymentStatus);

router.post('/checkout', checkoutValidation, createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;
