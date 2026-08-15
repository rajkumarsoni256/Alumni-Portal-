const db = require('../config/db');
const migrate = require('./migrate');

async function resetDatabase() {
  console.log('[DB RESET] Starting database cleanup...');
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@jecrc.ac.in').trim().toLowerCase();

    // Delete non-admin users and dependent records
    await db.query(`DELETE FROM auth_sessions WHERE user_id IN (SELECT id FROM users WHERE email != $1)`, [adminEmail]);
    await db.query(`DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email != $1)`, [adminEmail]);
    await db.query(`DELETE FROM alumni_verifications WHERE user_id IN (SELECT id FROM users WHERE email != $1)`, [adminEmail]);
    await db.query(`DELETE FROM verification_codes WHERE email != $1`, [adminEmail]);
    await db.query(`DELETE FROM email_deliveries WHERE recipient_email != $1`, [adminEmail]);
    await db.query(`DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email != $1)`, [adminEmail]);
    await db.query(`DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email != $1)`, [adminEmail]);
    await db.query(`DELETE FROM connections WHERE requester_id IN (SELECT id FROM users WHERE email != $1) OR receiver_id IN (SELECT id FROM users WHERE email != $1)`, [adminEmail]);
    await db.query(`DELETE FROM post_likes WHERE user_id IN (SELECT id FROM users WHERE email != $1)`, [adminEmail]);
    await db.query(`DELETE FROM comment_likes WHERE user_id IN (SELECT id FROM users WHERE email != $1)`, [adminEmail]);
    await db.query(`DELETE FROM comments WHERE author_id IN (SELECT id FROM users WHERE email != $1)`, [adminEmail]);
    await db.query(`DELETE FROM posts WHERE author_id IN (SELECT id FROM users WHERE email != $1)`, [adminEmail]);
    await db.query(`DELETE FROM events WHERE created_by IN (SELECT id FROM users WHERE email != $1)`, [adminEmail]);
    await db.query(`DELETE FROM users WHERE email != $1`, [adminEmail]);

    console.log('[DB RESET] Non-admin test data cleared successfully.');

    // Ensure database migration and default Admin user exist
    await migrate();
    console.log('[DB RESET] Database reset completed successfully!');
  } catch (err) {
    console.error('[DB RESET ERROR]', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  resetDatabase().then(() => process.exit(0));
}

module.exports = { resetDatabase };
