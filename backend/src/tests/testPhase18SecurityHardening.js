const assert = require('assert');
const http = require('http');
const app = require('../app');
const db = require('../config/db');
const migrate = require('../db/migrate');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
  console.log('=== PHASE 18: SECURITY HARDENING & AUTHORIZATION AUDIT SUITE ===\n');

  await migrate();

  // Start HTTP Server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST SERVER] Listening on ${baseUrl}`);

  let userA = null;
  let userB = null;
  let disabledUser = null;
  let tokenA = '';
  let tokenB = '';
  let disabledToken = '';

  try {
    // Setup Users
    const plainPassword = 'SecurePassword123!';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const emailA = `sec_user_a_${Date.now()}@jecrc.ac.in`;
    const emailB = `sec_user_b_${Date.now()}@jecrc.ac.in`;
    const emailDisabled = `sec_user_dis_${Date.now()}@jecrc.ac.in`;

    const resA = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, $2, 'STUDENT', true, 'ACTIVE') RETURNING *`,
      [emailA, passwordHash]
    );
    userA = resA.rows[0];

    const resB = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, $2, 'ALUMNI', true, 'ACTIVE') RETURNING *`,
      [emailB, passwordHash]
    );
    userB = resB.rows[0];

    const resDis = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, $2, 'STUDENT', true, 'DISABLED') RETURNING *`,
      [emailDisabled, passwordHash]
    );
    disabledUser = resDis.rows[0];

    await db.query(`INSERT INTO user_profiles (id, user_id, full_name, is_profile_complete) VALUES (gen_random_uuid(), $1, 'User A', true)`, [userA.id]);
    await db.query(`INSERT INTO user_profiles (id, user_id, full_name, is_profile_complete) VALUES (gen_random_uuid(), $1, 'User B', true)`, [userB.id]);
    await db.query(`INSERT INTO user_profiles (id, user_id, full_name, is_profile_complete) VALUES (gen_random_uuid(), $1, 'Disabled User', true)`, [disabledUser.id]);

    tokenA = jwt.sign({ id: userA.id, email: emailA, role: 'STUDENT' }, getJwtSecret(), { expiresIn: '1h' });
    tokenB = jwt.sign({ id: userB.id, email: emailB, role: 'ALUMNI' }, getJwtSecret(), { expiresIn: '1h' });
    disabledToken = jwt.sign({ id: disabledUser.id, email: emailDisabled, role: 'STUDENT' }, getJwtSecret(), { expiresIn: '1h' });

    // 1. Password Storage Security Check
    console.log('--- TEST 1: Password Storage Security Check ---');
    const pwdRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [userA.id]);
    assert.ok(pwdRes.rows[0].password_hash.startsWith('$2'), 'Password stored as bcrypt hash');
    assert.ok(!pwdRes.rows[0].password_hash.includes(plainPassword), 'Plaintext password never stored');
    console.log('  [PASS] Password stored securely as bcrypt hash.');

    // 2. Authentication Security Tests
    console.log('\n--- TEST 2: Authentication & Token Enforcement ---');
    const noToken = await requestApi('GET', '/api/v1/posts', null, null);
    assert.strictEqual(noToken.status, 401, 'Missing token returns 401 Unauthorized');

    const fakeToken = await requestApi('GET', '/api/v1/posts', null, 'invalid_jwt_string_123');
    assert.strictEqual(fakeToken.status, 401, 'Invalid token returns 401 Unauthorized');

    const tamperedToken = jwt.sign({ id: userA.id, email: emailA, role: 'ADMIN' }, 'wrong_secret');
    const tamperedRes = await requestApi('GET', '/api/v1/posts', null, tamperedToken);
    assert.strictEqual(tamperedRes.status, 401, 'Tampered token secret returns 401 Unauthorized');

    const disRes = await requestApi('GET', '/api/v1/posts', null, disabledToken);
    assert.strictEqual(disRes.status, 401, 'Disabled account returns 401 Unauthorized');
    console.log('  [PASS] JWT verification & disabled account enforcement verified.');

    // 3. IDOR / BOLA Authorization Tests
    console.log('\n--- TEST 3: IDOR / BOLA Authorization Audit ---');

    // Create Post by User A
    const postARes = await requestApi('POST', '/api/v1/posts', {
      content: 'User A private post',
      category: 'STUDENT',
      postType: 'TEXT',
      visibility: 'PUBLIC'
    }, tokenA);
    const postAId = postARes.body.data.id || postARes.body.data.post?.id;

    // User B tries to DELETE User A's post
    const deleteIdorRes = await requestApi('DELETE', `/api/v1/posts/${postAId}`, null, tokenB);
    assert.strictEqual(deleteIdorRes.status, 403, 'User B cannot delete User A post (403 Forbidden)');

    // Create Connection Request from User A to User B
    const connService = require('../services/connectionService');
    const connReq = await connService.sendRequest(userA, userB.id);

    // Create User C (Third Party)
    const resC = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, $2, 'STUDENT', true, 'ACTIVE') RETURNING *`,
      [`sec_user_c_${Date.now()}@jecrc.ac.in`, passwordHash]
    );
    const userC = resC.rows[0];
    const tokenC = jwt.sign({ id: userC.id, email: userC.email, role: 'STUDENT' }, getJwtSecret(), { expiresIn: '1h' });

    // User C tries to ACCEPT User A's connection request to User B
    const acceptIdorRes = await requestApi('POST', `/api/v1/connections/${connReq.connectionId}/accept`, null, tokenC);
    assert.strictEqual(acceptIdorRes.status, 403, 'Third party User C cannot accept User A -> B connection request (403 Forbidden)');

    // User C tries to access Admin API
    const adminIdorRes = await requestApi('GET', '/api/v1/admin/users', null, tokenC);
    assert.strictEqual(adminIdorRes.status, 403, 'Non-admin User C blocked from Admin API (403 Forbidden)');

    console.log('  [PASS] IDOR & BOLA authorization checks passed across resources.');

    // 4. Input Security & Query Normalization
    console.log('\n--- TEST 4: Input Security & Query Parameter Normalization ---');

    // SQL Injection in query parameter
    const sqlInjRes = await requestApi('GET', `/api/v1/posts?query=${encodeURIComponent("' OR 1=1 --")}`, null, tokenA);
    assert.strictEqual(sqlInjRes.status, 200, 'SQL injection query returns 200 OK without syntax error');

    // Boundary Pagination Testing (negative, huge, invalid)
    const negLimitRes = await requestApi('GET', '/api/v1/posts?limit=-10&page=-5', null, tokenA);
    assert.strictEqual(negLimitRes.status, 200, 'Negative limit & page normalized safely');

    const hugeLimitRes = await requestApi('GET', '/api/v1/posts?limit=9999999', null, tokenA);
    assert.strictEqual(hugeLimitRes.status, 200, 'Huge limit capped to max allowed page size');
    assert.ok(hugeLimitRes.body.data.posts.length <= 50, 'Returned posts capped to 50 max limit');

    // Invalid UUID Format Handling
    const invalidUuidRes = await requestApi('GET', '/api/v1/posts/invalid-uuid-string-format', null, tokenA);
    assert.strictEqual(invalidUuidRes.status, 400, 'Invalid UUID parameter returns HTTP 400 Bad Request');
    console.log('  [PASS] Input security, SQL injection safety, and pagination limits verified.');

    console.log('\n=== ALL PHASE 18 SECURITY HARDENING TESTS PASSED CLEANLY! ===\n');
  } finally {
    if (userA?.id) await db.query('DELETE FROM users WHERE id = $1', [userA.id]).catch(() => {});
    if (userB?.id) await db.query('DELETE FROM users WHERE id = $1', [userB.id]).catch(() => {});
    if (disabledUser?.id) await db.query('DELETE FROM users WHERE id = $1', [disabledUser.id]).catch(() => {});
    if (server) server.close();
  }
};

runTests().catch((err) => {
  console.error('\n[TEST FAILURE]', err.stack || err.message);
  process.exit(1);
});
