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

/**
 * Sends an email if SMTP is configured; otherwise logs and resolves so
 * callers can always `.catch(() => {})` without worrying about setup state.
 */
async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email skipped — SMTP not configured] To: ${to} | Subject: ${subject}`);
    return;
  }

  await t.sendMail({
    from: process.env.EMAIL_FROM || 'Aura Avenue <no-reply@auraavenue.com>',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ' ')
  });
}

const formatPKR = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const wrapLayout = (bodyHtml) => `
  <div style="font-family: Arial, sans-serif; background:#FAF8F5; padding:32px;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E2DDD4;border-radius:4px;padding:32px;">
      <h1 style="font-size:20px;color:#1A1A1A;margin:0 0 4px;">Aura Avenue</h1>
      <div style="height:1px;background:#E2DDD4;margin:16px 0;"></div>
      ${bodyHtml}
      <div style="height:1px;background:#E2DDD4;margin:24px 0 16px;"></div>
      <p style="font-size:12px;color:#999;">This is an automated message from Aura Avenue. Please don't reply directly to this email.</p>
    </div>
  </div>
`;

async function sendOrderConfirmationEmail(order, user) {
  const itemRows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:6px 0;color:#1A1A1A;">${it.name} × ${it.quantity}</td>
        <td style="padding:6px 0;text-align:right;color:#1A1A1A;">${formatPKR(it.price * it.quantity)}</td>
      </tr>`
    )
    .join('');

  const html = wrapLayout(`
    <p style="color:#1A1A1A;">Hi ${user.name},</p>
    <p style="color:#1A1A1A;">Thanks for your order! Here's a summary:</p>
    <p style="color:#666;font-size:13px;">Order #${order._id.toString().slice(-8).toUpperCase()}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">${itemRows}</table>
    <table style="width:100%;border-top:1px solid #E2DDD4;padding-top:8px;">
      <tr><td style="padding-top:8px;font-weight:bold;color:#1A1A1A;">Total</td><td style="padding-top:8px;text-align:right;font-weight:bold;color:#1A1A1A;">${formatPKR(order.totalAmount)}</td></tr>
    </table>
    <p style="color:#1A1A1A;">Payment method: ${order.paymentMethod}</p>
    <p style="color:#1A1A1A;">We'll let you know as soon as it ships.</p>
  `);

  await sendEmail({ to: user.email, subject: `Order confirmed — #${order._id.toString().slice(-8).toUpperCase()}`, html });
}

async function sendOrderStatusEmail(order, user, status) {
  const messages = {
    processing: 'Your order is now being processed.',
    shipped: 'Your order is on its way!',
    delivered: 'Your order has been delivered. We hope you love it!',
    cancelled: 'Your order has been cancelled.'
  };

  const html = wrapLayout(`
    <p style="color:#1A1A1A;">Hi ${user.name},</p>
    <p style="color:#1A1A1A;">${messages[status] || `Your order status has been updated to "${status}".`}</p>
    <p style="color:#666;font-size:13px;">Order #${order._id.toString().slice(-8).toUpperCase()}</p>
  `);

  await sendEmail({ to: user.email, subject: `Order update — ${status}`, html });
}

module.exports = { sendEmail, sendOrderConfirmationEmail, sendOrderStatusEmail };
