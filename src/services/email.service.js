const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'Waystone Tracking <onboarding@resend.dev>';
const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr>
          <td style="background:#0B1F3A;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:1px;">
              WAY<span style="color:#F5A623;">STONE</span>
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:12px;letter-spacing:2px;">
              PACKAGE &amp; ASSET TRACKING
            </p>
          </td>
        </tr>
        <tr><td style="padding:36px 40px;color:#111827;line-height:1.65;">
          ${content}
        </td></tr>
        <tr>
          <td style="background:#F9FAFB;padding:20px 40px;text-align:center;border-top:1px solid #E5E7EB;">
            <p style="margin:0;color:#9CA3AF;font-size:12px;">
              © ${new Date().getFullYear()} Waystone. This is an automated message — please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`⚠️  Email skipped (RESEND_API_KEY not set) — would have sent "${subject}" to ${to}`);
    return { skipped: true };
  }
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html, text: text || subject });
  if (error) {
    console.error('❌ Resend error:', error);
    throw new Error(error.message || 'Email sending failed');
  }
  console.log(`✅ Email sent to ${to} — ID: ${data.id}`);
  return data;
}

// Sent immediately when a shipment is created
async function sendTrackingLinkEmail(recipient, shipment) {
  const trackUrl = `${getFrontendUrl()}/track/${shipment.trackingLinkToken}`;

  const html = emailWrapper(`
    <h2 style="color:#0B1F3A;margin:0 0 8px;">Your package is on its way 📦</h2>
    <p style="color:#4B5563;font-size:15px;margin:0 0 24px;">
      Hi <strong>${recipient.fullName}</strong>, a shipment has been created for you.
      Track its journey in real time using the link below — no account needed.
    </p>

    <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 4px;color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Tracking Number</p>
      <p style="margin:0 0 16px;color:#0B1F3A;font-size:20px;font-weight:700;font-family:monospace;">${shipment.trackingNumber}</p>
      <p style="margin:0 0 4px;color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Contents</p>
      <p style="margin:0;color:#111827;font-size:14px;">${shipment.description}</p>
    </div>

    <div style="text-align:center;margin:0 0 20px;">
      <a href="${trackUrl}"
        style="display:inline-block;background:#1E5EFF;color:#FFFFFF;padding:14px 36px;
        border-radius:50px;text-decoration:none;font-size:15px;font-weight:700;">
        📍 Track My Package
      </a>
    </div>

    <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0;">
      Bookmark this link — you can check your package's status anytime, no sign-in required.
    </p>
  `);

  return sendEmail({
    to: recipient.email,
    subject: `📦 Track your package — ${shipment.trackingNumber}`,
    html,
    text: `Track your package at ${trackUrl}`,
  });
}

// Sent when status changes to 'delivered'
async function sendDeliveredEmail(recipient, shipment) {
  const trackUrl = `${getFrontendUrl()}/track/${shipment.trackingLinkToken}`;

  const html = emailWrapper(`
    <h2 style="color:#0B1F3A;margin:0 0 8px;">Delivered! ✅</h2>
    <p style="color:#4B5563;font-size:15px;margin:0 0 24px;">
      Hi <strong>${recipient.fullName}</strong>, your package
      <strong>${shipment.trackingNumber}</strong> has been delivered.
    </p>
    <div style="background:#E3F8EF;border:1px solid #1D9A6C;border-radius:12px;padding:16px 20px;margin:0 0 24px;text-align:center;">
      <p style="margin:0;color:#1D9A6C;font-weight:700;font-size:16px;">Package delivered successfully</p>
    </div>
    <div style="text-align:center;margin:0 0 20px;">
      <a href="${trackUrl}"
        style="display:inline-block;background:#1E5EFF;color:#FFFFFF;padding:14px 36px;
        border-radius:50px;text-decoration:none;font-size:15px;font-weight:700;">
        View Delivery Details
      </a>
    </div>
  `);

  return sendEmail({
    to: recipient.email,
    subject: `✅ Delivered — ${shipment.trackingNumber}`,
    html,
    text: `Your package ${shipment.trackingNumber} has been delivered. View details at ${trackUrl}`,
  });
}

module.exports = { sendEmail, sendTrackingLinkEmail, sendDeliveredEmail };