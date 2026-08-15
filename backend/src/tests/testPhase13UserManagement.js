const assert = require('assert');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { getSettings, updateSettings } = require('../services/adminSettingsService');
const { updateUserRole, updateUserStatus, getUsers } = require('../services/adminUserService');
const { getAuditLogs, AUDIT_ACTIONS } = require('../services/adminAuditService');

const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250655368566D5970';

async function runPhase13Tests() {
  console.log('\n======================================================');
  console.log('  RUNNING PHASE 13 AUTOMATED INTEGRATION TEST SUITE   ');
  console.log('======================================================\n');

  let adminId, studentId, alumniId;

  try {
    // Setup test users in PostgreSQL
    console.log('[Setup] Preparing test users in PostgreSQL...');
    const hashedPass = await bcrypt.hash('Password123!', 10);

    // 1. Admin Test User
    adminId = crypto.randomUUID();
    await db.query(
      `INSERT INTO users (id, email, password_hash, role, account_status, email_verified)
       VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE', TRUE)
       ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', account_status = 'ACTIVE'`,
      [adminId, `phase13_admin_${Date.now()}@jecrc.ac.in`, hashedPass]
    );
    await db.query(
      `INSERT INTO user_profiles (user_id, full_name, is_profile_complete)
       VALUES ($1, 'Phase 13 Admin User', TRUE)
       ON CONFLICT (user_id) DO UPDATE SET full_name = 'Phase 13 Admin User'`,
      [adminId]
    );

    // 2. Student Test User
    studentId = crypto.randomUUID();
    await db.query(
      `INSERT INTO users (id, email, password_hash, role, account_status, email_verified)
       VALUES ($1, $2, $3, 'STUDENT', 'ACTIVE', TRUE)`,
      [studentId, `phase13_student_${Date.now()}@jecrc.ac.in`, hashedPass]
    );
    await db.query(
      `INSERT INTO user_profiles (user_id, full_name, degree, branch, current_year, is_profile_complete)
       VALUES ($1, 'Phase 13 Student User', 'B.Tech', 'CSE', 2026, TRUE)`,
      [studentId]
    );

    // 3. Alumni Test User
    alumniId = crypto.randomUUID();
    await db.query(
      `INSERT INTO users (id, email, password_hash, role, account_status, email_verified)
       VALUES ($1, $2, $3, 'ALUMNI', 'ACTIVE', TRUE)`,
      [alumniId, `phase13_alumni_${Date.now()}@jecrc.ac.in`, hashedPass]
    );
    await db.query(
      `INSERT INTO user_profiles (user_id, full_name, degree, branch, graduation_year, is_profile_complete)
       VALUES ($1, 'Phase 13 Alumni User', 'B.Tech', 'ECE', 2023, TRUE)`,
      [alumniId]
    );

    console.log(`✓ Test accounts created: Admin (${adminId}), Student (${studentId}), Alumni (${alumniId})\n`);

    // TEST 1 — ADMIN IDENTITY & SETTINGS SYNCHRONIZATION
    console.log('[TEST 1] Testing Admin Profile Update & Identity Sync...');
    const newAdminName = `Admin Name ${Date.now()}`;
    const newAdminEmail = `admin_sync_${Date.now()}@jecrc.ac.in`;

    const updatedSettings = await updateSettings(adminId, {
      name: newAdminName,
      email: newAdminEmail,
    });

    assert.strictEqual(updatedSettings.adminProfile.name, newAdminName, 'Admin name updated in returned DTO');
    assert.strictEqual(updatedSettings.adminProfile.email, newAdminEmail, 'Admin email updated in returned DTO');

    const dbAdminCheck = await db.query(
      `SELECT u.email, p.full_name FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1`,
      [adminId]
    );
    assert.strictEqual(dbAdminCheck.rows[0].full_name, newAdminName, 'Admin name updated in PostgreSQL user_profiles table');
    assert.strictEqual(dbAdminCheck.rows[0].email, newAdminEmail, 'Admin email updated in PostgreSQL users table');

    console.log('✓ TEST 1 PASSED: Admin profile name and email successfully persisted in PostgreSQL.\n');

    // TEST 2 — STUDENT -> ALUMNI PROMOTION
    console.log('[TEST 2] Testing Student → Alumni Role Promotion...');

    // Verify initial role is STUDENT
    const prePromotion = await db.query(`SELECT role FROM users WHERE id = $1`, [studentId]);
    assert.strictEqual(prePromotion.rows[0].role, 'STUDENT', 'Initial role is STUDENT');

    // Execute promotion
    const promotedUser = await updateUserRole(adminId, studentId, 'ALUMNI');
    assert.strictEqual(promotedUser.role, 'ALUMNI', 'Returned role is ALUMNI');

    // Verify in PostgreSQL
    const postPromotion = await db.query(`SELECT role FROM users WHERE id = $1`, [studentId]);
    assert.strictEqual(postPromotion.rows[0].role, 'ALUMNI', 'PostgreSQL users.role updated to ALUMNI');

    // Verify Audit Log
    const auditLogs = await getAuditLogs({ action: AUDIT_ACTIONS.USER_ROLE_CHANGED, targetUserId: studentId });
    assert(auditLogs.logs.length > 0, 'USER_ROLE_CHANGED audit log entry recorded');
    assert.strictEqual(auditLogs.logs[0].details.newRole, 'ALUMNI', 'Audit log records newRole as ALUMNI');

    // Test Idempotent / Conflict promotion attempt on already Alumni user
    let errorThrown = false;
    try {
      await updateUserRole(adminId, studentId, 'ALUMNI');
    } catch (err) {
      errorThrown = true;
      assert.strictEqual(err.statusCode, 409, 'Returns 409 Conflict when user is already Alumni');
    }
    assert(errorThrown, 'Attempting to re-promote Alumni user throws conflict error');

    console.log('✓ TEST 2 PASSED: Student → Alumni promotion updated PostgreSQL role and logged audit event.\n');

    // TEST 3 — USER DEACTIVATION & RESTORATION
    console.log('[TEST 3] Testing User Deactivation & Restoration...');

    // 1. Deactivate Alumni User
    const deactivatedUser = await updateUserStatus(adminId, alumniId, 'DISABLED');
    assert.strictEqual(deactivatedUser.account_status, 'DISABLED', 'Status returned as DISABLED');

    const dbDisabledCheck = await db.query(`SELECT account_status FROM users WHERE id = $1`, [alumniId]);
    assert.strictEqual(dbDisabledCheck.rows[0].account_status, 'DISABLED', 'PostgreSQL account_status is DISABLED');

    // Verify Deactivation Audit Log
    const deactAudits = await getAuditLogs({ action: AUDIT_ACTIONS.USER_DEACTIVATED, targetUserId: alumniId });
    assert(deactAudits.logs.length > 0, 'USER_DEACTIVATED audit log entry recorded');

    // 2. Prevent Self-Deactivation
    let selfDeactError = false;
    try {
      await updateUserStatus(adminId, adminId, 'DISABLED');
    } catch (err) {
      selfDeactError = true;
      assert.strictEqual(err.statusCode, 400, 'Self-deactivation returned 400 Bad Request');
    }
    assert(selfDeactError, 'Self-deactivation guard prevented administrator self-lockout');

    // 3. Restore User Access
    const restoredUser = await updateUserStatus(adminId, alumniId, 'ACTIVE');
    assert.strictEqual(restoredUser.account_status, 'ACTIVE', 'Status returned as ACTIVE');

    const dbActiveCheck = await db.query(`SELECT account_status FROM users WHERE id = $1`, [alumniId]);
    assert.strictEqual(dbActiveCheck.rows[0].account_status, 'ACTIVE', 'PostgreSQL account_status is ACTIVE');

    // Verify Reactivation Audit Log
    const reactAudits = await getAuditLogs({ action: AUDIT_ACTIONS.USER_REACTIVATED, targetUserId: alumniId });
    assert(reactAudits.logs.length > 0, 'USER_REACTIVATED audit log entry recorded');

    console.log('✓ TEST 3 PASSED: User deactivation, self-deactivation guard, and restoration verified.\n');

    // TEST 4 — NOTIFICATION CENTER INBOX & READ STATE
    console.log('[TEST 4] Testing Notification Center Inbox & Read State Persistence...');
    const notificationService = require('../services/notificationService');

    // Create test notification for Admin
    const notif = await notificationService.createNotification({
      recipientId: adminId,
      actorId: studentId,
      type: 'SYSTEM',
      title: 'Test Admin Alert',
      message: 'This is a test notification for Phase 13 verification.',
    });

    assert(notif, 'Notification record created in PostgreSQL');

    // Fetch Inbox
    const inbox = await notificationService.getNotifications(adminId);
    assert(inbox.notifications.length > 0, 'Notification retrieved in inbox query');
    assert.strictEqual(inbox.unreadCount > 0, true, 'Unread count is greater than 0');

    // Mark single notification as read
    const markRes = await notificationService.markAsRead(adminId, notif.id);
    assert.strictEqual(markRes.success, true, 'Marked as read successfully');

    // Verify persistence in DB
    const dbNotifCheck = await db.query(`SELECT is_read, read_at FROM notifications WHERE id = $1`, [notif.id]);
    assert.strictEqual(dbNotifCheck.rows[0].is_read, true, 'is_read is TRUE in PostgreSQL');
    assert(dbNotifCheck.rows[0].read_at !== null, 'read_at timestamp set in PostgreSQL');

    console.log('✓ TEST 4 PASSED: Notification inbox, read state, and PostgreSQL persistence verified.\n');

    // TEST 5 — SECURITY & AUDIT LOG SANITIZATION
    console.log('[TEST 5] Testing Security & Audit Log Sanitization...');
    const allLogs = await getAuditLogs({ adminUserId: adminId });
    for (const log of allLogs.logs) {
      const detailsStr = JSON.stringify(log.details || {});
      assert(!detailsStr.toLowerCase().includes('password_hash'), 'No password_hash exposed in audit logs');
      assert(!detailsStr.toLowerCase().includes('jwt_secret'), 'No secrets exposed in audit logs');
    }

    console.log('✓ TEST 5 PASSED: Audit logs verified free of sensitive tokens and passwords.\n');

    console.log('======================================================');
    console.log('  ALL PHASE 13 AUTOMATED INTEGRATION TESTS PASSED 100% ');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ PHASE 13 TEST SUITE FAILED:', err);
    process.exit(1);
  } finally {
    // Cleanup test data
    console.log('[Cleanup] Cleaning up Phase 13 test records...');
    if (adminId) await db.query(`DELETE FROM users WHERE id = $1`, [adminId]).catch(() => {});
    if (studentId) await db.query(`DELETE FROM users WHERE id = $1`, [studentId]).catch(() => {});
    if (alumniId) await db.query(`DELETE FROM users WHERE id = $1`, [alumniId]).catch(() => {});
    if (db.pool && typeof db.pool.end === 'function') await db.pool.end().catch(() => {});
    process.exit(0);
  }
}

runPhase13Tests();
