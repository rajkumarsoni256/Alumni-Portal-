/**
 * Centralized Transactional Email Templates
 * Standardized HTML + Text renderers for all platform notifications.
 */

const FRONTEND_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

const emailHeader = (title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #991b1b; padding: 20px 24px; text-align: left; }
    .header img { height: 32px; vertical-align: middle; }
    .header span { color: #ffffff; font-weight: 700; font-size: 16px; margin-left: 10px; vertical-align: middle; }
    .content { padding: 28px 24px; line-height: 1.6; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .badge { display: inline-block; padding: 4px 12px; background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 600; border-radius: 9999px; margin-bottom: 16px; }
    .btn { display: inline-block; background: #991b1b; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin-top: 16px; margin-bottom: 16px; text-align: center; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 16px 0; font-size: 13px; }
    .footer { border-t: 1px solid #f1f5f9; padding: 16px 24px; background: #f8fafc; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span>JU Connect Alumni Network</span>
    </div>
    <div class="content">
      <h2 class="title">${title}</h2>
`;

const emailFooter = () => `
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} JECRC University Alumni Association. All rights reserved.</p>
      <p>This is an automated operational notification. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
`;

// 3. Welcome / Account Verified
const getWelcomeAccountTemplate = ({ name }) => {
  const title = `Welcome to JU Connect!`;
  const html = `
    ${emailHeader(title)}
    <p>Hi ${name || 'Member'},</p>
    <p>Your email address has been successfully verified, and your JU Connect account is fully active!</p>
    <p>You can now explore the Alumni Directory, join exclusive university discussions, connect with industry leaders, and discover career opportunities.</p>
    <p><a href="${FRONTEND_URL}/login" class="btn">Log In to Your Dashboard</a></p>
    ${emailFooter()}
  `;
  const text = `Hi ${name || 'Member'},\n\nYour email has been verified and your JU Connect account is active!\n\nLog in at: ${FRONTEND_URL}/login`;
  return { subject: `Welcome to JU Connect Alumni Network`, html, text };
};

// 4. Alumni Verification Request (Admin Notification)
const getAlumniVerificationRequestTemplate = ({ applicantName, applicantEmail, rollNumber, course, joiningYear, graduationYear, verificationLink }) => {
  const title = `New Alumni Verification Request Pending`;
  const actionUrl = verificationLink || `${FRONTEND_URL}/admin/verifications`;
  const html = `
    ${emailHeader(title)}
    <p>Hello Admin,</p>
    <p>A new Alumni registration request requires your review in the Admin Portal.</p>
    <div class="info-box">
      <p style="margin:4px 0;"><strong>Candidate:</strong> ${applicantName} (${applicantEmail})</p>
      <p style="margin:4px 0;"><strong>Roll Number:</strong> ${rollNumber || 'N/A'}</p>
      <p style="margin:4px 0;"><strong>Course:</strong> ${course || 'N/A'}</p>
      <p style="margin:4px 0;"><strong>Academic Years:</strong> ${joiningYear || 'N/A'} - ${graduationYear || 'N/A'}</p>
    </div>
    <p><a href="${actionUrl}" class="btn">Review Application in Admin Queue</a></p>
    ${emailFooter()}
  `;
  const text = `Hello Admin,\n\nNew Alumni verification request:\nName: ${applicantName} (${applicantEmail})\nRoll Number: ${rollNumber || 'N/A'}\nCourse: ${course || 'N/A'}\n\nReview at: ${actionUrl}`;
  return { subject: `New Alumni Verification Request: ${applicantName}`, html, text };
};

// 5. Alumni Account Approved
const getAlumniApprovedTemplate = ({ name }) => {
  const title = `Your Alumni Account Has Been Approved! 🎉`;
  const html = `
    ${emailHeader(title)}
    <p>Hi ${name || 'Alumnus'},</p>
    <p>Great news! The JECRC Alumni Relations team has verified your credentials and approved your Alumni status on JU Connect.</p>
    <p>Your profile now features the verified Alumni badge, granting full access to mentorship features, event creation, job postings, and direct directory networking.</p>
    <p><a href="${FRONTEND_URL}/login" class="btn">Access Alumni Dashboard</a></p>
    ${emailFooter()}
  `;
  const text = `Hi ${name || 'Alumnus'},\n\nYour JU Connect Alumni account has been approved! Log in at: ${FRONTEND_URL}/login`;
  return { subject: `Your JU Connect Alumni account has been approved`, html, text };
};

// 6. Alumni Account Rejected
const getAlumniRejectedTemplate = ({ name, rejectionReason }) => {
  const title = `Update Regarding Your Alumni Verification Request`;
  const html = `
    ${emailHeader(title)}
    <p>Hi ${name || 'Applicant'},</p>
    <p>Thank you for submitting your Alumni verification request to JU Connect.</p>
    <p>After reviewing your application, the administration was unable to approve your Alumni status at this time.</p>
    <div class="info-box" style="border-left: 4px solid #ef4444;">
      <p style="margin:0;"><strong>Reason:</strong> ${rejectionReason || 'Credence document details could not be matched with university records.'}</p>
    </div>
    <p>If you believe this is an error or wish to update your details, please contact the Alumni Office or re-submit your verification.</p>
    ${emailFooter()}
  `;
  const text = `Hi ${name || 'Applicant'},\n\nYour Alumni verification request was not approved.\nReason: ${rejectionReason || 'Verification failed.'}\nContact support for assistance.`;
  return { subject: `JU Connect Alumni Verification Status Update`, html, text };
};

// 7. Connection Request & Accepted
const getConnectionEventTemplate = ({ recipientName, actorName, eventType, profileUrl }) => {
  const isRequest = eventType === 'CONNECTION_REQUEST';
  const title = isRequest ? `New Connection Request` : `Connection Request Accepted!`;
  const targetLink = profileUrl || `${FRONTEND_URL}/network`;
  const html = `
    ${emailHeader(title)}
    <p>Hi ${recipientName || 'Member'},</p>
    <p><strong>${actorName}</strong> ${isRequest ? 'would like to connect with you on JU Connect.' : 'accepted your connection request!'}</p>
    <p><a href="${targetLink}" class="btn">${isRequest ? 'View Connection Request' : 'View Profile & Chat'}</a></p>
    ${emailFooter()}
  `;
  const text = `Hi ${recipientName},\n\n${actorName} ${isRequest ? 'sent you a connection request.' : 'accepted your connection request!'}\n\nView at: ${targetLink}`;
  return { subject: isRequest ? `${actorName} wants to connect on JU Connect` : `${actorName} accepted your connection request`, html, text };
};

// 8. New Message Alert
const getNewMessageTemplate = ({ recipientName, senderName, messageSnippet, chatUrl }) => {
  const title = `New Message from ${senderName}`;
  const targetLink = chatUrl || `${FRONTEND_URL}/messages`;
  const html = `
    ${emailHeader(title)}
    <p>Hi ${recipientName || 'Member'},</p>
    <p><strong>${senderName}</strong> sent you a message:</p>
    <div class="info-box">
      <p style="margin:0; font-style: italic;">"${messageSnippet || 'Sent you a message...'}"</p>
    </div>
    <p><a href="${targetLink}" class="btn">Reply to Message</a></p>
    ${emailFooter()}
  `;
  const text = `Hi ${recipientName},\n\n${senderName} sent you a message: "${messageSnippet}"\n\nReply at: ${targetLink}`;
  return { subject: `New message from ${senderName}`, html, text };
};

// 9. Job Application Alert
const getJobApplicationTemplate = ({ posterName, applicantName, jobTitle, jobUrl }) => {
  const title = `New Application for ${jobTitle}`;
  const targetLink = jobUrl || `${FRONTEND_URL}/jobs`;
  const html = `
    ${emailHeader(title)}
    <p>Hi ${posterName || 'Recruiter'},</p>
    <p><strong>${applicantName}</strong> has applied for your job listing: <strong>${jobTitle}</strong>.</p>
    <p><a href="${targetLink}" class="btn">Review Application</a></p>
    ${emailFooter()}
  `;
  const text = `Hi ${posterName},\n\n${applicantName} applied for your job post: ${jobTitle}.\n\nReview at: ${targetLink}`;
  return { subject: `New application received for ${jobTitle}`, html, text };
};

// 10. Event Registration Confirmation
const getEventRegistrationTemplate = ({ recipientName, eventTitle, eventDate, eventLocation, eventUrl }) => {
  const title = `Registration Confirmed: ${eventTitle}`;
  const targetLink = eventUrl || `${FRONTEND_URL}/events`;
  const html = `
    ${emailHeader(title)}
    <p>Hi ${recipientName || 'Member'},</p>
    <p>Your registration for <strong>${eventTitle}</strong> is confirmed!</p>
    <div class="info-box">
      <p style="margin:4px 0;"><strong>Event:</strong> ${eventTitle}</p>
      <p style="margin:4px 0;"><strong>Date/Time:</strong> ${eventDate || 'Scheduled Date'}</p>
      <p style="margin:4px 0;"><strong>Location:</strong> ${eventLocation || 'JECRC Campus / Online'}</p>
    </div>
    <p><a href="${targetLink}" class="btn">View Event Details</a></p>
    ${emailFooter()}
  `;
  const text = `Hi ${recipientName},\n\nYour registration for ${eventTitle} is confirmed!\n\nView details at: ${targetLink}`;
  return { subject: `Event Registration Confirmed: ${eventTitle}`, html, text };
};

// 11. Mentorship Request & Accepted
const getMentorshipEventTemplate = ({ recipientName, actorName, eventType, targetUrl }) => {
  const isRequest = eventType === 'MENTORSHIP_REQUEST';
  const title = isRequest ? `New Mentorship Request` : `Mentorship Request Accepted!`;
  const actionUrl = targetUrl || `${FRONTEND_URL}/mentorship`;
  const html = `
    ${emailHeader(title)}
    <p>Hi ${recipientName || 'Member'},</p>
    <p><strong>${actorName}</strong> ${isRequest ? 'has requested mentorship guidance from you.' : 'has accepted your mentorship request!'}</p>
    <p><a href="${actionUrl}" class="btn">${isRequest ? 'Review Mentorship Request' : 'View Mentorship Session'}</a></p>
    ${emailFooter()}
  `;
  const text = `Hi ${recipientName},\n\n${actorName} ${isRequest ? 'requested mentorship guidance from you.' : 'accepted your mentorship request!'}\n\nView at: ${actionUrl}`;
  return { subject: isRequest ? `New Mentorship Request from ${actorName}` : `Mentorship Request Accepted by ${actorName}`, html, text };
};

// 12. Alumni Registration Request Received (Applicant Receipt)
const getAlumniRegistrationReceivedTemplate = ({ name }) => {
  const title = `Alumni Registration Request Received`;
  const html = `
    ${emailHeader(title)}
    <p>Hi ${name || 'Graduate'},</p>
    <p>Thank you for registering with JU Connect Alumni Network!</p>
    <p>Your registration request has been successfully received and sent to the JU Connect team for administrative approval. Our alumni relations team will verify your details and approve your account shortly.</p>
    <div class="info-box">
      <p style="margin:4px 0;"><strong>Status:</strong> Pending Admin Verification</p>
      <p style="margin:4px 0;"><strong>Note:</strong> You will receive an email notification once your account has been approved by the Admin.</p>
    </div>
    <p>Thank you for your patience!</p>
    ${emailFooter()}
  `;
  const text = `Hi ${name || 'Graduate'},\n\nThank you for registering with JU Connect!\n\nYour registration request has been sent to the JU Connect team for approval. You will receive an email notification once your account has been approved.`;
  return { subject: `JU Connect Alumni Registration Request Received`, html, text };
};

module.exports = {
  getWelcomeAccountTemplate,
  getAlumniVerificationRequestTemplate,
  getAlumniApprovedTemplate,
  getAlumniRejectedTemplate,
  getAlumniRegistrationReceivedTemplate,
  getConnectionEventTemplate,
  getNewMessageTemplate,
  getJobApplicationTemplate,
  getEventRegistrationTemplate,
  getMentorshipEventTemplate,
};
