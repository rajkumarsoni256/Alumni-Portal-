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
  Calendar, 
  Check, 
  X, 
  Sparkles,
  Activity,
  Award
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Admin Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>Apex University Alumni Relations Office</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            University Administrator Dashboard
          </h1>
          <p className="text-sm text-slate-300">
            Real-time alumni networking analytics, student career interest monitoring, & verification approvals.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-xs text-slate-200">
          <span className="block text-[11px] text-slate-400">Network System Health</span>
          <span className="font-bold text-emerald-400 text-sm">Optimal (100% Operational)</span>
        </div>
      </div>

      {/* 5 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Total Students</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {MOCK_ADMIN_STATS.totalStudents.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">+8% this term</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Total Alumni</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {MOCK_ADMIN_STATS.totalAlumni.toLocaleString()}
          </p>
          <span className="text-[10px] text-indigo-600 font-semibold">Across 40+ countries</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Active Mentors</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {MOCK_ADMIN_STATS.activeMentors}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Available for 1-on-1s</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Mentorship Pairings</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {MOCK_ADMIN_STATS.mentorshipConnections.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-semibold">Completed Sessions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Upcoming Events</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {MOCK_ADMIN_STATS.upcomingEvents}
          </p>
          <span className="text-[10px] text-indigo-600 font-semibold">Workshops & Talks</span>
        </div>

      </div>

      {/* Visualizations Section */}
      <AdminCharts />

      {/* Grid: Pending Alumni Verification & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Pending Verifications Table (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Pending Alumni Verification</h3>
              <p className="text-xs text-slate-500">Verify degree certificates & company employment</p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {verifications.length} Pending Approval
            </span>
          </div>

          {verifications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Alumni Name</th>
                    <th className="py-3 px-2">Degree</th>
                    <th className="py-3 px-2">Current Role</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {verifications.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-2 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-2 text-slate-600">{item.degree}</td>
                      <td className="py-3 px-2 font-semibold text-indigo-600">
                        {item.role} @ {item.company}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerify(item.id, true)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            title="Approve & Verify"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleVerify(item.id, false)}
                            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold"
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
              All pending alumni verification requests have been processed!
            </div>
          )}
        </div>

        {/* Recent Network Activity Feed (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Live Platform Activity</h3>
              <p className="text-xs text-slate-500">Real-time mentorship & event logs</p>
            </div>
          </div>

          <div className="space-y-4">
            {MOCK_ADMIN_STATS.recentActivity.map((act, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                <div className="space-y-0.5">
                  <p className="text-slate-800 font-medium leading-snug">{act.text}</p>
                  <span className="text-[10px] text-slate-400 font-bold">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
