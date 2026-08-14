const db = require('./src/config/db');
db.query(
  "SELECT id, details FROM audit_logs WHERE details::text ILIKE '%password_hash%' LIMIT 5"
).then(r => {
  console.log(JSON.stringify(r.rows, null, 2));
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
