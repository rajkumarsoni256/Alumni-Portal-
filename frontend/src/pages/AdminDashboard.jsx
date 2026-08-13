import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MOCK_ADMIN_STATS } from '../data/mockData';
import { AdminCharts } from '../components/admin/AdminCharts';
import { 
  Shield, 
  Users, 
  GraduationCap, 
  UserCheck, 
  CheckCircle2, 
  Check, 
  X, 
  Sparkles
} from 'lucide-react';

export const AdminDashboard = () => {
  const { showNotification } = useApp();
  const [verifications, setVerifications] = useState(MOCK_ADMIN_STATS.pendingVerifications);

  const handleVerify = (id, approved) => {
    setVerifications((prev) => prev.filter((v) => v.id !== id));
    showNotification(
      approved
        ? 'Alumni account verified & approved!'
        : 'Alumni verification request declined.',
      approved ? 'success' : 'info'
    );
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
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Students</span>
            <p className="text-xl font-bold text-slate-900">
              {MOCK_ADMIN_STATS.totalStudents.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">+8% this year</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Alumni</span>
            <p className="text-xl font-bold text-slate-900">
              {MOCK_ADMIN_STATS.totalAlumni.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500 font-medium">Across 40+ countries</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Active Mentors</span>
            <p className="text-xl font-bold text-slate-900">
              {MOCK_ADMIN_STATS.activeMentors}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">Available for 1-on-1s</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Mentorship Pairings</span>
            <p className="text-xl font-bold text-slate-900">
              {MOCK_ADMIN_STATS.mentorshipConnections.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500 font-medium">Completed</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Avg Satisfaction</span>
            <p className="text-xl font-bold text-slate-900">
              {MOCK_ADMIN_STATS.avgSessionRating}★
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">98% positive rating</span>
          </div>
        </div>

        {/* Charts Section */}
        <AdminCharts />

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
                            src={v.avatar}
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
                        <span className="font-semibold text-slate-800 block">{v.currentRole}</span>
                        <span className="text-[11px] text-slate-500">{v.company}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">{v.degree}</span>
                        <span className="text-[11px] text-slate-400">Class of {v.batch}</span>
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
