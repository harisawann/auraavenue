const Product = require('../models/Product');
const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');

const escapeXml = (str) =>
  String(str).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

const urlEntry = (loc, { changefreq = 'weekly', priority = '0.5', lastmod } = {}) => `
  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

// @desc    Generate sitemap.xml listing static pages, categories, and active products
// @route   GET /sitemap.xml
// @access  Public
const getSitemap = asyncHandler(async (req, res) => {
  const siteUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

  const [products, categories] = await Promise.all([
    Product.find({ isActive: true }).select('slug updatedAt').lean(),
    Category.find({}).select('slug updatedAt').lean()
  ]);

  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/shop', priority: '0.9', changefreq: 'daily' },
    { path: '/policies/shipping', priority: '0.3', changefreq: 'monthly' },
    { path: '/policies/returns', priority: '0.3', changefreq: 'monthly' },
    { path: '/policies/refunds', priority: '0.3', changefreq: 'monthly' }
  ];

  const entries = [
    ...staticPages.map((p) => urlEntry(`${siteUrl}${p.path}`, p)),
    ...categories.map((c) => urlEntry(`${siteUrl}/shop?category=${c._id}`, { changefreq: 'weekly', priority: '0.6', lastmod: c.updatedAt })),
    ...products.map((p) => urlEntry(`${siteUrl}/products/${p.slug}`, { changefreq: 'weekly', priority: '0.7', lastmod: p.updatedAt }))
  ].join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.set('Cache-Control', 'public, max-age=3600'); // sitemaps don't need to be fresh-to-the-second
  res.send(xml);
});

// @desc    Generate robots.txt pointing crawlers to the sitemap
// @route   GET /robots.txt
// @access  Public
const getRobotsTxt = (req, res) => {
  const siteUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  res.set('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /checkout
Disallow: /cart

Sitemap: ${siteUrl}/sitemap.xml
`);
};

module.exports = { getSitemap, getRobotsTxt };
