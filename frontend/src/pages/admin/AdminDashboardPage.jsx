import React, { useState } from 'react';
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
  const stats = adminUserService.getAdminDashboardStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              Overview of JECRC student and alumni database health.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>View All Users</span>
            </button>
          </div>
        </div>

        {/* 1. Four Core Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Users */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Users
              </span>
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.metrics.totalUsers.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                Active JECRC database
              </span>
            </div>
          </div>

          {/* Card 2: Alumni */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Alumni
              </span>
              <div className="p-2 rounded-lg bg-red-50 text-red-700">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.metrics.alumni.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                Graduates across 40+ countries
              </span>
            </div>
          </div>

          {/* Card 3: Students */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Students
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.metrics.students.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                Enrolled campus undergraduates
              </span>
            </div>
          </div>

          {/* Card 4: Needs Update */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Needs Update
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.metrics.needsUpdate.toLocaleString()}
              </span>
              <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
                Outdated &gt; 1 year
              </span>
            </div>
          </div>

        </div>

        {/* 2. Middle Section: Recent Data Updates & Data Quality Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Recently Updated Stream (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recently Updated</h3>
                <p className="text-xs text-slate-500">Live stream of record modifications</p>
              </div>
              <Link
                to="/admin/users"
                className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              {stats.recentUpdates.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.avatar}
                      alt={item.userName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.userName}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.userRole}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate">
                        {item.action}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-slate-400 shrink-0">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Quality Snapshot (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Data Quality</h3>
                <p className="text-xs text-slate-500">Record completeness health</p>
              </div>
              <Link
                to="/admin/data"
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-3.5">
              {stats.dataQualitySnapshot.map((dq) => (
                <div key={dq.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{dq.label}</span>
                    <span className="font-bold text-slate-900">{dq.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${dq.color} transition-all duration-300`}
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
                className="w-full py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-center cursor-pointer"
              >
                Inspect Data Management Issues →
              </button>
            </div>
          </div>

        </div>

        {/* 3. Dashboard Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left space-y-1 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <Users className="w-4 h-4 text-slate-700 group-hover:text-red-700" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-700" />
              </div>
              <p className="text-xs font-bold text-slate-900">View Users</p>
              <p className="text-[11px] text-slate-500">Search and filter complete user directory</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/users?lastUpdated=more1year')}
              className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left space-y-1 cursor-pointer group"
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
              className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left space-y-1 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
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
