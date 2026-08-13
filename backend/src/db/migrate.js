const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const migrate = async () => {
  try {
    console.log('[MIGRATION] Checking & applying PostgreSQL database schema...');

    await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 1. users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(32) NOT NULL,
          email_verified BOOLEAN NOT NULL DEFAULT FALSE,
          account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. email_verification_tokens table
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(6) NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. password_reset_tokens table
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) NOT NULL UNIQUE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. oauth_accounts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS oauth_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          provider VARCHAR(32) NOT NULL,
          provider_user_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
      );
    `);

    // 5. user_profiles table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          full_name VARCHAR(150) NOT NULL,
          phone VARCHAR(20),
          avatar_url VARCHAR(512),
          bio TEXT,
          degree VARCHAR(100),
          branch VARCHAR(150),
          graduation_year INTEGER,
          current_year INTEGER,
          company VARCHAR(150),
          designation VARCHAR(150),
          location VARCHAR(150),
          is_available_for_mentorship BOOLEAN DEFAULT TRUE,
          linkedin_url VARCHAR(255),
          github_url VARCHAR(255),
          website_url VARCHAR(255),
          skills TEXT,
          interests TEXT,
          is_profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Set defaults for existing tables if created without default uuid
    await db.query(`ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE email_verification_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE password_reset_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE oauth_accounts ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});

    // Create indices if they don't exist
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON user_profiles(branch);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_grad_year ON user_profiles(graduation_year);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);`);

    // Seed default ADMIN user if no ADMIN account exists
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@jecrc.ac.in').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword@123';

    const adminCheck = await db.query(`SELECT id FROM users WHERE email = $1 OR role = 'ADMIN'`, [adminEmail]);
    if (adminCheck.rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const adminId = crypto.randomUUID();

      await db.query(
        `INSERT INTO users (id, email, password_hash, role, email_verified, account_status)
         VALUES ($1, $2, $3, 'ADMIN', true, 'ACTIVE')`,
        [adminId, adminEmail, passwordHash]
      );

      await db.query(
        `INSERT INTO user_profiles (id, user_id, full_name, designation, company, is_profile_complete)
         VALUES ($1, $2, 'Directorate of Alumni Relations', 'Dean of Alumni Relations', 'JECRC University', true)`,
        [crypto.randomUUID(), adminId]
      );

      console.log(`[MIGRATION SEED] Created default Admin user: ${adminEmail}`);
    }

    console.log('[MIGRATION] PostgreSQL database schema migration completed successfully.');
  } catch (err) {
    console.error('[MIGRATION ERROR] Failed to run database migrations:', err);
    throw err;
  }
};

module.exports = migrate;
