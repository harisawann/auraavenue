const express = require('express');
const router = express.Router();
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect); // every cart route requires a logged-in user

router.get('/', getCart);
router.post('/items', addItem);
router.put('/items/:productId', updateItem);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);

module.exports = router;
