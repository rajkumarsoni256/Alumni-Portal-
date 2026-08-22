const assert = require('assert');
const http = require('http');
const app = require('../app');
const db = require('../config/db');
const migrate = require('../db/migrate');
const bcrypt = require('bcryptjs');

let server = null;
let baseUrl = '';

const requestApi = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const duration = Date.now() - start;
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed, duration });
        } catch {
          resolve({ status: res.statusCode, body: data, duration });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const runTests = async () => {
  console.log('=== PHASE 19: AUTHENTICATION & EMAIL RELIABILITY TEST SUITE ===\n');

  await migrate();

  // Start HTTP Server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST SERVER] Listening on ${baseUrl}`);

  let testUser = null;
  const testPassword = 'PasswordP19Secure!';

  try {
    // Create Test User
    const email = `auth_p19_${Date.now()}@jecrc.ac.in`;
    const passwordHash = await bcrypt.hash(testPassword, 10);

    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, $2, 'STUDENT', true, 'ACTIVE') RETURNING *`,
      [email, passwordHash]
    );
    testUser = userRes.rows[0];

    await db.query(
      `INSERT INTO user_profiles (id, user_id, full_name, degree, branch, graduation_year, is_profile_complete)
       VALUES (gen_random_uuid(), $1, 'Auth Tester', 'B.Tech', 'CSE', 2026, true)`,
      [testUser.id]
    );

    // 1. Login Response Latency Benchmark (10 iterations)
    console.log('--- TEST 1: Login API Response Latency Benchmark ---');
    const durations = [];
    for (let i = 0; i < 10; i++) {
      const loginRes = await requestApi('POST', '/api/v1/auth/login', { email, password: testPassword });
      assert.strictEqual(loginRes.status, 200, `Login iteration ${i + 1} succeeded`);
      durations.push(loginRes.duration);
    }

    durations.sort((a, b) => a - b);
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];

    console.log(`  Login Durations: ${durations.join('ms, ')}ms`);
    console.log(`  P50 Login Latency: ${p50} ms`);
    console.log(`  P95 Login Latency: ${p95} ms`);
    assert.ok(p50 < 500, `P50 login latency under 500ms target (actual: ${p50}ms)`);
    assert.ok(p95 < 1000, `P95 login latency under 1000ms target (actual: ${p95}ms)`);
    console.log('  [PASS] Login latency benchmarks satisfied (<500ms target).');

    // 2. Password Reset Flow Verification
    console.log('\n--- TEST 2: Password Reset & Token Security ---');
    const forgotRes = await requestApi('POST', '/api/v1/auth/forgot-password', { email });
    assert.strictEqual(forgotRes.status, 200, 'Forgot password returns 200 OK');

    // Fetch generated reset token from DB
    const resetCheck = await db.query(
      'SELECT token FROM password_reset_tokens WHERE user_id = $1 AND used = false ORDER BY created_at DESC LIMIT 1',
      [testUser.id]
    );
    const resetToken = resetCheck.rows[0]?.token;
    assert.ok(resetToken, 'Reset token generated in DB');

    // Reset password with token
    const newPassword = 'NewSecurePassword123!';
    const resetRes = await requestApi('POST', '/api/v1/auth/reset-password', {
      token: resetToken,
      newPassword,
      password: newPassword,
    });
    assert.strictEqual(resetRes.status, 200, 'Reset password succeeds with token');

    // Attempt login with new password
    const newLoginRes = await requestApi('POST', '/api/v1/auth/login', { email, password: newPassword });
    assert.strictEqual(newLoginRes.status, 200, 'Login with updated password succeeds');

    // Reused reset token should be rejected
    const reuseRes = await requestApi('POST', '/api/v1/auth/reset-password', {
      token: resetToken,
      newPassword: 'AnotherPassword123!',
      password: 'AnotherPassword123!',
    });
    assert.strictEqual(reuseRes.status, 400, 'Reused reset token is rejected (400 Bad Request)');
    console.log('  [PASS] Password reset flow and token reuse prevention verified.');

    // 3. Email System Non-Blocking Verification
    console.log('\n--- TEST 3: Email Service Dispatch Safety ---');
    const emailService = require('../email/emailService');
    let emailErr = null;
    try {
      await emailService.sendStudentVerificationCode(email, 'Test User');
    } catch (e) {
      emailErr = e;
    }
    assert.strictEqual(emailErr, null, 'Email service functions execute safely without crashing app');
    console.log('  [PASS] Email dispatch reliability verified.');

    console.log('\n=== ALL PHASE 19 AUTHENTICATION & EMAIL TESTS PASSED CLEANLY! ===\n');
  } finally {
    if (testUser?.id) await db.query('DELETE FROM users WHERE id = $1', [testUser.id]).catch(() => {});
    if (server) server.close();
  }
};

runTests().catch((err) => {
  console.error('\n[TEST FAILURE]', err.stack || err.message);
  process.exit(1);
});
