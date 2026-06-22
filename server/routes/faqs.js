const express = require('express');
const router = express.Router();
const { getFAQs, createFAQ, updateFAQ, deleteFAQ, faqValidation } = require('../controllers/faqController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getFAQs);
router.post('/', protect, adminOnly, faqValidation, createFAQ);
router.put('/:id', protect, adminOnly, updateFAQ);
router.delete('/:id', protect, adminOnly, deleteFAQ);

module.exports = router;
