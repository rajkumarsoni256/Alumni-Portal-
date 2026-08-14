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

    // 6. connections table (Phase 4)
    await db.query(`
      CREATE TABLE IF NOT EXISTS connections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT chk_no_self_connection CHECK (requester_id <> receiver_id)
      );
    `);

    // 7. posts table (Phase 5)
    await db.query(`
      CREATE TABLE IF NOT EXISTS posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          image_url VARCHAR(512),
          category VARCHAR(32) NOT NULL DEFAULT 'ALL',
          post_type VARCHAR(32) NOT NULL DEFAULT 'TEXT',
          tags TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. post_likes table (Phase 5)
    await db.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_post_user_like UNIQUE (post_id, user_id)
      );
    `);

    // 9. comments table (Phase 5)
    await db.query(`
      CREATE TABLE IF NOT EXISTS comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. jobs table (Phase 6)
    await db.query(`
      CREATE TABLE IF NOT EXISTS jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          posted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          company VARCHAR(150) NOT NULL,
          type VARCHAR(32) NOT NULL DEFAULT 'Full-time',
          location VARCHAR(150) NOT NULL,
          salary VARCHAR(100),
          description TEXT NOT NULL,
          requirements TEXT,
          skills TEXT,
          application_url VARCHAR(512),
          status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // 11. job_bookmarks table (Phase 6)
    await db.query(`
      CREATE TABLE IF NOT EXISTS job_bookmarks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_job_user_bookmark UNIQUE (job_id, user_id)
      );
    `);

    // 12. job_applications table (Phase 6)
    await db.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          resume_url VARCHAR(512),
          cover_note TEXT,
          status VARCHAR(32) NOT NULL DEFAULT 'APPLIED',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_job_applicant UNIQUE (job_id, applicant_id)
      );
    `);

    // 13. conversations table (Phase 7)
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 14. conversation_participants table (Phase 7)
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_conversation_user UNIQUE (conversation_id, user_id)
      );
    `);

    // 15. messages table (Phase 7)
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 16. notifications table (Phase 8)
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
          type VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          entity_type VARCHAR(64),
          entity_id UUID,
          metadata JSONB,
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          read_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // 17. events table (Phase 9)
    await db.query(`
      CREATE TABLE IF NOT EXISTS events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          event_type VARCHAR(64) DEFAULT 'ALUMNI_MEETUP',
          category VARCHAR(64) DEFAULT 'Workshops',
          speaker VARCHAR(255),
          location VARCHAR(255) NOT NULL,
          is_online BOOLEAN DEFAULT FALSE,
          meeting_url VARCHAR(512),
          start_at TIMESTAMP WITH TIME ZONE NOT NULL,
          end_at TIMESTAMP WITH TIME ZONE NOT NULL,
          registration_deadline TIMESTAMP WITH TIME ZONE,
          capacity INTEGER NULL,
          image_url VARCHAR(512),
          status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 18. event_registrations table (Phase 9)
    await db.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED',
          registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_event_user_registration UNIQUE (event_id, user_id)
      );
    `);

    // 19. mentorship_requests table (Phase 10)
    await db.query(`
      CREATE TABLE IF NOT EXISTS mentorship_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          topic VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          responded_at TIMESTAMP WITH TIME ZONE NULL,
          CONSTRAINT chk_no_self_mentorship CHECK (student_id <> mentor_id)
      );
    `);

    // Set defaults for existing tables
    await db.query(`ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE email_verification_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE password_reset_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE oauth_accounts ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE connections ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE posts ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE post_likes ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE comments ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE jobs ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE job_bookmarks ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE job_applications ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE conversations ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE conversation_participants ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE messages ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE events ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE event_registrations ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE mentorship_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});

    // Indices
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON user_profiles(branch);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_grad_year ON user_profiles(graduation_year);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_connections_receiver ON connections(receiver_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at ASC);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_job_bookmarks_job ON job_bookmarks(job_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_job_bookmarks_user ON job_bookmarks(user_id);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_id);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, is_read);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_events_deadline ON events(registration_deadline);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_event_reg_event ON event_registrations(event_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_event_reg_user ON event_registrations(user_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_event_reg_status ON event_registrations(status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_event_reg_pair ON event_registrations(event_id, user_id);`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_mentorship_req_student ON mentorship_requests(student_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_mentorship_req_mentor ON mentorship_requests(mentor_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_mentorship_req_status ON mentorship_requests(status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_mentorship_req_created_at ON mentorship_requests(created_at DESC);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_mentorship_req_student_status ON mentorship_requests(student_id, status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_mentorship_req_mentor_status ON mentorship_requests(mentor_id, status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_mentorship_req_pair ON mentorship_requests(student_id, mentor_id);`);

    // Unique connection pair index to prevent duplicate relationships regardless of direction
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_connection_pair 
      ON connections (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));
    `).catch(() => {});

    // Seed default ADMIN user if no ADMIN account exists
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@jecrc.ac.in').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword@123';

    let adminId;
    const adminCheck = await db.query(`SELECT id FROM users WHERE email = $1 OR role = 'ADMIN'`, [adminEmail]);
    if (adminCheck.rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      adminId = crypto.randomUUID();

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
    } else {
      adminId = adminCheck.rows[0].id;
    }

    // Default Admin user initialized cleanly. No mock events seeded automatically.

    console.log('[MIGRATION] PostgreSQL database schema migration completed successfully.');
  } catch (err) {
    console.error('[MIGRATION ERROR] Failed to run database migrations:', err);
    throw err;
  }
};

module.exports = migrate;
