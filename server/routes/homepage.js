const express = require('express');
const router = express.Router();
const { getHomepageSections, upsertHomepageSection } = require('../controllers/homepageController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getHomepageSections);
router.put('/:key', protect, adminOnly, upsertHomepageSection);

module.exports = router;
