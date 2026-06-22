const { body, validationResult } = require('express-validator');
const FAQ = require('../models/FAQ');
const { asyncHandler } = require('../middleware/errorHandler');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    return false;
  }
  return true;
};

const faqValidation = [
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('answer').trim().notEmpty().withMessage('Answer is required')
];

// @desc    Get general (homepage) FAQs, or FAQs for a specific product
// @route   GET /api/faqs?productId=
// @access  Public
const getFAQs = asyncHandler(async (req, res) => {
  const { productId } = req.query;
  const query = { isActive: true, product: productId || null };
  const faqs = await FAQ.find(query).sort('displayOrder');
  res.json({ success: true, faqs });
});

// @desc    Create an FAQ
// @route   POST /api/faqs
// @access  Private/Admin
const createFAQ = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const { question, answer, product, category, displayOrder } = req.body;
  const faq = await FAQ.create({ question, answer, product: product || null, category, displayOrder });
  res.status(201).json({ success: true, faq });
});

// @desc    Update an FAQ
// @route   PUT /api/faqs/:id
// @access  Private/Admin
const updateFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.findById(req.params.id);
  if (!faq) {
    return res.status(404).json({ success: false, message: 'FAQ not found' });
  }

  const allowedFields = ['question', 'answer', 'product', 'category', 'displayOrder', 'isActive'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) faq[field] = req.body[field];
  });

  await faq.save();
  res.json({ success: true, faq });
});

// @desc    Delete an FAQ
// @route   DELETE /api/faqs/:id
// @access  Private/Admin
const deleteFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.findById(req.params.id);
  if (!faq) {
    return res.status(404).json({ success: false, message: 'FAQ not found' });
  }
  await faq.deleteOne();
  res.json({ success: true, message: 'FAQ deleted' });
});

module.exports = { getFAQs, createFAQ, updateFAQ, deleteFAQ, faqValidation };
