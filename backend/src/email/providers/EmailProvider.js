/**
 * Abstract Email Provider Interface
 */
class EmailProvider {
  /**
   * Send an email payload
   * @param {Object} options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject line
   * @param {string} options.html - HTML rendered content
   * @param {string} [options.text] - Plain text fallback content
   * @param {string} [options.from] - Sender address override
   * @param {string} [options.replyTo] - Reply-to address
   * @param {Object} [options.metadata] - Delivery metadata
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendEmail(options) {
    throw new Error('sendEmail() method must be implemented by concrete EmailProvider subclass');
  }
}

module.exports = EmailProvider;
