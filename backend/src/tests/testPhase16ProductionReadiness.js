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

const runTests = async () => {
  console.log('=== PHASE 16: PRODUCTION READINESS & RELIABILITY BENCHMARK SUITE ===\n');

  // 1. Run Migration to ensure latest indices are active
  console.log('--- TEST 1: Database Migration & Index Verification ---');
  await migrate();
  
  const indexRes = await db.query(`
    SELECT indexname FROM pg_indexes 
    WHERE indexname IN ('idx_connections_accepted_pair', 'idx_notifications_recipient_unread_created', 'idx_user_profiles_search_composite')
  `);
  const foundIndexes = indexRes.rows.map((r) => r.indexname);
  console.log(`  Found indices: ${foundIndexes.join(', ')}`);
  assert.ok(foundIndexes.includes('idx_connections_accepted_pair'), 'idx_connections_accepted_pair index active');
  assert.ok(foundIndexes.includes('idx_notifications_recipient_unread_created'), 'idx_notifications_recipient_unread_created index active');
  console.log('  [PASS] Composite performance indexes present in PostgreSQL schema.');

  // Start HTTP Server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`\n[TEST SERVER] Listening on ${baseUrl}`);

  let testUser = null;
  let testToken = '';

  try {
    // 2. Setup Test User
    const email = `test_p16_${Date.now()}@jecrc.ac.in`;
    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, 'hash_p16', 'STUDENT', true, 'ACTIVE') RETURNING *`,
      [email]
    );
    testUser = userRes.rows[0];

    await db.query(
      `INSERT INTO user_profiles (id, user_id, full_name, degree, branch, graduation_year, company, is_profile_complete)
       VALUES (gen_random_uuid(), $1, 'Test User P16', 'B.Tech', 'CSE', 2026, 'JECRC', true)`,
      [testUser.id]
    );

    testToken = jwt.sign({ id: testUser.id, email, role: 'STUDENT' }, getJwtSecret(), { expiresIn: '1h' });

    // 3. EXPLAIN (ANALYZE, BUFFERS) Diagnostic Checks
    console.log('\n--- TEST 2: EXPLAIN ANALYZE Query Diagnostics ---');
    
    const explainUsers = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT u.id AS user_id, u.email, u.role, p.full_name, p.company, COUNT(*) OVER() AS total_count
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.account_status != 'DISABLED'
      ORDER BY p.updated_at DESC NULLS LAST
      LIMIT 20 OFFSET 0
    `);
    const usersPlan = explainUsers.rows[0]['QUERY PLAN'][0];
    const usersExecTime = usersPlan['Execution Time'];
    console.log(`  EXPLAIN GET /users Execution Time: ${usersExecTime.toFixed(2)} ms`);
    assert.ok(usersExecTime < 100, `GET /users DB execution time (${usersExecTime}ms) sub-100ms`);

    const explainNotifs = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT n.*, u_actor.email AS actor_email, p_actor.full_name AS actor_name
      FROM notifications n
      LEFT JOIN users u_actor ON n.actor_id = u_actor.id
      LEFT JOIN user_profiles p_actor ON u_actor.id = p_actor.user_id
      WHERE n.recipient_id = $1
      ORDER BY n.created_at DESC
      LIMIT 20 OFFSET 0
    `, [testUser.id]);
    const notifsPlan = explainNotifs.rows[0]['QUERY PLAN'][0];
    const notifsExecTime = notifsPlan['Execution Time'];
    console.log(`  EXPLAIN GET /notifications Execution Time: ${notifsExecTime.toFixed(2)} ms`);
    assert.ok(notifsExecTime < 100, `GET /notifications DB execution time (${notifsExecTime}ms) sub-100ms`);

    console.log('  [PASS] All target queries execute under 100ms at database layer.');

    // 4. HTTP API Latency Benchmark
    console.log('\n--- TEST 3: HTTP API Endpoint Latency Benchmarks ---');
    
    const usersReq = await requestApi('GET', '/api/v1/users?limit=10', null, testToken);
    assert.strictEqual(usersReq.status, 200, 'GET /users returns 200');
    console.log(`  GET /api/v1/users HTTP latency: ${usersReq.duration} ms`);
    assert.ok(usersReq.duration < 500, `GET /api/v1/users HTTP response under 500ms (actual: ${usersReq.duration}ms)`);

    const notifsReq = await requestApi('GET', '/api/v1/notifications?limit=10', null, testToken);
    assert.strictEqual(notifsReq.status, 200, 'GET /notifications returns 200');
    console.log(`  GET /api/v1/notifications HTTP latency: ${notifsReq.duration} ms`);
    assert.ok(notifsReq.duration < 500, `GET /api/v1/notifications HTTP response under 500ms (actual: ${notifsReq.duration}ms)`);

    const connsReq = await requestApi('GET', '/api/v1/connections', null, testToken);
    assert.strictEqual(connsReq.status, 200, 'GET /connections returns 200');
    console.log(`  GET /api/v1/connections HTTP latency: ${connsReq.duration} ms`);
    assert.ok(connsReq.duration < 500, `GET /api/v1/connections HTTP response under 500ms (actual: ${connsReq.duration}ms)`);

    console.log('  [PASS] Endpoint HTTP latency targets satisfied.');

    // 5. Parallel Boot Burst Concurrency Test
    console.log('\n--- TEST 4: Multi-Request Parallel Boot Burst Concurrency ---');
    const startParallel = Date.now();
    const parallelPromises = [
      requestApi('GET', '/api/v1/profiles/me', null, testToken),
      requestApi('GET', '/api/v1/users?limit=10', null, testToken),
      requestApi('GET', '/api/v1/connections', null, testToken),
      requestApi('GET', '/api/v1/notifications', null, testToken),
      requestApi('GET', '/api/v1/events', null, testToken),
      requestApi('GET', '/api/v1/settings', null, testToken),
      requestApi('GET', '/api/v1/posts?limit=5', null, testToken),
      requestApi('GET', '/api/v1/connections/requests/incoming', null, testToken),
    ];

    const results = await Promise.all(parallelPromises);
    const totalParallelDuration = Date.now() - startParallel;

    const allSuccessful = results.every((r) => r.status >= 200 && r.status < 300);
    assert.ok(allSuccessful, 'All 8 concurrent boot requests return 2xx OK');
    console.log(`  8 Parallel Boot Requests Completed in: ${totalParallelDuration} ms total`);
    assert.ok(totalParallelDuration < 1000, `Parallel boot burst under 1000ms total (actual: ${totalParallelDuration}ms)`);
    console.log('  [PASS] Database pool handled 8 concurrent boot requests cleanly under 1 second.');

    console.log('\n=== ALL PHASE 16 PRODUCTION READINESS TESTS PASSED CLEANLY! ===\n');
  } finally {
    if (testUser?.id) {
      await db.query('DELETE FROM users WHERE id = $1', [testUser.id]).catch(() => {});
    }
    if (server) {
      server.close();
    }
  }
};

runTests().catch((err) => {
  console.error('\n[TEST FAILURE]', err.stack || err.message);
  process.exit(1);
});
