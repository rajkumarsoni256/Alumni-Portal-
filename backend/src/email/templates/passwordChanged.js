const { renderEmailLayout, htmlToText, appBaseUrl } = require('./templateRenderer');

const getPasswordChangedTemplate = ({ name, timestamp, device }) => {
  const subject = `Your JU Connect password was changed`;
  const preheader = `Security Alert: Password updated successfully`;
  const ctaUrl = `${appBaseUrl}/settings/security`;

  const formattedTime = timestamp ? new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : new Date().toLocaleString() + ' IST';

  const bodyHtml = `
    <h1 class="heading">Password Changed Successfully</h1>
    <p>Hi ${name || 'there'},</p>
    <p>This email confirms that the password for your JU Connect account was recently changed.</p>

    <div class="meta-card">
      <div class="meta-row"><span class="meta-label">Time:</span> ${formattedTime}</div>
      <div class="meta-row"><span class="meta-label">Session:</span> ${device || 'Web Browser'}</div>
    </div>

    <p style="font-size:12px;color:#64748b;">
      If you made this change, you can safely ignore this alert. If you did NOT change your password, secure your account immediately.
    </p>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader,
    bodyHtml,
    ctaText: 'Secure My Account',
    ctaUrl,
  });

  const text = htmlToText(bodyHtml);

  return { subject, html, text };
};

module.exports = getPasswordChangedTemplate;
