import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { adminUserService } from '../../services/adminUserService';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  ArrowRight, 
  ShieldCheck 
} from 'lucide-react';

export const AdminDataManagementPage = () => {
  const navigate = useNavigate();
  const [qualityStats, setQualityStats] = useState({
    complete: 0,
    incomplete: 0,
    needsUpdate: 0,
    missingContact: 0,
    missingEmail: 0,
    missingPhone: 0,
    missingCompany: 0,
    missingLocation: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const data = await adminUserService.getDataQualityStats();
      if (data) setQualityStats(data);
    } catch (err) {
      console.error('Failed to fetch data quality stats:', err);
      setError(err.message || 'Failed to fetch data quality stats from database.');
      setErrorStatus(err.status || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-5">
        
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-3.5">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Data Management
          </h1>
          <p className="text-xs text-slate-500">
            Monitor database record freshness, completeness, and identify stale entries.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <p className="font-bold text-red-900">
                  {errorStatus === 401 ? 'Session Expired' : 'Failed to load data quality stats'}
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
                className="px-3 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Log In Again
              </button>
            ) : (
              <button
                type="button"
                onClick={fetchStats}
                className="px-3 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* 1. Four Interactive Quality Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Card 1: Complete */}
          <button
            type="button"
            onClick={() => navigate('/admin/users?status=complete')}
            className="bg-white p-4 rounded-md border border-slate-200 hover:border-slate-300 transition-colors text-left space-y-1.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Complete Records
              </span>
              <div className="p-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight block">
                {qualityStats.complete.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-600 font-medium block mt-0.5 group-hover:text-red-700 flex items-center gap-1">
                <span>View Complete Users</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          {/* Card 2: Incomplete */}
          <button
            type="button"
            onClick={() => navigate('/admin/users?status=incomplete')}
            className="bg-white p-4 rounded-md border border-slate-200 hover:border-slate-300 transition-colors text-left space-y-1.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                Incomplete Records
              </span>
              <div className="p-1.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold text-amber-800 tracking-tight block">
                {qualityStats.incomplete.toLocaleString()}
              </span>
              <span className="text-[11px] text-amber-700 font-medium block mt-0.5 group-hover:underline flex items-center gap-1">
                <span>View Incomplete Users</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          {/* Card 3: Needs Update */}
          <button
            type="button"
            onClick={() => navigate('/admin/users?lastUpdated=more1year')}
            className="bg-white p-4 rounded-md border border-slate-200 hover:border-red-300 transition-colors text-left space-y-1.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
                Needs Update
              </span>
              <div className="p-1.5 rounded bg-red-50 text-red-700 border border-red-200">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold text-red-700 tracking-tight block">
                {qualityStats.needsUpdate.toLocaleString()}
              </span>
              <span className="text-[11px] text-red-700 font-medium block mt-0.5 group-hover:underline flex items-center gap-1">
                <span>Outdated &gt; 1 Year</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          {/* Card 4: Missing Contact */}
          <button
            type="button"
            onClick={() => navigate('/admin/users?missing=email')}
            className="bg-white p-4 rounded-md border border-slate-200 hover:border-slate-300 transition-colors text-left space-y-1.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Missing Contact
              </span>
              <div className="p-1.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                <Mail className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight block">
                {qualityStats.missingContact.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-600 font-medium block mt-0.5 group-hover:text-red-700 flex items-center gap-1">
                <span>View Missing Contact Entries</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

        </div>

        {/* 2. Records Needing Attention */}
        <div className="bg-white rounded-md border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Records Needing Attention</h3>
              <p className="text-[11px] text-slate-500">Stale records that have not been modified in over 12 months</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/users?lastUpdated=more1year')}
              className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Outdated Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3.5 rounded bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-amber-100 text-amber-800 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900">
                  Last Updated &gt; 1 Year Ago ({qualityStats.needsUpdate.toLocaleString()} records)
                </h4>
                <p className="text-[11px] text-amber-800">
                  The association recommends sending automated email verification reminders to these alumni.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/users?lastUpdated=more1year')}
              className="px-3 py-1 rounded text-xs font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-200 transition-colors shrink-0 cursor-pointer"
            >
              Inspect {qualityStats.needsUpdate.toLocaleString()} Records
            </button>
          </div>
        </div>

        {/* 3. Detailed Data Gap Breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Missing Contact Information */}
          <div className="bg-white rounded-md border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Missing Contact Information
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200/60 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Email Missing</span>
                  <span className="text-[11px] text-slate-500">{qualityStats.missingEmail.toLocaleString()} records</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/users?missing=email')}
                  className="px-2.5 py-1 rounded text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  View Records
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200/60 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Phone Missing</span>
                  <span className="text-[11px] text-slate-500">{qualityStats.missingPhone.toLocaleString()} records</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/users?missing=phone')}
                  className="px-2.5 py-1 rounded text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  View Records
                </button>
              </div>
            </div>
          </div>

          {/* Missing Professional Information */}
          <div className="bg-white rounded-md border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Missing Professional Information
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200/60 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Company / Employer Missing</span>
                  <span className="text-[11px] text-slate-500">{qualityStats.missingCompany.toLocaleString()} records</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/users?missing=company')}
                  className="px-2.5 py-1 rounded text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  View Records
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200/60 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Location / City Missing</span>
                  <span className="text-[11px] text-slate-500">{qualityStats.missingLocation.toLocaleString()} records</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/users?missing=location')}
                  className="px-2.5 py-1 rounded text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  View Records
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};
