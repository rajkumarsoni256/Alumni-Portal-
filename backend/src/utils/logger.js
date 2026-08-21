const { AsyncLocalStorage } = require('async_hooks');

const requestStorage = new AsyncLocalStorage();

const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'password_hash',
  'jwt',
  'token',
  'secret',
  'authorization',
  'smtp_password',
  'cloudinary_api_secret',
  'code_hash',
  'cookie',
];

/**
 * Recursively sanitize objects to prevent leaking secrets in logs
 */
const redactSecrets = (data) => {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactSecrets(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSecrets(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Get active Request ID or fallback to [SYS]
 */
const getReqPrefix = () => {
  const store = requestStorage.getStore();
  if (store && store.reqId) {
    return `[REQ:${store.reqId}]`;
  }
  return `[SYS]`;
};

const formatCategory = (cat) => `[${String(cat || 'APP').toUpperCase()}]`;

class Logger {
  constructor() {
    this.requestStorage = requestStorage;
  }

  info(category, message, details = null) {
    const prefix = `${getReqPrefix()} ${formatCategory(category)}`;
    if (details) {
      console.log(`${prefix} ${message}`, redactSecrets(details));
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  success(category, message, details = null) {
    const prefix = `${getReqPrefix()} ${formatCategory(category)}`;
    if (details) {
      console.log(`${prefix} SUCCESS: ${message}`, redactSecrets(details));
    } else {
      console.log(`${prefix} SUCCESS: ${message}`);
    }
  }

  warn(category, message, details = null) {
    const prefix = `${getReqPrefix()} ${formatCategory(category)}`;
    if (details) {
      console.warn(`${prefix} WARN: ${message}`, redactSecrets(details));
    } else {
      console.warn(`${prefix} WARN: ${message}`);
    }
  }

  error(category, message, error = null) {
    const prefix = `${getReqPrefix()} ${formatCategory(category)}`;
    const errDetails = error
      ? { message: error.message, code: error.errorCode || error.code, stack: error.stack }
      : null;

    console.error(`${prefix} ERROR: ${message}`, errDetails ? redactSecrets(errDetails) : '');
  }

  /**
   * Format structured key-value block in console logs
   */
  block(category, title, kvMap = {}) {
    const reqPrefix = getReqPrefix();
    const catStr = formatCategory(category);
    console.log(`\n============================================================`);
    console.log(`${reqPrefix} ${catStr} ${String(title).toUpperCase()}`);
    console.log(`============================================================`);

    const sanitizedMap = redactSecrets(kvMap);
    for (const [key, value] of Object.entries(sanitizedMap)) {
      const formattedKey = `${catStr} ${key}`.padEnd(28, ' ');
      let valStr = value;
      if (typeof value === 'object' && value !== null) {
        valStr = JSON.stringify(value);
      }
      console.log(`${reqPrefix} ${formattedKey}: ${valStr}`);
    }
    console.log(`============================================================\n`);
  }

  /**
   * Controlled OTP logger (enabled unless LOG_OTP === 'false')
   */
  logOTP({ email, purpose, code, expiresMinutes = 10 }) {
    if (process.env.LOG_OTP === 'false') {
      this.info('OTP', `OTP generated for ${email} (Logging suppressed by LOG_OTP=false)`);
      return;
    }

    this.block('OTP', 'VERIFICATION CODE DISPATCH', {
      User: email,
      Purpose: purpose,
      'OTP Code': code,
      Expires: `${expiresMinutes} minutes`,
      Status: 'ACTIVE',
    });
  }
}

const logger = new Logger();
logger.logger = logger;
logger.debug = logger.info.bind(logger);
logger.requestStorage = requestStorage;

module.exports = logger;
