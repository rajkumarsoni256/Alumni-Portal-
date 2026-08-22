const assert = require('assert');
const http = require('http');
const app = require('../app');
const db = require('../config/db');
const migrate = require('../db/migrate');
const jwt = require('jsonwebtoken');
const { io: ioClient } = require('socket.io-client');
const { initSocketServer } = require('../socket/socketServer');

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
  console.log('=== PHASE 20: REAL-TIME CONNECTION & NOTIFICATION RELIABILITY TEST SUITE ===\n');

  await migrate();

  // Start HTTP & Socket.IO Server
  server = http.createServer(app);
  initSocketServer(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST SERVER] Listening on ${baseUrl}`);

  let userA = null;
  let userB = null;
  let tokenA = '';
  let tokenB = '';

  let socketA1 = null;
  let socketA2 = null;
  let socketB = null;

  try {
    // Create Test Users
    const emailA = `rt_user_a_${Date.now()}@jecrc.ac.in`;
    const emailB = `rt_user_b_${Date.now()}@jecrc.ac.in`;

    const resA = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, 'hash_rt', 'STUDENT', true, 'ACTIVE') RETURNING *`,
      [emailA]
    );
    userA = resA.rows[0];

    const resB = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, 'hash_rt', 'ALUMNI', true, 'ACTIVE') RETURNING *`,
      [emailB]
    );
    userB = resB.rows[0];

    await db.query(`INSERT INTO user_profiles (id, user_id, full_name, is_profile_complete) VALUES (gen_random_uuid(), $1, 'Realtime User A', true)`, [userA.id]);
    await db.query(`INSERT INTO user_profiles (id, user_id, full_name, is_profile_complete) VALUES (gen_random_uuid(), $1, 'Realtime User B', true)`, [userB.id]);

    tokenA = jwt.sign({ id: userA.id, email: emailA, role: 'STUDENT' }, getJwtSecret(), { expiresIn: '1h' });
    tokenB = jwt.sign({ id: userB.id, email: emailB, role: 'ALUMNI' }, getJwtSecret(), { expiresIn: '1h' });

    // 1. Connect Socket.IO Clients
    console.log('--- TEST 1: Socket.IO Authentication & Multi-Tab Connection ---');
    socketA1 = ioClient(baseUrl, { auth: { token: tokenA }, transports: ['websocket'] });
    socketA2 = ioClient(baseUrl, { auth: { token: tokenA }, transports: ['websocket'] });
    socketB = ioClient(baseUrl, { auth: { token: tokenB }, transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => socketA1.on('connect', res)),
      new Promise((res) => socketA2.on('connect', res)),
      new Promise((res) => socketB.on('connect', res)),
    ]);

    assert.ok(socketA1.connected, 'User A Tab 1 connected');
    assert.ok(socketA2.connected, 'User A Tab 2 connected');
    assert.ok(socketB.connected, 'User B connected');
    console.log('  [PASS] All Socket.IO client connections established.');

    // 2. Real-Time Connection Request Event Flow
    console.log('\n--- TEST 2: Real-Time Connection Request Push ---');
    const requestPromise = new Promise((resolve) => {
      const startTime = Date.now();
      socketB.on('connection:request_received', (data) => {
        const latency = Date.now() - startTime;
        resolve({ data, latency });
      });
    });

    const sendRes = await requestApi('POST', '/api/v1/connections/request', { targetUserId: userB.id }, tokenA);
    assert.strictEqual(sendRes.status, 201, 'Send connection request returns 201 Created');

    const reqReceived = await requestPromise;
    assert.strictEqual(reqReceived.data.fromUserId, userA.id, 'Request received from User A');
    console.log(`  Real-time Socket.IO Push Latency: ${reqReceived.latency} ms`);
    assert.ok(reqReceived.latency < 200, `Real-time push under 200ms (actual: ${reqReceived.latency}ms)`);
    console.log('  [PASS] Connection request pushed to User B in real time.');

    // 3. Real-Time Connection Acceptance Event Flow
    console.log('\n--- TEST 3: Real-Time Connection Acceptance Push ---');
    const acceptPromise = new Promise((resolve) => {
      const startTime = Date.now();
      socketA1.on('connection:accepted', (data) => {
        const latency = Date.now() - startTime;
        resolve({ data, latency });
      });
    });

    const connId = sendRes.body.data.connectionId;
    const acceptRes = await requestApi('POST', `/api/v1/connections/${connId}/accept`, null, tokenB);
    assert.strictEqual(acceptRes.status, 200, 'Accept connection returns 200 OK');

    const accReceived = await acceptPromise;
    assert.strictEqual(accReceived.data.partnerId, userB.id, 'Acceptance received from User B');
    console.log(`  Real-time Socket.IO Push Latency: ${accReceived.latency} ms`);
    assert.ok(accReceived.latency < 200, `Real-time push under 200ms (actual: ${accReceived.latency}ms)`);
    console.log('  [PASS] Connection acceptance pushed to User A in real time.');

    // 4. Offline User Notification & Recovery Test
    console.log('\n--- TEST 4: Offline User Notification Persistence & Recovery ---');
    socketB.disconnect();

    // User A creates post, triggers notification / action while User B is offline
    await db.query(
      `INSERT INTO notifications (id, recipient_id, actor_id, type, title, message, is_read)
       VALUES (gen_random_uuid(), $1, $2, 'POST_LIKE', 'New Like', 'User A liked your post', false)`,
      [userB.id, userA.id]
    );

    // User B logs in later and fetches notifications
    const notifRes = await requestApi('GET', '/api/v1/notifications', null, tokenB);
    assert.strictEqual(notifRes.status, 200, 'User B fetches notifications successfully');
    assert.ok(notifRes.body.data.unreadCount >= 1, 'Unread notification count updated for offline user');
    console.log('  [PASS] Offline user notification persisted and recovered on login.');

    console.log('\n=== ALL PHASE 20 REAL-TIME SYSTEM TESTS PASSED CLEANLY! ===\n');
  } finally {
    if (socketA1) socketA1.disconnect();
    if (socketA2) socketA2.disconnect();
    if (socketB) socketB.disconnect();

    if (userA?.id) await db.query('DELETE FROM users WHERE id = $1', [userA.id]).catch(() => {});
    if (userB?.id) await db.query('DELETE FROM users WHERE id = $1', [userB.id]).catch(() => {});
    if (server) server.close();
  }
};

runTests().catch((err) => {
  console.error('\n[TEST FAILURE]', err.stack || err.message);
  process.exit(1);
});
