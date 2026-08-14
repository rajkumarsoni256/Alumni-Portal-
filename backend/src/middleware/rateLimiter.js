const { errorResponse } = require('../utils/response');

const hits = new Map();

// Periodic cleanup of expired rate limit windows every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of hits.entries()) {
    if (now - record.startTime > 300000) {
      hits.delete(key);
    }
  }
}, 300000);

/**
 * Rate Limiter Middleware
 * @param {Object} options Configuration options
 * @param {number} options.windowMs Time window in milliseconds (default 1 min)
 * @param {number} options.max Max requests per window per IP (default 20)
 * @param {string} options.message Custom error message
 */
const createRateLimiter = ({
  windowMs = 60000,
  max = 20,
  message = 'Too many requests. Please slow down and try again later.'
} = {}) => {
  return (req, res, next) => {
    // Skip rate limiting in automated test environment if desired
    if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true') {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = hits.get(key) || { count: 0, startTime: now };

    if (now - record.startTime > windowMs) {
      record.count = 1;
      record.startTime = now;
    } else {
      record.count += 1;
    }

    hits.set(key, record);

    if (record.count > max) {
      return errorResponse(res, message, 'TOO_MANY_REQUESTS', 429);
    }

    next();
  };
};

const authRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  max: 15,
  message: 'Too many authentication attempts. Please wait a minute before trying again.'
});

module.exports = {
  createRateLimiter,
  authRateLimiter
};
