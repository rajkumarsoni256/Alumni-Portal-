const SMTPEmailProvider = require('./SMTPEmailProvider');
const ResendEmailProvider = require('./ResendEmailProvider');
const SendGridEmailProvider = require('./SendGridEmailProvider');
const ConsoleDevEmailProvider = require('./ConsoleDevEmailProvider');

class EmailProviderFactory {
  static getProvider() {
    const providerType = (process.env.EMAIL_PROVIDER || 'console').toLowerCase().trim();
    const mode = (process.env.EMAIL_MODE || 'development').toLowerCase().trim();

    if (mode === 'development' && providerType === 'console') {
      return new ConsoleDevEmailProvider();
    }

    switch (providerType) {
      case 'smtp':
        return new SMTPEmailProvider();
      case 'resend':
        return new ResendEmailProvider();
      case 'sendgrid':
        return new SendGridEmailProvider();
      case 'console':
      default:
        return new ConsoleDevEmailProvider();
    }
  }
}

module.exports = EmailProviderFactory;
