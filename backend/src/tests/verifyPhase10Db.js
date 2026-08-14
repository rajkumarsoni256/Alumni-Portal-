const db = require('../config/db');

const verify = async () => {
  console.log('--- DIRECT POSTGRESQL VERIFICATION FOR PHASE 10 ---');

  const annRes = await db.query(`
    SELECT id, title, type, status, audience_type, created_at, published_at
    FROM announcements
    WHERE title LIKE '%Placement Drive%'
    ORDER BY created_at DESC
    LIMIT 1;
  `);

  const ann = annRes.rows[0];
  console.log('1. Announcement Row:', ann);

  if (ann) {
    const recipRes = await db.query(
      `SELECT COUNT(*) AS total, COUNT(CASE WHEN is_read = TRUE THEN 1 END) AS read_count FROM announcement_recipients WHERE announcement_id = $1;`,
      [ann.id]
    );
    console.log('2. Recipient Rows in DB:', recipRes.rows[0]);

    const auditRes = await db.query(
      `SELECT action, actor_name, details, created_at FROM audit_logs WHERE target_id = $1 ORDER BY created_at ASC;`,
      [ann.id]
    );
    console.log('3. Audit Logs for Announcement:', auditRes.rows);
  }

  process.exit(0);
};

verify();
