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

const calculatePercentiles = (durations) => {
  const sorted = [...durations].sort((a, b) => a - b);
  const len = sorted.length;
  const p50 = sorted[Math.floor(len * 0.5)];
  const p95 = sorted[Math.floor(len * 0.95)];
  const p99 = sorted[Math.floor(len * 0.99)];
  return { p50, p95, p99, min: sorted[0], max: sorted[len - 1] };
};

const runTests = async () => {
  console.log('=== PHASE 21: PRODUCTION API & DATABASE PERFORMANCE BENCHMARK SUITE ===\n');

  await migrate();

  // Start HTTP Server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST SERVER] Listening on ${baseUrl}`);

  let testUser = null;
  let testToken = '';

  try {
    // Create Test User
    const email = `perf_p21_${Date.now()}@jecrc.ac.in`;
    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, 'hash_p21', 'STUDENT', true, 'ACTIVE') RETURNING *`,
      [email]
    );
    testUser = userRes.rows[0];

    await db.query(
      `INSERT INTO user_profiles (id, user_id, full_name, degree, branch, graduation_year, company, is_profile_complete)
       VALUES (gen_random_uuid(), $1, 'Performance Tester', 'B.Tech', 'CSE', 2026, 'JECRC Lab', true)`,
      [testUser.id]
    );

    testToken = jwt.sign({ id: testUser.id, email, role: 'STUDENT' }, getJwtSecret(), { expiresIn: '1h' });

    const endpoints = [
      { name: 'GET /health', path: '/health', targetP95: 50, auth: false },
      { name: 'GET /api/v1/auth/me', path: '/api/v1/auth/me', targetP95: 300, auth: true },
      { name: 'GET /api/v1/profiles/me', path: '/api/v1/profiles/me', targetP95: 300, auth: true },
      { name: 'GET /api/v1/users', path: '/api/v1/users', targetP95: 300, auth: true },
      { name: 'GET /api/v1/notifications', path: '/api/v1/notifications', targetP95: 300, auth: true },
      { name: 'GET /api/v1/connections', path: '/api/v1/connections', targetP95: 300, auth: true },
      { name: 'GET /api/v1/posts', path: '/api/v1/posts', targetP95: 500, auth: true },
      { name: 'GET /api/v1/events', path: '/api/v1/events', targetP95: 500, auth: true },
    ];

    console.log('--- EXECUTING 20 SAMPLE ITERATIONS PER ENDPOINT ---');
    console.log('Endpoint'.padEnd(30) + 'P50 (ms)'.padStart(10) + 'P95 (ms)'.padStart(10) + 'P99 (ms)'.padStart(10) + 'Target (ms)'.padStart(14) + 'Status'.padStart(10));
    console.log('-'.repeat(84));

    for (const ep of endpoints) {
      const durations = [];
      const token = ep.auth ? testToken : null;

      // Warm-up request
      await requestApi('GET', ep.path, null, token);

      for (let i = 0; i < 20; i++) {
        const res = await requestApi('GET', ep.path, null, token);
        assert.strictEqual(res.status, 200, `${ep.name} returns 200 OK`);
        durations.push(res.duration);
      }

      const stats = calculatePercentiles(durations);
      const isPassed = stats.p95 <= ep.targetP95;
      const statusText = isPassed ? 'PASS' : 'FAIL';

      console.log(
        ep.name.padEnd(30) +
        `${stats.p50} ms`.padStart(10) +
        `${stats.p95} ms`.padStart(10) +
        `${stats.p99} ms`.padStart(10) +
        `< ${ep.targetP95} ms`.padStart(14) +
        statusText.padStart(10)
      );

      assert.ok(isPassed, `${ep.name} P95 latency (${stats.p95}ms) satisfies target (<${ep.targetP95}ms)`);
    }

    console.log('\n--- EXPLAIN (ANALYZE, BUFFERS) QUERY PERFORMANCE DIAGNOSTICS ---');
    const postsExplain = await db.query(`EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM posts ORDER BY created_at DESC LIMIT 10`);
    const usersExplain = await db.query(`EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM user_profiles ORDER BY updated_at DESC LIMIT 10`);

    const postsExecTime = parseFloat((postsExplain.rows.find(r => r['QUERY PLAN'].includes('Execution Time:')) || {})['QUERY PLAN']?.split(':')[1] || '0');
    const usersExecTime = parseFloat((usersExplain.rows.find(r => r['QUERY PLAN'].includes('Execution Time:')) || {})['QUERY PLAN']?.split(':')[1] || '0');

    console.log(`  EXPLAIN /posts DB Execution Time: ${postsExecTime} ms`);
    console.log(`  EXPLAIN /users DB Execution Time: ${usersExecTime} ms`);
    assert.ok(postsExecTime < 50, 'Posts DB query executes under 50ms');
    assert.ok(usersExecTime < 50, 'Users DB query executes under 50ms');

    console.log('\n=== ALL PHASE 21 PRODUCTION PERFORMANCE BENCHMARKS PASSED CLEANLY! ===\n');
  } finally {
    if (testUser?.id) await db.query('DELETE FROM users WHERE id = $1', [testUser.id]).catch(() => {});
    if (server) server.close();
  }
};

runTests().catch((err) => {
  console.error('\n[TEST FAILURE]', err.stack || err.message);
  process.exit(1);
});
