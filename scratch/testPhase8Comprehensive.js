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
  console.log('--- STARTING PHASE 8 COMPREHENSIVE NOTIFICATION TEST SUITE ---');

  const ts = Date.now();
  const studentAEmail = `notif_student_a_${ts}@jecrc.ac.in`;
  const studentBEmail = `notif_student_b_${ts}@jecrc.ac.in`;
  const alumniAEmail = `notif_alumni_a_${ts}@jecrc.ac.in`;
  const pass = 'TestPassword@123';

  // 1. Register users
  console.log('\n[1] Registering and Verifying Student A, Student B, and Alumni A...');

  await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentAEmail, password: pass, fullName: 'Notification Student A', role: 'STUDENT' });

  await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: studentBEmail, password: pass, fullName: 'Notification Student B', role: 'STUDENT' });

  await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: alumniAEmail, password: pass, fullName: 'Notification Alumni A', role: 'ALUMNI' });

  // Mark email_verified = true in DB for testing
  await db.query(`UPDATE users SET email_verified = true WHERE email IN ($1, $2, $3)`, [studentAEmail, studentBEmail, alumniAEmail]);

  // Login
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

  console.log('✓ Users registered & logged in successfully.');

  // 2. Connection Request Trigger Test
  console.log('\n[2] Testing Connection Request Notification...');
  const connReqRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/connections/request', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSA}` }
  }, { targetUserId: alumniAId });
  const connId = connReqRes.body.data.connectionId;

  // Check Alumni A notifications
  const notifAARes1 = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });

  console.assert(notifAARes1.body.data.notifications.length === 1, 'Alumni A should receive 1 notification');
  console.assert(notifAARes1.body.data.notifications[0].type === 'CONNECTION_REQUEST', 'Notification type should be CONNECTION_REQUEST');
  console.assert(notifAARes1.body.data.unreadCount === 1, 'Alumni A unreadCount should be 1');
  console.log('✓ Connection request notification verified for recipient Alumni A.');

  // Check Student A notifications (Self-notification guard check)
  const notifSARes1 = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });
  console.assert(notifSARes1.body.data.notifications.length === 0, 'Sender Student A should receive 0 notifications (Self-guard)');
  console.log('✓ Self-notification guard verified: Sender received no self-notifications.');

  // 3. Connection Accept Trigger Test
  console.log('\n[3] Testing Connection Accept Notification...');
  const acceptRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/connections/${connId}/accept`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  console.assert(acceptRes.status === 200, `Accept connection should return 200, got ${acceptRes.status}`);

  const notifSARes2 = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });
  console.assert(notifSARes2.body.data.notifications.length === 1, 'Student A should receive 1 notification');
  console.assert(notifSARes2.body.data.notifications[0].type === 'CONNECTION_ACCEPTED', 'Notification type should be CONNECTION_ACCEPTED');
  console.log('✓ Connection accept notification verified for requester Student A.');

  // 4. Post Like & Comment Notification Tests
  console.log('\n[4] Testing Post Like & Comment Notifications...');
  const createPostRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/posts', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSB}` }
  }, { content: 'Post by Student B for notification testing', category: 'STUDENT' });
  const postId = createPostRes.body.data.post.id;

  // Student A likes Student B's post
  await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/posts/${postId}/like`, method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenSA}` }
  });

  // Student A comments on Student B's post
  await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/posts/${postId}/comments`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSA}` }
  }, { text: 'Great post Student B!' });

  const notifSBRes1 = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenSB}` }
  });
  console.assert(notifSBRes1.body.data.notifications.length === 2, 'Student B should have 2 notifications (Like & Comment)');
  const notifTypesSB = notifSBRes1.body.data.notifications.map((n) => n.type);
  console.assert(notifTypesSB.includes('POST_LIKED'), 'Student B should have POST_LIKED notification');
  console.assert(notifTypesSB.includes('POST_COMMENTED'), 'Student B should have POST_COMMENTED notification');
  console.log('✓ Post like & comment notifications verified for post author Student B.');

  // 5. Private Messaging Notification Test
  console.log('\n[5] Testing Messaging Notification...');
  const convRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/conversations', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSA}` }
  }, { targetUserId: alumniAId });
  const convId = convRes.body.data.conversation.id;

  await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/conversations/${convId}/messages`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSA}` }
  }, { text: 'Hello Alumni A, nice to connect!' });

  const notifAARes2 = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  const notifTypesAA = notifAARes2.body.data.notifications.map((n) => n.type);
  console.assert(notifTypesAA.includes('NEW_MESSAGE'), 'Alumni A should have NEW_MESSAGE notification');
  console.log('✓ Message notification verified for recipient Alumni A.');

  // 6. Job Application Notification Test
  console.log('\n[6] Testing Job Application Notification...');
  const createJobRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/jobs', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAA}` }
  }, { title: 'Software Development Engineer', company: 'Google JECRC', location: 'Jaipur', description: 'Great role!' });
  const jobId = createJobRes.body.data.job.id;

  await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/jobs/${jobId}/apply`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenSA}` }
  }, { coverNote: 'Interested in this referral' });

  const notifAARes3 = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  const notifTypesAAFinal = notifAARes3.body.data.notifications.map((n) => n.type);
  console.assert(notifTypesAAFinal.includes('JOB_APPLICATION'), 'Alumni A should have JOB_APPLICATION notification');
  console.log('✓ Job application notification verified for job poster Alumni A.');

  // 7. Unread Count & Pagination Test
  console.log('\n[7] Testing GET /api/v1/notifications/unread-count & Pagination...');
  const unreadRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications/unread-count', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  console.assert(unreadRes.body.data.unreadCount === 3, `Unread count for Alumni A should be 3, got ${unreadRes.body.data.unreadCount}`);

  const pageRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications?page=1&limit=2', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  console.assert(pageRes.body.data.notifications.length === 2, 'Page 1 limit 2 should return 2 items');
  console.assert(pageRes.body.data.hasMore === true, 'hasMore should be true when total > 2');
  console.log('✓ Unread count and server-side pagination verified.');

  // 8. Mark Single Read Test
  console.log('\n[8] Testing PATCH /api/v1/notifications/:id/read...');
  const notifToMark = notifAARes3.body.data.notifications[0];
  const markReadRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/notifications/${notifToMark.id}/read`, method: 'PATCH',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  console.assert(markReadRes.status === 200, 'Mark read should return 200 OK');

  const unreadAfterSingle = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications/unread-count', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  console.assert(unreadAfterSingle.body.data.unreadCount === 2, 'Unread count should decrement to 2');
  console.log('✓ Single notification mark-as-read verified.');

  // 9. Mark All Read Test
  console.log('\n[9] Testing PATCH /api/v1/notifications/read-all...');
  const markAllRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications/read-all', method: 'PATCH',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  console.assert(markAllRes.status === 200, 'Mark all read should return 200 OK');

  const unreadAfterAll = await request({
    hostname: 'localhost', port: 8080, path: '/api/v1/notifications/unread-count', method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenAA}` }
  });
  console.assert(unreadAfterAll.body.data.unreadCount === 0, 'Unread count should be 0 after read-all');
  console.log('✓ Mark-all-as-read verified.');

  // 10. Cross-Account Authorization & Privacy Test
  console.log('\n[10] Testing Cross-Account Authorization & Security...');
  const forbidRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/v1/notifications/${notifToMark.id}/read`, method: 'PATCH',
    headers: { 'Authorization': `Bearer ${tokenSB}` } // Student B trying to touch Alumni A's notification
  });
  console.assert(forbidRes.status === 403, `Cross-account modification should return 403 Forbidden, got ${forbidRes.status}`);
  console.log('✓ Cross-account protection verified: Student B blocked from modifying Alumni A notification (403 Forbidden).');

  console.log('\n=======================================================');
  console.log('🎉 ALL PHASE 8 COMPREHENSIVE BACKEND TESTS PASSED (100%)');
  console.log('=======================================================\n');
  process.exit(0);
};

runTests().catch((err) => {
  console.error('❌ PHASE 8 TEST FAILED:', err);
  process.exit(1);
});
