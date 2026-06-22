require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { getSitemap, getRobotsTxt } = require('./controllers/sitemapController');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const wishlistRoutes = require('./routes/wishlist');
const couponRoutes = require('./routes/coupons');
const shippingRoutes = require('./routes/shipping');
const faqRoutes = require('./routes/faqs');
const homepageRoutes = require('./routes/homepage');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

connectDB();

const app = express();

// --- Security & core middleware ---
app.use(helmet());
app.use(compression()); // gzip responses to cut payload size, especially for JSON product lists
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Basic rate limiting to slow down brute-force/abuse on the API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Served at the root (not /api) since crawlers expect these at the domain
// root. In production, proxy /sitemap.xml and /robots.txt from the frontend
// host to this API the same way /api is proxied in dev (see vite.config.js).
app.get('/sitemap.xml', getSitemap);
app.get('/robots.txt', getRobotsTxt);

// Cache-Control for read-only catalog data (products, categories, FAQs,
// homepage sections). These change infrequently and aren't personalized, so
// a short public cache cuts repeat-load latency and DB load. Admin-only
// sub-routes (e.g. GET /api/products/admin/all) are excluded since those
// require auth and shouldn't be shared-cached.
const cacheableCatalogPaths = [
  '/api/products',
  '/api/categories',
  '/api/faqs',
  '/api/homepage-sections'
];
app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.includes('/admin') &&
    cacheableCatalogPaths.some((p) => req.path.startsWith(p))
  ) {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/shipping-config', shippingRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/homepage-sections', homepageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
