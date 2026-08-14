const https = require('https');
const EmailProvider = require('./EmailProvider');

class ResendEmailProvider extends EmailProvider {
  constructor(config = {}) {
    super();
    this.name = 'Resend';
    this.apiKey = config.apiKey || process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY;
    this.fromAddress = process.env.EMAIL_FROM || 'no-reply@jecrc.ac.in';
    this.fromName = process.env.EMAIL_FROM_NAME || 'JU Connect Alumni Network';
  }

  async sendEmail(options) {
    if (!this.apiKey) {
      console.log(`[RESEND DEV SIMULATION] To: ${options.to} | Subject: ${options.subject}`);
      return {
        success: true,
        messageId: `resend_sim_${Date.now()}`,
        provider: 'RESEND_SIMULATED',
      };
    }

    const payload = JSON.stringify({
      from: `${this.fromName} <${this.fromAddress}>`,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo || process.env.EMAIL_REPLY_TO,
    });

    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'api.resend.com',
          port: 443,
          path: '/emails',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                resolve({ success: true, messageId: parsed.id, provider: 'RESEND' });
              } catch (e) {
                resolve({ success: true, messageId: 'resend_ok', provider: 'RESEND' });
              }
            } else {
              resolve({ success: false, error: `Resend API Error HTTP ${res.statusCode}: ${data}`, provider: 'RESEND' });
            }
          });
        }
      );

      req.on('error', (err) => {
        resolve({ success: false, error: err.message, provider: 'RESEND' });
      });

      req.write(payload);
      req.end();
    });
  }
}

module.exports = ResendEmailProvider;
