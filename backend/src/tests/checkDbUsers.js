const db = require('../config/db');

const checkDb = async () => {
  try {
    const query = `
      SELECT
          u.id,
          u.email,
          u.role,
          p.full_name,
          p.branch,
          p.graduation_year,
          p.company,
          p.location
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC;
    `;
    const res = await db.query(query);
    console.log('--- ALL POSTGRESQL USERS IN DATABASE ---');
    console.log(`Total count in PostgreSQL: ${res.rows.length}\n`);
    res.rows.forEach((r, idx) => {
      console.log(`${idx + 1}. [${r.role}] ${r.full_name || 'NO_NAME'} | Email: ${r.email} | Company: ${r.company || 'NONE'} | Branch: ${r.branch || 'NONE'} | Batch: ${r.graduation_year || 'NONE'}`);
    });

    const targetUsers = [
      'Amit Singh',
      'Rahul Sharma',
      'Meera Nair',
      'Priya Sharma',
      'Aditya Roy',
      'Priya Mehta',
      'Nidhi Agarwal',
      'Saurabh Mishra'
    ];

    console.log('\n--- TARGET USERS CHECK ---');
    for (const name of targetUsers) {
      const match = res.rows.find((r) => r.full_name && r.full_name.toLowerCase() === name.toLowerCase());
      if (match) {
        console.log(`[FOUND] ${name} -> ID: ${match.id}, Email: ${match.email}, Role: ${match.role}`);
      } else {
        console.log(`[NOT IN DB] ${name}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDb();
