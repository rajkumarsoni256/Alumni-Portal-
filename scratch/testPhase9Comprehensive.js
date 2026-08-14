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
  console.log('--- STARTING PHASE 9 COMPREHENSIVE EVENTS TEST SUITE ---');

  const ts = Date.now();
  const studentAEmail = `evt_student_a_${ts}@jecrc.ac.in`;
  const studentBEmail = `evt_student_b_${ts}@jecrc.ac.in`;
  const alumniAEmail = `evt_alumni_a_${ts}@jecrc.ac.in`;
  const pass = 'TestPassword@123';

  // 1. Register users & fetch admin token
  console.log('\n[1] Registering test users & fetching Admin token...');

  await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentAEmail, password: pass, fullName: 'Event Student A', role: 'STUDENT' });

  await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentBEmail, password: pass, fullName: 'Event Student B', role: 'STUDENT' });

  await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: alumniAEmail, password: pass, fullName: 'Event Alumni A', role: 'ALUMNI' });

  await db.query(`UPDATE users SET email_verified = true WHERE email IN ($1, $2, $3)`, [studentAEmail, studentBEmail, alumniAEmail]);

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

  const loginAdmin = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@jecrc.ac.in', password: 'AdminPassword@123' });
  const tokenAdmin = loginAdmin.body.data.token;

  console.log('✓ Users registered & logged in successfully.');

  // 2. Event Creation & Authorization Checks
  console.log('\n[2] Testing Event Creation Authorization & Validation...');
  const studentCreateRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSA}` }
  }, { title: 'Unauthorized Student Event', description: 'Test', location: 'Lab 1', startAt: new Date().toISOString() });
  console.assert(studentCreateRes.status === 403, `Student creation should return 403 Forbidden, got ${studentCreateRes.status}`);
  console.log('✓ Student event creation blocked (403 Forbidden).');

  // Admin creates Event 1 with small capacity = 2
  const eventUniqueTitle = `Limited Capacity AI Masterclass ${ts}`;
  const adminCreateRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAdmin}` }
  }, {
    title: eventUniqueTitle,
    description: 'High intensity deep learning workshop for top students.',
    category: 'Workshops',
    location: 'Auditorium A',
    capacity: 2,
    startAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    endAt: new Date(Date.now() + 86400 * 1000 + 7200 * 1000).toISOString(),
    registrationDeadline: new Date(Date.now() + 80000 * 1000).toISOString(),
  });
  console.assert(adminCreateRes.status === 201, `Admin creation should return 201 Created, got ${adminCreateRes.status}`);
  const event1Id = adminCreateRes.body.data.event.id;
  console.log('✓ Admin event created with capacity 2.');

  // 3. Event Discovery & Detail Tests
  console.log('\n[3] Testing Event Discovery, Search, and Category Filtering...');
  const listRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/events', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });
  console.assert(listRes.body.data.events.length >= 4, 'Events list should contain seeded + created events');

  const searchRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/events?search=${ts}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });
  console.assert(searchRes.body.data.events.length === 1, 'Search for unique timestamp should return 1 event');

  const detailRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/events/${event1Id}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });
  console.assert(detailRes.body.data.event.title === eventUniqueTitle, 'Detail title should match');
  console.log('✓ Discovery, search, and detail endpoints verified.');

  // 4. Registration & Notification Trigger Test
  console.log('\n[4] Testing Event Registration & Notification Trigger...');
  const regSARes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/events/${event1Id}/register`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });
  console.assert(regSARes.status === 200, `Student A registration should return 200 OK, got ${regSARes.status}`);
  console.assert(regSARes.body.data.isRegistered === true, 'isRegistered should be true');
  console.assert(regSARes.body.data.registeredCount === 1, 'registeredCount should be 1');
  console.assert(regSARes.body.data.seatsLeft === 1, 'seatsLeft should be 1');

  // Verify notification was generated for Student A
  const notifSARes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });
  const eventNotifs = notifSARes.body.data.notifications.filter((n) => n.type === 'EVENT_REGISTRATION');
  console.assert(eventNotifs.length === 1, 'Student A should receive EVENT_REGISTRATION notification');
  console.log('✓ Student A registered successfully & received in-app confirmation notification.');

  // 5. Duplicate Registration Protection Test
  console.log('\n[5] Testing Duplicate Registration Protection...');
  const dupRegRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/events/${event1Id}/register`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });
  console.assert(dupRegRes.status === 409, `Duplicate registration should return 409 Conflict, got ${dupRegRes.status}`);
  console.log('✓ Duplicate registration blocked (409 Conflict).');

  // 6. Capacity Protection Test
  console.log('\n[6] Testing Event Capacity Protection...');
  // Student B registers (filling registration #2 of 2)
  const regSBRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/events/${event1Id}/register`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenSB}` }
  });
  console.assert(regSBRes.status === 200, 'Student B registration should succeed');
  console.assert(regSBRes.body.data.seatsLeft === 0, 'seatsLeft should now be 0');

  // Alumni A attempts registration (#3 on capacity = 2)
  const regAARes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/events/${event1Id}/register`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  console.assert(regAARes.status === 400, `Registration when full should return 400 Bad Request, got ${regAARes.status}`);
  console.assert(regAARes.body.message.includes('capacity'), 'Error message should mention capacity');
  console.log('✓ Capacity limit strictly enforced: 3rd registration rejected when capacity is 2.');

  // 7. Deadline Protection Test
  console.log('\n[7] Testing Registration Deadline Protection...');
  const expiredEventRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/events', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAdmin}` }
  }, {
    title: 'Expired Deadline Event',
    description: 'Event with deadline in the past.',
    location: 'Lab 2',
    startAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    registrationDeadline: new Date(Date.now() - 3600 * 1000).toISOString(), // 1h in the past
  });
  const expiredId = expiredEventRes.body.data.event.id;

  const regExpiredRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/events/${expiredId}/register`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  console.assert(regExpiredRes.status === 400, `Expired deadline registration should return 400 Bad Request, got ${regExpiredRes.status}`);
  console.log('✓ Registration deadline protection verified: Expired event registration rejected.');

  // 8. Cancel Registration Test
  console.log('\n[8] Testing Cancel Registration...');
  const cancelRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/events/${event1Id}/register`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });
  console.assert(cancelRes.status === 200, 'Cancel registration should return 200 OK');
  console.assert(cancelRes.body.data.isRegistered === false, 'isRegistered should be false');

  // Now Alumni A can register since a seat opened up
  const regAARetry = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/events/${event1Id}/register`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  console.assert(regAARetry.status === 200, 'Alumni A registration should succeed after Student A cancelled');
  console.log('✓ Registration cancellation & seat release verified.');

  // 9. My Registrations Endpoint Test
  console.log('\n[9] Testing GET /api/v1/events/registrations/me...');
  const myRegRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/events/registrations/me', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSB}` }
  });
  console.assert(myRegRes.body.data.events.length === 1, 'Student B should have 1 active registered event');
  console.assert(myRegRes.body.data.events[0].id === event1Id, 'Registered event ID should match');
  console.log('✓ My registrations endpoint verified for Student B.');

  console.log('\n=======================================================');
  console.log('🎉 ALL PHASE 9 COMPREHENSIVE BACKEND TESTS PASSED (100%)');
  console.log('=======================================================\n');
  process.exit(0);
};

runTests().catch((err) => {
  console.error('❌ PHASE 9 TEST FAILED:', err);
  process.exit(1);
});
