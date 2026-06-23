const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email skipped - SMTP not configured] To: ${to} | Subject: ${subject}`);
    return;
  }
  await t.sendMail({
    from: process.env.EMAIL_FROM || 'Aura Avenue <no-reply@auraavenue.com>',
    to, subject, html,
    text: text || html.replace(/<[^>]+>/g, ' ')
  });
}

const formatPKR = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const wrapLayout = (bodyHtml) => `
  <div style="font-family:Arial,sans-serif;background:#FAF8F5;padding:32px;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E2DDD4;border-radius:4px;padding:32px;">
      <div style="display:flex;align-items:center;margin-bottom:16px;">
        <h1 style="font-size:22px;color:#1A1A1A;margin:0;font-weight:bold;letter-spacing:1px;">AURA AVENUE</h1>
      </div>
      <div style="height:2px;background:#C9A84C;margin-bottom:24px;"></div>
      ${bodyHtml}
      <div style="height:1px;background:#E2DDD4;margin:24px 0 16px;"></div>
      <p style="font-size:12px;color:#999;margin:0;">This is an automated message from Aura Avenue. For support, WhatsApp us at 0325-5910645.</p>
    </div>
  </div>
`;

const STATUS_MESSAGES = {
  pending: { emoji: '⏳', title: 'Order Received', body: 'We have received your order and it is pending advance payment confirmation.' },
  pending_advance_payment: { emoji: '💳', title: 'Advance Payment Required', body: 'Please send advance payment of PKR 300 to confirm your order. Once received, your order will be processed.' },
  advance_payment_received: { emoji: '✅', title: 'Advance Payment Received', body: 'We have received your advance payment. Your order is now confirmed and will be processed shortly.' },
  confirmed: { emoji: '✅', title: 'Order Confirmed', body: 'Great news! Your order has been confirmed and will be prepared for dispatch.' },
  processing: { emoji: '📦', title: 'Order Processing', body: 'Your order is being packed and prepared for shipment.' },
  shipped: { emoji: '🚚', title: 'Order Shipped', body: 'Your order is on its way! Our courier will deliver it within the estimated time.' },
  out_for_delivery: { emoji: '🏍️', title: 'Out for Delivery', body: 'Your order is out for delivery today. Please keep your phone handy.' },
  delivered: { emoji: '🎉', title: 'Order Delivered', body: 'Your order has been delivered. We hope you love your Aura Avenue products!' },
  cancelled: { emoji: '❌', title: 'Order Cancelled', body: 'Your order has been cancelled. If you paid in advance, a refund will be processed within 3-5 business days.' }
};

async function sendOrderConfirmationEmail(order, user) {
  const itemRows = order.items.map((it) => `
    <tr>
      <td style="padding:8px 0;color:#1A1A1A;border-bottom:1px solid #F0EDE8;">${it.name} x ${it.quantity}</td>
      <td style="padding:8px 0;text-align:right;color:#1A1A1A;border-bottom:1px solid #F0EDE8;">${formatPKR(it.price * it.quantity)}</td>
    </tr>`).join('');

  const addr = order.shippingAddress;
  const addressText = addr ? `${addr.fullName}, ${addr.line1}, ${addr.city}, ${addr.state}` : 'N/A';

  const html = wrapLayout(`
    <p style="color:#1A1A1A;font-size:15px;">Hi ${user.name},</p>
    <p style="color:#555;">Thank you for your order! Here is your order summary:</p>
    <div style="background:#FAF8F5;border-radius:4px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
      <p style="margin:4px 0 0;color:#1A1A1A;font-weight:bold;font-size:16px;">#${order._id.toString().slice(-8).toUpperCase()}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">${itemRows}</table>
    <table style="width:100%;">
      <tr><td style="padding:4px 0;color:#888;">Shipping</td><td style="text-align:right;color:#1A1A1A;">${formatPKR(order.shippingFee || 0)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:bold;color:#1A1A1A;font-size:15px;">Total</td><td style="text-align:right;font-weight:bold;color:#1A1A1A;font-size:15px;">${formatPKR(order.totalAmount)}</td></tr>
    </table>
    <div style="background:#FAF8F5;border-radius:4px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0 0 4px;color:#888;font-size:12px;">Payment Method</p>
      <p style="margin:0;color:#1A1A1A;">${order.paymentMethod?.toUpperCase()}</p>
      <p style="margin:8px 0 4px;color:#888;font-size:12px;">Shipping To</p>
      <p style="margin:0;color:#1A1A1A;">${addressText}</p>
      <p style="margin:8px 0 4px;color:#888;font-size:12px;">Estimated Delivery</p>
      <p style="margin:0;color:#1A1A1A;">2-5 business days</p>
    </div>
    <p style="color:#555;font-size:13px;">We will send you updates as your order progresses. For any questions, WhatsApp us at 0325-5910645.</p>
  `);

  await sendEmail({
    to: user.email,
    subject: `Order Confirmed #${order._id.toString().slice(-8).toUpperCase()} - Aura Avenue`,
    html
  });
}

async function sendOrderStatusEmail(order, user, status) {
  const info = STATUS_MESSAGES[status] || { emoji: '📋', title: `Order ${status}`, body: `Your order status has been updated to "${status}".` };

  const html = wrapLayout(`
    <div style="text-align:center;padding:16px 0;">
      <div style="font-size:48px;margin-bottom:8px;">${info.emoji}</div>
      <h2 style="color:#1A1A1A;font-size:20px;margin:0 0 8px;">${info.title}</h2>
    </div>
    <p style="color:#1A1A1A;">Hi ${user.name},</p>
    <p style="color:#555;">${info.body}</p>
    <div style="background:#FAF8F5;border-radius:4px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;color:#888;font-size:12px;">Order Number</p>
      <p style="margin:4px 0 0;color:#1A1A1A;font-weight:bold;">#${order._id.toString().slice(-8).toUpperCase()}</p>
      <p style="margin:8px 0 4px;color:#888;font-size:12px;">Total Amount</p>
      <p style="margin:0;color:#1A1A1A;">${formatPKR(order.totalAmount)}</p>
    </div>
    <p style="color:#555;font-size:13px;">Need help? WhatsApp us at 0325-5910645 or email auraevenue@gmail.com</p>
  `);

  await sendEmail({
    to: user.email,
    subject: `${info.emoji} ${info.title} - Order #${order._id.toString().slice(-8).toUpperCase()}`,
    html
  });
}

module.exports = { sendEmail, sendOrderConfirmationEmail, sendOrderStatusEmail };
