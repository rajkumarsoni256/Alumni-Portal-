const crypto = require('crypto');
const { logger, requestStorage } = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const reqId = crypto.randomBytes(3).toString('hex').toUpperCase();
  req.id = reqId;

  const startTime = Date.now();
  const store = { reqId, startTime };

  requestStorage.run(store, () => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const method = req.method;
    const url = req.originalUrl || req.url;

    // Log request start for non-health routes
    if (!url.includes('/health') && !url.includes('/actuator')) {
      logger.info('HTTP', `${method} ${url} from ${ip}`);
    }

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const userStr = req.user ? `User: ${req.user.email || req.user.id} [${req.user.role || 'USER'}]` : 'Guest';

      if (!url.includes('/health') && !url.includes('/actuator')) {
        if (statusCode >= 400) {
          logger.warn('HTTP', `${method} ${url} -> ${statusCode} (${duration}ms) | ${userStr}`);
        } else {
          logger.success('HTTP', `${method} ${url} -> ${statusCode} (${duration}ms) | ${userStr}`);
        }
      }
    });

    next();
  });
};

module.exports = requestLogger;
