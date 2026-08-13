import React from 'react';
import { MOCK_ADMIN_STATS } from '../../data/mockData';
import { PieChart, BarChart3, TrendingUp, MapPin, Users } from 'lucide-react';

export const AdminCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Alumni by Industry */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Alumni Distribution by Industry</h3>
            <p className="text-[11px] text-slate-500">Breakdown of 1,890 verified graduates</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Live
          </span>
        </div>

        {/* Stacked Bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          {MOCK_ADMIN_STATS.alumniByIndustry.map((item, idx) => (
            <div
              key={idx}
              style={{ width: `${item.value}%`, backgroundColor: item.color }}
              className="h-full transition-all hover:opacity-90"
              title={`${item.label}: ${item.value}%`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {MOCK_ADMIN_STATS.alumniByIndustry.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="text-xs">
                <span className="font-medium text-slate-700 block truncate text-[11px]">{item.label}</span>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Career Interests */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Top Student Career Interests</h3>
            <p className="text-[11px] text-slate-500">Based on 4,250 active student profiles</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Spring 2026
          </span>
        </div>

        {/* Horizontal Bars */}
        <div className="space-y-2.5">
          {MOCK_ADMIN_STATS.studentInterests.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">{item.domain}</span>
                <span className="font-bold text-slate-900">{item.percentage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-700 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
