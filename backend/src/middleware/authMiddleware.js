const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { errorResponse } = require('../utils/response');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return errorResponse(res, 'Full authentication is required to access this resource', 'UNAUTHORIZED', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970');
    
    const userResult = await db.query('SELECT id, email, role, account_status, email_verified FROM users WHERE id = $1', [decoded.sub || decoded.id]);
    if (userResult.rows.length === 0) {
      return errorResponse(res, 'User associated with token no longer exists', 'UNAUTHORIZED', 401);
    }

    const user = userResult.rows[0];
    if (user.account_status !== 'ACTIVE') {
      return errorResponse(res, 'Account is disabled. Please contact support.', 'ACCOUNT_DISABLED', 401);
    }

    req.user = user;

    // Asynchronously update last_seen_at for online status
    db.query('UPDATE user_profiles SET last_seen_at = NOW() WHERE user_id = $1', [user.id]).catch(() => {});

    // Check system maintenance mode for non-admin users
    const role = user.role ? String(user.role).trim().toUpperCase() : '';
    if (role !== 'ADMIN') {
      try {
        const maintRes = await db.query(`SELECT maintenance_mode FROM system_settings WHERE id = 'default'`);
        if (maintRes.rows.length > 0 && maintRes.rows[0].maintenance_mode === true) {
          return errorResponse(
            res,
            'JU Connect is currently undergoing scheduled maintenance. Please check back shortly.',
            'MAINTENANCE_MODE_ACTIVE',
            503
          );
        }
      } catch (mErr) {
        // Fallthrough if settings table not yet initialized
      }
    }

    next();
  } catch (err) {
    console.warn('Invalid or expired JWT token:', err.message);
    return errorResponse(res, 'Full authentication is required to access this resource', 'UNAUTHORIZED', 401);
  }
};

const optionalAuthenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970');
    const userResult = await db.query('SELECT id, email, role, account_status, email_verified FROM users WHERE id = $1', [decoded.sub || decoded.id]);
    if (userResult.rows.length > 0 && userResult.rows[0].account_status === 'ACTIVE') {
      req.user = userResult.rows[0];
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Full authentication is required to access this resource', 'UNAUTHORIZED', 401);
  }
  const role = req.user.role ? String(req.user.role).trim().toUpperCase() : '';
  if (role !== 'ADMIN') {
    return errorResponse(res, 'Access denied. Administrative privileges are required.', 'FORBIDDEN', 403);
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  requireAdmin,
};

