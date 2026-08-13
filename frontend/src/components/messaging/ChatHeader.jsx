import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, User } from 'lucide-react';

export const ChatHeader = ({ partner, onBack }) => {
  if (!partner) return null;

  const isAlumni = Boolean(partner.isAlumni || partner.role?.toLowerCase() === 'alumni');
  const profilePath = isAlumni
    ? `/alumni/${partner.id}`
    : partner.id === 'st_101'
    ? '/student-dashboard'
    : `/profile/${partner.id}`;

  const subtitle = partner.headline || (isAlumni ? `Alumni @ ${partner.company || 'JECRC'}` : 'JECRC Student');
  const batchInfo = partner.batchDisplay || (partner.batch ? `JECRC ${partner.branch || 'CSE'} • ${partner.batch}` : 'JECRC Community');

  return (
    <div className="h-16 px-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0 sticky top-0 z-10">
      
      {/* Left: Mobile Back Button + Partner Avatar + Identity */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Back Button (Mobile/Tablet only) */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar with Status */}
        <Link to={profilePath} className="relative shrink-0 group">
          <img
            src={partner.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300'}
            alt={partner.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-red-600/20 transition-all"
          />
          {isAlumni && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"
              title="Verified Alumni"
            />
          )}
        </Link>

        {/* Identity & Company/Batch */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              to={profilePath}
              className="text-sm font-bold text-slate-900 hover:text-red-700 hover:underline truncate block transition-colors"
            >
              {partner.name}
            </Link>
            {isAlumni && (
              <ShieldCheck className="w-3.5 h-3.5 text-red-700 shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-slate-500 truncate leading-tight">
            {subtitle} <span className="text-slate-300">•</span> {batchInfo}
          </p>
        </div>
      </div>

      {/* Right: Quick Profile Link */}
      <div className="shrink-0">
        <Link
          to={profilePath}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors inline-flex items-center gap-1 shadow-2xs"
          title="View full profile"
        >
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Profile</span>
        </Link>
      </div>

    </div>
  );
};
