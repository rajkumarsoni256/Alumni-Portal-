const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { logAdminAction, AUDIT_ACTIONS } = require('./adminAuditService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_SETTING_KEYS = [
  'platformName',
  'supportEmail',
  'registrationEnabled',
  'alumniVerificationEnabled',
  'maintenanceMode',
  'name',
  'email',
  'currentPassword',
  'newPassword',
];

/**
 * Get current system settings and authenticated admin profile details
 */
const getSettings = async (adminUserId) => {
  // Ensure default system_settings row exists
  const settingsRes = await db.query(
    `SELECT 
        platform_name AS "platformName",
        support_email AS "supportEmail",
        registration_enabled AS "registrationEnabled",
        alumni_verification_enabled AS "alumniVerificationEnabled",
        maintenance_mode AS "maintenanceMode",
        updated_at AS "updatedAt"
     FROM system_settings 
     WHERE id = 'default'`
  );

  const defaultSettings = {
    platformName: 'JECRC Community Platform',
    supportEmail: 'alumni@jecrc.ac.in',
    registrationEnabled: true,
    alumniVerificationEnabled: true,
    maintenanceMode: false,
    updatedAt: new Date().toISOString(),
  };

  const currentSettings = settingsRes.rows.length > 0 ? settingsRes.rows[0] : defaultSettings;

  // Retrieve admin profile info
  let adminProfile = {
    id: adminUserId,
    name: 'Dean of Alumni Relations',
    email: 'admin@jecrc.ac.in',
  };

  if (adminUserId) {
    const adminRes = await db.query(
      `SELECT u.id, u.email, p.full_name AS "name"
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [adminUserId]
    );

    if (adminRes.rows.length > 0) {
      adminProfile = {
        id: adminRes.rows[0].id,
        name: adminRes.rows[0].name || 'Administrator',
        email: adminRes.rows[0].email,
      };
    }
  }

  return {
    ...currentSettings,
    adminProfile,
  };
};

/**
 * Update system settings, admin profile, and credentials in a single atomic transaction
 */
const updateSettings = async (adminUserId, payload = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    const error = new Error('Request payload must be a valid JSON object.');
    error.statusCode = 400;
    error.errorCode = 'INVALID_PAYLOAD';
    throw error;
  }

  // 1. Strict unknown fields check
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_SETTING_KEYS.includes(key)) {
      const error = new Error(`Unrecognized setting property: '${key}'. Unknown properties are not permitted.`);
      error.statusCode = 400;
      error.errorCode = 'INVALID_SETTING_PROPERTY';
      throw error;
    }
  }

  const {
    platformName,
    supportEmail,
    registrationEnabled,
    alumniVerificationEnabled,
    maintenanceMode,
    name,
    email,
    currentPassword,
    newPassword,
  } = payload;

  // 2. Validate global settings
  if (platformName !== undefined) {
    if (typeof platformName !== 'string' || platformName.trim().length === 0 || platformName.length > 150) {
      const error = new Error('platformName must be a non-empty string under 150 characters.');
      error.statusCode = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }
  }

  if (supportEmail !== undefined) {
    if (typeof supportEmail !== 'string' || !EMAIL_REGEX.test(supportEmail.trim()) || supportEmail.length > 255) {
      const error = new Error('supportEmail must be a valid email address.');
      error.statusCode = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }
  }

  if (registrationEnabled !== undefined && typeof registrationEnabled !== 'boolean') {
    const error = new Error('registrationEnabled must be a boolean value.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  if (alumniVerificationEnabled !== undefined && typeof alumniVerificationEnabled !== 'boolean') {
    const error = new Error('alumniVerificationEnabled must be a boolean value.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  if (maintenanceMode !== undefined && typeof maintenanceMode !== 'boolean') {
    const error = new Error('maintenanceMode must be a boolean value.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  // 3. Validate profile settings
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 150) {
      const error = new Error('Administrator name must be a non-empty string under 150 characters.');
      error.statusCode = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.length > 255) {
      const error = new Error('Admin email must be a valid email address.');
      error.statusCode = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }
  }

  // 4. Validate password changes
  if (currentPassword !== undefined || newPassword !== undefined) {
    if (!currentPassword || !newPassword) {
      const error = new Error('Both currentPassword and newPassword are required to update credentials.');
      error.statusCode = 400;
      error.errorCode = 'PASSWORD_REQUIRED';
      throw error;
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      const error = new Error('New password must be at least 6 characters in length.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_PASSWORD_LENGTH';
      throw error;
    }
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Retrieve existing global settings for audit trail
    const prevSettingsRes = await client.query(
      `SELECT * FROM system_settings WHERE id = 'default' FOR UPDATE`
    );
    const prevSettings = prevSettingsRes.rows[0] || {};

    const changedFields = [];
    const updates = [];
    const params = [];
    let pIdx = 1;

    if (platformName !== undefined) {
      updates.push(`platform_name = $${pIdx++}`);
      params.push(platformName.trim());
      changedFields.push('platformName');
    }

    if (supportEmail !== undefined) {
      updates.push(`support_email = $${pIdx++}`);
      params.push(supportEmail.trim().toLowerCase());
      changedFields.push('supportEmail');
    }

    if (registrationEnabled !== undefined) {
      updates.push(`registration_enabled = $${pIdx++}`);
      params.push(registrationEnabled);
      changedFields.push('registrationEnabled');
    }

    if (alumniVerificationEnabled !== undefined) {
      updates.push(`alumni_verification_enabled = $${pIdx++}`);
      params.push(alumniVerificationEnabled);
      changedFields.push('alumniVerificationEnabled');
    }

    if (maintenanceMode !== undefined) {
      updates.push(`maintenance_mode = $${pIdx++}`);
      params.push(maintenanceMode);
      changedFields.push('maintenanceMode');
    }

    if (updates.length > 0) {
      updates.push(`updated_by = $${pIdx++}`);
      params.push(adminUserId);
      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      await client.query(
        `UPDATE system_settings SET ${updates.join(', ')} WHERE id = 'default'`,
        params
      );
    }

    // Update Admin Profile
    if (name !== undefined) {
      await client.query(
        `INSERT INTO user_profiles (user_id, full_name, is_profile_complete, updated_at)
         VALUES ($1, $2, TRUE, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id)
         DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = CURRENT_TIMESTAMP`,
        [adminUserId, name.trim()]
      );
      changedFields.push('name');
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      // Check if email already used by another user
      const emailCheck = await client.query(
        `SELECT id FROM users WHERE email = $1 AND id != $2`,
        [normalizedEmail, adminUserId]
      );
      if (emailCheck.rows.length > 0) {
        const error = new Error(`Email '${normalizedEmail}' is already in use.`);
        error.statusCode = 409;
        error.errorCode = 'EMAIL_ALREADY_EXISTS';
        throw error;
      }
      await client.query(`UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
        normalizedEmail,
        adminUserId,
      ]);
      changedFields.push('email');
    }

    // Update Admin Password if requested
    if (currentPassword && newPassword) {
      const userRes = await client.query(`SELECT password_hash FROM users WHERE id = $1`, [adminUserId]);
      if (userRes.rows.length === 0) {
        const error = new Error('Admin user record not found.');
        error.statusCode = 404;
        error.errorCode = 'USER_NOT_FOUND';
        throw error;
      }

      const isValidPassword = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
      if (!isValidPassword) {
        const error = new Error('Current password entered is incorrect.');
        error.statusCode = 400;
        error.errorCode = 'INVALID_CREDENTIALS';
        throw error;
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await client.query(`UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
        newPasswordHash,
        adminUserId,
      ]);
      changedFields.push('password');
    }

    // Log Audit Event
    await logAdminAction({
      client,
      adminUserId,
      action: AUDIT_ACTIONS.SETTING_UPDATED,
      targetEntity: 'SYSTEM_SETTINGS',
      targetId: null,
      details: {
        changedFields,
        platformName: platformName !== undefined ? platformName.trim() : prevSettings.platform_name,
        supportEmail: supportEmail !== undefined ? supportEmail.trim() : prevSettings.support_email,
        registrationEnabled: registrationEnabled !== undefined ? registrationEnabled : prevSettings.registration_enabled,
      },
    });

    await client.query('COMMIT');

    return await getSettings(adminUserId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
