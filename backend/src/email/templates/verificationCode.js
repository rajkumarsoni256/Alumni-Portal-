const { renderEmailLayout, htmlToText } = require('./templateRenderer');

const getVerificationCodeTemplate = ({ code, name, expiresMinutes = 10 }) => {
  const subject = `Verify your JU Connect email address`;
  const preheader = `Your 6-digit verification code is ${code}`;

  const bodyHtml = `
    <h1 class="heading">Welcome to JU Connect!</h1>
    <p>Hi ${name || 'there'},</p>
    <p>Thank you for registering with JU Connect. Please use the following 6-digit verification code to complete your email verification:</p>

    <div class="otp-box">
      <div class="otp-code">${code}</div>
      <p style="font-size:11px;color:#64748b;margin-top:8px;margin-bottom:0;">Code expires in ${expiresMinutes} minutes.</p>
    </div>

    <p style="font-size:12px;color:#64748b;">
      If you did not initiate this registration request, you can safely ignore this email.
    </p>
  `;

  const html = renderEmailLayout({ title: subject, preheader, bodyHtml });
  const text = htmlToText(bodyHtml);

  return { subject, html, text };
};

module.exports = getVerificationCodeTemplate;
