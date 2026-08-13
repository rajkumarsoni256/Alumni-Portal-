import { MOCK_ADMIN_USERS, MOCK_ADMIN_SUMMARY, MOCK_RECENT_ADMIN_UPDATES } from '../data/adminUsers';

/**
 * Admin User Service
 * Encapsulates backend abstraction for filtering, searching, sorting, pagination,
 * data quality metrics, and CSV generation for 34,000+ potential database records.
 */

export const adminUserService = {
  /**
   * Fetch paginated & filtered admin users list
   */
  getAdminUsers: ({
    searchQuery = '',
    filters = {},
    sortField = 'lastUpdated',
    sortOrder = 'desc',
    page = 1,
    pageSize = 50
  } = {}) => {
    let result = [...MOCK_ADMIN_USERS];

    // 1. Multi-field Search Filter
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((u) => {
        const matchesName = u.name && u.name.toLowerCase().includes(q);
        const matchesEmail = u.email && u.email.toLowerCase().includes(q);
        const matchesPhone = u.phone && u.phone.toLowerCase().includes(q);
        const matchesCompany = u.company && u.company.toLowerCase().includes(q);
        const matchesDesignation = u.designation && u.designation.toLowerCase().includes(q);
        const matchesBranch = u.branch && u.branch.toLowerCase().includes(q);
        const matchesCity = u.city && u.city.toLowerCase().includes(q);

        return (
          matchesName ||
          matchesEmail ||
          matchesPhone ||
          matchesCompany ||
          matchesDesignation ||
          matchesBranch ||
          matchesCity
        );
      });
    }

    // 2. Structured Category Filters
    if (filters.role && filters.role !== 'all') {
      result = result.filter((u) => u.role.toLowerCase() === filters.role.toLowerCase());
    }

    if (filters.branch && filters.branch !== 'all') {
      result = result.filter((u) => u.branch.toLowerCase() === filters.branch.toLowerCase());
    }

    if (filters.batch && filters.batch !== 'all') {
      result = result.filter((u) => u.batch === parseInt(filters.batch, 10));
    }

    if (filters.batchFrom) {
      result = result.filter((u) => u.batch >= parseInt(filters.batchFrom, 10));
    }

    if (filters.batchTo) {
      result = result.filter((u) => u.batch <= parseInt(filters.batchTo, 10));
    }

    if (filters.city && filters.city !== 'all') {
      result = result.filter((u) => u.city.toLowerCase().includes(filters.city.toLowerCase()));
    }

    if (filters.company && filters.company.trim()) {
      const comp = filters.company.toLowerCase().trim();
      result = result.filter((u) => u.company && u.company.toLowerCase().includes(comp));
    }

    if (filters.profileStatus && filters.profileStatus !== 'all') {
      result = result.filter((u) => u.profileStatus.toLowerCase() === filters.profileStatus.toLowerCase());
    }

    if (filters.missingFields && filters.missingFields.length > 0) {
      result = result.filter((u) => {
        return filters.missingFields.some((mf) => u.missingFields.includes(mf));
      });
    }

    if (filters.lastUpdated && filters.lastUpdated !== 'all') {
      result = result.filter((u) => {
        const days = u.lastUpdatedDaysAgo;
        if (filters.lastUpdated === '30days') return days <= 30;
        if (filters.lastUpdated === '3months') return days <= 90;
        if (filters.lastUpdated === '6months') return days <= 180;
        if (filters.lastUpdated === '1year') return days <= 365;
        if (filters.lastUpdated === 'more1year') return days > 365;
        return true;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'lastUpdated') {
        valA = a.lastUpdatedDaysAgo;
        valB = b.lastUpdatedDaysAgo;
        // Reversed for date (smaller days ago = more recent)
        return sortOrder === 'desc' ? valA - valB : valB - valA;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    // 4. Pagination
    const totalCount = result.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = result.slice(startIndex, startIndex + pageSize);
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      users: paginatedUsers,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  /**
   * Fetch single user details by ID
   */
  getAdminUserById: (id) => {
    return MOCK_ADMIN_USERS.find((u) => u.id === id) || null;
  },

  /**
   * Fetch Overview Metrics for Dashboard
   */
  getAdminDashboardStats: () => {
    return {
      metrics: {
        totalUsers: MOCK_ADMIN_SUMMARY.totalUsersCount,
        alumni: MOCK_ADMIN_SUMMARY.alumniCount,
        students: MOCK_ADMIN_SUMMARY.studentsCount,
        needsUpdate: MOCK_ADMIN_SUMMARY.needsUpdateCount,
      },
      recentUpdates: MOCK_RECENT_ADMIN_UPDATES,
      dataQualitySnapshot: [
        { label: 'Complete', percentage: 72, count: MOCK_ADMIN_SUMMARY.completeCount, color: 'bg-emerald-500' },
        { label: 'Missing Contact', percentage: 12, count: MOCK_ADMIN_SUMMARY.missingContactCount, color: 'bg-amber-500' },
        { label: 'Missing Professional', percentage: 10, count: MOCK_ADMIN_SUMMARY.missingCompanyCount, color: 'bg-blue-500' },
        { label: 'Needs Update', percentage: 6, count: MOCK_ADMIN_SUMMARY.needsUpdateCount, color: 'bg-red-500' }
      ]
    };
  },

  /**
   * Fetch Data Management quality cards
   */
  getDataQualityStats: () => {
    return {
      complete: MOCK_ADMIN_SUMMARY.completeCount,
      incomplete: MOCK_ADMIN_SUMMARY.incompleteCount,
      needsUpdate: MOCK_ADMIN_SUMMARY.needsUpdateCount,
      missingContact: MOCK_ADMIN_SUMMARY.missingContactCount,
      missingEmail: MOCK_ADMIN_SUMMARY.missingEmailCount,
      missingPhone: MOCK_ADMIN_SUMMARY.missingPhoneCount,
      missingCompany: MOCK_ADMIN_SUMMARY.missingCompanyCount,
      missingLocation: MOCK_ADMIN_SUMMARY.missingLocationCount
    };
  },

  /**
   * Format & Download CSV File
   */
  downloadCSV: (usersList, selectedFields) => {
    if (!usersList || usersList.length === 0) return false;

    // Field headers map
    const fieldHeaderMap = {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      role: 'Role',
      branch: 'Branch',
      batch: 'Batch',
      degree: 'Degree',
      company: 'Company',
      designation: 'Designation',
      location: 'Location',
      industry: 'Industry',
      skills: 'Skills',
      linkedin: 'LinkedIn',
      updatedAt: 'Last Updated'
    };

    const activeFields = Object.keys(selectedFields).filter((k) => selectedFields[k]);
    if (activeFields.length === 0) return false;

    // Header row
    const headers = activeFields.map((f) => fieldHeaderMap[f] || f).join(',');

    // Data rows
    const rows = usersList.map((u) => {
      return activeFields
        .map((field) => {
          let val = u[field] || '';
          if (Array.isArray(val)) {
            val = val.join('; ');
          }
          // Escape quotes and commas
          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        })
        .join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `jecrc_alumni_export_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  }
};
