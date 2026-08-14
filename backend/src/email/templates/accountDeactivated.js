const { renderEmailLayout, htmlToText, appBaseUrl } = require('./templateRenderer');

const getAccountDeactivatedTemplate = ({ name }) => {
  const subject = `Your JU Connect account has been deactivated`;
  const preheader = `Account Deactivation Confirmation`;

  const bodyHtml = `
    <h1 class="heading">Account Deactivated</h1>
    <p>Hi ${name || 'there'},</p>
    <p>Your JU Connect account has been successfully deactivated according to your request.</p>
    <p>Your profile card, connection status, and posts are now hidden from the public community directory. You can reactivate your account anytime simply by signing back in.</p>
  `;

  const html = renderEmailLayout({ title: subject, preheader, bodyHtml });
  const text = htmlToText(bodyHtml);
  return { subject, html, text };
};

const getAccountDeletedTemplate = ({ name }) => {
  const subject = `Your JU Connect account deletion request`;
  const preheader = `Account Deletion Confirmation`;

  const bodyHtml = `
    <h1 class="heading">Account Deletion Requested</h1>
    <p>Hi ${name || 'there'},</p>
    <p>We have received your account deletion request. Your account has been disabled and your personal data has been flagged for permanent removal in accordance with our retention policy.</p>
    <p style="font-size:12px;color:#64748b;">Thank you for being a part of the JECRC Alumni Community.</p>
  `;

  const html = renderEmailLayout({ title: subject, preheader, bodyHtml });
  const text = htmlToText(bodyHtml);
  return { subject, html, text };
};

module.exports = {
  getAccountDeactivatedTemplate,
  getAccountDeletedTemplate,
};
