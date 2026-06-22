const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get dashboard analytics summary
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidFilter = { paymentStatus: 'paid' };

  const [
    totalSalesAgg,
    dailySalesAgg,
    monthlySalesAgg,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalCustomers,
    bestSellingAgg
  ] = await Promise.all([
    Order.aggregate([{ $match: paidFilter }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.aggregate([
      { $match: { ...paidFilter, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.aggregate([
      { $match: { ...paidFilter, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.countDocuments({}),
    Order.countDocuments({ orderStatus: 'processing' }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    User.countDocuments({ role: 'customer' }),
    Order.aggregate([
      { $match: paidFilter },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ])
  ]);

  res.json({
    success: true,
    analytics: {
      totalSales: totalSalesAgg[0]?.total || 0,
      dailySales: dailySalesAgg[0]?.total || 0,
      monthlySales: monthlySalesAgg[0]?.total || 0,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCustomers,
      totalProducts: await Product.countDocuments({ isActive: true }),
      bestSellingProducts: bestSellingAgg
    }
  });
});

// @desc    Get all customers with their order counts and total spend
// @route   GET /api/admin/customers
// @access  Private/Admin
const getCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [customers, total] = await Promise.all([
    User.find({ role: 'customer' }).select('-password').sort('-createdAt').skip(skip).limit(limitNum),
    User.countDocuments({ role: 'customer' })
  ]);

  // Attach order count + total spend per customer
  const customerIds = customers.map((c) => c._id);
  const orderStats = await Order.aggregate([
    { $match: { user: { $in: customerIds }, paymentStatus: 'paid' } },
    { $group: { _id: '$user', orderCount: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } }
  ]);
  const statsByUserId = new Map(orderStats.map((s) => [s._id.toString(), s]));

  const customersWithStats = customers.map((c) => ({
    ...c.toObject(),
    orderCount: statsByUserId.get(c._id.toString())?.orderCount || 0,
    totalSpent: statsByUserId.get(c._id.toString())?.totalSpent || 0
  }));

  res.json({
    success: true,
    customers: customersWithStats,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
  });
});

// @desc    Toggle a customer's active status (suspend/reactivate)
// @route   PUT /api/admin/customers/:id/status
// @access  Private/Admin
const updateCustomerStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' });

  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  customer.isActive = !!isActive;
  await customer.save();

  res.json({ success: true, customer: { id: customer._id, isActive: customer.isActive } });
});

module.exports = { getDashboard, getCustomers, updateCustomerStatus };
