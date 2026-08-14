const https = require('https');
const EmailProvider = require('./EmailProvider');

class SendGridEmailProvider extends EmailProvider {
  constructor(config = {}) {
    super();
    this.name = 'SendGrid';
    this.apiKey = config.apiKey || process.env.EMAIL_API_KEY || process.env.SENDGRID_API_KEY;
    this.fromAddress = process.env.EMAIL_FROM || 'no-reply@jecrc.ac.in';
    this.fromName = process.env.EMAIL_FROM_NAME || 'JU Connect Alumni Network';
  }

  async sendEmail(options) {
    if (!this.apiKey) {
      console.log(`[SENDGRID DEV SIMULATION] To: ${options.to} | Subject: ${options.subject}`);
      return {
        success: true,
        messageId: `sendgrid_sim_${Date.now()}`,
        provider: 'SENDGRID_SIMULATED',
      };
    }

    const payload = JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: this.fromAddress, name: this.fromName },
      subject: options.subject,
      content: [
        { type: 'text/plain', value: options.text || options.subject },
        { type: 'text/html', value: options.html },
      ],
    });

    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'api.sendgrid.com',
          port: 443,
          path: '/v3/mail/send',
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
              const msgId = res.headers['x-message-id'] || `sg_${Date.now()}`;
              resolve({ success: true, messageId: msgId, provider: 'SENDGRID' });
            } else {
              resolve({ success: false, error: `SendGrid API Error HTTP ${res.statusCode}: ${data}`, provider: 'SENDGRID' });
            }
          });
        }
      );

      req.on('error', (err) => {
        resolve({ success: false, error: err.message, provider: 'SENDGRID' });
      });

      req.write(payload);
      req.end();
    });
  }
}

module.exports = SendGridEmailProvider;
