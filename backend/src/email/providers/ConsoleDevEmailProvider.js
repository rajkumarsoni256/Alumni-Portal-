const EmailProvider = require('./EmailProvider');

class ConsoleDevEmailProvider extends EmailProvider {
  constructor() {
    super();
    this.name = 'Console';
  }

  async sendEmail(options) {
    const msgId = `console_dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    console.log('\n======================================================');
    console.log(`[EMAIL DISPATCH :: LOCAL CONSOLE DEV ADAPTER]`);
    console.log(`TO      : ${options.to}`);
    console.log(`SUBJECT : ${options.subject}`);
    console.log(`ID      : ${msgId}`);
    if (options.text) {
      console.log('------------------ PLAIN TEXT BODY -------------------');
      console.log(options.text.trim());
    }
    console.log('======================================================\n');

    return {
      success: true,
      messageId: msgId,
      provider: 'CONSOLE_DEV',
    };
  }
}

module.exports = ConsoleDevEmailProvider;
