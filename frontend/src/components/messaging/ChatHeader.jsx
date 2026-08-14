import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Phone, Video, Search, MoreVertical } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

export const ChatHeader = ({ partner, onBack }) => {
  if (!partner) return null;

  const isAlumni = Boolean(partner.isAlumni || partner.role?.toLowerCase() === 'alumni');
  const profilePath = isAlumni
    ? `/alumni/${partner.id}`
    : partner.id === 'st_101'
    ? '/student-dashboard'
    : `/profile/${partner.id}`;

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

        {/* Avatar with Green Online Status */}
        <Link to={profilePath} className="relative shrink-0 group">
          <UserAvatar
            src={partner.avatar}
            name={partner.name}
            className="w-10 h-10 group-hover:ring-2 group-hover:ring-red-600/20 transition-all"
          />
          <span
            className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"
            title="Online"
          />
        </Link>

        {/* Identity & Online indicator matching Image 1 */}
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
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium leading-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Right: Phone, Video, Search, 3 Dots Action Icons matching Image 1 */}
      <div className="flex items-center gap-1 sm:gap-2 text-slate-500">
        <button
          type="button"
          className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Audio Call"
          aria-label="Audio Call"
        >
          <Phone className="w-4 h-4" />
        </button>

        <button
          type="button"
          className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Video Call"
          aria-label="Video Call"
        >
          <Video className="w-4 h-4" />
        </button>

        <button
          type="button"
          className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Search in Chat"
          aria-label="Search in Chat"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          type="button"
          className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Options"
          aria-label="Options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
