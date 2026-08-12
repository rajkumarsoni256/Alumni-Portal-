import React from 'react';
import { MOCK_ADMIN_STATS } from '../../data/mockData';
import { PieChart, BarChart3, TrendingUp, MapPin, Users, Sparkles } from 'lucide-react';

export const AdminCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Alumni by Industry */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Alumni Distribution by Industry</h3>
              <p className="text-xs text-slate-500">Breakdown of 1,890 verified alumni</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Real-time Sync
          </span>
        </div>

        {/* Stacked Bar Representation */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {MOCK_ADMIN_STATS.alumniByIndustry.map((item, idx) => (
            <div
              key={idx}
              style={{ width: `${item.value}%`, backgroundColor: item.color }}
              className="h-full transition-all hover:opacity-90 cursor-pointer"
              title={`${item.label}: ${item.value}%`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {MOCK_ADMIN_STATS.alumniByIndustry.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="text-xs">
                <span className="font-medium text-slate-700 block truncate">{item.label}</span>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Career Interests */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Top Student Career Interests</h3>
              <p className="text-xs text-slate-500">Based on 4,250 active student profiles</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
            2026 Batch
          </span>
        </div>

        <div className="space-y-3">
          {MOCK_ADMIN_STATS.studentInterests.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">{item.label}</span>
                <span className="font-bold text-slate-900">{item.percentage}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alumni Location Hubs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Top Global Alumni Hubs</h3>
            <p className="text-xs text-slate-500">Primary metropolitan chapter regions</p>
          </div>
        </div>

        <div className="space-y-3">
          {MOCK_ADMIN_STATS.alumniByLocation.map((loc, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                  #{idx + 1}
                </span>
                <span className="font-semibold text-slate-800">{loc.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden hidden sm:block">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${loc.value}%` }} />
                </div>
                <span className="font-bold text-slate-900">{loc.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mentorship Activity Growth */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Mentorship Growth & Placement Impact</h3>
            <p className="text-xs text-slate-500">Monthly completed mentorship sessions</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-400">Total Mentorship Hours</span>
              <p className="text-2xl font-extrabold text-white mt-0.5">3,480+ hrs</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Mock Interview Pass Rate</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">92.4%</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              1,240 Successful Alumni-Student Pairings
            </span>
            <span className="text-emerald-400 font-semibold">+24% vs Last Semester</span>
          </div>
        </div>
      </div>
    </div>
  );
};
