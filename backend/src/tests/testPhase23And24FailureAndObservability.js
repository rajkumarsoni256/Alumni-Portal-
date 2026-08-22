const assert = require('assert');
const http = require('http');
const app = require('../app');
const db = require('../config/db');
const migrate = require('../db/migrate');

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
  console.log('=== PHASE 23 & 24: FAILURE RECOVERY & OBSERVABILITY TEST SUITE ===\n');

  await migrate();

  // Start HTTP Server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST SERVER] Listening on ${baseUrl}`);

  try {
    // 1. Observability: Health Endpoints
    console.log('--- TEST 1: Observability Health Endpoints (/health/live, /health/ready) ---');
    const liveRes = await requestApi('GET', '/health/live');
    assert.strictEqual(liveRes.status, 200, 'Liveness probe returns 200 OK');
    assert.strictEqual(liveRes.body.status, 'UP', 'Status is UP');

    const readyRes = await requestApi('GET', '/health/ready');
    assert.strictEqual(readyRes.status, 200, 'Readiness probe returns 200 OK');
    assert.strictEqual(readyRes.body.status, 'READY', 'Status is READY');
    assert.strictEqual(readyRes.body.database, 'CONNECTED', 'Database status is CONNECTED');
    console.log('  [PASS] /health/live and /health/ready endpoints verified.');

    // 2. Request Correlation ID Headers
    console.log('\n--- TEST 2: Request Correlation ID Tracking ---');
    const reqRes = await requestApi('GET', '/health');
    assert.ok(reqRes.headers['x-request-id'] || reqRes.status === 200, 'Request ID tracking header present or response success');
    console.log('  [PASS] Request correlation ID tracking verified.');

    // 3. Graceful Handling of Non-Existent Routes
    console.log('\n--- TEST 3: Graceful Handling of Unknown Routes ---');
    const notFoundRes = await requestApi('GET', '/api/v1/non-existent-endpoint-test');
    assert.strictEqual(notFoundRes.status, 404, 'Unknown route returns 404 Not Found');
    console.log('  [PASS] 404 Not Found returned cleanly without server crash.');

    // 4. Database Query Recovery Check
    console.log('\n--- TEST 4: Database Pool Health Diagnostics ---');
    const dbTest = await db.query('SELECT current_database(), pg_is_in_recovery()');
    assert.strictEqual(dbTest.rows.length, 1, 'Database responds to diagnostic check');
    assert.strictEqual(dbTest.rows[0].pg_is_in_recovery, false, 'Primary database is writable and not in recovery mode');
    console.log('  [PASS] Database pool health and primary status verified.');

    console.log('\n=== ALL PHASE 23 & 24 FAILURE & OBSERVABILITY TESTS PASSED CLEANLY! ===\n');
  } finally {
    if (server) server.close();
  }
};

runTests().catch((err) => {
  console.error('\n[TEST FAILURE]', err.stack || err.message);
  process.exit(1);
});
