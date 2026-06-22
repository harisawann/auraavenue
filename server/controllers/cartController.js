const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');

// Finds (or creates) the cart for the current user, then returns it with
// product details populated and a computed total. Filters out any items
// whose product was deleted/deactivated since being added.
const getPopulatedCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name price images stock isActive slug'
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // Drop items whose product no longer exists or was deactivated
  const validItems = cart.items.filter((item) => item.product && item.product.isActive);
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  const itemsWithTotals = cart.items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
    priceAtAdd: item.priceAtAdd,
    lineTotal: Math.round(item.product.price * item.quantity * 100) / 100
  }));

  const subtotal = Math.round(itemsWithTotals.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;

  return { _id: cart._id, items: itemsWithTotals, subtotal };
};

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await getPopulatedCart(req.user._id);
  res.json({ success: true, cart });
});

// @desc    Add an item to the cart (or increase quantity if already present)
// @route   POST /api/cart/items
// @access  Private
const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId is required' });
  }
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  const currentQtyInCart = existingItem ? existingItem.quantity : 0;

  if (currentQtyInCart + qty > product.stock) {
    return res.status(400).json({
      success: false,
      message: `Only ${product.stock} in stock — you already have ${currentQtyInCart} in your cart`
    });
  }

  if (existingItem) {
    existingItem.quantity += qty;
    existingItem.priceAtAdd = product.price;
  } else {
    cart.items.push({ product: product._id, quantity: qty, priceAtAdd: product.price });
  }

  await cart.save();

  const populated = await getPopulatedCart(req.user._id);
  res.status(201).json({ success: true, cart: populated });
});

// @desc    Update the quantity of an item in the cart
// @route   PUT /api/cart/items/:productId
// @access  Private
const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const qty = parseInt(quantity, 10);
  if (!Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  if (qty > product.stock) {
    return res.status(400).json({ success: false, message: `Only ${product.stock} in stock` });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ success: false, message: 'Cart not found' });
  }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not in cart' });
  }

  item.quantity = qty;
  await cart.save();

  const populated = await getPopulatedCart(req.user._id);
  res.json({ success: true, cart: populated });
});

// @desc    Remove an item from the cart
// @route   DELETE /api/cart/items/:productId
// @access  Private
const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ success: false, message: 'Cart not found' });
  }

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  await cart.save();

  const populated = await getPopulatedCart(req.user._id);
  res.json({ success: true, cart: populated });
});

// @desc    Clear the entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ success: true, cart: { items: [], subtotal: 0 } });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, getPopulatedCart };
