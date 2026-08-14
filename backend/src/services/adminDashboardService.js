const db = require('../config/db');
const adminDataQualityService = require('./adminDataQualityService');

/**
 * Fetch comprehensive administrative dashboard metrics and reporting aggregates
 */
const getDashboardStats = async () => {
  // 1. Core Overview Counts & User Distributions
  const overviewQuery = `
    SELECT
        COUNT(*) AS "totalUsers",
        COUNT(*) FILTER (WHERE u.role = 'STUDENT') AS "students",
        COUNT(*) FILTER (WHERE u.role = 'ALUMNI') AS "alumni",
        COUNT(*) FILTER (WHERE u.role = 'ADMIN') AS "admins",
        COUNT(*) FILTER (WHERE u.account_status = 'DISABLED') AS "disabledUsers",
        COUNT(*) FILTER (WHERE u.email_verified = FALSE) AS "pendingAccounts",
        COUNT(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '7 days') AS "newUsersThisWeek",
        COUNT(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '30 days') AS "newUsersThisMonth",
        COUNT(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '60 days' AND u.created_at < NOW() - INTERVAL '30 days') AS "newUsersLastMonth"
    FROM users u;
  `;

  // 2. Verification Queue Statistics
  const verificationQuery = `
    SELECT
        COUNT(*) FILTER (WHERE status = 'PENDING') AS "pending",
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS "approved",
        COUNT(*) FILTER (WHERE status = 'REJECTED') AS "rejected",
        COUNT(*) AS "total"
    FROM alumni_verifications;
  `;

  // 3. Entity Metrics Query (Jobs, Events, Mentorship)
  const entityMetricsQuery = `
    SELECT
        (SELECT COUNT(*) FROM jobs WHERE status = 'OPEN') AS "activeJobs",
        (SELECT COUNT(*) FROM events WHERE start_at >= NOW() AND (status = 'PUBLISHED' OR status IS NULL)) AS "upcomingEvents",
        (SELECT COUNT(*) FROM mentorship_requests WHERE status = 'PENDING') AS "openMentorshipRequests";
  `;

  // 4. User Growth Monthly Time-Series
  const growthQuery = `
    SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS "month",
        COUNT(*)::INTEGER AS "count"
    FROM users
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at) ASC;
  `;

  // 5. Branch Distribution
  const branchQuery = `
    SELECT
        COALESCE(NULLIF(TRIM(p.branch), ''), 'Unspecified') AS "branch",
        COUNT(*)::INTEGER AS "count"
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    GROUP BY COALESCE(NULLIF(TRIM(p.branch), ''), 'Unspecified')
    ORDER BY "count" DESC
    LIMIT 10;
  `;

  // 6. Batch / Graduation Year Distribution
  const batchQuery = `
    SELECT
        COALESCE(p.graduation_year, p.current_year)::TEXT AS "batch",
        COUNT(*)::INTEGER AS "count"
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE COALESCE(p.graduation_year, p.current_year) IS NOT NULL
    GROUP BY COALESCE(p.graduation_year, p.current_year)
    ORDER BY "batch" DESC
    LIMIT 10;
  `;

  const [overviewRes, verificationRes, entityRes, growthRes, branchRes, batchRes, qualityStats] = await Promise.all([
    db.query(overviewQuery),
    db.query(verificationQuery),
    db.query(entityMetricsQuery),
    db.query(growthQuery),
    db.query(branchQuery),
    db.query(batchQuery),
    adminDataQualityService.getDataQualityStats(),
  ]);

  const overviewRow = overviewRes.rows[0] || {};
  const verifRow = verificationRes.rows[0] || {};
  const entityRow = entityRes.rows[0] || {};

  const totalUsers = parseInt(overviewRow.totalUsers, 10) || 0;
  const students = parseInt(overviewRow.students, 10) || 0;
  const alumni = parseInt(overviewRow.alumni, 10) || 0;
  const admins = parseInt(overviewRow.admins, 10) || 0;
  const disabledUsers = parseInt(overviewRow.disabledUsers, 10) || 0;
  const pendingAccounts = parseInt(overviewRow.pendingAccounts, 10) || 0;

  const pendingVerifications = parseInt(verifRow.pending, 10) || 0;
  const approvedVerifications = parseInt(verifRow.approved, 10) || 0;
  const rejectedVerifications = parseInt(verifRow.rejected, 10) || 0;
  const totalVerifications = parseInt(verifRow.total, 10) || 0;

  const activeJobs = parseInt(entityRow.activeJobs, 10) || 0;
  const upcomingEvents = parseInt(entityRow.upcomingEvents, 10) || 0;
  const openMentorshipRequests = parseInt(entityRow.openMentorshipRequests, 10) || 0;

  const newUsersThisWeek = parseInt(overviewRow.newUsersThisWeek, 10) || 0;
  const newUsersThisMonth = parseInt(overviewRow.newUsersThisMonth, 10) || 0;
  const newUsersLastMonth = parseInt(overviewRow.newUsersLastMonth, 10) || 0;

  return {
    overview: {
      totalUsers,
      students,
      alumni,
      admins,
      disabledUsers,
      pendingAccounts,
      activeJobs,
      upcomingEvents,
      openMentorshipRequests,
      needsUpdate: qualityStats.needsUpdate || 0,
    },
    profileQuality: qualityStats,
    verification: {
      pending: pendingVerifications,
      approved: approvedVerifications,
      rejected: rejectedVerifications,
      total: totalVerifications,
    },
    growth: {
      newUsersThisWeek,
      newUsersThisMonth,
      newUsersLastMonth,
      monthlyTimeSeries: growthRes.rows || [],
    },
    distribution: {
      branches: branchRes.rows || [],
      batches: batchRes.rows || [],
    },
  };
};

module.exports = {
  getDashboardStats,
};
