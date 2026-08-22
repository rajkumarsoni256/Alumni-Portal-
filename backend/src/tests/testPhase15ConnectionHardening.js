const assert = require('assert');
const http = require('http');
const app = require('../app');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const ioClient = require('socket.io-client');
const { initSocketServer } = require('../socket/socketServer');

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret_key_for_development';

let server = null;
let baseUrl = '';

const requestApi = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
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
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const runTests = async () => {
  console.log('=== PHASE 15: REAL-TIME CONNECTION & PROFILE HARDENING TESTS ===\n');

  // Start HTTP & Socket server
  server = http.createServer(app);
  initSocketServer(server);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST SERVER] Running on ${baseUrl}`);

  let testUserA = null;
  let testUserB = null;
  let tokenA = '';
  let tokenB = '';

  try {
    // 1. Create or fetch test users in DB
    const emailA = `test_p15_a_${Date.now()}@jecrc.ac.in`;
    const emailB = `test_p15_b_${Date.now()}@jecrc.ac.in`;

    const userARes = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, 'hash_a', 'STUDENT', true, 'ACTIVE') RETURNING *`,
      [emailA]
    );
    testUserA = userARes.rows[0];

    const userBRes = await db.query(
      `INSERT INTO users (email, password_hash, role, email_verified, account_status)
       VALUES ($1, 'hash_b', 'ALUMNI', true, 'ACTIVE') RETURNING *`,
      [emailB]
    );
    testUserB = userBRes.rows[0];

    // Insert profiles
    await db.query(
      `INSERT INTO user_profiles (id, user_id, full_name, degree, branch, graduation_year, company, designation, is_profile_complete)
       VALUES (gen_random_uuid(), $1, 'Nandita Sharma', 'B.Tech', 'Computer Science', 2026, 'JECRC Lab', 'Student Researcher', true)`,
      [testUserA.id]
    );

    await db.query(
      `INSERT INTO user_profiles (id, user_id, full_name, degree, branch, graduation_year, company, designation, is_profile_complete)
       VALUES (gen_random_uuid(), $1, 'Rahul Kumar', 'B.Tech', 'Information Technology', 2022, 'Google', 'Software Engineer', true)`,
      [testUserB.id]
    );

    tokenA = jwt.sign({ id: testUserA.id, email: emailA, role: 'STUDENT' }, getJwtSecret(), { expiresIn: '1h' });
    tokenB = jwt.sign({ id: testUserB.id, email: emailB, role: 'ALUMNI' }, getJwtSecret(), { expiresIn: '1h' });

    // TEST 1: Profile Response Normalization
    console.log('\n--- TEST 1: Profile Response Normalization ---');
    const profileRes = await requestApi('GET', `/api/v1/profiles/${testUserA.id}`, null, tokenB);
    assert.strictEqual(profileRes.status, 200, 'GET /api/v1/profiles/:id returns 200 OK');
    const pData = profileRes.body.data;
    assert.strictEqual(pData.name, 'Nandita Sharma', 'Name property exists');
    assert.strictEqual(pData.fullName, 'Nandita Sharma', 'FullName property exists');
    assert.strictEqual(pData.full_name, 'Nandita Sharma', 'Full_name property exists');
    assert.ok(pData.headline, 'Headline property exists');
    assert.strictEqual(pData.connectionStatus, 'NONE', 'Initial connection status is NONE');
    console.log('  [PASS] Profile fields normalized cleanly with full alias support.');

    // TEST 2: Real-Time Socket Connection Events
    console.log('\n--- TEST 2: Real-Time Socket Connection Events ---');
    const socketB = ioClient(baseUrl, {
      auth: { token: tokenB },
      transports: ['websocket'],
    });

    await new Promise((resolve) => socketB.on('connect', resolve));
    console.log('  [PASS] Socket.IO Client B connected successfully.');

    let receivedSocketReq = null;
    let receivedSocketNotif = null;

    socketB.on('connection:request_received', (data) => {
      receivedSocketReq = data;
    });

    socketB.on('notification:new', (data) => {
      receivedSocketNotif = data;
    });

    // TEST 3: Send Connection Request from User A to User B
    console.log('\n--- TEST 3: Send Connection Request & DB/Socket Notification ---');
    const sendRes = await requestApi('POST', '/api/v1/connections/request', { targetUserId: testUserB.id }, tokenA);
    assert.strictEqual(sendRes.status, 201, 'POST /connections/request returns 201 Created');
    assert.strictEqual(sendRes.body.data.status, 'PENDING_SENT', 'Returns status PENDING_SENT');

    // Wait 500ms for Socket push
    await new Promise((r) => setTimeout(r, 500));

    assert.ok(receivedSocketReq, 'Socket B received connection:request_received event');
    assert.strictEqual(receivedSocketReq.status, 'PENDING_RECEIVED', 'Socket event status is PENDING_RECEIVED');
    assert.ok(receivedSocketNotif, 'Socket B received notification:new event');
    assert.strictEqual(receivedSocketNotif.type, 'CONNECTION_REQUEST', 'Notification type is CONNECTION_REQUEST');
    console.log('  [PASS] Real-time request delivered via Socket.IO instantly.');

    // TEST 4: Duplicate Connection Guarantee (Database Unique Constraint uq_connection_pair)
    console.log('\n--- TEST 4: Duplicate Connection Prevention ---');
    const dupRes = await requestApi('POST', '/api/v1/connections/request', { targetUserId: testUserB.id }, tokenA);
    assert.strictEqual(dupRes.status, 409, 'Duplicate request rejected with 409 Conflict');

    const revDupRes = await requestApi('POST', '/api/v1/connections/request', { targetUserId: testUserA.id }, tokenB);
    assert.strictEqual(revDupRes.status, 409, 'Reverse direction duplicate request rejected with 409 Conflict');
    console.log('  [PASS] Database-level uniqueness constraint uq_connection_pair prevents duplicates.');

    // TEST 5: Accept Connection Request Real-Time Flow
    console.log('\n--- TEST 5: Accept Connection Request & Real-Time Sync ---');
    const socketA = ioClient(baseUrl, {
      auth: { token: tokenA },
      transports: ['websocket'],
    });

    await new Promise((resolve) => socketA.on('connect', resolve));
    let socketAAccepted = null;

    socketA.on('connection:accepted', (data) => {
      socketAAccepted = data;
    });

    const acceptRes = await requestApi('POST', `/api/v1/connections/${testUserA.id}/accept`, null, tokenB);
    assert.strictEqual(acceptRes.status, 200, 'Accept request returns 200 OK');
    assert.strictEqual(acceptRes.body.data.status, 'CONNECTED', 'Status updated to CONNECTED');

    await new Promise((r) => setTimeout(r, 500));
    assert.ok(socketAAccepted, 'User A received connection:accepted real-time socket event');
    assert.strictEqual(socketAAccepted.status, 'CONNECTED', 'Socket payload status is CONNECTED');
    console.log('  [PASS] Real-time acceptance delivered to both clients.');

    // TEST 6: Check Updated Relationship Status on Profile Endpoint
    console.log('\n--- TEST 6: Verify Connected Relationship Status ---');
    const profileAfterRes = await requestApi('GET', `/api/v1/profiles/${testUserB.id}`, null, tokenA);
    assert.strictEqual(profileAfterRes.body.data.connectionStatus, 'CONNECTED', 'Profile endpoint reports CONNECTED');
    console.log('  [PASS] Profile endpoint reflects CONNECTED status.');

    socketA.disconnect();
    socketB.disconnect();
    console.log('\n=== ALL PHASE 15 CONNECTION HARDENING TESTS PASSED CLEANLY! ===\n');
  } finally {
    // Cleanup Test Users
    if (testUserA?.id) {
      await db.query('DELETE FROM users WHERE id IN ($1, $2)', [testUserA.id, testUserB.id]).catch(() => {});
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
