const { renderEmailLayout, htmlToText, appBaseUrl } = require('./templateRenderer');

const getEmailChangedTemplate = ({ name, oldEmail, newEmail, timestamp }) => {
  const subject = `Your JU Connect primary email address was changed`;
  const preheader = `Security Notification: Email address updated`;
  const ctaUrl = `${appBaseUrl}/settings/account`;

  const formattedTime = timestamp ? new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : new Date().toLocaleString() + ' IST';

  const bodyHtml = `
    <h1 class="heading">Email Address Updated</h1>
    <p>Hi ${name || 'there'},</p>
    <p>The primary email address associated with your JU Connect account was changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>

    <div class="meta-card">
      <div class="meta-row"><span class="meta-label">New Primary Email:</span> ${newEmail}</div>
      <div class="meta-row"><span class="meta-label">Timestamp:</span> ${formattedTime}</div>
    </div>

    <p style="font-size:12px;color:#64748b;">
      If you requested this email update, no further action is required. If you did not authorize this change, please contact JU Connect support immediately.
    </p>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader,
    bodyHtml,
    ctaText: 'Review Account Settings',
    ctaUrl,
  });

  const text = htmlToText(bodyHtml);

  return { subject, html, text };
};

module.exports = getEmailChangedTemplate;
