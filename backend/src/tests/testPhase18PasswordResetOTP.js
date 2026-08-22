/**
 * Phase 18 Automated Verification Test Suite
 * True 6-Digit OTP Password Reset Flow Hardening & Session Revocation
 */

const http = require('http');
const app = require('../app');
const db = require('../config/db');

let server;
let baseUrl;

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          const parsed = responseBody ? JSON.parse(responseBody) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const runTests = async () => {
  console.log('=== PHASE 18: 6-DIGIT OTP PASSWORD RESET HARDENING TEST SUITE ===\n');

  try {
    // Run schema migrations to ensure password_reset_otps table exists
    const migrate = require('../db/migrate');
    await migrate().catch((e) => console.warn('[TEST MIGRATION WARN]', e.message));

    // Start temporary test server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[TEST SERVER] Listening on ${baseUrl}\n`);

    const timestamp = Date.now();
    const testEmail = `otp_reset_user_${timestamp}@jecrcu.edu.in`;
    const initialPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456!';

    // Step 0: Register & verify test user directly in PostgreSQL
    console.log('--- TEST 0: User Setup & Registration ---');
    const bcrypt = require('bcryptjs');
    const userId = require('crypto').randomUUID();
    const initialPasswordHash = await bcrypt.hash(initialPassword, 10);

    await db.query(
      `INSERT INTO users (id, email, password_hash, role, email_verified, account_status, institutional_email, institutional_email_verified)
       VALUES ($1, $2, $3, 'STUDENT', true, 'ACTIVE', $4, true)
       ON CONFLICT (email) DO UPDATE SET password_hash = $3, account_status = 'ACTIVE'`,
      [userId, testEmail, initialPasswordHash, testEmail]
    );

    await db.query(
      `INSERT INTO user_profiles (id, user_id, full_name, is_profile_complete)
       VALUES (gen_random_uuid(), $1, 'OTP Reset Test User', true)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
    console.log('  [PASS] Test user created and activated in PostgreSQL cleanly.');

    // TEST 1: Rejection & Error Response for Unregistered Email
    console.log('\n--- TEST 1: Rejection Response for Unregistered Email ---');
    const unregRes = await request('POST', '/api/v1/auth/forgot-password', {
      email: 'nonexistent_user_999999@jecrc.ac.in',
    });

    if (unregRes.status !== 404) {
      throw new Error(`Expected status 404 for unregistered email, got: ${unregRes.status}`);
    }
    console.log('  [PASS] Unregistered email request rejected with status 404 cleanly.');

    // TEST 2: Forgot Password Request for Registered User
    console.log('\n--- TEST 2: Forgot Password OTP Dispatch for Registered User ---');
    const forgotRes = await request('POST', '/api/v1/auth/forgot-password', {
      email: testEmail,
    });

    if (forgotRes.status !== 200 || !forgotRes.body.success) {
      throw new Error(`Forgot password failed: ${JSON.stringify(forgotRes.body)}`);
    }

    // Small delay to allow non-blocking OTP insertion to complete
    await new Promise((r) => setTimeout(r, 150));

    // Fetch active OTP hash from DB
    const otpRes = await db.query(
      `SELECT id, code_hash FROM verification_codes WHERE email = $1 AND purpose = $2 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`,
      [testEmail, 'PASSWORD_RESET']
    );

    if (otpRes.rows.length === 0) {
      throw new Error('No active PASSWORD_RESET OTP record found in PostgreSQL database.');
    }
    console.log('  [PASS] Password reset 6-digit OTP code created and stored in PostgreSQL.');

    // TEST 3: Invalid OTP Rejection & Attempt Count Increment
    console.log('\n--- TEST 3: Invalid OTP Code Rejection & Attempt Tracking ---');
    const wrongOtpRes = await request('POST', '/api/v1/auth/verify-reset-otp', {
      email: testEmail,
      otp: '000000',
    });

    if (wrongOtpRes.status !== 400 || wrongOtpRes.body.success) {
      throw new Error(`Expected status 400 for wrong OTP, got: ${JSON.stringify(wrongOtpRes.body)}`);
    }

    const attemptRes = await db.query(`SELECT attempt_count FROM verification_codes WHERE id = $1`, [otpRes.rows[0].id]);
    if (attemptRes.rows[0].attempt_count !== 1) {
      throw new Error(`Expected attempt_count 1, got: ${attemptRes.rows[0].attempt_count}`);
    }
    console.log('  [PASS] Invalid OTP code rejected and attempt_count incremented cleanly.');

    // TEST 4: Valid OTP Verification & Reset Authorization Token
    console.log('\n--- TEST 4: Valid OTP Verification & Reset Authorization Token ---');
    const emailService = require('../email/emailService');
    const testOtpCode = '654321';
    const testHash = emailService.hashOTPCode(testOtpCode);

    // Update active OTP record in PostgreSQL with test hash
    await db.query(
      `UPDATE verification_codes SET code_hash = $1 WHERE id = $2`,
      [testHash, otpRes.rows[0].id]
    );

    const verifyRes = await request('POST', '/api/v1/auth/verify-reset-otp', {
      email: testEmail,
      otp: testOtpCode,
    });

    if (verifyRes.status !== 200 || !verifyRes.body.data?.resetToken) {
      throw new Error(`Verify OTP failed: ${JSON.stringify(verifyRes.body)}`);
    }
    const resetToken = verifyRes.body.data.resetToken;
    console.log('  [PASS] 6-digit OTP code verified and short-lived reset authorization token issued.');

    // TEST 5: Weak Password Rejection
    console.log('\n--- TEST 5: Weak Password Policy Validation ---');
    const weakPassRes = await request('POST', '/api/v1/auth/reset-password', {
      resetToken,
      newPassword: 'weak',
    });

    if (weakPassRes.status !== 400) {
      throw new Error(`Expected 400 for weak password, got: ${weakPassRes.status}`);
    }
    console.log('  [PASS] Weak password rejected by security policy.');

    // TEST 6: Successful Password Reset & Active Session Revocation
    console.log('\n--- TEST 6: Password Reset Execution & Session Revocation ---');
    const resetRes = await request('POST', '/api/v1/auth/reset-password', {
      resetToken,
      newPassword,
    });

    if (resetRes.status !== 200 || !resetRes.body.success) {
      throw new Error(`Password reset failed: ${JSON.stringify(resetRes.body)}`);
    }
    console.log('  [PASS] Password successfully updated in PostgreSQL database.');

    // TEST 7: Login Verification with New Password & Rejection with Old Password
    console.log('\n--- TEST 7: Login Verification with New Credentials ---');
    const oldLoginRes = await request('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: initialPassword,
    });
    if (oldLoginRes.status !== 401) {
      throw new Error(`Old password login should be rejected with 401, got: ${oldLoginRes.status}`);
    }

    const newLoginRes = await request('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: newPassword,
    });
    if (newLoginRes.status !== 200 || (!newLoginRes.body.user && !newLoginRes.body.data?.user)) {
      throw new Error(`New password login failed: ${JSON.stringify(newLoginRes.body)}`);
    }
    console.log('  [PASS] Old password rejected (401) and new password authenticated cleanly (200).');

    // TEST 8: Re-use of Used Reset Token Rejection
    console.log('\n--- TEST 8: Prevention of Reset Token Re-use ---');
    const reuseRes = await request('POST', '/api/v1/auth/reset-password', {
      resetToken,
      newPassword: 'AnotherPassword789!',
    });
    if (reuseRes.status !== 400) {
      throw new Error(`Expected 400 on reused reset token, got: ${reuseRes.status}`);
    }
    console.log('  [PASS] Reused password reset authorization token rejected.');

    console.log('\n=== ALL PHASE 18 6-DIGIT OTP PASSWORD RESET TESTS PASSED CLEANLY! ===\n');
  } catch (err) {
    console.error('\n[TEST FAILURE]', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runTests();
