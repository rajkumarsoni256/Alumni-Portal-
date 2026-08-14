require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const app = require('../app');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_123';
const PORT = 8089;

let server;
let adminToken;
let studentToken;
let alumniToken;

let adminUserId;
let studentUserId;
let alumniUserId;

const requestApi = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, `http://localhost:${PORT}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          if (rawData) parsed = JSON.parse(rawData);
        } catch (e) {
          parsed = rawData;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const setupTestUsers = async () => {
  await db.query(`DELETE FROM users WHERE email LIKE '%_test_p14admin@jecrc.ac.in';`);

  // 1. Admin
  const adminRes = await db.query(`
    INSERT INTO users (email, password_hash, role, account_status, email_verified, created_at)
    VALUES ('admin_test_p14admin@jecrc.ac.in', 'hash', 'ADMIN', 'ACTIVE', true, CURRENT_TIMESTAMP)
    RETURNING id;
  `);
  adminUserId = adminRes.rows[0].id;
  await db.query(`
    INSERT INTO user_profiles (user_id, full_name, designation, company, is_profile_complete)
    VALUES ($1, 'Admin Test User', 'Dean of Alumni', 'JECRC University', true);
  `, [adminUserId]);
  adminToken = jwt.sign({ id: adminUserId, email: 'admin_test_p14admin@jecrc.ac.in', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

  // 2. Student
  const studentRes = await db.query(`
    INSERT INTO users (email, password_hash, role, account_status, email_verified, created_at)
    VALUES ('student_test_p14admin@jecrc.ac.in', 'hash', 'STUDENT', 'ACTIVE', true, CURRENT_TIMESTAMP)
    RETURNING id;
  `);
  studentUserId = studentRes.rows[0].id;
  await db.query(`
    INSERT INTO user_profiles (user_id, full_name, university_roll_number, course, branch, joining_year, graduation_year, is_profile_complete)
    VALUES ($1, 'Student Test User', '24BCON0999', 'BCON', 'CSE', 2024, 2028, true);
  `, [studentUserId]);
  studentToken = jwt.sign({ id: studentUserId, email: 'student_test_p14admin@jecrc.ac.in', role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });

  // 3. Alumni
  const alumniRes = await db.query(`
    INSERT INTO users (email, password_hash, role, account_status, email_verified, created_at)
    VALUES ('alumni_test_p14admin@jecrc.ac.in', 'hash', 'ALUMNI', 'ACTIVE', true, CURRENT_TIMESTAMP)
    RETURNING id;
  `);
  alumniUserId = alumniRes.rows[0].id;
  await db.query(`
    INSERT INTO user_profiles (user_id, full_name, university_roll_number, course, branch, joining_year, graduation_year, company, designation, is_profile_complete)
    VALUES ($1, 'Alumni Test User', '20BCON0888', 'BCON', 'CSE', 2020, 2024, 'Tech Corp', 'Software Engineer', true);
  `, [alumniUserId]);
  alumniToken = jwt.sign({ id: alumniUserId, email: 'alumni_test_p14admin@jecrc.ac.in', role: 'ALUMNI' }, JWT_SECRET, { expiresIn: '1h' });
};

const cleanupTestUsers = async () => {
  await db.query(`DELETE FROM users WHERE email LIKE '%_test_p14admin@jecrc.ac.in';`);
};

const runTests = async () => {
  console.log('\n================================================================');
  console.log('  PHASE 14 — ADMIN PORTAL MANAGEMENT REFACTOR SUITE             ');
  console.log('================================================================\n');

  server = app.listen(PORT);
  let testsPassed = 0;
  let testsTotal = 0;

  const test = (title, fn) => {
    testsTotal++;
    try {
      fn();
      console.log(`  [PASS] ${title}`);
      testsPassed++;
    } catch (err) {
      console.error(`  [FAIL] ${title}:`, err.message);
      throw err;
    }
  };

  const asyncTest = async (title, fn) => {
    testsTotal++;
    try {
      await fn();
      console.log(`  [PASS] ${title}`);
      testsPassed++;
    } catch (err) {
      console.error(`  [FAIL] ${title}:`, err.message);
      throw err;
    }
  };

  try {
    await setupTestUsers();

    // 1. RBAC Defense & Security Controls
    console.log('--- 1. RBAC Authorization & Security Guards ---');
    await asyncTest('Unauthenticated access to /api/v1/admin/dashboard/stats yields 401', async () => {
      const res = await requestApi('GET', '/api/v1/admin/dashboard/stats');
      assert.strictEqual(res.status, 401);
    });

    await asyncTest('Student token accessing Admin endpoint yields 403 Forbidden', async () => {
      const res = await requestApi('GET', '/api/v1/admin/dashboard/stats', null, studentToken);
      assert.strictEqual(res.status, 403);
    });

    await asyncTest('Alumni token accessing Admin endpoint yields 403 Forbidden', async () => {
      const res = await requestApi('GET', '/api/v1/admin/users', null, alumniToken);
      assert.strictEqual(res.status, 403);
    });

    await asyncTest('Admin token accessing /api/v1/admin/dashboard/stats returns 200 OK', async () => {
      const res = await requestApi('GET', '/api/v1/admin/dashboard/stats', null, adminToken);
      assert.strictEqual(res.status, 200);
      assert(res.body?.data?.overview?.totalUsers !== undefined, 'Contains totalUsers count');
    });

    // 2. User Directory & Account Status Control
    console.log('\n--- 2. Admin User Directory & Account Control ---');
    await asyncTest('Admin fetches paginated users list', async () => {
      const res = await requestApi('GET', '/api/v1/admin/users?page=1&limit=10', null, adminToken);
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body?.data?.users), 'Returns users array');
    });

    await asyncTest('Admin disables student account status', async () => {
      const res = await requestApi('PATCH', `/api/v1/admin/users/${studentUserId}/status`, { status: 'DISABLED' }, adminToken);
      assert.strictEqual(res.status, 200);
    });

    await asyncTest('Disabled student authentication attempt rejected with 401', async () => {
      const res = await requestApi('GET', '/api/v1/users/me', null, studentToken);
      assert.strictEqual(res.status, 401);
    });

    await asyncTest('Admin re-enables student account status', async () => {
      const res = await requestApi('PATCH', `/api/v1/admin/users/${studentUserId}/status`, { status: 'ACTIVE' }, adminToken);
      assert.strictEqual(res.status, 200);
    });

    // 3. Admin Job Management
    console.log('\n--- 3. Admin Official Job Management ---');
    let createdJobId;
    await asyncTest('Admin creates official JECRC Job opportunity (201 Created)', async () => {
      const payload = {
        title: 'Official JECRC Research Fellowship',
        company: 'JECRC Innovation Lab',
        type: 'Full-time',
        location: 'Jaipur, Rajasthan',
        salary: '₹60,000 / month',
        description: 'Lead AI research initiatives for institutional smart projects.',
        requirements: 'B.Tech in CSE / IT with high academic standing.',
        skills: 'Python, PyTorch, SQL',
        status: 'OPEN',
      };
      const res = await requestApi('POST', '/api/v1/admin/jobs', payload, adminToken);
      assert.strictEqual(res.status, 201);
      assert(res.body?.data?.id, 'Returns created job ID');
      createdJobId = res.body.data.id;
    });

    await asyncTest('Student applies to Admin-created job (201 Created)', async () => {
      const res = await requestApi('POST', `/api/v1/jobs/${createdJobId}/apply`, { coverNote: 'Interested in AI research.' }, studentToken);
      assert.strictEqual(res.status, 201);
    });

    await asyncTest('Admin retrieves job applicants list (200 OK)', async () => {
      const res = await requestApi('GET', `/api/v1/admin/jobs/${createdJobId}/applications`, null, adminToken);
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body?.data?.applicants), 'Returns applicants list');
      assert.strictEqual(res.body.data.applicants.length, 1, 'Contains 1 applicant');
    });

    await asyncTest('Admin exports job applicants CSV (200 OK)', async () => {
      const res = await requestApi('POST', `/api/v1/admin/jobs/${createdJobId}/applications/export`, null, adminToken);
      assert.strictEqual(res.status, 200);
      assert(res.headers['content-type']?.includes('text/csv'), 'Returns text/csv content type');
    });

    // 4. Admin Event Management
    console.log('\n--- 4. Admin Official Event Management ---');
    let createdEventId;
    await asyncTest('Admin creates official JECRC Event (201 Created)', async () => {
      const payload = {
        title: 'JECRC Annual Leadership Summit 2026',
        description: 'Keynote addresses from global alumni tech executives.',
        category: 'Reunions',
        eventType: 'ALUMNI_MEETUP',
        speaker: 'Vice Chancellor & Alumni Guests',
        location: 'Main Auditorium, JECRC Campus',
        capacity: 250,
        status: 'PUBLISHED',
      };
      const res = await requestApi('POST', '/api/v1/admin/events', payload, adminToken);
      assert.strictEqual(res.status, 201);
      assert(res.body?.data?.id, 'Returns created event ID');
      createdEventId = res.body.data.id;
    });

    await asyncTest('Student registers for Admin-created event (200 OK)', async () => {
      const res = await requestApi('POST', `/api/v1/events/${createdEventId}/register`, {}, studentToken);
      assert(res.status === 200 || res.status === 201, 'Registration returns 200 or 201');
    });

    await asyncTest('Admin views event registered attendees (200 OK)', async () => {
      const res = await requestApi('GET', `/api/v1/admin/events/${createdEventId}/registrations`, null, adminToken);
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body?.data?.attendees), 'Returns attendees list');
      assert.strictEqual(res.body.data.attendees.length, 1, 'Contains 1 registered attendee');
    });

    await asyncTest('Admin exports event attendees CSV (200 OK)', async () => {
      const res = await requestApi('POST', `/api/v1/admin/events/${createdEventId}/registrations/export`, null, adminToken);
      assert.strictEqual(res.status, 200);
      assert(res.headers['content-type']?.includes('text/csv'), 'Returns text/csv content type');
    });

    // 5. Feed Moderation
    console.log('\n--- 5. Content & Feed Moderation ---');
    let postToModerateId;
    await asyncTest('Student creates post for moderation test', async () => {
      const res = await requestApi('POST', '/api/v1/posts', { content: 'Test post for moderation audit.' }, studentToken);
      assert.strictEqual(res.status, 201);
      postToModerateId = res.body?.data?.id;
    });

    await asyncTest('Admin fetches posts for moderation list', async () => {
      const res = await requestApi('GET', '/api/v1/admin/posts', null, adminToken);
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body?.data?.posts), 'Returns posts list');
    });

    await asyncTest('Admin moderates and deletes student post (200 OK)', async () => {
      const res = await requestApi('DELETE', `/api/v1/admin/posts/${postToModerateId}`, null, adminToken);
      assert.strictEqual(res.status, 200);
    });

    // 6. Connections & Mentorship Oversight
    console.log('\n--- 6. Connections & Mentorship Administrative Oversight ---');
    await asyncTest('Admin fetches platform connections overview', async () => {
      const res = await requestApi('GET', '/api/v1/admin/connections', null, adminToken);
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body?.data?.connections), 'Returns connections overview list');
    });

    await asyncTest('Admin fetches mentorship requests oversight', async () => {
      const res = await requestApi('GET', '/api/v1/admin/mentorship', null, adminToken);
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body?.data?.mentorships), 'Returns mentorships oversight list');
    });

    // 7. Data Quality & CSV Export
    console.log('\n--- 7. Data Quality & Data Export ---');
    await asyncTest('Admin fetches data quality hygiene stats', async () => {
      const res = await requestApi('GET', '/api/v1/admin/data-quality/stats', null, adminToken);
      assert.strictEqual(res.status, 200);
    });

    await asyncTest('Admin exports users CSV with selected fields', async () => {
      const payload = {
        columns: ['name', 'email', 'role', 'branch', 'degree'],
      };
      const res = await requestApi('POST', '/api/v1/admin/users/export', payload, adminToken);
      assert.strictEqual(res.status, 200);
      assert(res.headers['content-type']?.includes('text/csv'), 'Returns text/csv content type');
    });

    console.log('\n================================================================');
    console.log(`  PHASE 14 RESULTS: ${testsPassed} / ${testsTotal} TESTS PASSED (100%)`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n[FATAL TEST FAILURE]:', err);
    process.exitCode = 1;
  } finally {
    await cleanupTestUsers().catch(() => {});
    if (server) server.close();
  }
};

runTests();
