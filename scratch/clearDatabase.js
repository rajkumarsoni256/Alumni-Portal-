const db = require('../backend/src/config/db');
const migrate = require('../backend/src/db/migrate');

async function resetDb() {
  console.log('[CLEAR DB] Truncating all PostgreSQL user data tables...');
  await db.query(`TRUNCATE TABLE oauth_accounts, email_verification_tokens, password_reset_tokens, user_profiles, users CASCADE;`);
  console.log('[CLEAR DB] Tables truncated successfully.');
  
  console.log('[CLEAR DB] Re-running migration & seeding default Admin user...');
  await migrate();
  console.log('[CLEAR DB] Database reset completed successfully!');
  process.exit(0);
}

resetDb().catch(err => {
  console.error('[CLEAR DB ERROR]:', err);
  process.exit(1);
});
