const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const googleAuthService = require('./googleAuthService');
const emailService = require('../email/emailService');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

const normalizeEmail = (email) => {
  return email ? email.trim().toLowerCase() : '';
};

const generateToken = (userId, role) => {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

const parseUserAgent = (uaString = '') => {
  let browser = 'Chrome';
  if (uaString.includes('Firefox')) browser = 'Firefox';
  else if (uaString.includes('Safari') && !uaString.includes('Chrome')) browser = 'Safari';
  else if (uaString.includes('Edg')) browser = 'Edge';

  let os = 'Windows';
  if (uaString.includes('Macintosh') || uaString.includes('Mac OS')) os = 'macOS';
  else if (uaString.includes('Android')) os = 'Android';
  else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';
  else if (uaString.includes('Linux')) os = 'Linux';

  return {
    browser,
    os,
    deviceName: `${browser} on ${os}`,
  };
};

const detectDeviceAndSendAlert = async (user, req = {}, authMethod = 'PASSWORD') => {
  try {
    const userAgent = req.headers ? (req.headers['user-agent'] || '') : '';
    const ipAddress = req.ip || req.headers?.['x-forwarded-for'] || '127.0.0.1';
    const parsed = parseUserAgent(userAgent);
    const deviceName = parsed.deviceName;

    const sessionRes = await db.query(
      `SELECT id, is_active FROM user_sessions WHERE user_id = $1 AND device = $2 LIMIT 1`,
      [user.id, deviceName]
    );

    if (sessionRes.rows.length === 0) {
      // New Device Detected!
      await db.query(
        `INSERT INTO user_sessions (id, user_id, device, ip_address, user_agent, is_active, last_active_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW())`,
        [crypto.randomUUID(), user.id, deviceName, ipAddress, userAgent]
      );

      // Trigger New Device Security Email Alert
      await emailService.sendNewDeviceLoginAlert(user.email, user.id, {
        userName: user.fullName || user.full_name || user.name || (user.email ? user.email.split('@')[0] : 'Member'),
        device: deviceName,
        browser: parsed.browser,
        os: parsed.os,
        ip: ipAddress,
        location: 'Jaipur, Rajasthan, India',
        timestamp: new Date(),
        authMethod,
      });
    } else {
      // Known Device: Update last_active_at timestamp
      await db.query(
        `UPDATE user_sessions SET last_active_at = NOW(), is_active = true WHERE id = $1`,
        [sessionRes.rows[0].id]
      );
    }
  } catch (err) {
    console.warn('[Device Detection Alert Warning]', err.message);
  }
};

const {
  validateAndNormalizeRollNumber,
  validateAcademicYears,
  validateJECRCEmail,
  validateMobileNumber,
} = require('../utils/courseConfig');

/**
 * Phase 14: Step 1 of Student Registration — Validate inputs & send OTP to JECRC Email
 */
const initiateStudentRegistration = async ({
  name,
  rollNumber,
  institutionalEmail,
  personalEmail,
  mobileNumber,
  phone,
  password,
  course,
  joiningYear,
  graduationYear,
}) => {
  const normInstitutionalEmail = validateJECRCEmail(institutionalEmail);
  const normPersonalEmail = normalizeEmail(personalEmail);
  const normPhone = validateMobileNumber(mobileNumber || phone);
  const normRollNumber = validateAndNormalizeRollNumber(rollNumber);

  if (!normPersonalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normPersonalEmail)) {
    const err = new Error('Please enter a valid personal email address.');
    err.statusCode = 400;
    err.errorCode = 'INVALID_PERSONAL_EMAIL';
    throw err;
  }

  if (normPersonalEmail === normInstitutionalEmail) {
    const err = new Error('Personal email address cannot be the same as your JECRC institutional email.');
    err.statusCode = 400;
    err.errorCode = 'SAME_EMAIL_ERROR';
    throw err;
  }

  if (!password || String(password).length < 8) {
    const err = new Error('Password must be at least 8 characters long.');
    err.statusCode = 400;
    err.errorCode = 'WEAK_PASSWORD';
    throw err;
  }

  const years = validateAcademicYears(joiningYear, graduationYear);

  // Check system settings for registration permission
  const settingsRes = await db.query(`SELECT registration_enabled FROM system_settings WHERE id = 'default'`).catch(() => ({ rows: [] }));
  if (settingsRes.rows.length > 0 && settingsRes.rows[0].registration_enabled === false) {
    const error = new Error('Public registration is currently disabled by administrator.');
    error.statusCode = 403;
    error.errorCode = 'REGISTRATION_DISABLED';
    throw error;
  }

  // Check personal email uniqueness in users table
  const existingPersonal = await db.query('SELECT id FROM users WHERE email = $1', [normPersonalEmail]);
  if (existingPersonal.rows.length > 0) {
    const error = new Error(`An account with personal email '${normPersonalEmail}' already exists.`);
    error.statusCode = 409;
    error.errorCode = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  // Check roll number uniqueness in user_profiles
  const rollCheck = await db.query(
    `SELECT user_id FROM user_profiles WHERE university_roll_number = $1 LIMIT 1`,
    [normRollNumber]
  );
  if (rollCheck.rows.length > 0) {
    const error = new Error(`University Roll Number '${normRollNumber}' is already registered.`);
    error.statusCode = 409;
    error.errorCode = 'DUPLICATE_ROLL_NUMBER';
    throw error;
  }

  // Store OTP for student verification in emailService (purpose: 'STUDENT_VERIFICATION')
  const rawCode = await emailService.createAndStoreOTP({
    email: normInstitutionalEmail,
    purpose: 'STUDENT_VERIFICATION',
  });

  // Send OTP email to JECRC Institutional Email (non-blocking log warning)
  emailService.sendVerificationCode(normInstitutionalEmail, null, name || 'Student', rawCode)
    .catch((err) => console.warn('[OTP Email Send Warning]', err.message));

  return {
    success: true,
    message: 'Verification OTP sent to your JECRC institutional email address.',
    institutionalEmail: normInstitutionalEmail,
    personalEmail: normPersonalEmail,
    rollNumber: normRollNumber,
  };
};

/**
 * Phase 14: Step 2 of Student Registration — Verify OTP & create verified STUDENT account
 */
const verifyStudentRegistrationOTP = async ({
  name,
  rollNumber,
  institutionalEmail,
  personalEmail,
  mobileNumber,
  phone,
  password,
  course,
  joiningYear,
  graduationYear,
  code,
}) => {
  const normInstitutionalEmail = validateJECRCEmail(institutionalEmail);
  const normPersonalEmail = normalizeEmail(personalEmail);
  const normPhone = validateMobileNumber(mobileNumber || phone);
  const normRollNumber = validateAndNormalizeRollNumber(rollNumber);
  const years = validateAcademicYears(joiningYear, graduationYear);

  // Verify OTP
  await emailService.verifyOTPCode({
    email: normInstitutionalEmail,
    code,
    purpose: 'STUDENT_VERIFICATION',
  });

  // Re-verify uniqueness
  const existingPersonal = await db.query('SELECT id FROM users WHERE email = $1', [normPersonalEmail]);
  if (existingPersonal.rows.length > 0) {
    const error = new Error(`An account with email '${normPersonalEmail}' already exists`);
    error.statusCode = 409;
    error.errorCode = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const rollCheck = await db.query(
    `SELECT user_id FROM user_profiles WHERE university_roll_number = $1 LIMIT 1`,
    [normRollNumber]
  );
  if (rollCheck.rows.length > 0) {
    const error = new Error(`University Roll Number '${normRollNumber}' is already registered.`);
    error.statusCode = 409;
    error.errorCode = 'DUPLICATE_ROLL_NUMBER';
    throw error;
  }

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const profileName = name ? name.trim() : normPersonalEmail.split('@')[0];

  // Insert Student User with personalEmail as login email!
  const userResult = await db.query(
    `INSERT INTO users (id, email, password_hash, role, email_verified, account_status, institutional_email, institutional_email_verified, email_verification_status)
     VALUES ($1, $2, $3, 'STUDENT', true, 'ACTIVE', $4, true, 'VERIFIED')
     RETURNING id, email, role, email_verified, account_status, institutional_email`,
    [userId, normPersonalEmail, passwordHash, normInstitutionalEmail]
  );
  const user = userResult.rows[0];

  // Insert Profile with phone and verified roll number
  await db.query(
    `INSERT INTO user_profiles (id, user_id, full_name, university_roll_number, phone, course, joining_year, graduation_year, is_profile_complete)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
    [
      crypto.randomUUID(),
      user.id,
      profileName,
      normRollNumber,
      normPhone,
      course ? String(course).trim().toUpperCase() : 'BTECH',
      years.joiningYear,
      years.graduationYear,
    ]
  );

  const token = generateToken(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      institutionalEmail: user.institutional_email,
      role: user.role,
      fullName: profileName,
      profileComplete: true,
      universityRollNumber: normRollNumber,
      phone: normPhone,
      course: course ? String(course).trim().toUpperCase() : 'BTECH',
      joiningYear: years.joiningYear,
      graduationYear: years.graduationYear,
    },
    token,
  };
};

const register = async ({
  name,
  email,
  password,
  role,
  mobileNumber,
  phone,
  rollNumber,
  universityRollNumber,
  course,
  joiningYear,
  joining_year,
  graduationYear,
  graduation_year,
}) => {
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

  // Validate mobile number for ALUMNI
  const normPhone = validateMobileNumber(mobileNumber || phone);

  // Check system settings for registration permission
  const settingsRes = await db.query(`SELECT registration_enabled FROM system_settings WHERE id = 'default'`).catch(() => ({ rows: [] }));
  if (settingsRes.rows.length > 0 && settingsRes.rows[0].registration_enabled === false) {
    const error = new Error('Public registration is currently disabled by administrator.');
    error.statusCode = 403;
    error.errorCode = 'REGISTRATION_DISABLED';
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

  let normRollNumber = null;
  let normCourse = course ? String(course).trim().toUpperCase() : null;
  let validatedJoiningYear = joiningYear || joining_year ? parseInt(joiningYear || joining_year, 10) : null;
  let validatedGraduationYear = graduationYear || graduation_year ? parseInt(graduationYear || graduation_year, 10) : null;

  if (validatedJoiningYear && validatedGraduationYear) {
    const years = validateAcademicYears(validatedJoiningYear, validatedGraduationYear);
    validatedJoiningYear = years.joiningYear;
    validatedGraduationYear = years.graduationYear;
  }

  // Student Identity Validation
  if (upperRole === 'STUDENT') {
    const rawRoll = rollNumber || universityRollNumber;
    normRollNumber = validateAndNormalizeRollNumber(rawRoll);

    // Database Uniqueness check for Roll Number
    const rollCheck = await db.query(
      `SELECT user_id FROM user_profiles WHERE university_roll_number = $1 LIMIT 1`,
      [normRollNumber]
    );
    if (rollCheck.rows.length > 0) {
      const error = new Error(`University Roll Number '${normRollNumber}' is already registered.`);
      error.statusCode = 409;
      error.errorCode = 'DUPLICATE_ROLL_NUMBER';
      throw error;
    }
  }

  const initialAccountStatus = upperRole === 'ALUMNI' ? 'PENDING_APPROVAL' : 'ACTIVE';
  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const userResult = await db.query(
    `INSERT INTO users (id, email, password_hash, role, email_verified, account_status)
     VALUES ($1, $2, $3, $4, false, $5)
     RETURNING id, email, role, email_verified, account_status`,
    [userId, normalizedEmail, passwordHash, upperRole, initialAccountStatus]
  );
  const user = userResult.rows[0];

  const profileName = name ? name.trim() : normalizedEmail.split('@')[0];

  // Create initial profile
  await db.query(
    `INSERT INTO user_profiles (id, user_id, full_name, university_roll_number, phone, course, joining_year, graduation_year, is_profile_complete)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)`,
    [
      crypto.randomUUID(),
      user.id,
      profileName,
      normRollNumber,
      normPhone,
      normCourse,
      validatedJoiningYear,
      validatedGraduationYear,
    ]
  );

  let alumniVerificationStatus = null;

  // Alumni Approval Queue & Notification Engine
  if (upperRole === 'ALUMNI') {
    alumniVerificationStatus = 'PENDING';
    await db.query(
      `INSERT INTO alumni_verifications (id, user_id, status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'PENDING', NOW(), NOW());`,
      [user.id]
    );

    // Notify active Admins
    const adminUsersRes = await db.query(
      `SELECT id FROM users WHERE role = 'ADMIN' AND account_status = 'ACTIVE'`
    );
    for (const adminRow of adminUsersRes.rows) {
      await db.query(
        `INSERT INTO notifications (id, recipient_id, user_id, type, title, message, actor_name, created_at)
         VALUES (gen_random_uuid(), $1, $2, 'ALUMNI_VERIFICATION_REQUEST', 'New Alumni Verification Request', $3, $4, NOW());`,
        [
          adminRow.id,
          user.id,
          `New Alumni verification request submitted by ${profileName} (${user.email}).`,
          profileName,
        ]
      );
    }
  }

  // Send 6-digit OTP verification email (non-blocking)
  emailService.sendVerificationCode(user.email, user.id, profileName)
    .catch((err) => console.warn('[Email Verification Dispatch Warning]', err.message));

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: profileName,
    profileComplete: false,
    universityRollNumber: normRollNumber,
    course: normCourse,
    joiningYear: validatedJoiningYear,
    graduationYear: validatedGraduationYear,
    alumniVerificationStatus,
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

  // First try verification_codes (Secure OTP engine)
  try {
    await emailService.verifyOTPCode({ email: normalizedEmail, code, purpose: 'EMAIL_VERIFICATION' });
    await db.query('UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1', [user.id]);
    
    // Fetch profile name for welcome email
    const profileRes = await db.query('SELECT full_name FROM user_profiles WHERE user_id = $1', [user.id]);
    const userName = profileRes.rows[0]?.full_name || normalizedEmail.split('@')[0];
    emailService.sendWelcomeEmail(normalizedEmail, userName, user.id)
      .catch((err) => console.warn('[Welcome Email Dispatch Warning]', err.message));
    return;
  } catch (otpErr) {
    // Fallback to legacy email_verification_tokens for backward compatibility
    const tokenResult = await db.query(
      `SELECT id, expires_at, used FROM email_verification_tokens
       WHERE user_id = $1 AND token = $2 AND used = false`,
      [user.id, code ? code.trim() : '']
    );

    if (tokenResult.rows.length === 0) {
      throw otpErr; // Re-throw structured OTP error
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

    const profileRes = await db.query('SELECT full_name FROM user_profiles WHERE user_id = $1', [user.id]);
    const userName = profileRes.rows[0]?.full_name || normalizedEmail.split('@')[0];
    emailService.sendWelcomeEmail(normalizedEmail, userName, user.id)
      .catch((err) => console.warn('[Welcome Email Dispatch Warning]', err.message));
  }
};

const resendVerificationCode = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  const userResult = await db.query(
    `SELECT u.id, u.email, u.email_verified, p.full_name FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.email = $1`,
    [normalizedEmail]
  );

  if (userResult.rows.length === 0) {
    const error = new Error(`User not found with email: '${normalizedEmail}'`);
    error.statusCode = 404;
    error.errorCode = 'RESOURCE_NOT_FOUND';
    throw error;
  }

  const user = userResult.rows[0];
  if (user.email_verified) {
    const error = new Error('This email address has already been verified.');
    error.statusCode = 400;
    error.errorCode = 'EMAIL_ALREADY_VERIFIED';
    throw error;
  }

  await emailService.sendVerificationCode(user.email, user.id, user.full_name);
  return { success: true, message: 'New verification code sent to your email.' };
};

const login = async ({ email, password, req }) => {
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

  if (user.account_status === 'PENDING_APPROVAL') {
    const error = new Error('Your alumni account is awaiting administrator approval.');
    error.statusCode = 403;
    error.errorCode = 'ALUMNI_APPROVAL_PENDING';
    throw error;
  }

  if (user.account_status === 'REJECTED') {
    const error = new Error('Your alumni registration request was not approved.');
    error.statusCode = 403;
    error.errorCode = 'ALUMNI_APPROVAL_REJECTED';
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

  // Device detection and new device alert
  await detectDeviceAndSendAlert(user, req, 'PASSWORD');

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

const authenticateWithGoogle = async ({ idToken, req }) => {
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

  // Device detection and new device alert
  await detectDeviceAndSendAlert(user, req, 'GOOGLE_OAUTH');

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

  const userResult = await db.query(
    `SELECT u.id, u.email, u.account_status, p.full_name
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.email = $1`,
    [normalizedEmail]
  );

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

      // Trigger 6-digit OTP code & link reset email
      try {
        await emailService.sendPasswordResetCode(normalizedEmail, user.id, user.full_name, resetToken);
      } catch (err) {
        console.warn('[Password Reset Email Warning]', err.message);
      }
    }
  }

  return 'If an account exists for this email, password reset instructions have been sent';
};

const resetPassword = async ({ token, code, email, newPassword }) => {
  if (!newPassword || newPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters long');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  let targetUserId = null;
  let targetUserEmail = null;
  let targetUserName = null;

  // 1. Try 6-digit code verification
  if (code && email) {
    const cleanEmail = normalizeEmail(email);
    const otpResult = await emailService.verifyOTPCode({ email: cleanEmail, code, purpose: 'PASSWORD_RESET' });
    targetUserId = otpResult.userId;
    targetUserEmail = cleanEmail;
  } else if (token && token.trim()) {
    // 2. Try token link verification
    const tokenResult = await db.query(
      `SELECT pr.id, pr.user_id, pr.expires_at, pr.used, u.email, p.full_name
       FROM password_reset_tokens pr
       JOIN users u ON pr.user_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE pr.token = $1`,
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

    targetUserId = tokenRecord.user_id;
    targetUserEmail = tokenRecord.email;
    targetUserName = tokenRecord.full_name;

    await db.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [tokenRecord.id]);
  } else {
    const error = new Error('Verification code or reset token is required');
    error.statusCode = 400;
    error.errorCode = 'INVALID_TOKEN';
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, targetUserId]);

  // Trigger Security Alert Email: Password Changed
  if (targetUserEmail) {
    try {
      await emailService.sendPasswordChangedAlert(targetUserEmail, targetUserId, { userName: targetUserName });
    } catch (err) {
      console.warn('[Password Changed Alert Warning]', err.message);
    }
  }
};

const getCurrentUser = async (user) => {
  const result = await db.query(
    `SELECT u.id, u.email, u.role, p.full_name, p.avatar_url, p.is_profile_complete,
            p.university_roll_number, p.course, p.joining_year, p.graduation_year
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

  let alumniVerificationStatus = null;
  const verRes = await db.query(
    `SELECT status FROM alumni_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );
  if (verRes.rows.length > 0) {
    alumniVerificationStatus = verRes.rows[0].status;
  }

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name || null,
    avatarUrl: row.avatar_url || null,
    profileComplete: !!row.is_profile_complete,
    universityRollNumber: row.university_roll_number || null,
    course: row.course || null,
    joiningYear: row.joining_year || null,
    graduationYear: row.graduation_year || null,
    alumniVerificationStatus,
  };
};

module.exports = {
  register,
  initiateStudentRegistration,
  verifyStudentRegistrationOTP,
  verifyEmail,
  resendVerificationCode,
  login,
  authenticateWithGoogle,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
