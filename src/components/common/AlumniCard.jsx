import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, GraduationCap, Star, ShieldCheck, Bookmark, MessageSquare, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AlumniCard = ({ alumni, showMatchReasons = false }) => {
  const navigate = useNavigate();
  const { savedAlumniIds, toggleSaveAlumni } = useApp();
  const isSaved = savedAlumniIds.includes(alumni.id);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between overflow-hidden">
      {/* Cover Header */}
      <div>
        <div className="h-16 bg-slate-800 relative px-3 py-2 flex items-start justify-between">
          {alumni.matchPercentage ? (
            <span className="text-[10px] font-semibold bg-white/90 text-slate-800 px-2 py-0.5 rounded shadow-2xs">
              {alumni.matchPercentage}% match
            </span>
          ) : <span />}

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleSaveAlumni(alumni.id);
            }}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isSaved ? 'bg-white text-red-700' : 'bg-black/30 text-white hover:bg-black/50'
            }`}
            title={isSaved ? 'Remove Bookmark' : 'Save Alumni'}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Profile Details */}
        <div className="px-4 pb-3 pt-0 relative">
          {/* Avatar & Availability */}
          <div className="-mt-8 mb-2.5 flex items-end justify-between">
            <Link to={`/alumni/${alumni.id}`} className="relative inline-block">
              <img
                src={alumni.avatar}
                alt={alumni.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white bg-white shadow-2xs"
              />
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  alumni.isAvailableForMentorship ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
                title={alumni.isAvailableForMentorship ? 'Available for Mentorship' : 'Unavailable'}
              />
            </Link>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span>{alumni.rating}</span>
              <span className="text-slate-400 font-normal">({alumni.reviewsCount})</span>
            </div>
          </div>

          {/* Name & Headline */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Link
                to={`/alumni/${alumni.id}`}
                className="text-xs font-bold text-slate-900 hover:text-red-700 hover:underline truncate"
              >
                {alumni.name}
              </Link>
              <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-1 rounded">
                Alum
              </span>
            </div>

            <p className="text-xs text-slate-700 font-medium line-clamp-1">
              {alumni.currentRole}
            </p>

            <p className="text-[11px] text-slate-500 line-clamp-1">
              {alumni.company} • {alumni.location}
            </p>

            <p className="text-[10px] text-slate-400 pt-0.5">
              JECRC {alumni.degree?.split(' ')[0] || 'B.Tech'} • Class of {alumni.graduationYear}
            </p>
          </div>

          {/* Skills pills */}
          {alumni.skills && alumni.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2.5">
              {alumni.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                >
                  {skill}
                </span>
              ))}
              {alumni.skills.length > 3 && (
                <span className="text-[10px] text-slate-400 self-center">
                  +{alumni.skills.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Match Reason snippet if applicable */}
          {showMatchReasons && alumni.matchReasons && alumni.matchReasons.length > 0 && (
            <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 space-y-0.5">
              <span className="font-bold text-slate-800 block">Why this mentor:</span>
              <p className="line-clamp-2">{alumni.matchReasons[0]}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 grid grid-cols-2 gap-2">
        <Link
          to={`/alumni/${alumni.id}`}
          className="w-full text-center py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          Profile
        </Link>

        {alumni.isAvailableForMentorship ? (
          <button
            onClick={() => navigate(`/request-mentorship/${alumni.id}`)}
            className="w-full text-center py-1.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer"
          >
            Mentorship
          </button>
        ) : (
          <button
            onClick={() => navigate(`/alumni/${alumni.id}`)}
            className="w-full text-center py-1.5 rounded-md text-xs font-semibold text-slate-500 bg-slate-200/80 cursor-default"
          >
            Busy
          </button>
        )}
      </div>
    </div>
  );
};
