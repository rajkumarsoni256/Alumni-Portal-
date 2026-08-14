const nodemailer = require('nodemailer');
const EmailProvider = require('./EmailProvider');

class SMTPEmailProvider extends EmailProvider {
  constructor(config = {}) {
    super();
    this.name = 'SMTP';
    const host = config.host || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(config.port || process.env.SMTP_PORT || '587', 10);
    const secure = config.secure !== undefined ? config.secure : (port === 465);
    const user = config.user || process.env.SMTP_USER;
    const pass = config.password || process.env.SMTP_PASSWORD;

    this.fromAddress = process.env.EMAIL_FROM || 'no-reply@jecrc.ac.in';
    this.fromName = process.env.EMAIL_FROM_NAME || 'JU Connect Alumni Network';

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    } else {
      console.warn('[SMTPEmailProvider] Warning: SMTP credentials missing in process.env. Using fallback transport.');
      this.transporter = null;
    }
  }

  async sendEmail(options) {
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
        replyTo: options.replyTo || process.env.EMAIL_REPLY_TO || this.fromAddress,
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: 'SMTP',
      };
    } catch (err) {
      console.error('[SMTPEmailProvider Error]', err.message);
      return {
        success: false,
        error: err.message,
        provider: 'SMTP',
      };
    }
  }
}

module.exports = SMTPEmailProvider;
