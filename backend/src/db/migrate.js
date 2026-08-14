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

    // 6. audit_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          actor_name VARCHAR(150) NOT NULL,
          action VARCHAR(255) NOT NULL,
          target_entity VARCHAR(100),
          target_id UUID,
          details JSONB,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. alumni_verifications table
    await db.query(`
      CREATE TABLE IF NOT EXISTS alumni_verifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          proof_document_url VARCHAR(512),
          status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
          rejection_reason TEXT,
          reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT chk_alumni_verification_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
      );
    `);

    // 8. conversations table
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          last_message_text TEXT,
          last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. conversation_participants table
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          unread_count INTEGER NOT NULL DEFAULT 0,
          joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_conversation_participant UNIQUE (conversation_id, user_id)
      );
    `);

    // 10. messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 11. notifications table
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(64) NOT NULL DEFAULT 'SYSTEM',
          actor_name VARCHAR(150),
          actor_avatar VARCHAR(512),
          message TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 12. system_settings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
          id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
          platform_name VARCHAR(150) NOT NULL DEFAULT 'JECRC Community Platform',
          support_email VARCHAR(255) NOT NULL DEFAULT 'alumni@jecrc.ac.in',
          registration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          alumni_verification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      INSERT INTO system_settings (id, platform_name, support_email, registration_enabled, alumni_verification_enabled, maintenance_mode)
      VALUES ('default', 'JECRC Community Platform', 'alumni@jecrc.ac.in', TRUE, TRUE, FALSE)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 13. announcements table (Phase 10 Admin Communications)
    await db.query(`
      CREATE TABLE IF NOT EXISTS announcements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(64) NOT NULL DEFAULT 'GENERAL',
          status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
          audience_type VARCHAR(32) NOT NULL DEFAULT 'ALL',
          target_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          published_by UUID REFERENCES users(id) ON DELETE SET NULL,
          published_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT chk_announcement_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED')),
          CONSTRAINT chk_announcement_type CHECK (type IN ('GENERAL', 'URGENT', 'EVENT', 'OPPORTUNITY', 'MAINTENANCE')),
          CONSTRAINT chk_announcement_audience CHECK (audience_type IN ('ALL', 'STUDENTS', 'ALUMNI', 'ADMINS', 'CUSTOM'))
      );
    `);

    // 14. announcement_recipients table (Phase 10 Delivery & Read Tracking)
    await db.query(`
      CREATE TABLE IF NOT EXISTS announcement_recipients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_announcement_recipient UNIQUE (announcement_id, user_id)
      );
    `);

    // Set defaults for existing tables if created without default uuid
    await db.query(`ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE email_verification_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE password_reset_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE oauth_accounts ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE audit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE alumni_verifications ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE conversations ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE conversation_participants ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE messages ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE announcements ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE announcement_recipients ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});

    // Create indices if they don't exist
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON user_profiles(branch);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_grad_year ON user_profiles(graduation_year);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_complete ON user_profiles(is_profile_complete);`);

    // Audit logs indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);`);

    // Alumni verifications indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_alumni_verifications_user_id ON alumni_verifications(user_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_alumni_verifications_status ON alumni_verifications(status);`);

    // Conversations & Messages indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_conv_participants_user_id ON conversation_participants(user_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_conv_participants_conv_id ON conversation_participants(conversation_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at ASC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);`);

    // Notifications indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);`);

    // Phase 10 Announcements indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_announcements_status_created ON announcements(status, created_at DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_announcement_recipients_user ON announcement_recipients(user_id, is_read);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_announcement_recipients_announcement ON announcement_recipients(announcement_id, is_read);`);

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
