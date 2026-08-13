import React from 'react';
import { Briefcase, Plus, Edit2, Trash2 } from 'lucide-react';

export const ProfileExperienceSection = ({
  experience = [],
  isOwnProfile,
  onAddClick,
  onEditClick,
  onDeleteClick,
}) => {
  if ((!experience || experience.length === 0) && !isOwnProfile) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Experience</h2>
        
        {isOwnProfile && (
          <button
            type="button"
            onClick={onAddClick}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Experience</span>
          </button>
        )}
      </div>

      {(!experience || experience.length === 0) ? (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-1.5">
          <p className="text-xs text-slate-500 font-medium">No experience added yet.</p>
          {isOwnProfile && (
            <button
              type="button"
              onClick={onAddClick}
              className="text-xs font-semibold text-red-700 hover:underline cursor-pointer"
            >
              + Add your internship, job, or campus role
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-slate-100">
          {experience.map((exp, idx) => (
            <div key={exp.id || idx} className="pt-4 first:pt-0 flex items-start justify-between gap-3 group">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
                  <Briefcase className="w-4 h-4 text-slate-600" />
                </div>

                <div className="space-y-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                    {exp.role}
                  </h3>
                  <p className="text-xs font-semibold text-slate-700">
                    {exp.company}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {exp.period || `${exp.startYear} – ${exp.endYear || 'Present'}`}
                    {exp.location && ` • ${exp.location}`}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Owner Actions */}
              {isOwnProfile && (
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEditClick(exp)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Edit experience"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteClick(exp.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Delete experience"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
