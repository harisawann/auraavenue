# Aura Avenue

A Pakistan-based premium kitchen accessories e-commerce store. Full-stack
MERN app: React + Vite + Tailwind on the frontend, Express + MongoDB on the
backend.

## Status: Stages 4–11 complete

- **Stage 4** — Data model (Category, Wishlist, Coupon, ShippingConfig,
  Notification, extended Product/Order/Review)
- **Stage 5** — Aura Avenue branding, COD/JazzCash/Easypaisa/Bank Transfer
  payments, PKR formatting throughout
- **Stage 6** — Homepage (all 11 sections)
- **Stage 7** — Product detail page (gallery incl. multi-image support,
  video, specs, delivery estimate, FAQs, reviews, related/recently-viewed,
  wishlist, buy now)
- **Stage 8** — Google OAuth, saved addresses, wishlist, order tracking,
  profile editing (`/account`)
- **Stage 9** — Policy pages (Shipping/Returns/Refunds)
- **Stage 10** — Full admin panel: orders, customers, inventory, coupons,
  categories, reviews, homepage CMS, shipping config, FAQs, notifications,
  analytics dashboard
- **Stage 11** — SEO meta tags, sitemap.xml/robots.txt, gzip compression +
  catalog caching headers, lazy-loaded images, GA4/Meta Pixel hooks, email
  notifications (order confirmation + status updates), duplicate-order
  prevention

---

## Setup

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables
Copy `.env.example` → `.env` in both `server/` and `client/`, then fill in:

**server/.env**
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — used by the seed script
- `GOOGLE_CLIENT_ID` *(optional)* — enables "Sign in with Google"; leave
  blank to skip it (the button just won't render)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM`
  *(optional)* — enables order confirmation/status emails; leave `SMTP_HOST`
  blank to skip (emails are logged to the console instead of sent)
- `CLIENT_URL` — used for CORS and for building absolute URLs in the sitemap

**client/.env**
- `VITE_GOOGLE_CLIENT_ID` *(optional)* — must match the server's value
- `VITE_GA_MEASUREMENT_ID` *(optional)* — Google Analytics 4
- `VITE_FB_PIXEL_ID` *(optional)* — Meta Pixel

All of the optional vars are safe to leave blank — every integration in this
app degrades gracefully when its config is missing.

### 3. Seed the database
```bash
cd server
npm run seed
```

### 4. Run both servers
```bash
cd server && npm run dev      # http://localhost:5000
cd client && npm run dev      # http://localhost:5173
```

`/sitemap.xml` and `/robots.txt` are served by the backend and proxied
through Vite in dev (see `client/vite.config.js`). In production, point your
frontend host's reverse proxy at the API for those two paths the same way
`/api` is proxied.

---

## Notable implementation notes

- **Payments**: COD, JazzCash, Easypaisa, and Bank Transfer are all manual/
  semi-manual methods (no hosted card gateway) — admins reconcile payment
  status themselves via Admin → Orders. Stock is decremented at order
  placement, not at payment confirmation.
- **Product images**: admins can add multiple image URLs per product
  (Admin → Products → Images), reorder them, and the first one is used as
  the catalog thumbnail. There's no file-upload/CDN integration — images are
  pasted as URLs (e.g. hosted on Cloudinary, S3, or similar).
- **Notifications**: in-app only (bell icon in the header) plus optional
  email. Admins can broadcast an announcement to all customers/admins or
  message a single customer from Admin → Customers.
- **Email** and **Google OAuth** both no-op safely if unconfigured, so you
  can run the full app locally without setting either up.

## What's NOT built
- No automated tests
- No file/image upload (URLs only, see above)
- No card payment gateway (intentionally dropped per Stage 5 spec)
