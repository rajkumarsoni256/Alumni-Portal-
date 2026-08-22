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

    // 4b. auth_sessions table (Server-side Session Security Hardening)
    await db.query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          refresh_token_hash TEXT NOT NULL,
          prev_refresh_token_hash TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          last_used_at TIMESTAMP WITH TIME ZONE,
          revoked_at TIMESTAMP WITH TIME ZONE,
          rotated_at TIMESTAMP WITH TIME ZONE,
          ip_address TEXT,
          user_agent TEXT
      );
      ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS prev_refresh_token_hash TEXT;
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active ON auth_sessions (user_id, revoked_at, expires_at);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions (refresh_token_hash);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_prev_token_hash ON auth_sessions (prev_refresh_token_hash);
    `);

    // 5. user_profiles table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          full_name VARCHAR(150) NOT NULL,
          phone VARCHAR(20),
          avatar_url TEXT,
          banner_url TEXT,
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

    // Ensure avatar_url, banner_url, and post image_url columns use TEXT for base64/URL data
    try {
      await db.query(`ALTER TABLE user_profiles ALTER COLUMN avatar_url TYPE TEXT;`);
    } catch (e) {
      console.warn('[MIGRATION] avatar_url alter warning:', e.message);
    }
    try {
      await db.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS university_roll_number VARCHAR(64);`);
    } catch (e) {
      console.warn('[MIGRATION] university_roll_number add warning:', e.message);
    }
    try {
      await db.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS joining_year INTEGER;`);
    } catch (e) {
      console.warn('[MIGRATION] joining_year add warning:', e.message);
    }
    try {
      await db.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS course VARCHAR(100);`);
    } catch (e) {
      console.warn('[MIGRATION] course add warning:', e.message);
    }
    try {
      await db.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);
    } catch (e) {
      console.warn('[MIGRATION] last_seen_at add warning:', e.message);
    }
    try {
      await db.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_roll_number ON user_profiles(university_roll_number) WHERE university_roll_number IS NOT NULL;`
      );
    } catch (e) {
      console.warn('[MIGRATION] idx_user_profiles_roll_number index warning:', e.message);
    }

    // Phase 14: Student Institutional Email & Verification Migrations
    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS institutional_email VARCHAR(255);`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS institutional_email_verified BOOLEAN NOT NULL DEFAULT FALSE;`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_status VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED';`);
      await db.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`);
    } catch (e) {
      console.warn('[MIGRATION] Phase 14 user/profile columns add warning:', e.message);
    }

    try {
      await db.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_profiles_academic_years'
          ) THEN
            ALTER TABLE user_profiles
            ADD CONSTRAINT chk_user_profiles_academic_years
            CHECK (graduation_year IS NULL OR joining_year IS NULL OR graduation_year > joining_year);
          END IF;
        END $$;
      `);
    } catch (e) {
      console.warn('[MIGRATION] chk_user_profiles_academic_years constraint warning:', e.message);
    }

    // 6. audit_logs table (Admin Audit Logs)
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

    // 7. alumni_verifications table (Admin Verification Workflow)
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

    // 8. system_settings table (Admin System Settings)
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

    // 9. announcements table (Phase 10 Admin Communications)
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

    // 10. announcement_recipients table (Phase 10 Delivery & Read Tracking)
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

    // 11. connections table (Phase 4)
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

      CREATE UNIQUE INDEX IF NOT EXISTS uq_connection_pair 
      ON connections (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));
    `);

    // 12. posts table (Phase 5)
    await db.query(`
      CREATE TABLE IF NOT EXISTS posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          image_url TEXT,
          category VARCHAR(32) NOT NULL DEFAULT 'ALL',
          post_type VARCHAR(32) NOT NULL DEFAULT 'TEXT',
          tags TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await db.query(`ALTER TABLE posts ALTER COLUMN image_url TYPE TEXT;`);
    } catch (e) {
      console.warn('[MIGRATION] image_url alter warning:', e.message);
    }

    // Extended columns for posts table (Visibility, Job, Achievement)
    const postColumnQueries = [
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS job_location VARCHAR(255);`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50);`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS job_description TEXT;`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS job_url TEXT;`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS achievement_title VARCHAR(255);`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS achievement_organization VARCHAR(255);`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS achievement_description TEXT;`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS achievement_date DATE;`,
    ];

    for (const q of postColumnQueries) {
      try {
        await db.query(q);
      } catch (e) {
        console.warn('[MIGRATION] post column alter warning:', e.message);
      }
    }

    // 12b. post_media table
    await db.query(`
      CREATE TABLE IF NOT EXISTS post_media (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          media_type VARCHAR(20) NOT NULL DEFAULT 'IMAGE',
          storage_key TEXT,
          media_url TEXT NOT NULL,
          thumbnail_url TEXT,
          original_filename TEXT,
          mime_type VARCHAR(100),
          file_size BIGINT,
          width INTEGER,
          height INTEGER,
          duration INTEGER,
          sort_order SMALLINT NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await db.query(`ALTER TABLE post_media ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;`);
      await db.query(`ALTER TABLE post_media ADD COLUMN IF NOT EXISTS sort_order SMALLINT NOT NULL DEFAULT 0;`);
      await db.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_post_media_sort_order') THEN
            ALTER TABLE post_media ADD CONSTRAINT chk_post_media_sort_order CHECK (sort_order BETWEEN 0 AND 4);
          END IF;
        END $$;
      `);
      await db.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_post_media_order') THEN
            ALTER TABLE post_media ADD CONSTRAINT uq_post_media_order UNIQUE (post_id, sort_order);
          END IF;
        END $$;
      `);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_post_media_post_order ON post_media(post_id, sort_order ASC);`);
    } catch (e) {
      console.warn('[MIGRATION] post_media schema alteration warning:', e.message);
    }

    // 12c. hashtags table
    await db.query(`
      CREATE TABLE IF NOT EXISTS hashtags (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 12d. post_hashtags table
    await db.query(`
      CREATE TABLE IF NOT EXISTS post_hashtags (
          post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
          PRIMARY KEY (post_id, hashtag_id)
      );
    `);

    // 13. post_likes table (Phase 5)
    await db.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_post_user_like UNIQUE (post_id, user_id)
      );
    `);

    // 14. comments table (Phase 5)
    await db.query(`
      CREATE TABLE IF NOT EXISTS comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          is_pinned BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_pinned ON comments(post_id, is_pinned DESC, created_at DESC);`).catch(() => {});

    // 14b. comment_likes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_comment_user_like UNIQUE (comment_id, user_id)
      );
    `);

    // 15. jobs table (Phase 6)
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

    // 16. job_bookmarks table (Phase 6)
    await db.query(`
      CREATE TABLE IF NOT EXISTS job_bookmarks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_job_user_bookmark UNIQUE (job_id, user_id)
      );
    `);

    // 17. job_applications table (Phase 6)
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

    // 18. conversations table (Phase 7)
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          last_message_text TEXT,
          last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_text TEXT;`).catch(() => {});

    // 19. conversation_participants table (Phase 7)
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          unread_count INTEGER NOT NULL DEFAULT 0,
          joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_conversation_user UNIQUE (conversation_id, user_id)
      );
    `);
    await db.query(`ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0;`).catch(() => {});
    await db.query(`ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`).catch(() => {});

    // 20. messages table (Phase 7)
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
    await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;`).catch(() => {});
    await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;`).catch(() => {});

    // 21. notifications table (Phase 8)
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
          actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
          type VARCHAR(64) NOT NULL DEFAULT 'SYSTEM',
          title VARCHAR(255),
          message TEXT NOT NULL,
          entity_type VARCHAR(64),
          entity_id UUID,
          metadata JSONB,
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          read_at TIMESTAMP WITH TIME ZONE
      );
    `);
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES users(id) ON DELETE CASCADE;`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES users(id) ON DELETE SET NULL;`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(64) DEFAULT 'SYSTEM';`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type VARCHAR(64);`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id UUID;`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_name VARCHAR(150);`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_avatar VARCHAR(512);`).catch(() => {});
    await db.query(`UPDATE notifications SET recipient_id = user_id WHERE recipient_id IS NULL AND user_id IS NOT NULL;`).catch(() => {});
    await db.query(`UPDATE notifications SET user_id = recipient_id WHERE user_id IS NULL AND recipient_id IS NOT NULL;`).catch(() => {});
    await db.query(`UPDATE users SET email_verified = true WHERE role = 'ALUMNI' AND email_verified = false;`).catch(() => {});

    // 22. events table (Phase 9)
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

    // 23. event_registrations table (Phase 9)
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

    // 24. mentorship_requests table (Phase 10)
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

    // 25. user_settings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          profile_visibility VARCHAR(30) DEFAULT 'COMMUNITY',
          email_visibility VARCHAR(30) DEFAULT 'CONNECTIONS',
          phone_visibility VARCHAR(30) DEFAULT 'ONLY_ME',
          connections_visibility VARCHAR(30) DEFAULT 'COMMUNITY',
          search_visibility BOOLEAN DEFAULT TRUE,
          directory_visibility BOOLEAN DEFAULT TRUE,
          online_status_visible BOOLEAN DEFAULT TRUE,
          mentorship_visibility BOOLEAN DEFAULT TRUE,
          allow_messages_from VARCHAR(30) DEFAULT 'CONNECTIONS',
          allow_connection_requests_from VARCHAR(30) DEFAULT 'EVERYONE',
          show_read_receipts BOOLEAN DEFAULT TRUE,
          show_typing_indicator BOOLEAN DEFAULT TRUE,
          post_like_notifications BOOLEAN DEFAULT TRUE,
          post_comment_notifications BOOLEAN DEFAULT TRUE,
          comment_reply_notifications BOOLEAN DEFAULT TRUE,
          mention_notifications BOOLEAN DEFAULT TRUE,
          post_share_notifications BOOLEAN DEFAULT TRUE,
          connection_request_notifications BOOLEAN DEFAULT TRUE,
          connection_accepted_notifications BOOLEAN DEFAULT TRUE,
          message_notifications BOOLEAN DEFAULT TRUE,
          job_notifications BOOLEAN DEFAULT TRUE,
          event_notifications BOOLEAN DEFAULT TRUE,
          mentorship_notifications BOOLEAN DEFAULT TRUE,
          email_notifications BOOLEAN DEFAULT TRUE,
          push_notifications BOOLEAN DEFAULT TRUE,
          career_status VARCHAR(50) DEFAULT 'OPEN_TO_FULLTIME',
          work_type_remote BOOLEAN DEFAULT TRUE,
          work_type_hybrid BOOLEAN DEFAULT TRUE,
          work_type_onsite BOOLEAN DEFAULT TRUE,
          preferred_roles TEXT DEFAULT 'Software Engineer, Full Stack Developer',
          preferred_locations TEXT DEFAULT 'Jaipur, Bengaluru, Remote',
          mentorship_topics TEXT DEFAULT 'Career guidance, Technical skills, Interview preparation',
          show_company BOOLEAN DEFAULT TRUE,
          show_designation BOOLEAN DEFAULT TRUE,
          show_location BOOLEAN DEFAULT TRUE,
          two_factor_enabled BOOLEAN DEFAULT FALSE,
          theme VARCHAR(20) DEFAULT 'SYSTEM',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 26. user_blocks table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_blocks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (blocker_id, blocked_id)
      );
    `);

    // 27. user_sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          device VARCHAR(100) DEFAULT 'Browser / Web Client',
          ip_address VARCHAR(50) DEFAULT '127.0.0.1',
          user_agent TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 28. email_deliveries table
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_deliveries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          recipient_email VARCHAR(255) NOT NULL,
          email_type VARCHAR(50) NOT NULL,
          template_name VARCHAR(50) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          status VARCHAR(20) DEFAULT 'QUEUED',
          provider VARCHAR(30),
          provider_message_id VARCHAR(255),
          attempt_count INT DEFAULT 1,
          last_error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          sent_at TIMESTAMP WITH TIME ZONE,
          failed_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // 29. verification_codes table (Secure OTP Hashing Store)
    await db.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          purpose VARCHAR(30) NOT NULL,
          code_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          attempt_count INT DEFAULT 0,
          max_attempts INT DEFAULT 5,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 30. password_reset_otps table (Phase 18 6-Digit OTP Password Reset Hardening)
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_otps (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          otp_hash TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          attempts SMALLINT NOT NULL DEFAULT 0,
          max_attempts SMALLINT NOT NULL DEFAULT 5,
          verified_at TIMESTAMPTZ,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user ON password_reset_otps(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expiry ON password_reset_otps(expires_at);
    `);

    // Set defaults for existing tables if created without default uuid
    await db.query(`ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE email_verification_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE password_reset_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE oauth_accounts ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE audit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE alumni_verifications ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE announcements ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
    await db.query(`ALTER TABLE announcement_recipients ALTER COLUMN id SET DEFAULT gen_random_uuid();`).catch(() => {});
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
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`).catch(() => {});
    await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_roll_number_unique ON user_profiles(LOWER(university_roll_number)) WHERE university_roll_number IS NOT NULL AND TRIM(university_roll_number) != '';`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON user_profiles(branch);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_grad_year ON user_profiles(graduation_year);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_complete ON user_profiles(is_profile_complete);`).catch(() => {});

    // Audit logs indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);`).catch(() => {});

    // Alumni verifications indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_alumni_verifications_user_id ON alumni_verifications(user_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_alumni_verifications_status ON alumni_verifications(status);`).catch(() => {});

    // Phase 10 Announcements indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_announcements_status_created ON announcements(status, created_at DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_announcement_recipients_user ON announcement_recipients(user_id, is_read);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_announcement_recipients_announcement ON announcement_recipients(announcement_id, is_read);`).catch(() => {});

    // Connections indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_connections_receiver ON connections(receiver_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);`).catch(() => {});

    // Posts & Likes indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);`).catch(() => {});

    // Comments indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at ASC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);`).catch(() => {});

    // Jobs indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_job_bookmarks_job ON job_bookmarks(job_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_job_bookmarks_user ON job_bookmarks(user_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_id);`).catch(() => {});

    // Conversations & Messages indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_conv_participants_user_id ON conversation_participants(user_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_conv_participants_conv_id ON conversation_participants(conversation_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at ASC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);`).catch(() => {});

    // Production Performance Hardening Composite & Partial Indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_conv_created_id ON messages(conversation_id, created_at DESC, id DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id) WHERE is_read = false;`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread_created ON notifications(recipient_id, is_read, created_at DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_connections_requester_status ON connections(requester_id, status);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_connections_receiver_status ON connections(receiver_id, status);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_connections_accepted_pair ON connections(requester_id, receiver_id) WHERE status = 'ACCEPTED';`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_connections_accepted_rev ON connections(receiver_id, requester_id) WHERE status = 'ACCEPTED';`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_user ON user_profiles(updated_at DESC, user_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_search_composite ON user_profiles(user_id, company, branch, graduation_year);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(account_status, role);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_email_deliveries_recipient ON email_deliveries(recipient_email);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_email_deliveries_status ON email_deliveries(status);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_verification_codes_email_purpose ON verification_codes(email, purpose);`).catch(() => {});

    // Seed default settings for all existing users if missing
    await db.query(`
      INSERT INTO user_settings (user_id)
      SELECT id FROM users
      ON CONFLICT (user_id) DO NOTHING;
    `);

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



    // Clean up duplicate conversation pairs and merge messages into single conversation
    await db.query(`
      DO $$
      DECLARE
        rec RECORD;
        keep_conv_id UUID;
        dup_conv_id UUID;
      BEGIN
        FOR rec IN (
          SELECT cp1.user_id AS u1, cp2.user_id AS u2, ARRAY_AGG(c.id ORDER BY c.last_message_at DESC, c.created_at DESC) AS conv_ids
          FROM conversations c
          JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
          JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp1.user_id < cp2.user_id
          GROUP BY cp1.user_id, cp2.user_id
          HAVING COUNT(c.id) > 1
        ) LOOP
          keep_conv_id := rec.conv_ids[1];
          FOR i IN 2..ARRAY_LENGTH(rec.conv_ids, 1) LOOP
            dup_conv_id := rec.conv_ids[i];
            UPDATE messages SET conversation_id = keep_conv_id WHERE conversation_id = dup_conv_id;
            DELETE FROM conversation_participants WHERE conversation_id = dup_conv_id;
            DELETE FROM conversations WHERE id = dup_conv_id;
          END LOOP;
        END LOOP;
      END $$;
    `).catch(() => {});

    console.log('[MIGRATION] PostgreSQL database schema migration completed successfully.');
  } catch (err) {
    console.error('[MIGRATION ERROR] Failed to run database migrations:', err);
    throw err;
  }
};

module.exports = migrate;

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
