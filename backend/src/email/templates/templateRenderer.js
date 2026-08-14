const appBaseUrl = process.env.FRONTEND_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:5173';

/**
 * Wrap email content body in clean, professional JU Connect responsive email layout
 */
const renderEmailLayout = ({ title, preheader, bodyHtml, ctaText, ctaUrl }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background-color: #ffffff; padding: 24px 32px; border-bottom: 2px solid #b91c1c; text-align: left; }
    .brand-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; text-decoration: none; display: inline-block; }
    .brand-accent { color: #b91c1c; }
    .brand-sub { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
    .content { padding: 32px; color: #334155; font-size: 14px; line-height: 1.6; }
    .heading { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .otp-box { background-color: #f8fafc; border: 1px border-slate-300; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #b91c1c; margin: 0; }
    .cta-button { display: inline-block; background-color: #b91c1c; color: #ffffff !important; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 20px 0; }
    .meta-card { background-color: #f1f5f9; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 12px; color: #475569; }
    .meta-row { margin-bottom: 6px; }
    .meta-row:last-child { margin-bottom: 0; }
    .meta-label { font-weight: 700; color: #0f172a; }
    .footer { background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .footer-link { color: #64748b; text-decoration: underline; }
  </style>
</head>
<body>
  <span style="display:none;font-size:1px;color:#ffffff;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader || title}</span>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <a href="${appBaseUrl}" class="brand-title">JU <span class="brand-accent">CONNECT</span></a>
        <div class="brand-sub">JECRC University Alumni Network</div>
      </div>
      <div class="content">
        ${bodyHtml}
        ${ctaText && ctaUrl ? `<div style="text-align: center;"><a href="${ctaUrl}" class="cta-button">${ctaText}</a></div>` : ''}
      </div>
      <div class="footer">
        JU Connect · Directorate of Alumni Relations · JECRC University, Jaipur<br>
        This is an automated notification. Please do not reply directly to this message.
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Strips HTML tags to generate clean plain text fallback
 */
const htmlToText = (html) => {
  if (!html) return '';
  return html
    .replace(/<style([\s\S]*?)<\/style>/gi, '')
    .replace(/<script([\s\S]*?)<\/script>/gi, '')
    .replace(/<div class="otp-code">([\s\S]*?)<\/div>/gi, 'CODE: $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();
};

module.exports = {
  renderEmailLayout,
  htmlToText,
  appBaseUrl,
};
