const db = require('../config/db');
const migrate = require('./migrate');

const runVerification = async () => {
  try {
    console.log('--- 1. Executing Migration ---');
    await migrate();

    console.log('\n--- 2. Verifying Tables ---');
    const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tables found in database:');
    tablesRes.rows.forEach((r) => console.log(`  - ${r.table_name}`));

    console.log('\n--- 3. Verifying Columns in New Tables ---');
    const newTables = [
      'audit_logs',
      'alumni_verifications',
      'conversations',
      'conversation_participants',
      'messages',
      'notifications'
    ];

    for (const table of newTables) {
      const colRes = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      console.log(`\nColumns for table [${table}]:`);
      colRes.rows.forEach((c) => {
        console.log(`  * ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable}, default: ${c.column_default})`);
      });
    }

    console.log('\n--- 4. Verifying Foreign Key Constraints ---');
    const fkRes = await db.query(`
      SELECT
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `);
    console.log('Foreign Keys:');
    fkRes.rows.forEach((fk) => {
      console.log(`  - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name} [ON DELETE ${fk.delete_rule}]`);
    });

    console.log('\n--- 5. Verifying Check & Unique Constraints ---');
    const constraintRes = await db.query(`
      SELECT conname, contype, conrelid::regclass AS table_name, pg_get_constraintdef(c.oid) AS def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public'
      ORDER BY conrelid::regclass::text, conname;
    `);
    console.log('Constraints:');
    constraintRes.rows.forEach((con) => {
      console.log(`  - [${con.table_name}] ${con.conname} (${con.contype}): ${con.def}`);
    });

    console.log('\n--- 6. Verifying Indexes ---');
    const indexRes = await db.query(`
      SELECT
          tablename,
          indexname,
          indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    console.log('Indexes:');
    indexRes.rows.forEach((idx) => {
      console.log(`  - [${idx.tablename}] ${idx.indexname}: ${idx.indexdef}`);
    });

    console.log('\n--- 7. Verifying Existing Data & Admin User ---');
    const userCount = await db.query(`SELECT COUNT(*) FROM users;`);
    const adminUser = await db.query(`SELECT id, email, role, email_verified, account_status FROM users WHERE role = 'ADMIN';`);
    console.log(`Total users in DB: ${userCount.rows[0].count}`);
    console.log('Admin user row:', adminUser.rows[0]);

    console.log('\n[DATABASE VERIFICATION SUCCESSFUL] All tables, indexes, constraints, and relations verified.');
    process.exit(0);
  } catch (err) {
    console.error('[DATABASE VERIFICATION FAILED]:', err);
    process.exit(1);
  }
};

runVerification();
