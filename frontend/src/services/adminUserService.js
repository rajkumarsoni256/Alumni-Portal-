import { apiClient } from './apiClient';

/**
 * Admin User Service
 * Encapsulates backend API communication for filtering, searching, sorting, pagination,
 * data quality metrics, verification workflows, and CSV generation against PostgreSQL.
 */

export const adminUserService = {
  /**
   * Fetch paginated & filtered admin users list from backend API
   */
  getAdminUsers: async ({
    searchQuery = '',
    filters = {},
    sortField = 'lastUpdated',
    sortOrder = 'desc',
    page = 1,
    pageSize = 20
  } = {}) => {
    const params = {
      q: searchQuery && searchQuery.trim() ? searchQuery.trim() : undefined,
      role: filters.role && filters.role !== 'all' ? filters.role : undefined,
      branch: filters.branch && filters.branch !== 'all' ? filters.branch : undefined,
      batch: filters.batch && filters.batch !== 'all' ? filters.batch : undefined,
      batchFrom: filters.batchFrom || undefined,
      batchTo: filters.batchTo || undefined,
      city: filters.city && filters.city !== 'all' ? filters.city : undefined,
      company: filters.company && filters.company.trim() ? filters.company.trim() : undefined,
      status: filters.profileStatus && filters.profileStatus !== 'all' ? filters.profileStatus : undefined,
      missing: filters.missingFields && filters.missingFields.length > 0 ? filters.missingFields.join(',') : undefined,
      lastUpdated: filters.lastUpdated && filters.lastUpdated !== 'all' ? filters.lastUpdated : undefined,
      sortBy: sortField || 'lastUpdated',
      sortOrder: sortOrder || 'desc',
      page: page || 1,
      pageSize: pageSize || 20
    };

    return await apiClient.get('/api/v1/admin/users', { params });
  },

  /**
   * Fetch single user details by ID from backend API
   */
  getAdminUserById: async (id) => {
    if (!id) return null;
    return await apiClient.get(`/api/v1/admin/users/${id}`);
  },

  /**
   * Fetch aggregate user statistics summary from backend API
   */
  getUserStats: async () => {
    return await apiClient.get('/api/v1/admin/users/stats');
  },

  /**
   * Fetch Data Management quality cards from backend API
   */
  getDataQualityStats: async () => {
    return await apiClient.get('/api/v1/admin/data-quality/stats');
  },

  /**
   * Fetch complete Dashboard Analytics & Reporting from backend API
   */
  getDashboardAnalytics: async () => {
    return await apiClient.get('/api/v1/admin/dashboard/stats');
  },

  /**
   * Fetch Overview Metrics for Dashboard from backend APIs
   */
  getAdminDashboardStats: async () => {
    try {
      const [dashData, activityList] = await Promise.all([
        apiClient.get('/api/v1/admin/dashboard/stats'),
        apiClient.get('/api/v1/admin/activity', { params: { limit: 5 } }).catch(() => ([])),
      ]);

      const overview = dashData.overview || {};
      const qualityStats = dashData.profileQuality || {};

      const totalUsers = overview.totalUsers || 0;
      const alumni = overview.alumni || 0;
      const students = overview.students || 0;
      const needsUpdate = qualityStats.needsUpdate || 0;
      const complete = qualityStats.complete || 0;
      const missingContact = qualityStats.missingContact || 0;
      const missingCompany = qualityStats.missingCompany || 0;

      const completePct = totalUsers > 0 ? Math.round((complete / totalUsers) * 100) : 0;
      const missingContactPct = totalUsers > 0 ? Math.round((missingContact / totalUsers) * 100) : 0;
      const missingProfPct = totalUsers > 0 ? Math.round((missingCompany / totalUsers) * 100) : 0;
      const needsUpdatePct = totalUsers > 0 ? Math.round((needsUpdate / totalUsers) * 100) : 0;

      const recentUpdates = Array.isArray(activityList) && activityList.length > 0
        ? activityList.map((item) => ({
            id: item.id,
            userId: item.actorId,
            userName: item.actorName,
            userRole: item.action?.startsWith('VERIFICATION') ? 'Admin Action' : 'Activity',
            avatar: item.avatar,
            action: item.description,
            time: item.time,
          }))
        : [];

      return {
        metrics: {
          totalUsers,
          alumni,
          students,
          needsUpdate,
        },
        verification: dashData.verification || { pending: 0, approved: 0, rejected: 0, total: 0 },
        growth: dashData.growth || { newUsersThisWeek: 0, newUsersThisMonth: 0, newUsersLastMonth: 0, monthlyTimeSeries: [] },
        distribution: dashData.distribution || { branches: [], batches: [] },
        recentUpdates,
        dataQualitySnapshot: [
          { label: 'Complete', percentage: completePct, count: complete, color: 'bg-emerald-500' },
          { label: 'Missing Contact', percentage: missingContactPct, count: missingContact, color: 'bg-amber-500' },
          { label: 'Missing Professional', percentage: missingProfPct, count: missingCompany, color: 'bg-blue-500' },
          { label: 'Needs Update', percentage: needsUpdatePct, count: needsUpdate, color: 'bg-red-500' }
        ]
      };
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
      throw err;
    }
  },

  /**
   * Fetch paginated & filtered audit logs from backend API
   */
  getAuditLogs: async (options = {}) => {
    return await apiClient.get('/api/v1/admin/audit-logs', { params: options });
  },

  /**
   * Fetch recent activity stream derived from audit_logs
   */
  getRecentActivity: async ({ limit = 10 } = {}) => {
    return await apiClient.get('/api/v1/admin/activity', { params: { limit } });
  },

  /**
   * Fetch Alumni Verification queue requests from backend API
   */
  getVerifications: async ({ status, q, page = 1, pageSize = 20 } = {}) => {
    const params = {
      status: status && status !== 'all' ? status : undefined,
      q: q && q.trim() ? q.trim() : undefined,
      page,
      pageSize
    };
    return await apiClient.get('/api/v1/admin/verifications', { params });
  },

  /**
   * Approve or Reject an Alumni Verification request via backend API
   */
  updateVerificationStatus: async (id, { status, rejectionReason } = {}) => {
    return await apiClient.patch(`/api/v1/admin/verifications/${id}`, {
      status,
      rejectionReason
    });
  },

  /**
   * Server-side secure CSV Export API Integration
   */
  exportUsersCSV: async ({ userIds, filters, selectedFields } = {}) => {
    const activeColumns = selectedFields 
      ? Object.keys(selectedFields).filter((k) => selectedFields[k])
      : undefined;

    const token = localStorage.getItem('jecrc_community_jwt');
    const baseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080';
    
    const response = await fetch(`${baseUrl}/api/v1/admin/users/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        userIds,
        filters,
        columns: activeColumns
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to export CSV from server');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `jecrc_community_export_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  /**
   * Fetch system settings and admin profile details
   */
  getSettings: async () => {
    return await apiClient.get('/api/v1/admin/settings');
  },

  /**
   * Update system settings, admin profile, and credentials
   */
  updateSettings: async (payload) => {
    return await apiClient.patch('/api/v1/admin/settings', payload);
  },

  /**
   * Phase 10: Fetch paginated announcement & notification history
   */
  getNotifications: async (params = {}) => {
    const res = await apiClient.get('/api/v1/admin/notifications', { params });
    if (Array.isArray(res)) {
      return {
        notifications: res,
        data: res,
        summary: {
          totalAnnouncements: res.length,
          publishedCount: res.filter((n) => n.status === 'PUBLISHED').length,
          draftCount: res.filter((n) => n.status === 'DRAFT').length,
          cancelledCount: res.filter((n) => n.status === 'CANCELLED').length,
        },
        pagination: {
          totalCount: res.length,
          page: params.page || 1,
          pageSize: params.pageSize || 10,
          totalPages: Math.ceil(res.length / (params.pageSize || 10)) || 1,
          hasNext: false,
          hasPrev: (params.page || 1) > 1,
        },
      };
    }
    return res;
  },

  /**
   * Phase 10: Fetch single announcement by ID
   */
  getNotificationById: async (id) => {
    return await apiClient.get(`/api/v1/admin/notifications/${id}`);
  },

  /**
   * Phase 10: Create a new announcement draft
   */
  createNotification: async (payload) => {
    return await apiClient.post('/api/v1/admin/notifications', payload);
  },

  /**
   * Phase 10: Update an existing draft announcement
   */
  updateNotification: async (id, payload) => {
    return await apiClient.patch(`/api/v1/admin/notifications/${id}`, payload);
  },

  /**
   * Phase 10: Publish an announcement and generate delivery records
   */
  publishNotification: async (id) => {
    return await apiClient.post(`/api/v1/admin/notifications/${id}/publish`, {});
  },

  /**
   * Phase 10: Cancel a draft announcement
   */
  cancelNotification: async (id) => {
    return await apiClient.post(`/api/v1/admin/notifications/${id}/cancel`, {});
  },

  /**
   * Phase 10: Delete a draft or cancelled announcement
   */
  deleteNotification: async (id) => {
    return await apiClient.delete(`/api/v1/admin/notifications/${id}`);
  },

  /**
   * Phase 10: Preview audience recipient count for targeting configuration
   */
  previewAudience: async (payload) => {
    return await apiClient.post('/api/v1/admin/notifications/preview-audience', payload);
  },

  /**
   * Phase 13: Promote Student to Alumni role
   */
  promoteUserToAlumni: async (id) => {
    return await apiClient.patch(`/api/v1/admin/users/${id}/role`, { role: 'ALUMNI' });
  },

  /**
   * Phase 13: Update user account status (ACTIVE or DISABLED)
   */
  updateUserStatus: async (id, status) => {
    return await apiClient.patch(`/api/v1/admin/users/${id}/status`, { accountStatus: status });
  },

  /**
   * Phase 13: Fetch real Admin Notification Inbox records
   */
  getNotificationInbox: async (params = {}) => {
    return await apiClient.get('/api/v1/admin/notifications/inbox', { params });
  },

  /**
   * Phase 13: Mark single notification as read
   */
  markNotificationAsRead: async (id) => {
    return await apiClient.patch(`/api/v1/admin/notifications/${id}/read`);
  },
  markNotificationRead: async (id) => {
    return await apiClient.patch(`/api/v1/admin/notifications/${id}/read`);
  },

  /**
   * Phase 13: Mark all notifications as read
   */
  markAllNotificationsAsRead: async () => {
    return await apiClient.patch('/api/v1/admin/notifications/read-all');
  },
  markAllNotificationsRead: async () => {
    return await apiClient.patch('/api/v1/admin/notifications/read-all');
  }
};
