const { renderEmailLayout, htmlToText, appBaseUrl } = require('./templateRenderer');

const getNewDeviceLoginTemplate = ({ name, device, browser, os, ip, location, timestamp, authMethod = 'PASSWORD' }) => {
  const subject = `New device signed in to your JU Connect account`;
  const preheader = `New login detected from ${browser || 'Web Browser'} on ${os || 'Device'}`;
  const ctaUrl = `${appBaseUrl}/settings/security`;

  const formattedTime = timestamp ? new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : new Date().toLocaleString() + ' IST';

  const bodyHtml = `
    <h1 class="heading" style="color:#b91c1c;">New Device Login Alert</h1>
    <p>Hi ${name || 'there'},</p>
    <p>Your JU Connect account was just signed in from a new device or browser session.</p>

    <div class="meta-card">
      <div class="meta-row"><span class="meta-label">Device / OS:</span> ${os || 'Desktop / Mobile'}</div>
      <div class="meta-row"><span class="meta-label">Browser:</span> ${browser || 'Web Browser'}</div>
      <div class="meta-row"><span class="meta-label">Authentication:</span> ${authMethod}</div>
      <div class="meta-row"><span class="meta-label">Approximate Location:</span> ${location || 'Jaipur, Rajasthan, India'}</div>
      <div class="meta-row"><span class="meta-label">Timestamp:</span> ${formattedTime}</div>
    </div>

    <p style="font-size:12px;color:#64748b;">
      If this was you, no further action is required. If you do not recognize this login activity, please secure your account immediately.
    </p>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader,
    bodyHtml,
    ctaText: 'Review Account Security',
    ctaUrl,
  });

  const text = htmlToText(bodyHtml);

  return { subject, html, text };
};

module.exports = getNewDeviceLoginTemplate;
