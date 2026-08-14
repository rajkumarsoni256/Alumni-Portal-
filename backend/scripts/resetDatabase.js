/**
 * Production Database Reset & Admin Bootstrap Script
 * Safe production-ready cleanup mechanism that removes all development/test data
 * while preserving PostgreSQL schema, migrations, and system configuration.
 *
 * Usage:
 *   ALLOW_DATABASE_RESET=true node scripts/resetDatabase.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const KNOWN_DEV_PLACEHOLDERS = [
  'AdminPassword@123',
  'password',
  'admin123',
  'your_admin_password_here',
  'change_me',
  'secret'
];

async function resetDatabase() {
  console.log('====================================================');
  console.log('  JU CONNECT — PRODUCTION DATABASE RESET & BOOTSTRAP  ');
  console.log('====================================================\n');

  // 1. Explicit Reset Permission Guard
  const resetAllowed = process.env.ALLOW_DATABASE_RESET === 'true';
  if (!resetAllowed) {
    console.error('[CRITICAL SECURITY BLOCKER] Database reset refused!');
    console.error('Execution requires explicit environment flag: ALLOW_DATABASE_RESET=true\n');
    console.error('Example command:');
    console.error('  ALLOW_DATABASE_RESET=true node scripts/resetDatabase.js\n');
    process.exit(1);
  }

  // 2. Environment & Database Connection Check
  try {
    const dbCheck = await db.query('SELECT current_database(), current_user, version()');
    const currentDb = dbCheck.rows[0].current_database;
    const currentUser = dbCheck.rows[0].current_user;
    console.log(`[OK] Connected to PostgreSQL Database: "${currentDb}" as user "${currentUser}"`);
  } catch (err) {
    console.error('[DATABASE CONNECTION ERROR] Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  // 3. Admin Credentials Validation Guard
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@jecrc.ac.in').trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();

  if (!adminPassword || KNOWN_DEV_PLACEHOLDERS.includes(adminPassword)) {
    console.error('\n[BOOTSTRAP SECURITY ERROR] Missing or insecure ADMIN_PASSWORD environment variable!');
    console.error('Production admin bootstrap requires a strong, non-placeholder password in process.env.ADMIN_PASSWORD.');
    console.error('Refusing database reset until ADMIN_PASSWORD is securely configured.\n');
    process.exit(1);
  }

  console.log('\n[WARNING] Initiating full database cleanup of all test & development records...');

  // 4. Truncate Application Data in Dependency-Safe Order
  const tablesToTruncate = [
    'email_deliveries',
    'verification_codes',
    'user_sessions',
    'user_blocks',
    'user_settings',
    'mentorship_requests',
    'event_registrations',
    'events',
    'notifications',
    'messages',
    'conversation_participants',
    'conversations',
    'job_applications',
    'job_bookmarks',
    'jobs',
    'comment_likes',
    'comments',
    'post_likes',
    'post_hashtags',
    'hashtags',
    'post_media',
    'posts',
    'connections',
    'announcement_recipients',
    'announcements',
    'alumni_verifications',
    'audit_logs',
    'user_profiles',
    'oauth_accounts',
    'password_reset_tokens',
    'email_verification_tokens',
    'users'
  ];

  try {
    await db.query(`TRUNCATE TABLE ${tablesToTruncate.join(', ')} CASCADE;`);
    console.log('[OK] Successfully purged all test users, posts, jobs, events, connections, and activity records.');
  } catch (err) {
    console.error('[TRUNCATE ERROR] Failed to truncate database tables:', err.message);
    process.exit(1);
  }

  // 5. Bootstrap Initial Production Administrator Account
  console.log('\n[BOOTSTRAP] Initializing clean production Admin account...');
  try {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminId = crypto.randomUUID();
    const profileId = crypto.randomUUID();

    await db.query(
      `INSERT INTO users (id, email, password_hash, role, email_verified, account_status)
       VALUES ($1, $2, $3, 'ADMIN', true, 'ACTIVE')`,
      [adminId, adminEmail, passwordHash]
    );

    await db.query(
      `INSERT INTO user_profiles (id, user_id, full_name, designation, company, location, is_profile_complete)
       VALUES ($1, $2, 'Directorate of Alumni Relations', 'Dean of Alumni Relations', 'JECRC University', 'Jaipur, Rajasthan', true)`,
      [profileId, adminId]
    );

    await db.query(
      `INSERT INTO user_settings (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [adminId]
    );

    console.log(`[BOOTSTRAP SUCCESS] Created primary Admin account for: ${adminEmail}`);
  } catch (err) {
    console.error('[BOOTSTRAP ERROR] Failed to create admin account:', err.message);
    process.exit(1);
  }

  // 6. Run Clean State Verification Queries
  console.log('\n====================================================');
  console.log('  FINAL POSTGRESQL CLEAN STATE VERIFICATION REPORT   ');
  console.log('====================================================');

  const verifyTables = [
    'users',
    'user_profiles',
    'posts',
    'connections',
    'jobs',
    'events',
    'mentorship_requests',
    'conversations',
    'messages',
    'notifications',
    'alumni_verifications',
    'audit_logs'
  ];

  for (const tbl of verifyTables) {
    const res = await db.query(`SELECT COUNT(*) AS count FROM ${tbl}`);
    const count = parseInt(res.rows[0].count, 10);
    console.log(`  - ${tbl.padEnd(24)} : ${count} record(s)`);
  }

  console.log('====================================================');
  console.log('  PRODUCTION DATABASE RESET & BOOTSTRAP COMPLETE!   ');
  console.log('====================================================\n');
  process.exit(0);
}

resetDatabase();
