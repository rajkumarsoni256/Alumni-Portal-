const db = require('../backend/src/config/db');
const bcrypt = require('../backend/node_modules/bcryptjs');

async function cleanTestDataAndSeedProduction() {
  console.log('===========================================================');
  console.log('🧹 CLEANING TEST ACCOUNTS & SEEDING REALISTIC JECRC DATA');
  console.log('===========================================================\n');

  try {
    // 1. Delete test accounts created by test runner scripts
    const deleteTestUsersRes = await db.query(`
      DELETE FROM users 
      WHERE email LIKE 'reg_%' 
         OR email LIKE 'conn_%' 
         OR email LIKE 'mnt_%' 
         OR email LIKE 'test_%'
         OR email LIKE 'master_%'
         OR email LIKE 'user_%';
    `);
    console.log(`✓ Removed ${deleteTestUsersRes.rowCount} temporary test user accounts from PostgreSQL.`);

    // 2. Clean up duplicate test jobs & events
    await db.query(`DELETE FROM jobs WHERE title LIKE '%Node.js%' OR title LIKE '%Test%';`);
    await db.query(`DELETE FROM events WHERE title LIKE '%Master%' OR title LIKE '%Test%';`);
    await db.query(`DELETE FROM posts WHERE content LIKE '%Master%' OR content LIKE '%Test%';`);

    // 3. Seed realistic JECRC Alumni profiles if not existing
    const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

    const alumniToSeed = [
      {
        email: 'priya.sharma@jecrc.ac.in',
        fullName: 'Priya Sharma',
        role: 'ALUMNI',
        degree: 'B.Tech',
        branch: 'Computer Science',
        graduationYear: 2020,
        company: 'Google',
        designation: 'Senior Staff Software Engineer',
        location: 'Bengaluru, India',
        linkedinUrl: 'https://linkedin.com/in/priyasharma-jecrc',
        bio: 'Tech lead at Google working on large-scale distributed systems. JECRC CSE 2020 passout passionate about mentoring students.',
        skills: ['Distributed Systems', 'System Design', 'Cloud Architecture', 'Java', 'Go'],
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      },
      {
        email: 'rahul.verma@jecrc.ac.in',
        fullName: 'Rahul Verma',
        role: 'ALUMNI',
        degree: 'B.Tech',
        branch: 'Information Technology',
        graduationYear: 2019,
        company: 'Microsoft',
        designation: 'Principal Cloud Architect',
        location: 'Hyderabad, India',
        linkedinUrl: 'https://linkedin.com/in/rahulverma-jecrc',
        bio: 'Azure cloud solutions architect at Microsoft. Former JECRC IT graduate helping students master cloud infrastructure and DevOps.',
        skills: ['Azure', 'Kubernetes', 'DevOps', 'Terraform', 'C#'],
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300',
      },
      {
        email: 'ananya.iyer@jecrc.ac.in',
        fullName: 'Ananya Iyer',
        role: 'ALUMNI',
        degree: 'B.Tech',
        branch: 'Electronics & Communication',
        graduationYear: 2021,
        company: 'Adobe',
        designation: 'Lead UX Architect & PM',
        location: 'Noida, India',
        linkedinUrl: 'https://linkedin.com/in/ananyaiyer-jecrc',
        bio: 'Product Designer & Strategist at Adobe Experience Cloud. Specializing in UI/UX design systems and product management.',
        skills: ['UI/UX Design', 'Product Management', 'Figma', 'User Research'],
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
      },
      {
        email: 'aman.gupta@jecrc.ac.in',
        fullName: 'Aman Gupta',
        role: 'ALUMNI',
        degree: 'B.Tech',
        branch: 'Computer Science',
        graduationYear: 2018,
        company: 'Amazon',
        designation: 'SDE III - AWS Infrastructure',
        location: 'Bengaluru, India',
        linkedinUrl: 'https://linkedin.com/in/amangupta-jecrc',
        bio: 'AWS Core Services developer at Amazon. Guiding JECRC students for Amazon SDE campus placements and DSA interviews.',
        skills: ['DSA & Coding', 'AWS', 'System Design', 'Python', 'Microservices'],
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      },
      {
        email: 'nidhi.agarwal@jecrc.ac.in',
        fullName: 'Nidhi Agarwal',
        role: 'ALUMNI',
        degree: 'B.Tech',
        branch: 'Information Technology',
        graduationYear: 2022,
        company: 'Zomato',
        designation: 'Senior Backend Engineer',
        location: 'Gurugram, India',
        linkedinUrl: 'https://linkedin.com/in/nidhiagarwal-jecrc',
        bio: 'Engineered high-concurrency payment services at Zomato. JECRC IT 2022 batch.',
        skills: ['Node.js', 'PostgreSQL', 'Redis', 'System Architecture'],
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=300',
      },
    ];

    for (const a of alumniToSeed) {
      // Check if user exists
      const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [a.email]);
      let userId;

      if (userCheck.rows.length === 0) {
        const newUser = await db.query(
          `INSERT INTO users (email, password_hash, role, account_status, email_verified)
           VALUES ($1, $2, $3, 'ACTIVE', true)
           RETURNING id;`,
          [a.email, defaultPasswordHash, a.role]
        );
        userId = newUser.rows[0].id;
      } else {
        userId = userCheck.rows[0].id;
      }

      // Upsert profile
      await db.query(
        `INSERT INTO user_profiles (
          user_id, full_name, phone, degree, branch, graduation_year, company, designation, location, linkedin_url, bio, skills, is_profile_complete
        ) VALUES (
          $1, $2, '+91 9876543210', $3, $4, $5, $6, $7, $8, $9, $10, $11, true
        )
        ON CONFLICT (user_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          degree = EXCLUDED.degree,
          branch = EXCLUDED.branch,
          graduation_year = EXCLUDED.graduation_year,
          company = EXCLUDED.company,
          designation = EXCLUDED.designation,
          location = EXCLUDED.location,
          linkedin_url = EXCLUDED.linkedin_url,
          bio = EXCLUDED.bio,
          skills = EXCLUDED.skills,
          is_profile_complete = true;`,
        [
          userId,
          a.fullName,
          a.degree,
          a.branch,
          a.graduationYear,
          a.company,
          a.designation,
          a.location,
          a.linkedinUrl,
          a.bio,
          a.skills,
        ]
      );
    }

    console.log(`✓ Seeded ${alumniToSeed.length} verified real JECRC Alumni profiles in PostgreSQL.`);

    // 4. Seed clean realistic Campus Jobs if none exist
    const jobsCheck = await db.query('SELECT COUNT(*) FROM jobs');
    if (parseInt(jobsCheck.rows[0].count, 10) === 0) {
      const priyaUser = await db.query('SELECT id FROM users WHERE email = $1', ['priya.sharma@jecrc.ac.in']);
      const rahulUser = await db.query('SELECT id FROM users WHERE email = $1', ['rahul.verma@jecrc.ac.in']);

      if (priyaUser.rows.length > 0) {
        await db.query(`
          INSERT INTO jobs (title, company, location, type, experience_level, salary, description, skills_required, posted_by, status)
          VALUES (
            'Software Development Engineer I (SDE 1)',
            'Google',
            'Bengaluru, India',
            'Full-time',
            'Entry-level',
            '₹18 - ₹24 LPA',
            'Looking for passionate 2025/2026 JECRC graduates for core backend systems engineering roles. Referral available.',
            ARRAY['Java', 'System Design', 'DSA', 'PostgreSQL'],
            $1,
            'OPEN'
          );
        `, [priyaUser.rows[0].id]);
      }

      if (rahulUser.rows.length > 0) {
        await db.query(`
          INSERT INTO jobs (title, company, location, type, experience_level, salary, description, skills_required, posted_by, status)
          VALUES (
            'Cloud Infrastructure & DevOps Intern',
            'Microsoft',
            'Hyderabad, India',
            'Internship',
            'Internship',
            '₹60,000 / month',
            '6-month internship for JECRC final year students in Azure cloud operations and container orchestration.',
            ARRAY['Azure', 'Kubernetes', 'Docker', 'Linux'],
            $1,
            'OPEN'
          );
        `, [rahulUser.rows[0].id]);
      }
      console.log('✓ Seeded realistic JECRC Alumni campus recruitment jobs.');
    }

    // 5. Seed clean realistic Campus Events if none exist
    const eventsCheck = await db.query('SELECT COUNT(*) FROM events');
    if (parseInt(eventsCheck.rows[0].count, 10) === 0) {
      const priyaUser = await db.query('SELECT id FROM users WHERE email = $1', ['priya.sharma@jecrc.ac.in']);
      if (priyaUser.rows.length > 0) {
        await db.query(`
          INSERT INTO events (title, description, event_type, category, start_at, end_at, location, speaker, capacity, organizer_id, status)
          VALUES (
            'JECRC Alumni Placement Guidance & System Design Masterclass',
            'Comprehensive 2-hour technical webinar covering campus interview prep, system design fundamentals, and Google placement referrals.',
            'Masterclass',
            'Technology',
            NOW() + INTERVAL '5 days',
            NOW() + INTERVAL '5 days 2 hours',
            'Main Campus Auditorium A & Google Meet Live',
            'Priya Sharma (Google) & Rahul Verma (Microsoft)',
            150,
            $1,
            'PUBLISHED'
          );
        `, [priyaUser.rows[0].id]);
      }
      console.log('✓ Seeded realistic JECRC Campus Event.');
    }

    console.log('\n===========================================================');
    console.log('✨ CLEANUP & SEEDING COMPLETED SUCCESSFULLY!');
    console.log('===========================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ CLEANUP ERROR:', err);
    process.exit(1);
  }
}

cleanTestDataAndSeedProduction();
