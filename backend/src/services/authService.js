const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const googleAuthService = require('./googleAuthService');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

const normalizeEmail = (email) => {
  return email ? email.trim().toLowerCase() : '';
};

const generateToken = (userId, role) => {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

const register = async ({ name, email, password, role }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!role || typeof role !== 'string') {
    const error = new Error('Invalid role specified. Allowed roles: STUDENT, ALUMNI');
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }

  const upperRole = role.trim().toUpperCase();
  if (upperRole === 'ADMIN') {
    const error = new Error('Public registration for ADMIN role is strictly forbidden');
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }

  if (upperRole !== 'STUDENT' && upperRole !== 'ALUMNI') {
    const error = new Error('Invalid role specified. Allowed roles: STUDENT, ALUMNI');
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    throw error;
  }

  // Check existing user
  const existingResult = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existingResult.rows.length > 0) {
    const error = new Error(`An account with email '${normalizedEmail}' already exists`);
    error.statusCode = 409;
    error.errorCode = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const userResult = await db.query(
    `INSERT INTO users (id, email, password_hash, role, email_verified, account_status)
     VALUES ($1, $2, $3, $4, false, 'ACTIVE')
     RETURNING id, email, role, email_verified, account_status`,
    [userId, normalizedEmail, passwordHash, upperRole]
  );
  const user = userResult.rows[0];

  // Create initial profile
  await db.query(
    `INSERT INTO user_profiles (id, user_id, full_name, is_profile_complete)
     VALUES ($1, $2, $3, false)`,
    [crypto.randomUUID(), user.id, name ? name.trim() : normalizedEmail.split('@')[0]]
  );

  // Generate 6-digit OTP code
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.query(
    `INSERT INTO email_verification_tokens (id, user_id, token, expires_at, used)
     VALUES ($1, $2, $3, $4, false)`,
    [crypto.randomUUID(), user.id, verificationCode, expiresAt]
  );

  console.log(`[DEV EMAIL SERVICE] Sending Email Verification Code to [${user.email}] | Code: [${verificationCode}]`);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: name ? name.trim() : null,
    profileComplete: false,
  };
};

const verifyEmail = async ({ email, code }) => {
  const normalizedEmail = normalizeEmail(email);

  const userResult = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (userResult.rows.length === 0) {
    const error = new Error(`User not found with email: '${normalizedEmail}'`);
    error.statusCode = 404;
    error.errorCode = 'RESOURCE_NOT_FOUND';
    throw error;
  }
  const user = userResult.rows[0];

  const tokenResult = await db.query(
    `SELECT id, expires_at, used FROM email_verification_tokens
     WHERE user_id = $1 AND token = $2 AND used = false`,
    [user.id, code ? code.trim() : '']
  );

  if (tokenResult.rows.length === 0) {
    const error = new Error('Invalid or expired email verification code');
    error.statusCode = 400;
    error.errorCode = 'INVALID_TOKEN';
    throw error;
  }

  const tokenRecord = tokenResult.rows[0];
  if (new Date(tokenRecord.expires_at) < new Date()) {
    const error = new Error('Email verification code has expired. Please request a new code.');
    error.statusCode = 400;
    error.errorCode = 'TOKEN_EXPIRED';
    throw error;
  }

  await db.query('UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1', [user.id]);
  await db.query('UPDATE email_verification_tokens SET used = true WHERE id = $1', [tokenRecord.id]);
};

const login = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const userResult = await db.query(
    `SELECT u.id, u.email, u.password_hash, u.role, u.email_verified, u.account_status,
            p.full_name, p.avatar_url, p.is_profile_complete
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.email = $1`,
    [normalizedEmail]
  );

  if (userResult.rows.length === 0) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  const user = userResult.rows[0];

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (user.account_status !== 'ACTIVE') {
    const error = new Error('Account is disabled. Please contact support.');
    error.statusCode = 401;
    error.errorCode = 'ACCOUNT_DISABLED';
    throw error;
  }

  if (!user.email_verified) {
    const error = new Error('Please verify your email before logging in');
    error.statusCode = 403;
    error.errorCode = 'EMAIL_NOT_VERIFIED';
    throw error;
  }

  const token = generateToken(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || null,
      avatarUrl: user.avatar_url || null,
      profileComplete: !!user.is_profile_complete,
    },
    token,
  };
};

const authenticateWithGoogle = async ({ idToken }) => {
  const payload = await googleAuthService.verifyIdToken(idToken);
  const googleSub = payload.subjectId;
  const normalizedEmail = normalizeEmail(payload.email);

  // 1. Check existing OAuth account mapping
  const oauthResult = await db.query(
    `SELECT u.id, u.email, u.role, u.account_status, p.full_name, p.is_profile_complete
     FROM oauth_accounts oa
     JOIN users u ON oa.user_id = u.id
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE oa.provider = 'GOOGLE' AND oa.provider_user_id = $1`,
    [googleSub]
  );

  let user;
  if (oauthResult.rows.length > 0) {
    user = oauthResult.rows[0];
    if (user.account_status !== 'ACTIVE') {
      const error = new Error('Account is disabled. Please contact support.');
      error.statusCode = 401;
      error.errorCode = 'ACCOUNT_DISABLED';
      throw error;
    }
  } else {
    // 2. Check if a user with the same email already exists
    const existingUserResult = await db.query(
      `SELECT u.id, u.email, u.role, u.account_status, p.full_name, p.is_profile_complete
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.email = $1`,
      [normalizedEmail]
    );

    if (existingUserResult.rows.length > 0) {
      const existingUser = existingUserResult.rows[0];
      if (existingUser.account_status !== 'ACTIVE') {
        const error = new Error('Account is disabled. Please contact support.');
        error.statusCode = 401;
        error.errorCode = 'ACCOUNT_DISABLED';
        throw error;
      }

      // Link Google OAuth account to existing user
      await db.query(
        `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id)
         VALUES ($1, $2, 'GOOGLE', $3)
         ON CONFLICT (provider, provider_user_id) DO NOTHING`,
        [crypto.randomUUID(), existingUser.id, googleSub]
      );

      // Verify email since Google verified it
      await db.query('UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1', [existingUser.id]);

      user = existingUser;
    } else {
      // 3. Register new Google user (Role: STUDENT, email_verified: true)
      const newUserId = crypto.randomUUID();
      const randomHash = await bcrypt.hash(crypto.randomUUID(), 10);
      const newUserResult = await db.query(
        `INSERT INTO users (id, email, password_hash, role, email_verified, account_status)
         VALUES ($1, $2, $3, 'STUDENT', true, 'ACTIVE')
         RETURNING id, email, role`,
        [newUserId, normalizedEmail, randomHash]
      );
      const newUser = newUserResult.rows[0];

      await db.query(
        `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id)
         VALUES ($1, $2, 'GOOGLE', $3)`,
        [crypto.randomUUID(), newUser.id, googleSub]
      );

      const newProfileResult = await db.query(
        `INSERT INTO user_profiles (id, user_id, full_name, avatar_url, is_profile_complete)
         VALUES ($1, $2, $3, $4, false)
         RETURNING full_name, is_profile_complete`,
        [crypto.randomUUID(), newUser.id, payload.name, payload.pictureUrl]
      );

      const profile = newProfileResult.rows[0];
      user = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        full_name: profile.full_name,
        is_profile_complete: false,
      };
    }
  }

  const token = generateToken(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || null,
      profileComplete: !!user.is_profile_complete,
    },
    token,
  };
};

const forgotPassword = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  const userResult = await db.query('SELECT id, account_status FROM users WHERE email = $1', [normalizedEmail]);
  if (userResult.rows.length > 0) {
    const user = userResult.rows[0];
    if (user.account_status === 'ACTIVE') {
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await db.query(
        `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used)
         VALUES ($1, $2, $3, $4, false)`,
        [crypto.randomUUID(), user.id, resetToken, expiresAt]
      );

      console.log(`[DEV EMAIL SERVICE] Sending Password Reset Token to [${normalizedEmail}] | Token: [${resetToken}]`);
    }
  }

  return 'If an account exists for this email, password reset instructions have been sent';
};

const resetPassword = async ({ token, newPassword }) => {
  if (!token || !token.trim()) {
    const error = new Error('Invalid or unrecognized password reset token');
    error.statusCode = 400;
    error.errorCode = 'INVALID_TOKEN';
    throw error;
  }

  const tokenResult = await db.query(
    `SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1`,
    [token.trim()]
  );

  if (tokenResult.rows.length === 0) {
    const error = new Error('Invalid or unrecognized password reset token');
    error.statusCode = 400;
    error.errorCode = 'INVALID_TOKEN';
    throw error;
  }

  const tokenRecord = tokenResult.rows[0];
  if (tokenRecord.used) {
    const error = new Error('Password reset token has already been used');
    error.statusCode = 400;
    error.errorCode = 'INVALID_TOKEN';
    throw error;
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    const error = new Error('Password reset token has expired. Please request a new password reset.');
    error.statusCode = 400;
    error.errorCode = 'TOKEN_EXPIRED';
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, tokenRecord.user_id]);
  await db.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [tokenRecord.id]);
};

const getCurrentUser = async (user) => {
  const result = await db.query(
    `SELECT u.id, u.email, u.role, p.full_name, p.avatar_url, p.is_profile_complete
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.id = $1`,
    [user.id]
  );

  if (result.rows.length === 0) {
    const error = new Error(`User not found with id: '${user.id}'`);
    error.statusCode = 404;
    error.errorCode = 'RESOURCE_NOT_FOUND';
    throw error;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name || null,
    avatarUrl: row.avatar_url || null,
    profileComplete: !!row.is_profile_complete,
  };
};

module.exports = {
  register,
  verifyEmail,
  login,
  authenticateWithGoogle,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
