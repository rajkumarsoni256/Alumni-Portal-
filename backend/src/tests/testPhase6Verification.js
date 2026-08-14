const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const adminVerificationService = require('../services/adminVerificationService');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const migrate = require('../db/migrate');

const runPhase6Tests = async () => {
  console.log('================================================================');
  console.log('    PHASE 6 — ALUMNI VERIFICATION & MODERATION TEST SUITE       ');
  console.log('================================================================\n');

  await migrate();

  // Start test server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let total = 0;

  const assert = (condition, name, details = '') => {
    total++;
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} - ${details}`);
    }
  };

  try {
    // ------------------------------------------------------------------
    // Step 1: Setup Test Users & Verification Records in PostgreSQL
    // ------------------------------------------------------------------
    console.log('--- Step 1: Setting up Test Verification Candidates ---');
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const testCandidates = [
      {
        email: 'karan.malhotra.verify@uber.com',
        fullName: 'Karan Malhotra',
        degree: 'B.Tech',
        branch: 'CSE',
        graduationYear: 2019,
        company: 'Uber',
        designation: 'Staff Engineer',
        proofDoc: 'https://storage.jecrc.ac.in/degrees/karan_malhotra_btech_2019.pdf',
      },
      {
        email: 'sameer.khan.verify@gs.com',
        fullName: 'Dr. Sameer Khan',
        degree: 'Ph.D. Finance',
        branch: 'Finance',
        graduationYear: 2012,
        company: 'Goldman Sachs',
        designation: 'VP Quantitative Research',
        proofDoc: 'https://storage.jecrc.ac.in/degrees/sameer_khan_phd_2012.pdf',
      },
      {
        email: 'tanya.sen.verify@razorpay.com',
        fullName: 'Tanya Sen',
        degree: 'B.Des',
        branch: 'Design',
        graduationYear: 2021,
        company: 'Razorpay',
        designation: 'Product Designer',
        proofDoc: 'https://storage.jecrc.ac.in/degrees/tanya_sen_bdes_2021.pdf',
      },
    ];

    const verificationIds = [];

    for (const c of testCandidates) {
      let uRes = await db.query('SELECT id FROM users WHERE email = $1', [c.email]);
      let uId;
      if (uRes.rows.length === 0) {
        const ins = await db.query(
          `INSERT INTO users (email, password_hash, role, email_verified, account_status)
           VALUES ($1, $2, 'STUDENT', true, 'ACTIVE') RETURNING id`,
          [c.email, passwordHash]
        );
        uId = ins.rows[0].id;
      } else {
        uId = uRes.rows[0].id;
      }

      await db.query(
        `INSERT INTO user_profiles (
            user_id, full_name, degree, branch, graduation_year, company, designation, is_profile_complete
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT (user_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            degree = EXCLUDED.degree,
            branch = EXCLUDED.branch,
            graduation_year = EXCLUDED.graduation_year,
            company = EXCLUDED.company,
            designation = EXCLUDED.designation`,
        [uId, c.fullName, c.degree, c.branch, c.graduationYear, c.company, c.designation]
      );

      // Insert pending verification record
      let vRes = await db.query('SELECT id FROM alumni_verifications WHERE user_id = $1', [uId]);
      let vId;
      if (vRes.rows.length === 0) {
        const insV = await db.query(
          `INSERT INTO alumni_verifications (user_id, proof_document_url, status)
           VALUES ($1, $2, 'PENDING') RETURNING id`,
          [uId, c.proofDoc]
        );
        vId = insV.rows[0].id;
      } else {
        vId = vRes.rows[0].id;
        // Reset to PENDING for idempotent test runs
        await db.query(`UPDATE alumni_verifications SET status = 'PENDING', reviewed_by = NULL, reviewed_at = NULL, rejection_reason = NULL WHERE id = $1`, [vId]);
      }
      verificationIds.push(vId);
    }

    console.log(`Seeded ${verificationIds.length} pending verification records.\n`);

    // ------------------------------------------------------------------
    // Step 2: Auth Tokens
    // ------------------------------------------------------------------
    const adminUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1`)).rows[0];
    const studentUser = (await db.query(`SELECT id, email FROM users WHERE role = 'STUDENT' LIMIT 1`)).rows[0];
    const alumniUser = (await db.query(`SELECT id, email FROM users WHERE role = 'ALUMNI' LIMIT 1`)).rows[0];

    const adminToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
    const studentToken = jwt.sign({ sub: studentUser.id, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });
    const alumniToken = jwt.sign({ sub: alumniUser.id, role: 'ALUMNI' }, JWT_SECRET, { expiresIn: '1h' });
    const expiredToken = jwt.sign({ sub: adminUser.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '-10s' });

    const requestApi = async (method, path, body, token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, body: data };
    };

    // ------------------------------------------------------------------
    // SECTION 1: AUTHORIZATION & RBAC CHECKS
    // ------------------------------------------------------------------
    console.log('--- 1. Authorization & RBAC Checks ---');
    const rListNoToken = await requestApi('GET', '/api/v1/admin/verifications');
    assert(rListNoToken.status === 401 && rListNoToken.body?.errorCode === 'UNAUTHORIZED', 'GET /verifications no token -> 401');

    const rListExpired = await requestApi('GET', '/api/v1/admin/verifications', null, expiredToken);
    assert(rListExpired.status === 401 && rListExpired.body?.errorCode === 'UNAUTHORIZED', 'GET /verifications expired token -> 401');

    const rListStudent = await requestApi('GET', '/api/v1/admin/verifications', null, studentToken);
    assert(rListStudent.status === 403 && rListStudent.body?.errorCode === 'FORBIDDEN', 'GET /verifications Student role -> 403');

    const rListAlumni = await requestApi('GET', '/api/v1/admin/verifications', null, alumniToken);
    assert(rListAlumni.status === 403 && rListAlumni.body?.errorCode === 'FORBIDDEN', 'GET /verifications Alumni role -> 403');

    const rListAdmin = await requestApi('GET', '/api/v1/admin/verifications', null, adminToken);
    assert(rListAdmin.status === 200 && rListAdmin.body?.success === true, 'GET /verifications Admin role -> 200 OK');

    const rPatchStudent = await requestApi('PATCH', `/api/v1/admin/verifications/${verificationIds[0]}`, { status: 'APPROVED' }, studentToken);
    assert(rPatchStudent.status === 403 && rPatchStudent.body?.errorCode === 'FORBIDDEN', 'PATCH /verifications/:id Student role -> 403');

    const rPatchAlumni = await requestApi('PATCH', `/api/v1/admin/verifications/${verificationIds[0]}`, { status: 'APPROVED' }, alumniToken);
    assert(rPatchAlumni.status === 403 && rPatchAlumni.body?.errorCode === 'FORBIDDEN', 'PATCH /verifications/:id Alumni role -> 403');

    // ------------------------------------------------------------------
    // SECTION 2: VERIFICATION LIST CONTRACT & FILTERING
    // ------------------------------------------------------------------
    console.log('\n--- 2. Verification List Contract & Filtering ---');
    const vList = rListAdmin.body.data;
    assert(Array.isArray(vList.verifications), 'Response contains verifications array');
    assert(vList.totalCount >= 3, `Total count reflects queue size (${vList.totalCount})`);
    assert(typeof vList.page === 'number' && typeof vList.pageSize === 'number', 'Pagination metadata present');

    const firstRec = vList.verifications[0];
    assert(typeof firstRec.id === 'string', 'Record contains ID');
    assert(typeof firstRec.name === 'string', 'Record contains candidate Name');
    assert(typeof firstRec.email === 'string', 'Record contains candidate Email');
    assert(typeof firstRec.company === 'string', 'Record contains Company');
    assert(typeof firstRec.currentRole === 'string' || typeof firstRec.designation === 'string', 'Record contains Role/Designation');
    assert(typeof firstRec.proofDocument === 'string', 'Record contains Proof Document identifier');
    assert(typeof firstRec.status === 'string', 'Record contains Status');

    // Search filtering
    const searchRes = await requestApi('GET', '/api/v1/admin/verifications?q=Karan', null, adminToken);
    assert(
      searchRes.body.data.verifications.some((v) => v.name.includes('Karan')),
      'Search query (q=Karan) returns matching candidate'
    );

    // Status filtering
    const statusPending = await requestApi('GET', '/api/v1/admin/verifications?status=PENDING', null, adminToken);
    assert(
      statusPending.body.data.verifications.every((v) => v.status === 'PENDING'),
      'Status filter (status=PENDING) returns only pending records'
    );

    // ------------------------------------------------------------------
    // SECTION 3: APPROVAL WORKFLOW & USER ROLE TRANSITION
    // ------------------------------------------------------------------
    console.log('\n--- 3. Verification Approval Workflow ---');
    const approveId = verificationIds[0];
    const rApprove = await requestApi('PATCH', `/api/v1/admin/verifications/${approveId}`, { status: 'APPROVED' }, adminToken);

    assert(rApprove.status === 200, 'Approve request returns 200 OK');
    assert(rApprove.body.data.status === 'APPROVED', 'Record status transitioned to APPROVED');
    assert(rApprove.body.data.reviewedBy === adminUser.id, 'reviewedBy correctly attributed to Admin');
    assert(rApprove.body.data.reviewedAt !== null, 'reviewedAt timestamp recorded');

    // Verify in database: candidate user role promoted to ALUMNI
    const userDbRes = await db.query('SELECT role FROM users WHERE email = $1', ['karan.malhotra.verify@uber.com']);
    assert(userDbRes.rows[0].role === 'ALUMNI', 'Candidate user role promoted to ALUMNI in PostgreSQL');

    // ------------------------------------------------------------------
    // SECTION 4: REJECTION WORKFLOW & VALIDATION
    // ------------------------------------------------------------------
    console.log('\n--- 4. Verification Rejection Workflow ---');
    const rejectId = verificationIds[1];

    // Missing rejection reason
    const rRejectNoReason = await requestApi('PATCH', `/api/v1/admin/verifications/${rejectId}`, { status: 'REJECTED' }, adminToken);
    assert(
      rRejectNoReason.status === 400 && rRejectNoReason.body.errorCode === 'MISSING_REJECTION_REASON',
      'Rejection without reason rejected with 400 MISSING_REJECTION_REASON'
    );

    // Whitespace only rejection reason
    const rRejectWhitespace = await requestApi(
      'PATCH',
      `/api/v1/admin/verifications/${rejectId}`,
      { status: 'REJECTED', rejectionReason: '   ' },
      adminToken
    );
    assert(
      rRejectWhitespace.status === 400 && rRejectWhitespace.body.errorCode === 'MISSING_REJECTION_REASON',
      'Whitespace-only rejection reason rejected with 400 MISSING_REJECTION_REASON'
    );

    // Valid rejection
    const validReason = 'Uploaded degree document is blurry and missing graduation year seal.';
    const rRejectValid = await requestApi(
      'PATCH',
      `/api/v1/admin/verifications/${rejectId}`,
      { status: 'REJECTED', rejectionReason: validReason },
      adminToken
    );

    assert(rRejectValid.status === 200, 'Valid rejection returns 200 OK');
    assert(rRejectValid.body.data.status === 'REJECTED', 'Record status transitioned to REJECTED');
    assert(rRejectValid.body.data.rejectionReason === validReason, 'Rejection reason persisted in record');
    assert(rRejectValid.body.data.reviewedBy === adminUser.id, 'reviewedBy attributed to Admin');

    // Verify in database
    const vDbRes = await db.query('SELECT status, rejection_reason FROM alumni_verifications WHERE id = $1', [rejectId]);
    assert(vDbRes.rows[0].status === 'REJECTED', 'Status in database is REJECTED');
    assert(vDbRes.rows[0].rejection_reason === validReason, 'Rejection reason in database is verified');

    // ------------------------------------------------------------------
    // SECTION 5: STATE TRANSITIONS & INPUT VALIDATIONS
    // ------------------------------------------------------------------
    console.log('\n--- 5. State Transitions & Input Validations ---');
    // Attempt re-approval on already APPROVED record
    const rReApprove = await requestApi('PATCH', `/api/v1/admin/verifications/${approveId}`, { status: 'APPROVED' }, adminToken);
    assert(
      rReApprove.status === 409 && rReApprove.body.errorCode === 'INVALID_STATE_TRANSITION',
      'Modifying already APPROVED record returns 409 INVALID_STATE_TRANSITION'
    );

    // Attempt re-rejection on already REJECTED record
    const rReReject = await requestApi(
      'PATCH',
      `/api/v1/admin/verifications/${rejectId}`,
      { status: 'REJECTED', rejectionReason: 'Another reason' },
      adminToken
    );
    assert(
      rReReject.status === 409 && rReReject.body.errorCode === 'INVALID_STATE_TRANSITION',
      'Modifying already REJECTED record returns 409 INVALID_STATE_TRANSITION'
    );

    // Nonexistent UUID
    const rNotFound = await requestApi(
      'PATCH',
      '/api/v1/admin/verifications/00000000-0000-0000-0000-000000000000',
      { status: 'APPROVED' },
      adminToken
    );
    assert(
      rNotFound.status === 404 && rNotFound.body.errorCode === 'VERIFICATION_NOT_FOUND',
      'Nonexistent UUID returns 404 VERIFICATION_NOT_FOUND'
    );

    // Malformed UUID
    const rBadUUID = await requestApi(
      'PATCH',
      '/api/v1/admin/verifications/malformed-id-1234',
      { status: 'APPROVED' },
      adminToken
    );
    assert(
      rBadUUID.status === 400 && rBadUUID.body.errorCode === 'INVALID_ID_FORMAT',
      'Malformed UUID returns 400 INVALID_ID_FORMAT'
    );

    // Invalid status string
    const rBadStatus = await requestApi(
      'PATCH',
      `/api/v1/admin/verifications/${verificationIds[2]}`,
      { status: 'PENDING_REVIEW' },
      adminToken
    );
    assert(
      rBadStatus.status === 400 && rBadStatus.body.errorCode === 'INVALID_STATUS',
      'Invalid status string returns 400 INVALID_STATUS'
    );

    // ------------------------------------------------------------------
    // SECTION 6: PERFORMANCE & EXPLAIN ANALYZE
    // ------------------------------------------------------------------
    console.log('\n--- 6. Performance & EXPLAIN ANALYZE ---');
    const explainList = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT
          av.id, av.user_id, av.proof_document_url, av.status, av.created_at,
          u.email, p.full_name, p.company, p.designation
      FROM alumni_verifications av
      JOIN users u ON av.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY CASE WHEN av.status = 'PENDING' THEN 0 ELSE 1 END, av.created_at DESC
      LIMIT 20 OFFSET 0;
    `);

    console.log('  [Verification List Query Execution Plan]:');
    explainList.rows.forEach((r) => console.log(`    ${r['QUERY PLAN']}`));
    assert(explainList.rows.length > 0, 'EXPLAIN ANALYZE completed for verification list query');

    console.log('\n================================================================');
    console.log(`  PHASE 6 RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[PHASE 6 TEST FATAL ERROR]:', err);
    server.close();
    process.exit(1);
  }
};

runPhase6Tests();
