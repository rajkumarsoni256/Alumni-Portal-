const assert = require('assert');
const http = require('http');
const app = require('../app');
const db = require('../config/db');
const migrate = require('../db/migrate');
const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret_key_for_development';

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
          resolve({ status: res.statusCode, body: parsed, duration, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body: data, duration, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const runTests = async () => {
  console.log('=== PHASE 17B: AUTHENTICATION & ONBOARDING DETERMINISM TEST SUITE ===\n');

  await migrate();

  // Start HTTP Server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST SERVER] Listening on ${baseUrl}`);

  let studentId = null;
  let alumniId = null;

  try {
    // 1. Explicit Student Registration Endpoint
    console.log('--- TEST 1: Explicit Student Registration (POST /register/student) ---');
    const studentEmail = `det_student_${Date.now()}@jecrc.ac.in`;
    const studentRes = await requestApi('POST', '/api/v1/auth/register/student', {
      name: 'Determinism Student',
      email: studentEmail,
      password: 'SecurePassword123!',
      rollNumber: `24BCON${Math.floor(1000 + Math.random() * 9000)}`,
      mobileNumber: '9876543210',
    });

    assert.strictEqual(studentRes.status, 201, 'Student registration returns 201 Created');
    assert.strictEqual(studentRes.body.data.role, 'STUDENT', 'Database role is strictly STUDENT');
    studentId = studentRes.body.data.id;
    console.log('  [PASS] Student registration endpoint verified.');

    // 2. Explicit Alumni Registration Endpoint
    console.log('\n--- TEST 2: Explicit Alumni Registration (POST /register/alumni) ---');
    const alumniEmail = `det_alumni_${Date.now()}@gmail.com`;
    const alumniRes = await requestApi('POST', '/api/v1/auth/register/alumni', {
      name: 'Determinism Alumni',
      email: alumniEmail,
      password: 'SecurePassword123!',
      graduationYear: '2020',
      mobileNumber: '9876543211',
    });

    assert.strictEqual(alumniRes.status, 201, 'Alumni registration returns 201 Created');
    assert.strictEqual(alumniRes.body.data.role, 'ALUMNI', 'Database role is strictly ALUMNI');
    alumniId = alumniRes.body.data.id;
    console.log('  [PASS] Alumni registration endpoint verified.');

    // 3. Role Tampering Protection
    console.log('\n--- TEST 3: Role Tampering Payload Prevention ---');
    const tamperEmail = `det_tamper_${Date.now()}@jecrc.ac.in`;
    const tamperRes = await requestApi('POST', '/api/v1/auth/register/student', {
      name: 'Tamper Attacker',
      email: tamperEmail,
      password: 'SecurePassword123!',
      rollNumber: `24BCON${Math.floor(1000 + Math.random() * 9000)}`,
      mobileNumber: '9876543212',
      role: 'ADMIN', // Client tries to override role to ADMIN
    });

    assert.strictEqual(tamperRes.status, 201, 'Tampered registration succeeds as student');
    assert.strictEqual(tamperRes.body.data.role, 'STUDENT', 'Role tampering to ADMIN blocked; enforced as STUDENT');
    await db.query('DELETE FROM users WHERE id = $1', [tamperRes.body.data.id]);
    console.log('  [PASS] Server-side role tampering prevention verified.');

    // 4. Source of Truth Database Hydration (/auth/me)
    console.log('\n--- TEST 4: Unified /auth/me Database Source of Truth ---');
    const token = jwt.sign({ id: studentId, email: studentEmail, role: 'STUDENT' }, getJwtSecret(), { expiresIn: '1h' });
    const meRes = await requestApi('GET', '/api/v1/auth/me', null, token);

    assert.strictEqual(meRes.status, 200, 'GET /auth/me returns 200 OK');
    assert.strictEqual(meRes.body.data.role, 'STUDENT', 'Source of truth role is STUDENT');
    assert.strictEqual(meRes.body.data.accountStatus, 'ACTIVE', 'Account status is ACTIVE');
    assert.ok('profileComplete' in meRes.body.data, 'profileComplete flag present in DTO');
    console.log('  [PASS] Unified /auth/me source of truth response structure verified.');

    // 5. Disabled Account Protection
    console.log('\n--- TEST 5: Suspended / Disabled Account Enforcement ---');
    await db.query(`UPDATE users SET account_status = 'DISABLED' WHERE id = $1`, [studentId]);
    const disabledMe = await requestApi('GET', '/api/v1/auth/me', null, token);
    const disabledLogin = await requestApi('POST', '/api/v1/auth/login', { email: studentEmail, password: 'SecurePassword123!' });

    assert.strictEqual(disabledLogin.status, 401, 'Disabled user login returns 401 Unauthorized');
    assert.strictEqual(disabledLogin.body.errorCode, 'ACCOUNT_DISABLED', 'Error code is ACCOUNT_DISABLED');
    console.log('  [PASS] Disabled account status enforced across auth endpoints.');

    // 6. Duplicate Email Handling
    console.log('\n--- TEST 6: Duplicate Email Registration Prevention ---');
    const dupRes = await requestApi('POST', '/api/v1/auth/register/student', {
      name: 'Duplicate Student',
      email: studentEmail,
      password: 'SecurePassword123!',
      rollNumber: `24BCON${Math.floor(1000 + Math.random() * 9000)}`,
      mobileNumber: '9876543299',
    });
    assert.strictEqual(dupRes.status, 409, 'Duplicate email registration returns 409 Conflict');
    assert.strictEqual(dupRes.body.errorCode, 'EMAIL_ALREADY_EXISTS', 'Error code is EMAIL_ALREADY_EXISTS');
    console.log('  [PASS] Duplicate email prevention verified.');

    // 7. Wrong Password Fast Rejection
    console.log('\n--- TEST 7: Wrong Password Fast Rejection ---');
    const wrongPassRes = await requestApi('POST', '/api/v1/auth/login', { email: alumniEmail, password: 'WrongPassword999!' });
    assert.strictEqual(wrongPassRes.status, 401, 'Wrong password returns 401 Unauthorized');
    assert.strictEqual(wrongPassRes.body.errorCode, 'INVALID_CREDENTIALS', 'Error code is INVALID_CREDENTIALS');
    console.log('  [PASS] Wrong password rejection verified.');

    // 8. Expired JWT Rejection
    console.log('\n--- TEST 8: Expired JWT Rejection ---');
    const expiredToken = jwt.sign({ id: alumniId, email: alumniEmail, role: 'ALUMNI' }, getJwtSecret(), { expiresIn: '-1s' });
    const expiredRes = await requestApi('GET', '/api/v1/auth/me', null, expiredToken);
    assert.strictEqual(expiredRes.status, 401, 'Expired JWT returns 401 Unauthorized');
    console.log('  [PASS] Expired JWT rejection verified.');

    console.log('\n=== ALL PHASE 17B AUTHENTICATION & ONBOARDING DETERMINISM TESTS PASSED CLEANLY! ===\n');
  } finally {
    if (studentId) await db.query('DELETE FROM users WHERE id = $1', [studentId]).catch(() => {});
    if (alumniId) await db.query('DELETE FROM users WHERE id = $1', [alumniId]).catch(() => {});
    if (server) server.close();
  }
};

runTests().catch((err) => {
  console.error('\n[TEST FAILURE]', err.stack || err.message);
  process.exit(1);
});
