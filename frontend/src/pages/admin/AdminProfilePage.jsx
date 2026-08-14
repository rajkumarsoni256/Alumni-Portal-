import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Mail, 
  User, 
  Building2, 
  Award, 
  Lock, 
  KeyRound, 
  Clock, 
  CheckCircle2, 
  Settings, 
  Database,
  ArrowRight
} from 'lucide-react';

export const AdminProfilePage = () => {
  const { authUser, currentUser } = useApp();
  const navigate = useNavigate();

  const adminName = currentUser?.name || authUser?.name || 'Dean of Alumni Relations';
  const adminEmail = authUser?.email || 'admin@jecrc.ac.in';
  const adminRole = authUser?.role || 'ADMIN';

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Administrator Profile
            </h1>
            <p className="text-xs text-slate-500">
              Verified identity, official credentials, and platform management authority.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/settings"
              className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Settings</span>
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-md border border-slate-200 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-5 border-b border-slate-100">
            <div className="relative">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'}
                alt={adminName}
                className="w-16 h-16 rounded-full object-cover border border-slate-200"
              />
              <span className="absolute bottom-0 right-0 p-1 bg-red-700 text-white rounded-full border border-white" title="Verified Administrator">
                <ShieldCheck className="w-3 h-3" />
              </span>
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {adminName}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 uppercase">
                  {adminRole}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Authenticated</span>
                </span>
              </div>
              
              <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Directorate of Alumni Relations &amp; Institutional Advancement</span>
              </p>

              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{adminEmail}</span>
              </p>
            </div>
          </div>

          {/* Institutional Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 rounded bg-slate-50 border border-slate-200/80 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Institution</span>
              <p className="text-xs font-bold text-slate-900">JECRC University, Jaipur</p>
              <p className="text-[11px] text-slate-500">Official Campus Portal</p>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200/80 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Access Level</span>
              <p className="text-xs font-bold text-slate-900">Platform Super Administrator</p>
              <p className="text-[11px] text-slate-500">Full System &amp; Data Rights</p>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200/80 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Status</span>
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>Active (JWT Secured)</span>
              </p>
              <p className="text-[11px] text-slate-500">PostgreSQL Backend Verified</p>
            </div>
          </div>

          {/* Admin Responsibilities & Authority */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Administrative Authority &amp; Capabilities
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded border border-slate-200/80 bg-white">
                <User className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">User Directory &amp; Alumni Approval</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Review and verify incoming alumni registration requests, disable accounts, and inspect directory records.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded border border-slate-200/80 bg-white">
                <Database className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Data Management &amp; CSV Export</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Monitor database hygiene, execute filtered CSV user exports, and analyze profile completion statistics.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded border border-slate-200/80 bg-white">
                <Award className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Content &amp; Event Governance</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Publish official JECRC job opportunities, campus events, inspect RSVPs, and moderate feed content.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded border border-slate-200/80 bg-white">
                <Lock className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">System Security &amp; Audit Logs</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Inspect immutable PostgreSQL audit trails, configure global platform toggles, and secure admin credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Need to change email or password? Use system settings.
            </span>

            <div className="flex items-center gap-2">
              <Link
                to="/admin/settings"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1"
              >
                <span>System Settings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};
