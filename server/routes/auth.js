const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  getMe,
  updateMe,
  registerValidation,
  loginValidation
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
