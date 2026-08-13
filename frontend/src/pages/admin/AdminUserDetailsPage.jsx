import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { adminUserService } from '../../services/adminUserService';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  GraduationCap, 
  Globe, 
  Link2, 
  Code2, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Award
} from 'lucide-react';

export const AdminUserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = adminUserService.getAdminUserById(id);

  if (!user) {
    return (
      <AdminLayout>
        <div className="py-16 text-center space-y-4 bg-white rounded-xl border border-slate-200 p-8">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">User Record Not Found</h2>
          <p className="text-xs text-slate-500">The requested record ID "{id}" does not exist in the database.</p>
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-800 transition-colors cursor-pointer"
          >
            ← Return to Users Directory
          </button>
        </div>
      </AdminLayout>
    );
  }

  const isOutdated = user.lastUpdatedDaysAgo > 365;

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Back Link */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Users</span>
          </button>
        </div>

        {/* 1. User Detail Header Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xl border-2 border-white shadow-sm shrink-0">
                {user.name.charAt(0)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                    {user.name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      user.role === 'Alumni'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      user.profileStatus === 'Complete'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : user.profileStatus === 'Needs Update'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}
                  >
                    Status: {user.profileStatus}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-600">
                  {user.institution} • {user.degree} in {user.branch} (Batch of {user.batch})
                </p>

                <p className="text-[11px] text-slate-400">
                  Record ID: <span className="font-mono text-slate-600 font-semibold">{user.id}</span>
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 space-y-1 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Last Record Update</span>
              <span className={`text-xs font-bold block ${isOutdated ? 'text-amber-700' : 'text-slate-800'}`}>
                {user.lastUpdatedDaysAgo} days ago ({new Date(user.updatedAt).toLocaleDateString()})
              </span>
              {isOutdated && (
                <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-bold">
                  <AlertCircle className="w-3 h-3" />
                  <span>Requires Record Refresh</span>
                </span>
              )}
            </div>

          </div>
        </div>

        {/* 2. Three Column Information Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Contact Information */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Mail className="w-4 h-4 text-red-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Contact Information
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Primary Email</span>
                <span className="font-bold text-slate-900 block truncate">
                  {user.email || '— (Missing Email)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Phone Number</span>
                <span className="font-bold text-slate-900 block">
                  {user.phone || '— (Missing Phone)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">City & Location</span>
                <span className="font-semibold text-slate-800 block">
                  {user.location || '—'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Country</span>
                <span className="font-semibold text-slate-800 block">
                  {user.country || 'India'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Academic Information */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <GraduationCap className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Academic Information
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Institution</span>
                <span className="font-bold text-slate-900 block">
                  {user.institution}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Degree & Branch</span>
                <span className="font-bold text-slate-900 block">
                  {user.degree} in {user.branch}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Batch Year</span>
                <span className="font-bold text-slate-900 block">
                  {user.batch}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Graduation Year</span>
                <span className="font-bold text-slate-900 block">
                  {user.graduationYear}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Professional Information */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Professional Information
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Current Company</span>
                <span className="font-bold text-slate-900 block">
                  {user.company || '— (Not Specified)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Designation / Role</span>
                <span className="font-bold text-slate-900 block">
                  {user.designation || '—'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Industry</span>
                <span className="font-semibold text-slate-800 block">
                  {user.industry || '—'}
                </span>
              </div>

              {user.skills && user.skills.length > 0 && (
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px] mb-1">Key Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {user.skills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 3. Bottom Section: Social Profiles & Record Data Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* External Links */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              External Profiles
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200/60">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-600" />
                  <span>LinkedIn Profile</span>
                </span>
                {user.linkedin ? (
                  <a
                    href={user.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Open Link ↗
                  </a>
                ) : (
                  <span className="text-slate-400">Not provided</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200/60">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-slate-800" />
                  <span>GitHub Profile</span>
                </span>
                {user.github ? (
                  <a
                    href={user.github}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-slate-800 hover:underline"
                  >
                    Open Link ↗
                  </a>
                ) : (
                  <span className="text-slate-400">Not provided</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200/60">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Portfolio / Website</span>
                </span>
                {user.portfolio ? (
                  <a
                    href={user.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Open Link ↗
                  </a>
                ) : (
                  <span className="text-slate-400">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Record Quality Status */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Record Quality Audit
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="text-slate-700 font-medium">Contact Completeness</span>
                <span className={`font-bold ${user.email && user.phone ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {user.email && user.phone ? 'Complete (Email & Phone)' : 'Incomplete'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="text-slate-700 font-medium">Professional Information</span>
                <span className={`font-bold ${user.company ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {user.company ? 'Complete' : 'Missing Company'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="text-slate-700 font-medium">Record Freshness</span>
                <span className={`font-bold ${isOutdated ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isOutdated ? 'Outdated (> 1 Year)' : 'Fresh'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};
