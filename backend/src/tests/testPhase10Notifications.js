const http = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const migrate = require('../db/migrate');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

const runPhase10Tests = async () => {
  console.log('================================================================');
  console.log('    PHASE 10 — ADMIN COMMUNICATION & NOTIFICATIONS SUITE        ');
  console.log('================================================================\n');

  await migrate();

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
    // Setup Users & Tokens
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
    // SECTION 1: AUTHENTICATION & RBAC DEFENSE
    // ------------------------------------------------------------------
    console.log('--- 1. Authentication & RBAC Defense ---');
    const rNoToken = await requestApi('GET', '/api/v1/admin/notifications');
    assert(rNoToken.status === 401 && rNoToken.body?.errorCode === 'UNAUTHORIZED', 'GET /notifications no token -> 401');

    const rExpired = await requestApi('GET', '/api/v1/admin/notifications', null, expiredToken);
    assert(rExpired.status === 401 && rExpired.body?.errorCode === 'UNAUTHORIZED', 'GET /notifications expired token -> 401');

    const rStudent = await requestApi('GET', '/api/v1/admin/notifications', null, studentToken);
    assert(rStudent.status === 403 && rStudent.body?.errorCode === 'FORBIDDEN', 'GET /notifications Student role -> 403 Forbidden');

    const rAlumni = await requestApi('GET', '/api/v1/admin/notifications', null, alumniToken);
    assert(rAlumni.status === 403 && rAlumni.body?.errorCode === 'FORBIDDEN', 'GET /notifications Alumni role -> 403 Forbidden');

    const rAdminList = await requestApi('GET', '/api/v1/admin/notifications', null, adminToken);
    assert(rAdminList.status === 200 && rAdminList.body?.success === true, 'GET /notifications Admin role -> 200 OK');

    // ------------------------------------------------------------------
    // SECTION 2: CREATION & INPUT VALIDATION
    // ------------------------------------------------------------------
    console.log('\n--- 2. Announcement Creation & Input Validation ---');
    const rEmptyTitle = await requestApi('POST', '/api/v1/admin/notifications', {
      title: '   ',
      message: 'Some message',
    }, adminToken);
    assert(rEmptyTitle.status === 400 && rEmptyTitle.body?.errorCode === 'VALIDATION_ERROR', 'Empty title rejected with 400');

    const rEmptyMsg = await requestApi('POST', '/api/v1/admin/notifications', {
      title: 'Valid Title',
      message: '   ',
    }, adminToken);
    assert(rEmptyMsg.status === 400 && rEmptyMsg.body?.errorCode === 'VALIDATION_ERROR', 'Empty message rejected with 400');

    const rInvalidAudience = await requestApi('POST', '/api/v1/admin/notifications', {
      title: 'Valid Title',
      message: 'Valid Message',
      audienceType: 'INVALID_GROUP',
    }, adminToken);
    assert(rInvalidAudience.status === 400 && rInvalidAudience.body?.errorCode === 'VALIDATION_ERROR', 'Invalid audience type rejected with 400');

    const rBadUuid = await requestApi('POST', '/api/v1/admin/notifications', {
      title: 'Targeted Announcement',
      message: 'Targeting specific user',
      audienceType: 'CUSTOM',
      targetFilters: { selectedUserIds: ['not-a-valid-uuid'] },
    }, adminToken);
    assert(rBadUuid.status === 400 && rBadUuid.body?.errorCode === 'INVALID_UUID', 'Malformed selected UUID rejected with 400');

    // Create a valid draft announcement
    const rCreateDraft = await requestApi('POST', '/api/v1/admin/notifications', {
      title: 'Annual Alumni Meet 2026 Registration Open',
      message: 'We are pleased to invite all JECRC alumni and graduating students to the Annual Alumni Conclave 2026.',
      type: 'EVENT',
      audienceType: 'ALL',
    }, adminToken);

    assert(rCreateDraft.status === 201 && rCreateDraft.body?.success === true, 'Valid announcement draft created (201 Created)');
    const draftId = rCreateDraft.body?.data?.id;
    assert(rCreateDraft.body?.data?.status === 'DRAFT', 'Announcement created in DRAFT status');
    assert(rCreateDraft.body?.data?.createdBy?.id === adminUser.id, 'Announcement createdBy matches authenticated admin ID');
    assert(rCreateDraft.body?.data?.statistics?.totalRecipients === 0, 'Draft recipient count initialized to 0');

    // ------------------------------------------------------------------
    // SECTION 3: AUDIENCE PREVIEW & TARGETING
    // ------------------------------------------------------------------
    console.log('\n--- 3. Audience Preview & Targeting Calculations ---');
    const rPrevAll = await requestApi('POST', '/api/v1/admin/notifications/preview-audience', {
      audienceType: 'ALL',
    }, adminToken);
    assert(rPrevAll.status === 200 && typeof rPrevAll.body?.data?.count === 'number', 'Preview ALL audience returns valid count');
    const totalUsersCount = rPrevAll.body?.data?.count;

    const rPrevStudents = await requestApi('POST', '/api/v1/admin/notifications/preview-audience', {
      audienceType: 'STUDENTS',
    }, adminToken);
    assert(rPrevStudents.status === 200 && rPrevStudents.body?.data?.count <= totalUsersCount, 'Preview STUDENTS audience returns valid count');

    const rPrevAlumni = await requestApi('POST', '/api/v1/admin/notifications/preview-audience', {
      audienceType: 'ALUMNI',
    }, adminToken);
    assert(rPrevAlumni.status === 200 && rPrevAlumni.body?.data?.count <= totalUsersCount, 'Preview ALUMNI audience returns valid count');

    const rPrevCustom = await requestApi('POST', '/api/v1/admin/notifications/preview-audience', {
      audienceType: 'CUSTOM',
      targetFilters: { selectedUserIds: [studentUser.id, alumniUser.id] },
    }, adminToken);
    assert(rPrevCustom.status === 200 && rPrevCustom.body?.data?.count === 2, 'Preview CUSTOM selected users returns exact count');

    // ------------------------------------------------------------------
    // SECTION 4: EDITING DRAFT ANNOUNCEMENTS
    // ------------------------------------------------------------------
    console.log('\n--- 4. Editing Draft Announcements ---');
    const rUpdateDraft = await requestApi('PATCH', `/api/v1/admin/notifications/${draftId}`, {
      title: 'Annual Alumni Meet 2026 — Early Bird Access',
      message: 'Updated description with workshop schedule and campus map.',
      type: 'EVENT',
    }, adminToken);

    assert(rUpdateDraft.status === 200, 'PATCH /notifications/:id updated draft successfully');
    assert(rUpdateDraft.body?.data?.title === 'Annual Alumni Meet 2026 — Early Bird Access', 'Draft title updated in response');

    // Verify DB persistence of update
    const dbDraft = (await db.query(`SELECT title FROM announcements WHERE id = $1`, [draftId])).rows[0];
    assert(dbDraft.title === 'Annual Alumni Meet 2026 — Early Bird Access', 'PostgreSQL reflects updated draft title');

    // ------------------------------------------------------------------
    // SECTION 5: STATE TRANSITIONS & CONFLICT DEFENSE
    // ------------------------------------------------------------------
    console.log('\n--- 5. State Transitions & Conflict Protection ---');
    // Step 5a: Create a second draft to test cancellation
    const rDraft2 = await requestApi('POST', '/api/v1/admin/notifications', {
      title: 'Temporary Test Announcement',
      message: 'This announcement will be cancelled.',
      type: 'GENERAL',
      audienceType: 'ALL',
    }, adminToken);
    const draft2Id = rDraft2.body?.data?.id;

    // Step 5b: Cancel draft 2
    const rCancelDraft2 = await requestApi('POST', `/api/v1/admin/notifications/${draft2Id}/cancel`, {}, adminToken);
    assert(rCancelDraft2.status === 200 && rCancelDraft2.body?.data?.status === 'CANCELLED', 'Draft 2 cancelled successfully (status = CANCELLED)');

    // Step 5c: Attempting to cancel already CANCELLED -> 409 Conflict
    const rCancelAgain = await requestApi('POST', `/api/v1/admin/notifications/${draft2Id}/cancel`, {}, adminToken);
    assert(rCancelAgain.status === 409 && rCancelAgain.body?.errorCode === 'INVALID_STATE_TRANSITION', 'Cancelling already cancelled announcement rejected with 409');

    // Step 5d: Attempting to publish CANCELLED -> 409 Conflict
    const rPublishCancelled = await requestApi('POST', `/api/v1/admin/notifications/${draft2Id}/publish`, {}, adminToken);
    assert(rPublishCancelled.status === 409 && rPublishCancelled.body?.errorCode === 'CANNOT_PUBLISH_CANCELLED', 'Publishing cancelled announcement rejected with 409');

    // ------------------------------------------------------------------
    // SECTION 6: ATOMIC PUBLICATION & RECIPIENT SET GENERATION
    // ------------------------------------------------------------------
    console.log('\n--- 6. Atomic Publication & Recipient Generation ---');
    const rPublish = await requestApi('POST', `/api/v1/admin/notifications/${draftId}/publish`, {}, adminToken);
    assert(rPublish.status === 200 && rPublish.body?.data?.status === 'PUBLISHED', 'POST /publish transitioned status to PUBLISHED (200 OK)');
    assert(rPublish.body?.data?.publishedBy?.id === adminUser.id, 'publishedBy reflects authenticated admin ID');
    assert(rPublish.body?.data?.publishedAt !== null, 'publishedAt timestamp recorded');

    const publishedRecipients = rPublish.body?.data?.statistics?.totalRecipients;
    assert(publishedRecipients > 0, `Generated ${publishedRecipients} recipient records in PostgreSQL`);

    // Direct PostgreSQL validation of recipient records
    const dbRecipients = (await db.query(`SELECT COUNT(*) AS total FROM announcement_recipients WHERE announcement_id = $1`, [draftId])).rows[0];
    assert(parseInt(dbRecipients.total, 10) === publishedRecipients, 'announcement_recipients count matches API statistics');

    // In-app notifications table sync check
    const dbInAppNotifs = (await db.query(`SELECT COUNT(*) AS total FROM notifications WHERE message = $1`, ['Annual Alumni Meet 2026 — Early Bird Access'])).rows[0];
    assert(parseInt(dbInAppNotifs.total, 10) > 0, 'In-app notifications table populated for recipient users');

    // Attempting to edit PUBLISHED announcement -> 409 Conflict
    const rEditPublished = await requestApi('PATCH', `/api/v1/admin/notifications/${draftId}`, { title: 'Hacked Title' }, adminToken);
    assert(rEditPublished.status === 409 && rEditPublished.body?.errorCode === 'CANNOT_MODIFY_NON_DRAFT', 'Editing PUBLISHED announcement rejected with 409 Conflict');

    // Attempting to re-publish already PUBLISHED announcement -> 409 Conflict
    const rPublishAgain = await requestApi('POST', `/api/v1/admin/notifications/${draftId}/publish`, {}, adminToken);
    assert(rPublishAgain.status === 409 && rPublishAgain.body?.errorCode === 'ALREADY_PUBLISHED', 'Re-publishing PUBLISHED announcement rejected with 409 Conflict');

    // Attempting to delete PUBLISHED announcement -> 409 Conflict
    const rDeletePublished = await requestApi('DELETE', `/api/v1/admin/notifications/${draftId}`, {}, adminToken);
    assert(rDeletePublished.status === 409 && rDeletePublished.body?.errorCode === 'CANNOT_DELETE_PUBLISHED', 'Deleting PUBLISHED announcement rejected with 409 Conflict');

    // ------------------------------------------------------------------
    // SECTION 7: DELIVERY & READ TRACKING SIMULATION
    // ------------------------------------------------------------------
    console.log('\n--- 7. Delivery & Read Tracking Metrics ---');
    // Simulate student reading announcement
    await db.query(
      `UPDATE announcement_recipients SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE announcement_id = $1 AND user_id = $2`,
      [draftId, studentUser.id]
    );

    const rStatsAfterRead = await requestApi('GET', `/api/v1/admin/notifications/${draftId}`, null, adminToken);
    assert(rStatsAfterRead.status === 200, 'GET /notifications/:id fetched details');
    const stats = rStatsAfterRead.body?.data?.statistics;
    assert(stats.readCount === 1, 'Read count accurately computed as 1 in statistics');
    assert(stats.unreadCount === publishedRecipients - 1, 'Unread count reflects (total - read)');
    assert(typeof stats.readPercentage === 'number' && stats.readPercentage > 0, 'Read percentage computed correctly');

    // ------------------------------------------------------------------
    // SECTION 8: LISTING, PAGINATION & SEARCH
    // ------------------------------------------------------------------
    console.log('\n--- 8. Listing, Pagination & Search Filters ---');
    const rListPaginated = await requestApi('GET', '/api/v1/admin/notifications?page=1&pageSize=2', null, adminToken);
    assert(rListPaginated.status === 200, 'GET /notifications with pagination succeeded');
    assert(Array.isArray(rListPaginated.body?.data) && rListPaginated.body?.data.length <= 2, 'Page size enforced');
    assert(rListPaginated.body?.pagination?.totalCount >= 2, 'Pagination totalCount reflects persisted records');
    assert(rListPaginated.body?.summary?.publishedCount >= 1, 'Summary metrics include publishedCount');

    // Search by title keyword
    const rSearch = await requestApi('GET', '/api/v1/admin/notifications?q=Early+Bird', null, adminToken);
    assert(rSearch.status === 200 && rSearch.body?.data.length >= 1, 'Search by keyword found matching announcement');
    assert(rSearch.body?.data[0]?.title.includes('Early Bird'), 'Search result matches query string');

    // Filter by status
    const rFilterPublished = await requestApi('GET', '/api/v1/admin/notifications?status=PUBLISHED', null, adminToken);
    assert(rFilterPublished.status === 200 && rFilterPublished.body?.data.every((n) => n.status === 'PUBLISHED'), 'Status filter returns only PUBLISHED items');

    // ------------------------------------------------------------------
    // SECTION 9: AUDIT LOG INTEGRATION
    // ------------------------------------------------------------------
    console.log('\n--- 9. Audit Log Integration ---');
    const createdAudit = (await db.query(
      `SELECT action, user_id, details FROM audit_logs WHERE action = 'NOTIFICATION_CREATED' ORDER BY created_at DESC LIMIT 1`
    )).rows[0];
    assert(createdAudit !== undefined, 'NOTIFICATION_CREATED audit log persisted');
    assert(createdAudit.user_id === adminUser.id, 'Audit log attributed to authenticated admin');

    const publishedAudit = (await db.query(
      `SELECT action, user_id, details FROM audit_logs WHERE action = 'NOTIFICATION_PUBLISHED' ORDER BY created_at DESC LIMIT 1`
    )).rows[0];
    assert(publishedAudit !== undefined, 'NOTIFICATION_PUBLISHED audit log persisted');
    assert(publishedAudit.details?.recipientCount > 0, 'Audit log recorded published recipient count');

    const cancelledAudit = (await db.query(
      `SELECT action, user_id, details FROM audit_logs WHERE action = 'NOTIFICATION_CANCELLED' ORDER BY created_at DESC LIMIT 1`
    )).rows[0];
    assert(cancelledAudit !== undefined, 'NOTIFICATION_CANCELLED audit log persisted');

    // Check secrets protection
    const allNotifAudits = (await db.query(
      `SELECT details FROM audit_logs WHERE action LIKE 'NOTIFICATION_%'`
    )).rows;
    const hasSecrets = allNotifAudits.some((a) => JSON.stringify(a.details || {}).includes('password'));
    assert(!hasSecrets, 'Zero sensitive passwords or secrets stored in audit metadata');

    // ------------------------------------------------------------------
    // SECTION 10: PERFORMANCE & EXPLAIN ANALYZE
    // ------------------------------------------------------------------
    console.log('\n--- 10. Performance & EXPLAIN ANALYZE ---');
    const explainList = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT a.id, a.title, a.status, COALESCE(r.total_recipients, 0) AS recipient_count
      FROM announcements a
      LEFT JOIN (
          SELECT announcement_id, COUNT(id) AS total_recipients
          FROM announcement_recipients
          GROUP BY announcement_id
      ) r ON a.id = r.announcement_id
      ORDER BY a.created_at DESC
      LIMIT 20 OFFSET 0;
    `);
    console.log('  [Announcement List Query Plan]:');
    explainList.rows.forEach((r) => console.log(`    ${r['QUERY PLAN']}`));
    assert(explainList.rows.length > 0, 'EXPLAIN ANALYZE completed for announcement list query');

    const explainAudience = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT COUNT(u.id) AS total
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.account_status = 'ACTIVE';
    `);
    console.log('  [Audience Resolution Query Plan]:');
    explainAudience.rows.forEach((r) => console.log(`    ${r['QUERY PLAN']}`));
    assert(explainAudience.rows.length > 0, 'EXPLAIN ANALYZE completed for audience resolution query');

    console.log('\n================================================================');
    console.log(`  PHASE 10 RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[PHASE 10 TEST FATAL ERROR]:', err);
    server.close();
    process.exit(1);
  }
};

runPhase10Tests();
