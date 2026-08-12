import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, GraduationCap, Star, Sparkles, CheckCircle2, Bookmark } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AlumniCard = ({ alumni, showMatchReasons = false }) => {
  const navigate = useNavigate();
  const { savedAlumniIds, toggleSaveAlumni } = useApp();
  const isSaved = savedAlumniIds.includes(alumni.id);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-red-200 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      {/* Header Cover Bar */}
      <div>
        <div className={`h-24 bg-gradient-to-r ${alumni.coverBg || 'from-red-600 via-rose-700 to-red-900'} p-4 relative flex justify-between items-start`}>
          {alumni.matchPercentage && (
            <div className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md text-xs font-extrabold text-red-900 border border-red-100">
              <Sparkles className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>{alumni.matchPercentage}% Match</span>
            </div>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleSaveAlumni(alumni.id);
            }}
            className={`p-2 rounded-full transition-all ${
              isSaved ? 'bg-white text-red-600 shadow-md scale-110' : 'bg-black/20 text-white hover:bg-white/30'
            }`}
            title={isSaved ? 'Remove Bookmark' : 'Save Alumni'}
          >
            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pt-0 pb-4 relative">
          {/* Avatar */}
          <div className="-mt-12 mb-3 flex items-end justify-between">
            <div className="relative">
              <img
                src={alumni.avatar}
                alt={alumni.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-slate-100 group-hover:scale-105 transition-transform"
              />
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                  alumni.isAvailableForMentorship ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
                title={alumni.isAvailableForMentorship ? 'Available for Mentorship' : 'Currently Busy'}
              />
            </div>
            <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-extrabold border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{alumni.rating}</span>
              <span className="text-amber-700/70 font-normal">({alumni.reviewsCount})</span>
            </div>
          </div>

          {/* Name & Role */}
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-red-600 transition-colors flex items-center gap-1.5">
              <span>{alumni.name}</span>
              <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
            </h3>
            <p className="text-sm font-bold text-red-700 flex items-center gap-1.5 mt-0.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{alumni.currentRole}</span>
              <span className="text-slate-400 font-normal">@</span>
              <span className="text-slate-900 font-black">{alumni.company}</span>
            </p>
          </div>

          {/* Meta Info */}
          <div className="mt-3 flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>JU Class of {alumni.graduationYear}</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{alumni.location}</span>
            </span>
          </div>

          {/* Match Reason highlights */}
          {showMatchReasons && alumni.matchReasons && alumni.matchReasons.length > 0 && (
            <div className="mt-3 bg-red-50/70 border border-red-100 rounded-xl p-2.5 text-xs text-red-950 space-y-1">
              <span className="font-extrabold text-red-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-red-600" /> Why a great JU match:
              </span>
              <p className="text-[11px] text-slate-700 leading-snug">
                • {alumni.matchReasons[0]}
              </p>
            </div>
          )}

          {/* Skills Pills */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {alumni.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/60"
              >
                {skill}
              </span>
            ))}
            {alumni.skills.length > 4 && (
              <span className="text-[11px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md">
                +{alumni.skills.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        <Link
          to={`/alumni/${alumni.id}`}
          className="w-1/2 py-2.5 text-center text-xs font-extrabold text-slate-700 hover:text-red-700 bg-white border border-slate-200 rounded-xl hover:border-red-300 transition-all shadow-2xs"
        >
          View Profile
        </Link>
        <Link
          to={`/request-mentorship/${alumni.id}`}
          className="w-1/2 py-2.5 text-center text-xs font-extrabold text-white gradient-accent-red rounded-xl shadow-xs hover:opacity-95 transition-opacity"
        >
          Request Mentorship
        </Link>
      </div>
    </div>
  );
};
