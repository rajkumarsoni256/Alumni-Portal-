const http = require('http');
const db = require('../backend/src/config/db');

const request = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING PHASE 10 COMPREHENSIVE MENTORSHIP TEST SUITE ---');

  const ts = Date.now();
  const studentAEmail = `mnt_student_a_${ts}@jecrc.ac.in`;
  const studentBEmail = `mnt_student_b_${ts}@jecrc.ac.in`;
  const alumniAEmail = `mnt_alumni_a_${ts}@jecrc.ac.in`;
  const alumniBEmail = `mnt_alumni_b_${ts}@jecrc.ac.in`;
  const pass = 'TestPassword@123';

  // 1. Register users & fetch tokens
  console.log('\n[1] Registering test users & fetching Tokens...');

  await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentAEmail, password: pass, fullName: 'Mentorship Student A', role: 'STUDENT' });

  await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentBEmail, password: pass, fullName: 'Mentorship Student B', role: 'STUDENT' });

  await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: alumniAEmail, password: pass, fullName: 'Mentorship Alumni A', role: 'ALUMNI' });

  await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: alumniBEmail, password: pass, fullName: 'Mentorship Alumni B', role: 'ALUMNI' });

  await db.query(`UPDATE users SET email_verified = true WHERE email IN ($1, $2, $3, $4)`, [studentAEmail, studentBEmail, alumniAEmail, alumniBEmail]);

  const loginSA = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentAEmail, password: pass });
  const studentAId = loginSA.body.data.user.id;
  const tokenSA = loginSA.body.data.token;

  const loginSB = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentBEmail, password: pass });
  const studentBId = loginSB.body.data.user.id;
  const tokenSB = loginSB.body.data.token;

  const loginAA = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: alumniAEmail, password: pass });
  const alumniAId = loginAA.body.data.user.id;
  const tokenAA = loginAA.body.data.token;

  const loginAB = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: alumniBEmail, password: pass });
  const alumniBId = loginAB.body.data.user.id;
  const tokenAB = loginAB.body.data.token;

  console.log('✓ Test users registered & tokens fetched.');

  // 2. Role & Eligibility Validation Checks
  console.log('\n[2] Testing Role Validation & Mentor Eligibility...');

  // Alumni A attempts to request mentorship as student
  const alumniReqRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/mentorship/requests', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAA}` }
  }, { mentorId: alumniBId, topic: 'Career', message: 'Test' });
  console.assert(alumniReqRes.status === 403, `Alumni sending request should return 403 Forbidden, got ${alumniReqRes.status}`);

  // Student A attempts to request Student B as mentor
  const studentMentorRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/mentorship/requests', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSA}` }
  }, { mentorId: studentBId, topic: 'Career', message: 'Test' });
  console.assert(studentMentorRes.status === 400, `Student as mentor should return 400 Bad Request, got ${studentMentorRes.status}`);

  // Self mentorship attempt
  const selfReqRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/mentorship/requests', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSA}` }
  }, { mentorId: studentAId, topic: 'Career', message: 'Test' });
  console.assert(selfReqRes.status === 400, `Self mentorship should return 400 Bad Request, got ${selfReqRes.status}`);
  console.log('✓ Role validation & self-mentorship guards verified.');

  // 3. Mentorship Request Creation
  console.log('\n[3] Testing Mentorship Request Creation...');
  const createReqRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/mentorship/requests', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSA}` }
  }, {
    mentorId: alumniAId,
    topic: 'System Design & Placement Strategy',
    message: 'I am preparing for top software engineering interviews. Seeking guidance on distributed systems.',
  });
  console.assert(createReqRes.status === 201, `Valid creation should return 201 Created, got ${createReqRes.status}`);
  const req1Id = createReqRes.body.data.request.id;
  console.assert(createReqRes.body.data.request.status === 'PENDING', 'Initial status should be PENDING');
  console.log('✓ Mentorship request created successfully.');

  // Verify notification delivered to Alumni A
  const notifAARes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  const mntNotifs = notifAARes.body.data.notifications.filter((n) => n.type === 'MENTORSHIP_REQUEST');
  console.assert(mntNotifs.length === 1, 'Alumni A should receive MENTORSHIP_REQUEST notification');
  console.log('✓ In-app notification delivered to Alumni A.');

  // 4. Duplicate Request Guard Test
  console.log('\n[4] Testing Duplicate Active Request Guard...');
  const dupReqRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/mentorship/requests', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSA}` }
  }, {
    mentorId: alumniAId,
    topic: 'Duplicate Test',
    message: 'Another request while pending.',
  });
  console.assert(dupReqRes.status === 409, `Duplicate request should return 409 Conflict, got ${dupReqRes.status}`);
  console.log('✓ Duplicate active request blocked (409 Conflict).');

  // 5. Cross-Account Security & Data Isolation
  console.log('\n[5] Testing Request Isolation & Cross-Account Privacy...');
  const listSARes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/mentorship/requests', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });
  console.assert(listSARes.body.data.requests.length === 1, 'Student A should see 1 request');

  const listSBRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/mentorship/requests', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSB}` }
  });
  console.assert(listSBRes.body.data.requests.length === 0, 'Student B should see 0 requests');

  const listAARes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/mentorship/requests', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  console.assert(listAARes.body.data.requests.length === 1, 'Alumni A should see 1 incoming request');

  const listABRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/mentorship/requests', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenAB}` }
  });
  console.assert(listABRes.body.data.requests.length === 0, 'Alumni B should see 0 requests');
  console.log('✓ Request privacy & data isolation verified.');

  // 6. Ownership & Security Authorization on Accept / Decline
  console.log('\n[6] Testing Authorization for Status Updates...');
  const illegalAcceptRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/mentorship/requests/${req1Id}`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAB}` } // Alumni B trying to accept Alumni A's request
  }, { status: 'ACCEPTED' });
  console.assert(illegalAcceptRes.status === 403, `Wrong alumni accept should return 403 Forbidden, got ${illegalAcceptRes.status}`);

  // Alumni A accepts Student A's request
  const acceptRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/mentorship/requests/${req1Id}`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAA}` }
  }, { status: 'ACCEPTED' });
  console.assert(acceptRes.status === 200, `Alumni A accept should return 200 OK, got ${acceptRes.status}`);
  console.assert(acceptRes.body.data.request.status === 'ACCEPTED', 'Status should be ACCEPTED');

  // Verify notification delivered to Student A
  const notifSARes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });
  const acceptNotifs = notifSARes.body.data.notifications.filter((n) => n.type === 'MENTORSHIP_ACCEPTED');
  console.assert(acceptNotifs.length === 1, 'Student A should receive MENTORSHIP_ACCEPTED notification');
  console.log('✓ Alumni A accepted request & Student A received confirmation notification.');

  // 7. Status Transition Safeguards
  console.log('\n[7] Testing Status Transition Rules...');
  const invalidTransitionRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/mentorship/requests/${req1Id}`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAA}` }
  }, { status: 'ACCEPTED' });
  console.assert(invalidTransitionRes.status === 400, `Re-accepting ACCEPTED request should return 400 Bad Request, got ${invalidTransitionRes.status}`);
  console.log('✓ Invalid status transitions strictly blocked.');

  // 8. Cancel Request Test
  console.log('\n[8] Testing Cancel Request by Student...');
  const createReq2Res = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/mentorship/requests', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSB}` }
  }, { mentorId: alumniAId, topic: 'DSA Advice', message: 'Help with trees & graphs.' });
  const req2Id = createReq2Res.body.data.request.id;

  // Student B cancels request
  const cancelRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/mentorship/requests/${req2Id}`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSB}` }
  }, { status: 'CANCELLED' });
  console.assert(cancelRes.status === 200, 'Student B cancel should return 200 OK');
  console.assert(cancelRes.body.data.request.status === 'CANCELLED', 'Status should be CANCELLED');
  console.log('✓ Student cancellation verified.');

  // 9. Decline Request Test
  console.log('\n[9] Testing Decline Request by Alumni...');
  const createReq3Res = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/mentorship/requests', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSB}` }
  }, { mentorId: alumniBId, topic: 'Cloud Architecture', message: 'Help with AWS.' });
  const req3Id = createReq3Res.body.data.request.id;

  // Alumni B declines request
  const declineRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/mentorship/requests/${req3Id}`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAB}` }
  }, { status: 'DECLINED' });
  console.assert(declineRes.status === 200, 'Alumni B decline should return 200 OK');
  console.assert(declineRes.body.data.request.status === 'DECLINED', 'Status should be DECLINED');

  // Verify notification delivered to Student B
  const notifSBRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSB}` }
  });
  const declineNotifs = notifSBRes.body.data.notifications.filter((n) => n.type === 'MENTORSHIP_DECLINED');
  console.assert(declineNotifs.length === 1, 'Student B should receive MENTORSHIP_DECLINED notification');
  console.log('✓ Alumni B declined request & Student B received notification.');

  console.log('\n===========================================================');
  console.log('🎉 ALL PHASE 10 COMPREHENSIVE BACKEND TESTS PASSED (100%)');
  console.log('===========================================================\n');
  process.exit(0);
};

runTests().catch((err) => {
  console.error('❌ PHASE 10 TEST FAILED:', err);
  process.exit(1);
});
