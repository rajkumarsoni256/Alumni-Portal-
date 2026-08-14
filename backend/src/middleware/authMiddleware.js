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
    next();
  } catch (err) {
    console.warn('Invalid or expired JWT token:', err.message);
    return errorResponse(res, 'Full authentication is required to access this resource', 'UNAUTHORIZED', 401);
  }
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
  requireAdmin,
};
