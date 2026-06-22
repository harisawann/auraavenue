const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ShippingConfig = require('../models/ShippingConfig');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPopulatedCart } = require('./cartController');
const { notifyAdmins, notifyUser } = require('./notificationController');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../utils/email');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    return false;
  }
  return true;
};

const checkoutValidation = [
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('shippingAddress.line1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('shippingAddress.country').trim().notEmpty().withMessage('Country is required'),
  body('paymentMethod')
    .isIn(Order.PAYMENT_METHODS)
    .withMessage(`Payment method must be one of: ${Order.PAYMENT_METHODS.join(', ')}`),
  body('idempotencyKey').trim().notEmpty().withMessage('idempotencyKey is required')
];

const TAX_RATE = 0.0; // set to e.g. 0.08 for 8% if you want sales tax applied

// Computes the shipping fee for a given subtotal + city, using the admin's
// ShippingConfig (zone-specific rate if one matches the city, otherwise the
// default flat fee), with free-shipping threshold applied if configured.
async function calculateShipping(subtotal, city) {
  const config = await ShippingConfig.getConfig();

  if (config.freeShippingThreshold !== null && subtotal >= config.freeShippingThreshold) {
    return { fee: 0, estimatedDays: config.defaultEstimatedDays };
  }

  const zoneMatch = config.zoneRates.find(
    (zone) => zone.zoneName.trim().toLowerCase() === (city || '').trim().toLowerCase()
  );

  if (zoneMatch) {
    return { fee: zoneMatch.fee, estimatedDays: zoneMatch.estimatedDays };
  }

  return { fee: config.defaultFee, estimatedDays: config.defaultEstimatedDays };
}

// Validates and computes a coupon's discount for a given subtotal + user.
// Returns { discountAmount: 0 } if no coupon code was supplied, rather than
// treating "no coupon" as an error.
async function applyCoupon(couponCode, subtotal, userId) {
  if (!couponCode) return { discountAmount: 0, coupon: null };

  const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
  if (!coupon) {
    const err = new Error('Coupon code not found');
    err.statusCode = 400;
    throw err;
  }
  if (!coupon.isCurrentlyValid()) {
    const err = new Error('This coupon is no longer valid');
    err.statusCode = 400;
    throw err;
  }
  if (subtotal < coupon.minOrderAmount) {
    const err = new Error(`This coupon requires a minimum order of Rs. ${coupon.minOrderAmount}`);
    err.statusCode = 400;
    throw err;
  }

  const timesUsedByUser = await Order.countDocuments({
    user: userId,
    'coupon.code': coupon.code,
    paymentStatus: { $ne: 'failed' }
  });
  if (timesUsedByUser >= coupon.usageLimitPerUser) {
    const err = new Error('You have already used this coupon');
    err.statusCode = 400;
    throw err;
  }

  let discountAmount =
    coupon.discountType === 'percentage' ? Math.round(subtotal * (coupon.discountValue / 100) * 100) / 100 : coupon.discountValue;

  if (coupon.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  }
  discountAmount = Math.min(discountAmount, subtotal); // never discount more than the subtotal

  return { discountAmount, coupon };
}

// @desc    Place an order. Payment method determines what happens next:
//          - cod: order is created, payment collected on delivery, no
//            online verification needed (paymentStatus stays 'pending'
//            until admin marks delivered/paid).
//          - jazzcash/easypaisa/bank_transfer: order is created with
//            paymentStatus 'pending'; the customer (for bank transfer) or
//            payment provider redirect (for wallets) supplies a reference,
//            and an admin manually verifies and marks it 'paid'. (Full
//            JazzCash/Easypaisa API integration is a separate stage — see
//            README for the current manual-verification approach and why.)
// @route   POST /api/orders/checkout
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { shippingAddress, paymentMethod, paymentReference, couponCode, idempotencyKey } = req.body;

  // Duplicate-order prevention: if this idempotency key was already used,
  // return the existing order instead of creating a second one. This
  // protects against double-clicks and retried network requests.
  const existingOrder = await Order.findOne({ idempotencyKey });
  if (existingOrder) {
    return res.status(200).json({ success: true, order: existingOrder, duplicate: true });
  }

  const cart = await getPopulatedCart(req.user._id);

  if (!cart.items.length) {
    return res.status(400).json({ success: false, message: 'Your cart is empty' });
  }

  for (const item of cart.items) {
    if (item.quantity > item.product.stock) {
      return res.status(400).json({
        success: false,
        message: `"${item.product.name}" only has ${item.product.stock} left in stock`
      });
    }
  }

  const itemsTotal = cart.subtotal;

  let discountAmount = 0;
  let appliedCoupon = null;
  try {
    const result = await applyCoupon(couponCode, itemsTotal, req.user._id);
    discountAmount = result.discountAmount;
    appliedCoupon = result.coupon;
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }

  const { fee: shippingCost } = await calculateShipping(itemsTotal, shippingAddress.city);
  const taxableAmount = Math.max(0, itemsTotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * TAX_RATE * 100) / 100;
  const totalAmount = Math.round((taxableAmount + shippingCost + taxAmount) * 100) / 100;

  const order = await Order.create({
    user: req.user._id,
    items: cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0]?.url,
      price: item.product.price,
      quantity: item.quantity
    })),
    shippingAddress,
    itemsTotal,
    shippingCost,
    taxAmount,
    discountAmount,
    totalAmount,
    coupon: appliedCoupon ? { code: appliedCoupon.code, discountAmount } : undefined,
    paymentMethod,
    paymentReference,
    // COD never needs online payment verification, so there's nothing to
    // mark "paid" until delivery — it stays 'pending' by schema default,
    // and admin can update it after collecting payment on delivery.
    paymentStatus: 'pending',
    idempotencyKey
  });

  // Decrement stock immediately on order placement (not on payment
  // confirmation) since none of these payment methods give us a reliable
  // automated "payment succeeded" signal the way a card gateway would —
  // an admin manually reconciles payment status for wallet/bank transfers.
  const LOW_STOCK_THRESHOLD = 5;
  for (const item of order.items) {
    const updated = await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (updated && updated.stock <= LOW_STOCK_THRESHOLD && updated.stock >= 0) {
      notifyAdmins({
        title: 'Low stock alert',
        message: `${updated.name} is down to ${updated.stock} in stock.`,
        type: 'low_stock',
        link: '/admin/products'
      }).catch(() => {});
    }
  }
  if (appliedCoupon) {
    await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { timesUsed: 1 } });
  }
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  // Best-effort admin alert — a failure here shouldn't fail the order itself.
  notifyAdmins({
    title: 'New order placed',
    message: `${req.user.name} placed an order for Rs. ${totalAmount.toLocaleString()}`,
    type: 'order',
    link: `/admin/orders`
  }).catch(() => {});

  sendOrderConfirmationEmail(order, req.user).catch((err) => console.error('Order confirmation email failed:', err.message));

  res.status(201).json({ success: true, order });
});

// @desc    Get current user's orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, orders });
});

// @desc    Get a single order (must belong to the requesting user, or be admin)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
  }

  res.json({ success: true, order });
});

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, paymentStatus, orderStatus } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (orderStatus) query.orderStatus = orderStatus;

  const [orders, total] = await Promise.all([
    Order.find(query).populate('user', 'name email').sort('-createdAt').skip(skip).limit(limitNum),
    Order.countDocuments(query)
  ]);

  res.json({
    success: true,
    orders,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
  });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(orderStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid order status' });
  }

  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.orderStatus = orderStatus;
  if (orderStatus === 'delivered') order.deliveredAt = new Date();
  if (orderStatus === 'cancelled') order.cancelledAt = new Date();

  await order.save();

  const statusMessages = {
    processing: 'Your order is being processed.',
    shipped: 'Your order has shipped!',
    delivered: 'Your order has been delivered.',
    cancelled: 'Your order has been cancelled.'
  };
  notifyUser(order.user._id, {
    title: `Order #${order._id.toString().slice(-8).toUpperCase()} ${orderStatus}`,
    message: statusMessages[orderStatus] || `Order status updated to ${orderStatus}.`,
    type: 'order',
    link: `/orders`
  }).catch(() => {});

  sendOrderStatusEmail(order, order.user, orderStatus).catch((err) => console.error('Order status email failed:', err.message));

  res.json({ success: true, order });
});

// @desc    Update payment status (admin) — used to manually mark
//          JazzCash/Easypaisa/Bank Transfer/COD orders as paid once
//          verified, or mark them failed/refunded.
// @route   PUT /api/orders/:id/payment-status
// @access  Private/Admin
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;
  const validStatuses = ['pending', 'paid', 'failed', 'refunded'];

  if (!validStatuses.includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid payment status' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.paymentStatus = paymentStatus;
  await order.save();

  res.json({ success: true, order });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  checkoutValidation
};
