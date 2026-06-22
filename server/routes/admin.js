const express = require('express');
const router = express.Router();
const { getDashboard, getCustomers, updateCustomerStatus } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/customers', getCustomers);
router.put('/customers/:id/status', updateCustomerStatus);

module.exports = router;
