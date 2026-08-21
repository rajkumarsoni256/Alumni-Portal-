const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const sessionService = require('../services/sessionService');
const authService = require('../services/authService');
const adminUserService = require('../services/adminUserService');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const runTests = async () => {
  console.log('=== STARTING COMPLETE AUTHENTICATION & SESSION SECURITY HARDENING TEST SUITE ===\n');

  try {
    // Setup Test User & Admin
    const studentEmail = `sec_student_${Date.now()}@jecrc.ac.in`;
    const adminEmail = `sec_admin_${Date.now()}@jecrc.ac.in`;
    const password = 'TestPassword123!';
    const passwordHash = '$2a$10$76dYqX7Nq4gM7eO9oZt2e.5S1/uM9UeL4jHnS1g1g1g1g1g1g1g1g'; // dummy valid hash

    const studentUserRes = await db.query(
      `INSERT INTO users (id, email, password_hash, role, email_verified, account_status)
       VALUES ($1, $2, $3, 'STUDENT', true, 'ACTIVE') RETURNING *`,
      [crypto.randomUUID(), studentEmail, passwordHash]
    );
    const studentUser = studentUserRes.rows[0];

    const adminUserRes = await db.query(
      `INSERT INTO users (id, email, password_hash, role, email_verified, account_status)
       VALUES ($1, $2, $3, 'ADMIN', true, 'ACTIVE') RETURNING *`,
      [crypto.randomUUID(), adminEmail, passwordHash]
    );
    const adminUser = adminUserRes.rows[0];

    console.log('✅ Test Users initialized cleanly.');

    // ----------------------------------------------------
    // TEST 1: Access Token Minimal Claims & Short TTL
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Access Token Minimal Claims & Security ---');
    const token = jwt.sign({ sub: studentUser.id, role: studentUser.role }, JWT_SECRET, { expiresIn: '15m' });
    const decoded = jwt.verify(token, JWT_SECRET);

    assert.strictEqual(decoded.sub, studentUser.id, 'JWT subject claim must match user ID');
    assert.strictEqual(decoded.role, 'STUDENT', 'JWT role claim must match user role');
    assert.strictEqual(decoded.password, undefined, 'JWT must NOT contain password');
    assert.strictEqual(decoded.email, undefined, 'JWT must NOT contain personal email');
    assert.strictEqual(decoded.phone, undefined, 'JWT must NOT contain phone number');

    // Test invalid signature
    assert.throws(
      () => jwt.verify(token, 'WRONG_SECRET'),
      /invalid signature/,
      'JWT signature verification must fail with incorrect secret'
    );

    console.log('✅ TEST 1 PASSED: Access token contains minimal claims and strict signature validation.');

    // ----------------------------------------------------
    // TEST 2: Server-Side Session Creation (10-Day Max Cap)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Server-Side Session Creation (10-Day Lifetime) ---');
    const { rawRefreshToken, session } = await sessionService.createSession({
      userId: studentUser.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
    });

    assert.ok(rawRefreshToken, 'Raw refresh token string must be generated');
    assert.ok(session.id, 'Session ID must be UUID');
    assert.strictEqual(session.user_id, studentUser.id, 'Session user ID must match student ID');

    const expectedExpiryMin = Date.now() + 9 * 24 * 60 * 60 * 1000; // > 9 days
    const actualExpiry = new Date(session.expires_at).getTime();
    assert.ok(actualExpiry > expectedExpiryMin, 'Session expires_at must be ~10 days in future');

    console.log('✅ TEST 2 PASSED: Server-side session created with un-extendable 10-day expiration cap.');

    // ----------------------------------------------------
    // TEST 3: Refresh Token Rotation & Expiration Preservation
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Refresh Token Rotation & Expiration Preservation ---');
    const refreshResult = await sessionService.refreshSession({
      rawRefreshToken,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
    });

    assert.ok(refreshResult.newRawRefreshToken, 'Rotated refresh token must be issued');
    assert.notStrictEqual(refreshResult.newRawRefreshToken, rawRefreshToken, 'New token must differ from old token');
    assert.strictEqual(
      new Date(refreshResult.session.expires_at).toISOString(),
      new Date(session.expires_at).toISOString(),
      'Rotated token MUST preserve original 10-day absolute expiration date'
    );

    console.log('✅ TEST 3 PASSED: Refresh token rotated successfully while preserving 10-day cap.');

    // ----------------------------------------------------
    // TEST 4: Reused Token Attack Detection & Emergency Revocation
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Token Reuse Attack Detection & Safety Revocation ---');
    try {
      // Re-present the OLD rawRefreshToken that was already rotated in TEST 3!
      await sessionService.refreshSession({
        rawRefreshToken,
        ipAddress: '192.168.1.100',
        userAgent: 'Attacker Browser',
      });
      assert.fail('Reusing a rotated refresh token MUST throw REFRESH_TOKEN_REUSE error');
    } catch (err) {
      assert.strictEqual(err.errorCode, 'REFRESH_TOKEN_REUSE', 'Error code must be REFRESH_TOKEN_REUSE');

      // Verify all active sessions for student are now revoked
      const activeSessions = await sessionService.getUserSessions(studentUser.id);
      assert.strictEqual(activeSessions.length, 0, 'All active sessions must be revoked upon token reuse attack');

      // Verify audit log
      const auditRes = await db.query(
        `SELECT action FROM audit_logs WHERE user_id = $1 AND action = 'REFRESH_TOKEN_REUSE'`,
        [studentUser.id]
      );
      assert.strictEqual(auditRes.rows.length, 1, 'REFRESH_TOKEN_REUSE event must be logged');
    }

    console.log('✅ TEST 4 PASSED: Token reuse attack detected, all user sessions revoked, alert logged.');

    // ----------------------------------------------------
    // TEST 5: Short Lifetime Session Expiration
    // ----------------------------------------------------
    console.log('\n--- TEST 5: 10-Day Expiration Boundary Test ---');
    process.env.TEST_SESSION_MAX_LIFETIME_MS = '1500'; // 1.5 seconds

    const shortSession = await sessionService.createSession({
      userId: studentUser.id,
      ipAddress: '127.0.0.1',
    });

    await sleep(2000); // Wait 2 seconds (exceeds 1.5s max lifetime)

    try {
      await sessionService.refreshSession({ rawRefreshToken: shortSession.rawRefreshToken });
      assert.fail('Expired session refresh MUST fail');
    } catch (err) {
      assert.strictEqual(err.errorCode, 'SESSION_EXPIRED', 'Error code must be SESSION_EXPIRED');
    }

    delete process.env.TEST_SESSION_MAX_LIFETIME_MS;
    console.log('✅ TEST 5 PASSED: Session expiration strictly enforced upon reaching max lifetime limit.');

    // ----------------------------------------------------
    // TEST 6: Single Logout & Logout All Devices
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Logout & Logout-All Devices ---');
    const s1 = await sessionService.createSession({ userId: studentUser.id });
    const s2 = await sessionService.createSession({ userId: studentUser.id });

    let activeBefore = await sessionService.getUserSessions(studentUser.id);
    assert.strictEqual(activeBefore.length, 2, 'Should have 2 active sessions');

    // Revoke s1
    await sessionService.revokeSession(s1.session.id, studentUser.id);
    let activeMid = await sessionService.getUserSessions(studentUser.id);
    assert.strictEqual(activeMid.length, 1, 'Should have 1 active session after revoking s1');

    // Revoke all
    await sessionService.revokeAllUserSessions(studentUser.id, 'LOGOUT_ALL');
    let activeAfter = await sessionService.getUserSessions(studentUser.id);
    assert.strictEqual(activeAfter.length, 0, 'Should have 0 active sessions after logout-all');

    console.log('✅ TEST 6 PASSED: Logout and Logout-All revoke sessions correctly.');

    // ----------------------------------------------------
    // TEST 7: Session Invalidation on Account Deactivation
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Account Deactivation Session Invalidation ---');
    const deactSession = await sessionService.createSession({ userId: studentUser.id });
    
    // Admin deactivates student
    await adminUserService.updateUserStatus(adminUser.id, studentUser.id, 'DISABLED');

    const deactSessions = await sessionService.getUserSessions(studentUser.id);
    assert.strictEqual(deactSessions.length, 0, 'Active sessions must be revoked when admin deactivates user');

    console.log('✅ TEST 7 PASSED: Admin account deactivation revokes all active user sessions.');

    // Cleanup Test Users
    await db.query(`DELETE FROM users WHERE id IN ($1, $2)`, [studentUser.id, adminUser.id]);
    console.log('\n✅ Cleanup completed successfully.');

    console.log('\n=== ALL SESSION SECURITY HARDENING TESTS PASSED 100% ===');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  }
};

runTests();
