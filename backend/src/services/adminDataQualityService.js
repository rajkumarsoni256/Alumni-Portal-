const db = require('../config/db');

/**
 * Fetch real-time data quality aggregate statistics across all registered users
 */
const getDataQualityStats = async () => {
  const query = `
    SELECT
        COUNT(*) FILTER (
            WHERE p.is_profile_complete = true 
            AND (NOW() - COALESCE(p.updated_at, u.updated_at)) <= INTERVAL '365 days'
        ) AS "complete",
        COUNT(*) FILTER (
            WHERE (p.is_profile_complete IS NOT TRUE) 
            AND (NOW() - COALESCE(p.updated_at, u.updated_at)) <= INTERVAL '365 days'
        ) AS "incomplete",
        COUNT(*) FILTER (
            WHERE (NOW() - COALESCE(p.updated_at, u.updated_at)) > INTERVAL '365 days'
        ) AS "needsUpdate",
        COUNT(*) FILTER (
            WHERE (u.email IS NULL OR TRIM(u.email) = '' OR p.phone IS NULL OR TRIM(p.phone) = '')
        ) AS "missingContact",
        COUNT(*) FILTER (
            WHERE (u.email IS NULL OR TRIM(u.email) = '')
        ) AS "missingEmail",
        COUNT(*) FILTER (
            WHERE (p.phone IS NULL OR TRIM(p.phone) = '')
        ) AS "missingPhone",
        COUNT(*) FILTER (
            WHERE (u.role = 'ALUMNI' AND (p.company IS NULL OR TRIM(p.company) = ''))
        ) AS "missingCompany",
        COUNT(*) FILTER (
            WHERE (p.location IS NULL OR TRIM(p.location) = '')
        ) AS "missingLocation"
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id;
  `;

  const result = await db.query(query);
  const row = result.rows[0] || {};

  return {
    complete: parseInt(row.complete, 10) || 0,
    incomplete: parseInt(row.incomplete, 10) || 0,
    needsUpdate: parseInt(row.needsUpdate, 10) || 0,
    missingContact: parseInt(row.missingContact, 10) || 0,
    missingEmail: parseInt(row.missingEmail, 10) || 0,
    missingPhone: parseInt(row.missingPhone, 10) || 0,
    missingCompany: parseInt(row.missingCompany, 10) || 0,
    missingLocation: parseInt(row.missingLocation, 10) || 0,
  };
};

module.exports = {
  getDataQualityStats,
};
