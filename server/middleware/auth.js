const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT from the Authorization header and attaches the user to req
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }

  // Separate try/catch: a DB error here is a server problem, not an auth
  // problem, and should surface as a 500 rather than be reported to the
  // client as "invalid token" (which would be misleading).
  try {
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User no longer exists or is inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    // A genuine DB/server error — let the centralized error handler report
    // it as a 500, rather than misreporting it to the client as a bad token.
    next(error);
  }
};

// Restricts a route to admins only. Must be used AFTER `protect`.
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = { protect, adminOnly };
