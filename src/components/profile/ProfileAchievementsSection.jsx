import React from 'react';
import { Award } from 'lucide-react';

export const ProfileAchievementsSection = ({ achievements = [] }) => {
  if (!achievements || achievements.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
      <h2 className="text-sm font-bold text-slate-900">Honors & Achievements</h2>

      <div className="space-y-3.5 divide-y divide-slate-100">
        {achievements.map((ach, idx) => (
          <div key={ach.id || idx} className="pt-3.5 first:pt-0 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
              <Award className="w-4 h-4" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {ach.title}
                </h3>
                {ach.year && (
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                    {ach.year}
                  </span>
                )}
              </div>
              {ach.description && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ach.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
