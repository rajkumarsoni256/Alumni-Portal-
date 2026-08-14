import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { adminUserService } from '../services/adminUserService';
import { AdminCharts } from '../components/admin/AdminCharts';
import { 
  Shield, 
  Users, 
  GraduationCap, 
  UserCheck, 
  CheckCircle2, 
  Check, 
  X, 
  Sparkles,
  Clock
} from 'lucide-react';

export const AdminDashboard = () => {
  const { showNotification } = useApp();
  const [verifications, setVerifications] = useState([]);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    overview: { totalUsers: 0, students: 0, alumni: 0, admins: 0, needsUpdate: 0 },
    verification: { pending: 0, approved: 0, rejected: 0, total: 0 },
    growth: { newUsersThisWeek: 0, newUsersThisMonth: 0, newUsersLastMonth: 0, monthlyTimeSeries: [] },
    distribution: { branches: [], batches: [] },
  });

  const loadDashboardData = async () => {
    setIsLoadingVerifications(true);
    try {
      const [verifRes, statsRes] = await Promise.all([
        adminUserService.getVerifications({ status: 'PENDING' }),
        adminUserService.getDashboardAnalytics().catch(() => null),
      ]);
      setVerifications(verifRes?.verifications || []);
      if (statsRes) setDashboardStats(statsRes);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setVerifications([]);
    } finally {
      setIsLoadingVerifications(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleVerify = async (id, approved) => {
    try {
      await adminUserService.updateVerificationStatus(id, {
        status: approved ? 'APPROVED' : 'REJECTED',
        rejectionReason: approved ? undefined : 'Declined during administrative review',
      });
      setVerifications((prev) => prev.filter((v) => v.id !== id));
      showNotification(
        approved
          ? 'Alumni account verified & approved!'
          : 'Alumni verification request declined.',
        approved ? 'success' : 'info'
      );
    } catch (err) {
      console.error('Failed to update verification status:', err);
      showNotification(err.message || 'Failed to update verification status.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/75 py-5">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
        
        {/* Header Title */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">JECRC Directorate Administration</h1>
              <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.2 rounded-full">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Alumni relations metrics, student interest analytics, and verification approvals.
            </p>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg self-start sm:self-auto">
            <span>System Status: <strong className="text-emerald-700">Operational</strong></span>
          </div>
        </div>

        {/* 5 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Users</span>
            <p className="text-xl font-bold text-slate-900">
              {dashboardStats.overview.totalUsers.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">Active database</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Alumni</span>
            <p className="text-xl font-bold text-slate-900">
              {dashboardStats.overview.alumni.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500 font-medium">Graduates</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Students</span>
            <p className="text-xl font-bold text-slate-900">
              {dashboardStats.overview.students.toLocaleString()}
            </p>
            <span className="text-[10px] text-blue-600 font-medium">Undergraduates</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Pending Verifications</span>
            <p className="text-xl font-bold text-slate-900">
              {dashboardStats.verification.pending.toLocaleString()}
            </p>
            <span className="text-[10px] text-amber-600 font-medium">Review queue</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Needs Update</span>
            <p className="text-xl font-bold text-slate-900">
              {dashboardStats.overview.needsUpdate.toLocaleString()}
            </p>
            <span className="text-[10px] text-amber-700 font-medium">&gt; 1 year stale</span>
          </div>
        </div>

        {/* Charts Section */}
        <AdminCharts 
          branches={dashboardStats.distribution?.branches} 
          batches={dashboardStats.distribution?.batches} 
        />

        {/* Pending Alumni Verifications Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Alumni Verification Queue</h2>
              <p className="text-xs text-slate-500">Review degree and employment details before granting verified alumni badge.</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {verifications.length} pending
            </span>
          </div>

          {verifications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Alumni Candidate</th>
                    <th className="py-2.5 px-3">Roll No & Course</th>
                    <th className="py-2.5 px-3">Role & Company</th>
                    <th className="py-2.5 px-3">Graduation</th>
                    <th className="py-2.5 px-3">Document Proof</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verifications.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={v.avatar || '/ju-alumni-logo.jpg'}
                            alt={v.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{v.name}</span>
                            <span className="text-[11px] text-slate-400">{v.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-semibold text-slate-800 block">
                          {v.universityRollNumber || 'N/A'}
                        </span>
                        <span className="text-[11px] text-slate-500">{v.course || v.branch || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 block">{v.currentRole || 'Applicant'}</span>
                        <span className="text-[11px] text-slate-500">{v.company || v.location || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">{v.degree}</span>
                        <span className="text-[11px] text-slate-400">
                          {v.joiningYear ? `${v.joiningYear} - ${v.batch}` : `Class of ${v.batch}`}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {v.proofDocument}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerify(v.id, true)}
                            className="px-2.5 py-1 rounded text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleVerify(v.id, false)}
                            className="px-2.5 py-1 rounded text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
              All alumni verification requests have been processed.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
