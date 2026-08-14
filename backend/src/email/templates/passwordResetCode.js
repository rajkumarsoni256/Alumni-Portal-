const { renderEmailLayout, htmlToText, appBaseUrl } = require('./templateRenderer');

const getPasswordResetCodeTemplate = ({ code, resetToken, name, expiresMinutes = 10 }) => {
  const subject = `Reset your JU Connect password`;
  const preheader = `Your password reset verification code is ${code}`;
  const ctaUrl = `${appBaseUrl}/reset-password?token=${resetToken || ''}&email=${encodeURIComponent(name || '')}`;

  const bodyHtml = `
    <h1 class="heading">Password Reset Request</h1>
    <p>Hi ${name || 'there'},</p>
    <p>We received a request to reset the password for your JU Connect account. Use the 6-digit verification code below to authorize your password reset:</p>

    <div class="otp-box">
      <div class="otp-code">${code}</div>
      <p style="font-size:11px;color:#64748b;margin-top:8px;margin-bottom:0;">Code expires in ${expiresMinutes} minutes.</p>
    </div>

    <p style="font-size:12px;color:#64748b;">
      If you did not request a password reset, please ignore this email and verify your account security.
    </p>
  `;

  const html = renderEmailLayout({ 
    title: subject, 
    preheader, 
    bodyHtml,
    ctaText: resetToken ? 'Reset Password Direct Link' : null,
    ctaUrl: resetToken ? ctaUrl : null
  });

  const text = htmlToText(bodyHtml);

  return { subject, html, text };
};

module.exports = getPasswordResetCodeTemplate;
