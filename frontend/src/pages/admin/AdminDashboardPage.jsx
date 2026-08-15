import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { adminUserService } from '../../services/adminUserService';
import { ExportModal } from '../../components/admin/export/ExportModal';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  Clock, 
  ArrowRight, 
  FileSpreadsheet, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [stats, setStats] = useState({
    metrics: {
      totalUsers: 0,
      alumni: 0,
      students: 0,
      needsUpdate: 0,
    },
    verification: { pending: 0, approved: 0, rejected: 0, total: 0 },
    growth: { newUsersThisWeek: 0, newUsersThisMonth: 0, newUsersLastMonth: 0, monthlyTimeSeries: [] },
    distribution: { branches: [], batches: [] },
    recentUpdates: [],
    dataQualitySnapshot: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const data = await adminUserService.getAdminDashboardStats();
      if (data) setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError(err.message || 'Failed to fetch dashboard statistics from database.');
      setErrorStatus(err.status || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-5">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              University community overview &amp; database health monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 py-1.5 rounded text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>View All Users</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <p className="font-bold text-red-900">
                  {errorStatus === 401 ? 'Session Expired' : 'Failed to load live dashboard statistics'}
                </p>
                <p className="text-[11px] text-red-700">
                  {errorStatus === 401
                    ? 'Your administrator session has expired. Please log in again to continue.'
                    : error}
                </p>
              </div>
            </div>
            {errorStatus === 401 ? (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-2.5 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                Log In Again
              </button>
            ) : (
              <button
                type="button"
                onClick={fetchDashboardData}
                className="px-2.5 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* 1. Institutional KPI Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Total Users */}
          <div
            onClick={() => navigate('/admin/users')}
            className="bg-white p-3.5 rounded-md border border-slate-200 space-y-1 text-left cursor-pointer hover:border-slate-300 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Users</span>
            <span className="text-lg font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : (stats.metrics?.totalUsers ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-normal block">Registered database users</span>
          </div>

          {/* Students */}
          <div
            onClick={() => navigate('/admin/users?role=student')}
            className="bg-white p-3.5 rounded-md border border-slate-200 space-y-1 text-left cursor-pointer hover:border-slate-300 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Students</span>
            <span className="text-lg font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : (stats.metrics?.students ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-normal block">Enrolled undergraduates</span>
          </div>

          {/* Alumni */}
          <div
            onClick={() => navigate('/admin/users?role=alumni')}
            className="bg-white p-3.5 rounded-md border border-slate-200 space-y-1 text-left cursor-pointer hover:border-slate-300 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alumni</span>
            <span className="text-lg font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : (stats.metrics?.alumni ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-normal block">Verified graduates</span>
          </div>

          {/* Pending Approvals */}
          <div
            onClick={() => navigate('/admin/users?tab=approval')}
            className="bg-white p-3.5 rounded-md border border-slate-200 space-y-1 text-left cursor-pointer hover:border-amber-300 transition-colors"
          >
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pending Approvals</span>
            <span className="text-lg font-bold text-amber-800 tracking-tight block">
              {isLoading ? '...' : (stats.verification?.pending ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-amber-700 font-normal block">Alumni verification queue</span>
          </div>

          {/* Active Jobs */}
          <div
            onClick={() => navigate('/admin/content')}
            className="bg-white p-3.5 rounded-md border border-slate-200 space-y-1 text-left cursor-pointer hover:border-slate-300 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Jobs</span>
            <span className="text-lg font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : (stats.metrics?.activeJobs ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-normal block">Open career opportunities</span>
          </div>

          {/* Upcoming Events */}
          <div
            onClick={() => navigate('/admin/content')}
            className="bg-white p-3.5 rounded-md border border-slate-200 space-y-1 text-left cursor-pointer hover:border-slate-300 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Upcoming Events</span>
            <span className="text-lg font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : (stats.metrics?.upcomingEvents ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-normal block">Scheduled webinars &amp; meets</span>
          </div>

          {/* Mentorship Requests */}
          <div
            onClick={() => navigate('/admin/content')}
            className="bg-white p-3.5 rounded-md border border-slate-200 space-y-1 text-left cursor-pointer hover:border-slate-300 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mentorship Requests</span>
            <span className="text-lg font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : (stats.metrics?.openMentorshipRequests ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-normal block">Pending student requests</span>
          </div>

          {/* Disabled Users */}
          <div
            onClick={() => navigate('/admin/users?status=disabled')}
            className="bg-white p-3.5 rounded-md border border-slate-200 space-y-1 text-left cursor-pointer hover:border-red-300 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disabled Users</span>
            <span className="text-lg font-bold text-slate-900 tracking-tight block">
              {isLoading ? '...' : (stats.metrics?.disabledUsers ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-normal block">Suspended user accounts</span>
          </div>

        </div>

        {/* 2. Middle Section: Activity Stream & Data Quality */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Recent Administrative Activity Stream */}
          <div className="lg:col-span-7 bg-white rounded-md border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Administrative Activity Log</h3>
                <p className="text-[11px] text-slate-500">Live stream of record changes and system events</p>
              </div>
              <Link
                to="/admin/data"
                className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Audit Logs</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2 divide-y divide-slate-100">
              {stats.recentUpdates.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No recent administrative activity recorded in audit log.
                </div>
              ) : (
                stats.recentUpdates.map((item) => (
                  <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700 shrink-0">
                        {item.userName ? item.userName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 truncate">
                            {item.userName}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase border border-slate-200">
                            {item.userRole}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.action}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {item.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Data Quality Snapshot */}
          <div className="lg:col-span-5 bg-white rounded-md border border-slate-200 p-4 space-y-3">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Data Hygiene Snapshot</h3>
                <p className="text-[11px] text-slate-500">Database completeness metrics</p>
              </div>
              <Link
                to="/admin/data"
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-2.5">
              {stats.dataQualitySnapshot.map((dq) => (
                <div key={dq.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{dq.label}</span>
                    <span className="font-bold text-slate-900">{dq.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-700 transition-all duration-300"
                      style={{ width: `${dq.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/admin/data')}
                className="w-full py-1.5 rounded text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-center cursor-pointer"
              >
                Inspect Data Management Issues →
              </button>
            </div>
          </div>

        </div>

        {/* 3. Dashboard Quick Actions */}
        <div className="bg-white rounded-md border border-slate-200 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Operational Quick Actions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="p-3 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left space-y-1 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <Users className="w-4 h-4 text-slate-700 group-hover:text-red-700" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-700" />
              </div>
              <p className="text-xs font-bold text-slate-900">View Users Directory</p>
              <p className="text-[11px] text-slate-500">Search and filter complete user database</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/users?lastUpdated=more1year')}
              className="p-3 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left space-y-1 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
              </div>
              <p className="text-xs font-bold text-slate-900">Find Outdated Records</p>
              <p className="text-[11px] text-slate-500">Filter records last updated &gt; 1 year ago</p>
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="p-3 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left space-y-1 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="w-4 h-4 text-slate-700 group-hover:text-emerald-700" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
              </div>
              <p className="text-xs font-bold text-slate-900">Export Data</p>
              <p className="text-[11px] text-slate-500">Generate CSV exports with custom field selection</p>
            </button>
          </div>
        </div>

      </div>

      {/* CSV Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          onClose={() => setIsExportModalOpen(false)}
          exportContext="all"
        />
      )}
    </AdminLayout>
  );
};
