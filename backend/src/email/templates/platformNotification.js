const { renderEmailLayout, htmlToText, appBaseUrl } = require('./templateRenderer');

const getPlatformNotificationTemplate = ({ recipientName, actorName, title, message, entityType, entityId }) => {
  const subject = title || `New interaction on JU Connect`;
  const preheader = message || `Check your JU Connect notifications`;

  let actionUrl = `${appBaseUrl}/notifications`;
  if (entityType === 'POST') actionUrl = `${appBaseUrl}/feed`;
  else if (entityType === 'CONNECTION') actionUrl = `${appBaseUrl}/network`;
  else if (entityType === 'MESSAGE' || entityType === 'CONVERSATION') actionUrl = `${appBaseUrl}/messages`;
  else if (entityType === 'EVENT') actionUrl = `${appBaseUrl}/events`;
  else if (entityType === 'JOB') actionUrl = `${appBaseUrl}/jobs`;

  const bodyHtml = `
    <h1 class="heading">${title}</h1>
    <p>Hi ${recipientName || 'there'},</p>
    <p>${message}</p>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader,
    bodyHtml,
    ctaText: 'View in JU Connect',
    ctaUrl: actionUrl,
  });

  const text = htmlToText(bodyHtml);

  return { subject, html, text };
};

module.exports = getPlatformNotificationTemplate;
