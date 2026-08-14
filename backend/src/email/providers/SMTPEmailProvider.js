const nodemailer = require('nodemailer');
const EmailProvider = require('./EmailProvider');

class SMTPEmailProvider extends EmailProvider {
  constructor(config = {}) {
    super();
    this.name = 'SMTP';

    const providerType = (process.env.EMAIL_PROVIDER || 'console').toLowerCase().trim();
    const host = config.host || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(config.port || process.env.SMTP_PORT || '587', 10);
    const secure = config.secure !== undefined ? config.secure : (port === 465);
    const user = config.user || process.env.SMTP_USER;
    const pass = config.password || process.env.SMTP_PASSWORD;

    this.fromAddress = process.env.EMAIL_FROM || 'no-reply@jecrc.ac.in';
    this.fromName = process.env.EMAIL_FROM_NAME || 'JU Connect Alumni Network';
    this.replyTo = process.env.EMAIL_REPLY_TO || this.fromAddress;

    // Strict validation when SMTP is explicitly configured as EMAIL_PROVIDER
    if (providerType === 'smtp') {
      const missingVars = [];
      if (!config.host && !process.env.SMTP_HOST) missingVars.push('SMTP_HOST');
      if (!config.port && !process.env.SMTP_PORT) missingVars.push('SMTP_PORT');
      if (!config.user && !process.env.SMTP_USER) missingVars.push('SMTP_USER');
      if (!config.password && !process.env.SMTP_PASSWORD) missingVars.push('SMTP_PASSWORD');
      if (!process.env.EMAIL_FROM) missingVars.push('EMAIL_FROM');

      if (missingVars.length > 0) {
        const errMsg = `[SMTPEmailProvider Configuration Error] Missing required SMTP environment variables: ${missingVars.join(', ')}. Credentials must be set when EMAIL_PROVIDER=smtp.`;
        console.error(errMsg);
        throw new Error(errMsg);
      }
    }

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure, // false for 587 (STARTTLS), true for 465
        auth: { user, pass },
        connectionTimeout: 3000,
        socketTimeout: 3000,
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });
    } else {
      console.warn('[SMTPEmailProvider] Warning: SMTP credentials missing in process.env. Using fallback transport simulation.');
      this.transporter = null;
    }
  }

  /**
   * Send transactional email safely via Nodemailer SMTP
   */
  async sendEmail(options = {}) {
    const fromStr = `"${this.fromName}" <${this.fromAddress}>`;

    if (!this.transporter) {
      console.log(`[SMTP DEV SIMULATION] To: ${options.to} | Subject: ${options.subject}`);
      return {
        success: true,
        messageId: `smtp_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        provider: 'SMTP_SIMULATED',
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: fromStr,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || this.replyTo,
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: 'SMTP',
      };
    } catch (err) {
      // Sanitize errors so passwords/headers are NEVER leaked in logs or error objects
      const sanitizedError = String(err.message || 'SMTP Email Dispatch Failed')
        .replace(new RegExp(process.env.SMTP_PASSWORD || 'SecretPasswordPlaceholder', 'g'), '***REDACTED***')
        .replace(new RegExp(process.env.SMTP_USER || 'SecretUserPlaceholder', 'g'), '***REDACTED***');

      console.error('[SMTPEmailProvider Error]', sanitizedError);
      return {
        success: false,
        error: sanitizedError,
        provider: 'SMTP',
      };
    }
  }
}

module.exports = SMTPEmailProvider;
