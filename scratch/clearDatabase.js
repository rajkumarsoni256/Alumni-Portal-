const db = require('../backend/src/config/db');
const migrate = require('../backend/src/db/migrate');

async function resetDb() {
  console.log('===========================================================');
  console.log('🔥 TRUNCATING ALL POSTGRESQL TABLES (COMPLETE DATA WIPE)');
  console.log('===========================================================\n');

  const tables = [
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
    'comments',
    'post_likes',
    'posts',
    'connections',
    'user_profiles',
    'oauth_accounts',
    'password_reset_tokens',
    'email_verification_tokens',
    'users'
  ];

  const truncateQuery = `TRUNCATE TABLE ${tables.join(', ')} CASCADE;`;
  await db.query(truncateQuery);
  console.log('✓ All 19 PostgreSQL tables truncated successfully.');

  console.log('\n[RE-MIGRATING] Re-running migration & initializing default Admin account...');
  await migrate();
  console.log('✓ Migration finished. Default Admin account seeded.');

  // Print final verification row counts
  console.log('\n--- VERIFYING TABLE ROW COUNTS ---');
  for (const t of tables) {
    const res = await db.query(`SELECT COUNT(*) FROM ${t}`);
    console.log(`- ${t}: ${res.rows[0].count} rows`);
  }

  console.log('\n===========================================================');
  console.log('✨ DATABASE WIPE COMPLETE: ALL DATA HAS BEEN REMOVED!');
  console.log('===========================================================');
  process.exit(0);
}

resetDb().catch(err => {
  console.error('❌ CLEAR DATABASE ERROR:', err);
  process.exit(1);
});
