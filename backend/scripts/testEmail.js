/**
 * Standalone SMTP Delivery Test Tool
 * Usage: node scripts/testEmail.js recipient@example.com
 */

require('dotenv').config();
const emailService = require('../src/email/emailService');

const targetRecipient = process.argv[2] || process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || 'test@example.com';

console.log('================================================================');
console.log('    JU CONNECT ALUMNI NETWORK — SMTP EMAIL TEST UTILITY         ');
console.log('================================================================\n');

console.log(`[INFO] EMAIL_PROVIDER : ${process.env.EMAIL_PROVIDER || 'console'}`);
console.log(`[INFO] EMAIL_MODE     : ${process.env.EMAIL_MODE || 'development'}`);
console.log(`[INFO] SMTP_HOST      : ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
console.log(`[INFO] SMTP_PORT      : ${process.env.SMTP_PORT || '587'}`);
console.log(`[INFO] EMAIL_FROM     : ${process.env.EMAIL_FROM || 'no-reply@jecrc.ac.in'}`);
console.log(`[INFO] Target Recipient: ${targetRecipient}\n`);

async function runTest() {
  try {
    const result = await emailService.provider.sendEmail({
      to: targetRecipient,
      subject: 'JU Connect — Production SMTP Test Email',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; max-width: 500px;">
          <h2 style="color: #991b1b; margin-top: 0;">JU Connect SMTP Test Passed! 🎉</h2>
          <p>This is a transactional test email dispatched via <strong>${process.env.EMAIL_PROVIDER || 'SMTP'}</strong> transport.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
      text: `JU Connect SMTP Test Passed!\nTimestamp: ${new Date().toISOString()}`,
    });

    console.log('[RESULT] Dispatch Completed:');
    console.log(`  Success    : ${result.success}`);
    console.log(`  Provider   : ${result.provider}`);
    console.log(`  Message ID : ${result.messageId || 'N/A'}`);
    if (result.error) {
      console.error(`  Error      : ${result.error}`);
    }

    console.log('\n================================================================\n');
    process.exit(result.success ? 0 : 1);
  } catch (err) {
    console.error('[FATAL TEST ERROR]', err.message);
    process.exit(1);
  }
}

runTest();
