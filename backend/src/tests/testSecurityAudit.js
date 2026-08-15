const assert = require('assert');
const http = require('http');
const app = require('../app');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

let server;
let baseUrl;

const requestApi = (method, path, body = null, token = null, cookies = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (cookies) headers['Cookie'] = cookies;

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            parsed = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function runSecurityAuditTests() {
  console.log('\n=== STARTING DEFENSIVE APPLICATION SECURITY AUDIT SUITE ===\n');

  let passed = 0;
  let total = 0;
  const testAssert = (cond, msg) => {
    total++;
    if (cond) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  };

  try {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 1. Security Headers Verification
    console.log('--- 1. HTTP Security Headers Verification ---');
    const rHealth = await requestApi('GET', '/api/v1/health');
    testAssert(rHealth.headers['x-frame-options'] === 'SAMEORIGIN' || rHealth.headers['x-frame-options'] === 'DENY', 'X-Frame-Options security header present');
    testAssert(rHealth.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff header present');
    testAssert(rHealth.headers['cache-control'] && rHealth.headers['cache-control'].includes('no-store'), 'Cache-Control: no-store header present on API endpoints');

    // 2. Sensitive Data Exposure Defense
    console.log('\n--- 2. Sensitive Data Exposure & Password Hash Defense ---');
    const studentUserRes = await db.query(`SELECT id, email FROM users WHERE role = 'STUDENT' AND account_status = 'ACTIVE' LIMIT 1`);
    if (studentUserRes.rows.length > 0) {
      const studentId = studentUserRes.rows[0].id;
      const adminRes = await db.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`);
      const adminToken = jwt.sign(
        { sub: adminRes.rows[0].id, role: 'ADMIN' },
        process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970',
        { expiresIn: '15m' }
      );

      const rUserDetail = await requestApi('GET', `/api/v1/admin/users/${studentId}`, null, adminToken);
      testAssert(rUserDetail.status === 200, 'Admin user details endpoint succeeds');
      const responseString = JSON.stringify(rUserDetail.body);
      testAssert(!responseString.includes('password_hash') && !responseString.includes('$2a$') && !responseString.includes('$2b$'), 'Zero password hashes exposed in API responses');
    }

    // 3. RBAC & Admin Endpoint Isolation
    console.log('\n--- 3. RBAC & Admin Privilege Isolation ---');
    const studentRes = await db.query(`SELECT id FROM users WHERE role = 'STUDENT' LIMIT 1`);
    if (studentRes.rows.length > 0) {
      const studentToken = jwt.sign(
        { sub: studentRes.rows[0].id, role: 'STUDENT' },
        process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970',
        { expiresIn: '15m' }
      );

      const rAdminSetting = await requestApi('GET', '/api/v1/admin/settings', null, studentToken);
      testAssert(rAdminSetting.status === 403, 'Student JWT calling Admin settings rejected with 403 Forbidden');

      const rAdminUserList = await requestApi('GET', '/api/v1/admin/users', null, studentToken);
      testAssert(rAdminUserList.status === 403, 'Student JWT calling Admin user directory rejected with 403 Forbidden');
    }

    // 4. Input Validation & Malformed Input Handling
    console.log('\n--- 4. Input Validation & Parameter Safety ---');
    const adminUserRes = await db.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`);
    const adminToken = jwt.sign(
      { sub: adminUserRes.rows[0].id, role: 'ADMIN' },
      process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970',
      { expiresIn: '15m' }
    );

    const rBadUuid = await requestApi('GET', '/api/v1/admin/users/not-a-valid-uuid', null, adminToken);
    testAssert(rBadUuid.status === 400, 'Malformed UUID parameter rejected with 400 Bad Request');

    const rSqlInject = await requestApi('GET', '/api/v1/admin/users?sortBy=name;DROP%20TABLE%20users;', null, adminToken);
    testAssert(rSqlInject.status === 400, 'SQL injection in sortBy query parameter rejected with 400 Bad Request');

    console.log('\n================================================================');
    console.log(`  SECURITY AUDIT TEST SUITE PASSED 100% (${passed}/${total})`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('Security audit test failed:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
  }
}

runSecurityAuditTests();
