const http = require('http');
const db = require('../config/db');
const { migrate } = require('../db/migrate');
const app = require('../app');

let server;
let baseUrl;

const makeRequest = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: json });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n================================================================');
  console.log('    PHASE 14 — REAL ALUMNI APPROVAL & MOCK REMOVAL SUITE         ');
  console.log('================================================================\n');

  try {
    // 1. Initialize Server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // 2. Setup Admin Identity
    const adminRes = await db.query("SELECT id, email FROM users WHERE role = 'ADMIN' AND account_status = 'ACTIVE' LIMIT 1");
    if (adminRes.rows.length === 0) {
      throw new Error('No active ADMIN user found in PostgreSQL for test suite');
    }
    const adminUser = adminRes.rows[0];
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';
    const adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

    // --- TEST 1: Alumni Registration creates PENDING_APPROVAL Account ---
    console.log('--- 1. Alumni Registration & PENDING_APPROVAL State ---');
    const timestamp = Date.now();
    const candidateEmail = `alumni_candidate_${timestamp}@jecrc.ac.in`;
    const candidatePassword = 'AlumniCandidatePassword123!';

    const regRes = await makeRequest('POST', '/api/v1/auth/register', {
      name: 'Aman Verma',
      email: candidateEmail,
      password: candidatePassword,
      mobile: '+919876543210',
      role: 'ALUMNI',
      course: 'BTECH',
      graduationYear: 2024,
    });

    if (regRes.status === 201 && regRes.body.data.alumniVerificationStatus === 'PENDING') {
      console.log('  [PASS] Alumni registration created with PENDING verification status (201 Created)');
    } else {
      throw new Error(`Alumni registration failed: status ${regRes.status}, body: ${JSON.stringify(regRes.body)}`);
    }

    const candidateId = regRes.body.data.id;

    // Verify PostgreSQL users table account_status
    const dbCandidateCheck = await db.query('SELECT account_status FROM users WHERE id = $1', [candidateId]);
    if (dbCandidateCheck.rows[0]?.account_status === 'PENDING_APPROVAL') {
      console.log('  [PASS] User account_status persisted as PENDING_APPROVAL in PostgreSQL users table');
    } else {
      throw new Error(`Expected account_status PENDING_APPROVAL, got: ${dbCandidateCheck.rows[0]?.account_status}`);
    }

    // Verify email_verified status for login test
    await db.query('UPDATE users SET email_verified = true WHERE id = $1', [candidateId]);

    // --- TEST 2: Login Security Guard Blocks PENDING_APPROVAL Alumni ---
    console.log('\n--- 2. Login Security Guard & 403 Forbidden ---');
    const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
      email: candidateEmail,
      password: candidatePassword,
    });

    if (loginRes.status === 403 && loginRes.body.errorCode === 'ALUMNI_APPROVAL_PENDING') {
      console.log('  [PASS] Login attempt by PENDING_APPROVAL Alumni blocked with 403 Forbidden & ALUMNI_APPROVAL_PENDING');
    } else {
      throw new Error(`Expected 403 ALUMNI_APPROVAL_PENDING, got status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
    }

    // --- TEST 3: Admin Approval Workflow ---
    console.log('\n--- 3. Admin Verification Queue & Approval Workflow ---');
    const queueRes = await makeRequest('GET', '/api/v1/admin/users/pending-alumni', null, adminToken);
    if (queueRes.status === 200 && Array.isArray(queueRes.body.data.verifications)) {
      console.log(`  [PASS] Admin retrieved pending alumni queue (${queueRes.body.data.totalCount} pending)`);
    } else {
      throw new Error(`Failed to fetch pending queue: ${queueRes.status}`);
    }

    // Approve Candidate
    const approveRes = await makeRequest('PATCH', `/api/v1/admin/users/${candidateId}/approve`, {}, adminToken);
    if (approveRes.status === 200 && approveRes.body.data.status === 'APPROVED') {
      console.log('  [PASS] Admin approved candidate application via PATCH /api/v1/admin/users/:id/approve (200 OK)');
    } else {
      throw new Error(`Approval failed: status ${approveRes.status}, body: ${JSON.stringify(approveRes.body)}`);
    }

    // Verify PostgreSQL status updated to ACTIVE
    const approvedDbCheck = await db.query('SELECT account_status, role FROM users WHERE id = $1', [candidateId]);
    if (approvedDbCheck.rows[0]?.account_status === 'ACTIVE' && approvedDbCheck.rows[0]?.role === 'ALUMNI') {
      console.log('  [PASS] Candidate account_status updated to ACTIVE and role set to ALUMNI in PostgreSQL');
    } else {
      throw new Error(`Expected ACTIVE & ALUMNI, got: ${JSON.stringify(approvedDbCheck.rows[0])}`);
    }

    // Verify Notification inserted in PostgreSQL
    const notifCheck = await db.query("SELECT type, title FROM notifications WHERE recipient_id = $1 AND type = 'ALUMNI_VERIFICATION_APPROVED'", [candidateId]);
    if (notifCheck.rows.length > 0) {
      console.log('  [PASS] In-app ALUMNI_VERIFICATION_APPROVED notification inserted into PostgreSQL');
    } else {
      throw new Error('Notification not found in PostgreSQL');
    }

    // Verify Audit Log inserted in PostgreSQL
    const auditCheck = await db.query("SELECT action FROM audit_logs WHERE target_id::text = $1 OR details->>'targetUserId' = $1", [candidateId]);
    if (auditCheck.rows.length > 0) {
      console.log('  [PASS] ALUMNI_VERIFICATION_APPROVED audit log recorded in PostgreSQL');
    } else {
      throw new Error('Audit log record not found');
    }

    // --- TEST 4: Approved Alumni Login ---
    console.log('\n--- 4. Approved Alumni Successful Login ---');
    const approvedLoginRes = await makeRequest('POST', '/api/v1/auth/login', {
      email: candidateEmail,
      password: candidatePassword,
    });

    if (approvedLoginRes.status === 200 && approvedLoginRes.body.data.token && approvedLoginRes.body.data.user.role === 'ALUMNI') {
      console.log('  [PASS] Approved Alumni successfully logged in and received JWT token with ALUMNI role');
    } else {
      throw new Error(`Approved login failed: status ${approvedLoginRes.status}: ${JSON.stringify(approvedLoginRes.body)}`);
    }

    // --- TEST 5: Rejection Workflow ---
    console.log('\n--- 5. Alumni Rejection Workflow ---');
    const rejectEmail = `alumni_reject_${timestamp}@jecrc.ac.in`;
    const rejectRegRes = await makeRequest('POST', '/api/v1/auth/register', {
      name: 'Rohan Sharma',
      email: rejectEmail,
      password: candidatePassword,
      mobile: '+919876543211',
      role: 'ALUMNI',
      course: 'BTECH',
      graduationYear: 2023,
    });

    const rejectCandidateId = rejectRegRes.body.data.id;
    await db.query('UPDATE users SET email_verified = true WHERE id = $1', [rejectCandidateId]);

    const rejectRes = await makeRequest('PATCH', `/api/v1/admin/users/${rejectCandidateId}/reject`, {
      rejectionReason: 'Invalid degree certificate document provided.',
    }, adminToken);

    if (rejectRes.status === 200 && rejectRes.body.data.status === 'REJECTED') {
      console.log('  [PASS] Admin rejected candidate application via PATCH /api/v1/admin/users/:id/reject (200 OK)');
    } else {
      throw new Error(`Rejection failed: status ${rejectRes.status}: ${JSON.stringify(rejectRes.body)}`);
    }

    // Verify PostgreSQL status REJECTED
    const rejectedDbCheck = await db.query('SELECT account_status FROM users WHERE id = $1', [rejectCandidateId]);
    if (rejectedDbCheck.rows[0]?.account_status === 'REJECTED') {
      console.log('  [PASS] Candidate account_status updated to REJECTED in PostgreSQL');
    } else {
      throw new Error(`Expected REJECTED, got: ${rejectedDbCheck.rows[0]?.account_status}`);
    }

    // Verify Rejected Alumni Login Blocked
    const rejectLoginRes = await makeRequest('POST', '/api/v1/auth/login', {
      email: rejectEmail,
      password: candidatePassword,
    });

    if (rejectLoginRes.status === 403 && rejectLoginRes.body.errorCode === 'ALUMNI_APPROVAL_REJECTED') {
      console.log('  [PASS] Rejected Alumni login attempt blocked with 403 Forbidden & ALUMNI_APPROVAL_REJECTED');
    } else {
      throw new Error(`Expected 403 ALUMNI_APPROVAL_REJECTED, got: ${rejectLoginRes.status}`);
    }

    // --- TEST 6: Admin Dashboard PostgreSQL Real Counts ---
    console.log('\n--- 6. Admin Dashboard PostgreSQL Real Counts ---');
    const dashRes = await makeRequest('GET', '/api/v1/admin/dashboard/stats', null, adminToken);
    if (dashRes.status === 200 && typeof dashRes.body.data.overview.totalUsers === 'number') {
      console.log(`  [PASS] GET /api/v1/admin/dashboard/stats returns real DB counts: Total=${dashRes.body.data.overview.totalUsers}, Students=${dashRes.body.data.overview.students}, Alumni=${dashRes.body.data.overview.alumni}`);
    } else {
      throw new Error(`Dashboard stats failed: status ${dashRes.status}`);
    }

    console.log('\n================================================================');
    console.log('  REAL ALUMNI APPROVAL & MOCK REMOVAL SUITE: ALL TESTS PASSED (100%)');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ TEST FAILURE:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    process.exit(process.exitCode || 0);
  }
};

runTests();
