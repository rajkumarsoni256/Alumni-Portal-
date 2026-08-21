const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { errorResponse } = require('../utils/response');

// 1. In-Memory Maintenance Mode Cache (Refresh every 30 seconds)
let maintenanceModeCache = { value: false, lastFetched: 0 };
const getMaintenanceMode = async () => {
  const now = Date.now();
  if (now - maintenanceModeCache.lastFetched < 30000) {
    return maintenanceModeCache.value;
  }
  try {
    const maintRes = await db.query(`SELECT maintenance_mode FROM system_settings WHERE id = 'default'`);
    const isMaint = maintRes.rows.length > 0 && maintRes.rows[0].maintenance_mode === true;
    maintenanceModeCache = { value: isMaint, lastFetched: now };
    return isMaint;
  } catch {
    return maintenanceModeCache.value;
  }
};

// 2. In-Memory User Auth Cache (TTL = 30 seconds per user ID)
const userAuthCache = new Map();
const getUserAuthRecord = async (userId) => {
  const now = Date.now();
  const cached = userAuthCache.get(userId);
  if (cached && (now - cached.timestamp < 30000)) {
    return cached.user;
  }

  const userResult = await db.query(
    'SELECT id, email, role, account_status, email_verified FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) return null;
  const user = userResult.rows[0];
  userAuthCache.set(userId, { user, timestamp: now });
  return user;
};

const invalidateUserAuthCache = (userId) => {
  if (userId) {
    userAuthCache.delete(userId);
  } else {
    userAuthCache.clear();
  }
};

// Throttled last_seen_at update tracker (max once per 5 minutes per user)
const lastSeenTracker = new Map();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return errorResponse(res, 'Full authentication is required to access this resource', 'UNAUTHORIZED', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970');
    const userId = decoded.sub || decoded.id;

    const user = await getUserAuthRecord(userId);
    if (!user) {
      return errorResponse(res, 'User associated with token no longer exists', 'UNAUTHORIZED', 401);
    }

    if (user.account_status !== 'ACTIVE') {
      return errorResponse(res, 'Account is disabled. Please contact support.', 'ACCOUNT_DISABLED', 401);
    }

    req.user = user;

    // Throttled asynchronous presence timestamp update (max 1 DB update per 5 minutes per user)
    const now = Date.now();
    const lastUpdate = lastSeenTracker.get(user.id) || 0;
    if (now - lastUpdate > 300000) {
      lastSeenTracker.set(user.id, now);
      db.query('UPDATE user_profiles SET last_seen_at = NOW() WHERE user_id = $1', [user.id]).catch(() => {});
    }

    // Check system maintenance mode using cached value
    const role = user.role ? String(user.role).trim().toUpperCase() : '';
    if (role !== 'ADMIN') {
      const isMaintenance = await getMaintenanceMode();
      if (isMaintenance) {
        return errorResponse(
          res,
          'JU Connect is currently undergoing scheduled maintenance. Please check back shortly.',
          'MAINTENANCE_MODE_ACTIVE',
          503
        );
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
    const userId = decoded.sub || decoded.id;
    const user = await getUserAuthRecord(userId);
    if (user && user.account_status === 'ACTIVE') {
      req.user = user;
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
  invalidateUserAuthCache,
};

