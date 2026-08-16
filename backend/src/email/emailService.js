const crypto = require('crypto');
const db = require('../config/db');
const EmailProviderFactory = require('./providers/EmailProviderFactory');

// Templates
const getVerificationCodeTemplate = require('./templates/verificationCode');
const getPasswordResetCodeTemplate = require('./templates/passwordResetCode');
const getNewDeviceLoginTemplate = require('./templates/newDeviceLogin');
const getPasswordChangedTemplate = require('./templates/passwordChanged');
const getEmailChangedTemplate = require('./templates/emailChanged');
const { getAccountDeactivatedTemplate, getAccountDeletedTemplate } = require('./templates/accountDeactivated');
const getPlatformNotificationTemplate = require('./templates/platformNotification');
const {
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
} = require('./templates/transactionalTemplates');

class EmailService {
  constructor() {
    this.provider = EmailProviderFactory.getProvider();
    this.OTP_EXPIRY_MINUTES = 10;
    this.MAX_OTP_ATTEMPTS = 5;
    this.RESEND_COOLDOWN_SECONDS = 60;
  }

  /**
   * Cryptographically secure 6-digit OTP code generator
   */
  generateOTPCode() {
    return String(crypto.randomInt(100000, 999999));
  }

  /**
   * Hash code with SHA-256 for secure storage
   */
  hashOTPCode(code) {
    return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
  }

  /**
   * Store hashed OTP code in database with cooldown & max attempts limit
   */
  async createAndStoreOTP({ userId, email, purpose }) {
    const cleanEmail = String(email).trim().toLowerCase();

    // Check resend rate-limiting cooldown (60 seconds)
    const recentRes = await db.query(
      `SELECT created_at FROM verification_codes 
       WHERE email = $1 AND purpose = $2 AND created_at > NOW() - INTERVAL '60 seconds'
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, purpose]
    );

    if (recentRes.rows.length > 0) {
      const err = new Error('Please wait 60 seconds before requesting a new code.');
      err.statusCode = 429;
      err.errorCode = 'TOO_MANY_REQUESTS';
      throw err;
    }

    // Invalidate previous active codes for this email + purpose
    await db.query(
      `UPDATE verification_codes SET used_at = NOW() WHERE email = $1 AND purpose = $2 AND used_at IS NULL`,
      [cleanEmail, purpose]
    );

    const rawCode = this.generateOTPCode();
    const codeHash = this.hashOTPCode(rawCode);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.query(
      `INSERT INTO verification_codes (id, user_id, email, purpose, code_hash, expires_at, attempt_count, max_attempts)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7)`,
      [crypto.randomUUID(), userId || null, cleanEmail, purpose, codeHash, expiresAt, this.MAX_OTP_ATTEMPTS]
    );

    return rawCode;
  }

  /**
   * Verify an OTP code against stored SHA-256 hash
   */
  async verifyOTPCode({ email, code, purpose }) {
    const cleanEmail = String(email).trim().toLowerCase();
    const rawCode = String(code || '').trim();

    if (!rawCode || rawCode.length !== 6) {
      const err = new Error('Verification code must be 6 digits');
      err.statusCode = 400;
      err.errorCode = 'INVALID_CODE';
      throw err;
    }

    const res = await db.query(
      `SELECT id, user_id, code_hash, expires_at, attempt_count, max_attempts, used_at
       FROM verification_codes
       WHERE email = $1 AND purpose = $2 AND used_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, purpose]
    );

    if (res.rows.length === 0) {
      const err = new Error('Invalid or expired verification code');
      err.statusCode = 400;
      err.errorCode = 'INVALID_CODE';
      throw err;
    }

    const record = res.rows[0];

    // Check attempts limit
    if (record.attempt_count >= record.max_attempts) {
      await db.query(`UPDATE verification_codes SET used_at = NOW() WHERE id = $1`, [record.id]);
      const err = new Error('Maximum verification attempts exceeded. Please request a new code.');
      err.statusCode = 400;
      err.errorCode = 'MAX_ATTEMPTS_EXCEEDED';
      throw err;
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      const err = new Error('Verification code has expired. Please request a new code.');
      err.statusCode = 400;
      err.errorCode = 'CODE_EXPIRED';
      throw err;
    }

    // Hash user input and compare
    const inputHash = this.hashOTPCode(rawCode);
    if (inputHash !== record.code_hash) {
      await db.query(`UPDATE verification_codes SET attempt_count = attempt_count + 1 WHERE id = $1`, [record.id]);
      const err = new Error('Invalid verification code');
      err.statusCode = 400;
      err.errorCode = 'INVALID_CODE';
      throw err;
    }

    // Mark used
    await db.query(`UPDATE verification_codes SET used_at = NOW() WHERE id = $1`, [record.id]);

    return {
      success: true,
      userId: record.user_id,
      email: cleanEmail,
    };
  }

  /**
   * Internal helper to record delivery log to PostgreSQL
   */
  async logDelivery({ userId, recipientEmail, emailType, templateName, subject, result }) {
    try {
      const status = result.success ? 'SENT' : 'FAILED';
      await db.query(
        `INSERT INTO email_deliveries 
         (id, user_id, recipient_email, email_type, template_name, subject, status, provider, provider_message_id, last_error, sent_at, failed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          crypto.randomUUID(),
          userId || null,
          recipientEmail,
          emailType,
          templateName,
          subject,
          status,
          result.provider || this.provider.name,
          result.messageId || null,
          result.error || null,
          result.success ? new Date() : null,
          result.success ? null : new Date(),
        ]
      );
    } catch (err) {
      console.warn('Failed to insert email_deliveries record:', err.message);
    }
  }

  /**
   * 1. Send Email Verification OTP Code
   */
  async sendVerificationCode(email, userId, name) {
    const rawCode = await this.createAndStoreOTP({ userId, email, purpose: 'EMAIL_VERIFICATION' });
    const { subject, html, text } = getVerificationCodeTemplate({ code: rawCode, name, expiresMinutes: this.OTP_EXPIRY_MINUTES });

    console.log(`[OTP DISPATCH] Verification OTP for ${email}: ${rawCode}`);
    const result = await this.provider.sendEmail({ to: email, subject, html, text });
    await this.logDelivery({ userId, recipientEmail: email, emailType: 'EMAIL_VERIFICATION', templateName: 'verificationCode', subject, result });
    return result;
  }

  /**
   * 1b. Send Student Institutional Email Verification OTP Code
   */
  async sendStudentVerificationCode(email, name) {
    const rawCode = await this.createAndStoreOTP({ email, purpose: 'STUDENT_VERIFICATION' });
    const { subject, html, text } = getVerificationCodeTemplate({ code: rawCode, name, expiresMinutes: this.OTP_EXPIRY_MINUTES });

    console.log(`[OTP DISPATCH] Student Verification OTP for ${email}: ${rawCode}`);
    const result = await this.provider.sendEmail({ to: email, subject, html, text });
    await this.logDelivery({ userId: null, recipientEmail: email, emailType: 'STUDENT_VERIFICATION', templateName: 'verificationCode', subject, result });
    return result;
  }

  /**
   * 2. Send Password Reset OTP Code
   */
  async sendPasswordResetCode(email, userId, name, resetToken = null) {
    const rawCode = await this.createAndStoreOTP({ userId, email, purpose: 'PASSWORD_RESET' });
    const { subject, html, text } = getPasswordResetCodeTemplate({ code: rawCode, name, resetToken, expiresMinutes: this.OTP_EXPIRY_MINUTES });

    console.log(`[OTP DISPATCH] Password Reset OTP for ${email}: ${rawCode}`);
    const result = await this.provider.sendEmail({ to: email, subject, html, text });
    await this.logDelivery({ userId, recipientEmail: email, emailType: 'PASSWORD_RESET', templateName: 'passwordResetCode', subject, result });
    return result;
  }

  /**
   * 3. Send New Device Login Security Alert (IMMUTABLE)
   */
  async sendNewDeviceLoginAlert(email, userId, deviceMeta = {}) {
    const { subject, html, text } = getNewDeviceLoginTemplate({
      name: deviceMeta.userName,
      device: deviceMeta.device,
      browser: deviceMeta.browser,
      os: deviceMeta.os,
      ip: deviceMeta.ip,
      location: deviceMeta.location,
      timestamp: deviceMeta.timestamp || new Date(),
      authMethod: deviceMeta.authMethod || 'PASSWORD',
    });

    const result = await this.provider.sendEmail({ to: email, subject, html, text });
    await this.logDelivery({ userId, recipientEmail: email, emailType: 'NEW_DEVICE_LOGIN', templateName: 'newDeviceLogin', subject, result });
    return result;
  }

  /**
   * 4. Send Password Changed Confirmation Alert (IMMUTABLE)
   */
  async sendPasswordChangedAlert(email, userId, deviceMeta = {}) {
    const { subject, html, text } = getPasswordChangedTemplate({
      name: deviceMeta.userName,
      timestamp: deviceMeta.timestamp || new Date(),
      device: deviceMeta.device || 'Web Client',
    });

    const result = await this.provider.sendEmail({ to: email, subject, html, text });
    await this.logDelivery({ userId, recipientEmail: email, emailType: 'PASSWORD_CHANGED', templateName: 'passwordChanged', subject, result });
    return result;
  }

  /**
   * 5. Send Email Changed Notification (IMMUTABLE - Sent to Old Email)
   */
  async sendEmailChangedAlert(oldEmail, newEmail, userId, name) {
    const { subject, html, text } = getEmailChangedTemplate({
      name,
      oldEmail,
      newEmail,
      timestamp: new Date(),
    });

    const result = await this.provider.sendEmail({ to: oldEmail, subject, html, text });
    await this.logDelivery({ userId, recipientEmail: oldEmail, emailType: 'EMAIL_CHANGED', templateName: 'emailChanged', subject, result });
    return result;
  }

  /**
   * 6. Send Account Deactivated / Deleted Alerts
   */
  async sendAccountDeactivatedAlert(email, name, userId) {
    const { subject, html, text } = getAccountDeactivatedTemplate({ name });
    const result = await this.provider.sendEmail({ to: email, subject, html, text });
    await this.logDelivery({ userId, recipientEmail: email, emailType: 'ACCOUNT_DEACTIVATED', templateName: 'accountDeactivated', subject, result });
    return result;
  }

  async sendAccountDeletedAlert(email, name, userId) {
    const { subject, html, text } = getAccountDeletedTemplate({ name });
    const result = await this.provider.sendEmail({ to: email, subject, html, text });
    await this.logDelivery({ userId, recipientEmail: email, emailType: 'ACCOUNT_DELETED', templateName: 'accountDeleted', subject, result });
    return result;
  }

  /**
   * 8. Send Welcome / Account Verified Email
   */
  async sendWelcomeEmail(email, name, userId = null) {
    const { subject, html, text } = getWelcomeAccountTemplate({ name });
    const result = await this.provider.sendEmail({ to: email, subject, html, text });
    await this.logDelivery({ userId, recipientEmail: email, emailType: 'WELCOME', templateName: 'welcomeAccount', subject, result });
    return result;
  }

  /**
   * 9. Send Alumni Verification Request Alert to Admin
   */
  async sendAlumniVerificationRequestEmail(adminEmail, applicantData = {}) {
    const { subject, html, text } = getAlumniVerificationRequestTemplate(applicantData);
    const result = await this.provider.sendEmail({ to: adminEmail, subject, html, text });
    await this.logDelivery({ userId: null, recipientEmail: adminEmail, emailType: 'ALUMNI_VERIFICATION_REQUEST', templateName: 'alumniVerificationRequest', subject, result });
    return result;
  }

  /**
   * 10. Send Alumni Account Approved Email
   */
  async sendAlumniApprovedEmail(email, name, userId = null) {
    const { subject, html, text } = getAlumniApprovedTemplate({ name });
    const result = await this.provider.sendEmail({ to: email, subject, html, text });
    await this.logDelivery({ userId, recipientEmail: email, emailType: 'ALUMNI_VERIFICATION_APPROVED', templateName: 'alumniApproved', subject, result });
    return result;
  }

  /**
   * 11. Send Alumni Account Rejected Email
   */
  async sendAlumniRejectedEmail(email, name, rejectionReason = null, userId = null) {
    const { subject, html, text } = getAlumniRejectedTemplate({ name, rejectionReason });
    const result = await this.provider.sendEmail({ to: email, subject, html, text });
    await this.logDelivery({ userId, recipientEmail: email, emailType: 'ALUMNI_VERIFICATION_REJECTED', templateName: 'alumniRejected', subject, result });
    return result;
  }

  /**
   * 12. Send Alumni Registration Request Received Confirmation Email to Applicant
   */
  async sendAlumniRegistrationReceivedEmail(email, name, userId = null) {
    const { subject, html, text } = getAlumniRegistrationReceivedTemplate({ name });
    const result = await this.provider.sendEmail({ to: email, subject, html, text });
    await this.logDelivery({ userId, recipientEmail: email, emailType: 'ALUMNI_REGISTRATION_RECEIVED', templateName: 'alumniRegistrationReceived', subject, result });
    return result;
  }

  /**
   * 7. Send Platform Notification (Integrates with Settings toggles)
   */
  async sendPlatformNotification(recipientId, eventType, data = {}) {
    // Fetch user settings and email address
    const userRes = await db.query('SELECT email FROM users WHERE id = $1 AND account_status = $2', [recipientId, 'ACTIVE']);
    if (userRes.rows.length === 0) return null;
    const recipientEmail = userRes.rows[0].email;

    const settingsRes = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [recipientId]);
    const settings = settingsRes.rows[0] || {};

    // Check if general email_notifications is enabled
    if (settings.email_notifications === false) {
      return null; // User disabled email notifications
    }

    // Check category specific toggle
    if (eventType === 'CONNECTION_REQUEST' && settings.connection_request_notifications === false) return null;
    if (eventType === 'MESSAGE' && settings.message_notifications === false) return null;
    if (eventType === 'JOB' && settings.job_notifications === false) return null;
    if (eventType === 'EVENT' && settings.event_notifications === false) return null;
    if (eventType === 'MENTORSHIP' && settings.mentorship_notifications === false) return null;

    const { subject, html, text } = getPlatformNotificationTemplate({
      recipientName: data.recipientName,
      actorName: data.actorName,
      title: data.title || 'New Notification on JU Connect',
      message: data.message || 'You have new activity on JU Connect.',
      entityType: data.entityType,
      entityId: data.entityId,
    });

    const result = await this.provider.sendEmail({ to: recipientEmail, subject, html, text });
    await this.logDelivery({ userId: recipientId, recipientEmail, emailType: eventType, templateName: 'platformNotification', subject, result });
    return result;
  }

  /**
   * 13. Send Announcement Broadcast Email to targeted recipient
   */
  async sendAnnouncementBroadcastEmail(recipientEmail, userId = null, announcementData = {}) {
    const title = announcementData.title || 'Official Announcement from JU Connect';
    const message = announcementData.message || '';
    const recipientName = announcementData.recipientName || 'Community Member';
    const type = announcementData.type || 'SYSTEM';

    const subject = `[JU Connect Official] ${title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="background-color: #991b1b; padding: 15px; border-radius: 6px 6px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">JU Connect Official Announcement</h1>
        </div>
        <div style="padding: 20px; color: #1e293b; line-height: 1.6;">
          <p>Hello <strong>${recipientName}</strong>,</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #991b1b; padding: 15px; margin: 15px 0;">
            <h2 style="margin-top: 0; color: #0f172a; font-size: 16px;">${title}</h2>
            <p style="margin-bottom: 0; white-space: pre-wrap; font-size: 14px;">${message}</p>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
            This is an official institutional broadcast sent from the Directorate of Alumni Relations at JECRC University.
          </p>
        </div>
      </div>
    `;
    const text = `JU Connect Official Announcement\n\nHello ${recipientName},\n\n${title}\n\n${message}\n\n-- Directorate of Alumni Relations`;

    const result = await this.provider.sendEmail({ to: recipientEmail, subject, html, text });
    await this.logDelivery({
      userId,
      recipientEmail,
      emailType: 'SYSTEM_ANNOUNCEMENT',
      templateName: 'announcementBroadcast',
      subject,
      result,
    });
    return result;
  }
}

module.exports = new EmailService();
