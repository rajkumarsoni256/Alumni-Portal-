const db = require('../config/db');
const { buildUserQueryFilters } = require('./adminUserService');

const EXPORT_COLUMNS_MAP = {
  name: {
    header: 'Name',
    getValue: (row) => row.full_name || (row.email ? row.email.split('@')[0] : 'User'),
  },
  email: {
    header: 'Email',
    getValue: (row) => row.email || '',
  },
  phone: {
    header: 'Phone Number',
    getValue: (row) => row.phone || '',
  },
  role: {
    header: 'Role (Student/Alumni)',
    getValue: (row) => (row.role === 'ALUMNI' ? 'Alumni' : (row.role === 'STUDENT' ? 'Student' : 'Admin')),
  },
  branch: {
    header: 'Branch',
    getValue: (row) => row.branch || '',
  },
  batch: {
    header: 'Batch',
    getValue: (row) => row.graduation_year || row.current_year || '',
  },
  graduationyear: {
    header: 'Graduation Year',
    getValue: (row) => row.graduation_year || '',
  },
  degree: {
    header: 'Degree',
    getValue: (row) => row.degree || 'B.Tech',
  },
  institution: {
    header: 'Institution',
    getValue: () => 'JECRC University',
  },
  company: {
    header: 'Company',
    getValue: (row) => row.company || '',
  },
  designation: {
    header: 'Designation',
    getValue: (row) => row.designation || '',
  },
  location: {
    header: 'Location',
    getValue: (row) => row.location || '',
  },
  city: {
    header: 'City',
    getValue: (row) => (row.location ? row.location.split(',')[0].trim() : ''),
  },
  industry: {
    header: 'Industry',
    getValue: (row) => (row.role === 'ALUMNI' && row.company ? 'Technology & Software' : ''),
  },
  skills: {
    header: 'Skills',
    getValue: (row) => row.skills || '',
  },
  linkedin: {
    header: 'LinkedIn URL',
    getValue: (row) => row.linkedin_url || '',
  },
  github: {
    header: 'GitHub URL',
    getValue: (row) => row.github_url || '',
  },
  portfolio: {
    header: 'Portfolio / Website',
    getValue: (row) => row.website_url || '',
  },
  profilestatus: {
    header: 'Profile Status',
    getValue: (row) => {
      const daysAgo = row.last_updated_days_ago !== null ? Math.max(0, parseInt(row.last_updated_days_ago, 10)) : 0;
      if (daysAgo > 365) return 'Needs Update';
      if (row.is_profile_complete) return 'Complete';
      return 'Incomplete';
    },
  },
  updatedat: {
    header: 'Last Updated',
    getValue: (row) => (row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : ''),
  },
};

/**
 * Escapes CSV cell content and prevents formula injection in spreadsheet software
 */
const sanitizeCsvCell = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  // Formula injection defense: prefix dangerous start characters with an apostrophe
  const firstChar = str.charAt(0);
  if (['=', '+', '-', '@', '\t', '\r'].includes(firstChar)) {
    str = `'${str}`;
  }

  // Escape double quotes by doubling them
  str = str.replace(/"/g, '""');

  return `"${str}"`;
};

/**
 * Streams filtered or selected user records directly as CSV chunks to HTTP response
 */
const exportUsersStream = async ({ userIds, filters, columns }, res) => {
  // 1. Column Selection & Whitelist Validation
  let requestedColumns = columns;
  if (!requestedColumns || !Array.isArray(requestedColumns) || requestedColumns.length === 0) {
    requestedColumns = ['name', 'email', 'phone', 'role', 'branch', 'batch', 'degree', 'company', 'designation', 'location', 'updatedAt'];
  }

  const normalizedColumns = requestedColumns.map((c) => String(c).trim().toLowerCase());
  for (const col of normalizedColumns) {
    if (!EXPORT_COLUMNS_MAP[col]) {
      const err = new Error(`Invalid export column: "${col}". Allowed columns: ${Object.keys(EXPORT_COLUMNS_MAP).join(', ')}`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_COLUMN';
      throw err;
    }
  }

  // 2. Query Construction (Mode A: Selected IDs vs Mode B: Filters)
  let whereSql = '';
  let queryParams = [];

  if (Array.isArray(userIds) && userIds.length > 0) {
    // Mode A: Explicit selected user IDs
    queryParams.push(userIds);
    whereSql = `WHERE u.id = ANY($1::uuid[])`;
  } else if (filters && typeof filters === 'object') {
    // Mode B: Filtered dataset
    const filterResult = buildUserQueryFilters(filters);
    whereSql = filterResult.whereSql;
    queryParams = filterResult.queryParams;
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `jecrc-community-export-${dateStr}.csv`;

  // 3. HTTP Headers for attachment streaming
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 4. Write CSV Header line
  const headerLine = normalizedColumns
    .map((colKey) => sanitizeCsvCell(EXPORT_COLUMNS_MAP[colKey].header))
    .join(',');
  res.write(headerLine + '\r\n');

  // 5. Memory-safe batch streaming loop
  const CHUNK_SIZE = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const chunkParams = [...queryParams, CHUNK_SIZE, offset];
    const limitIdx = queryParams.length + 1;
    const offsetIdx = queryParams.length + 2;

    const query = `
      SELECT 
          u.id,
          u.email,
          u.role,
          p.full_name,
          p.phone,
          p.avatar_url,
          p.degree,
          p.branch,
          p.graduation_year,
          p.current_year,
          p.company,
          p.designation,
          p.location,
          p.skills,
          p.linkedin_url,
          p.github_url,
          p.website_url,
          p.is_profile_complete,
          COALESCE(p.updated_at, u.updated_at) AS updated_at,
          ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(p.updated_at, u.updated_at))) / 86400) AS last_updated_days_ago
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ${whereSql}
      ORDER BY COALESCE(p.updated_at, u.updated_at) DESC NULLS LAST, u.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    const result = await db.query(query, chunkParams);
    const rows = result.rows;

    if (rows.length === 0) {
      hasMore = false;
      break;
    }

    let chunkCsv = '';
    for (const row of rows) {
      const line = normalizedColumns
        .map((colKey) => sanitizeCsvCell(EXPORT_COLUMNS_MAP[colKey].getValue(row)))
        .join(',');
      chunkCsv += line + '\r\n';
    }

    res.write(chunkCsv);

    if (rows.length < CHUNK_SIZE) {
      hasMore = false;
    } else {
      offset += CHUNK_SIZE;
    }
  }

  res.end();
};

module.exports = {
  EXPORT_COLUMNS_MAP,
  sanitizeCsvCell,
  exportUsersStream,
};
