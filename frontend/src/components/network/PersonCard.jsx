import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { AlumniProfileModal } from '../profile/AlumniProfileModal';
import { UserAvatar } from '../common/UserAvatar';
import { ConnectionButton } from '../common/ConnectionButton';

export const PersonCard = ({ person }) => {
  const [showModal, setShowModal] = useState(false);

  if (!person) return null;

  const isAlumni = Boolean(person.isAlumni || person.role?.toLowerCase() === 'alumni');
  const personName = person.name || person.fullName || person.full_name || 'JECRC Member';
  const personId = person.id || person.userId || person.user_id;

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3.5 group">
        
        {/* Top Header: Avatar + Main Info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {/* Avatar with Status */}
            <div 
              onClick={() => setShowModal(true)} 
              className="relative shrink-0 cursor-pointer"
            >
              <UserAvatar
                src={person.avatar || person.avatarUrl || person.avatar_url}
                name={personName}
                className="w-12 h-12 group-hover:ring-2 group-hover:ring-red-600/20 transition-all"
              />
              {isAlumni && (
                <span 
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"
                  title="Verified Alumni"
                />
              )}
            </div>

            {/* Identity & Role Info */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="text-sm font-bold text-slate-900 hover:text-red-700 hover:underline truncate block text-left cursor-pointer"
                >
                  {personName}
                </button>
                
                {/* Subtle Role Badge */}
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                    isAlumni
                      ? 'bg-rose-100 text-red-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isAlumni ? 'Alumni' : 'Student'}
                </span>
              </div>

              {/* Headline / Current Role */}
              <p className="text-xs text-slate-700 font-medium line-clamp-1 leading-snug">
                {person.headline || person.currentRole || (isAlumni ? `Alumni @ ${person.company || 'JECRC'}` : 'JECRC Student')}
              </p>

              {/* Batch & Department Info */}
              <p className="text-[11px] text-slate-500 truncate">
                {person.batchDisplay || (person.batch ? `JECRC ${person.branch || 'Engineering'} • ${person.batch}` : `JECRC ${person.branch || 'Student'}`)}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{person.location || 'Jaipur, India'}</span>
            </div>
          </div>

          {/* Skills Tag Row */}
          {person.skills && person.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {person.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium bg-slate-100/90 text-slate-600 px-2 py-0.5 rounded"
                >
                  {skill}
                </span>
              ))}
              {person.skills.length > 3 && (
                <span className="text-[10px] text-slate-400 self-center">
                  +{person.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Dual Action Row: View Profile Modal + Reusable ConnectionButton */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-center py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            View Profile
          </button>

          <ConnectionButton userId={personId} targetUser={person} size="sm" />
        </div>

      </div>

      {/* Alumni Profile Modal matching Image 4 */}
      <AlumniProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        alumni={person}
      />
    </>
  );
};
