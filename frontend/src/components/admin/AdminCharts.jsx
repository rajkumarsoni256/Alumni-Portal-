import React from 'react';
import { PieChart, BarChart3, TrendingUp, MapPin, Users, Building2, GraduationCap } from 'lucide-react';

const BRANCH_COLORS = ['#b91c1c', '#1d4ed8', '#047857', '#d97706', '#7c3aed', '#db2777', '#475569'];

export const AdminCharts = ({ branches = [], batches = [] }) => {
  const totalBranchUsers = branches.reduce((acc, b) => acc + (b.count || 0), 0) || 1;
  const totalBatchUsers = batches.reduce((acc, b) => acc + (b.count || 0), 0) || 1;

  const branchData = branches.length > 0
    ? branches.slice(0, 6).map((b, idx) => ({
        label: b.branch,
        count: b.count,
        percentage: Math.round((b.count / totalBranchUsers) * 100),
        color: BRANCH_COLORS[idx % BRANCH_COLORS.length],
      }))
    : [
        { label: 'CSE', count: 0, percentage: 0, color: '#b91c1c' },
        { label: 'ECE', count: 0, percentage: 0, color: '#1d4ed8' },
      ];

  const batchData = batches.length > 0
    ? batches.slice(0, 5).map((b) => ({
        domain: `Class of ${b.batch}`,
        count: b.count,
        percentage: Math.round((b.count / totalBatchUsers) * 100),
      }))
    : [
        { domain: 'Class of 2024', count: 0, percentage: 0 },
        { domain: 'Class of 2025', count: 0, percentage: 0 },
      ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Branch Distribution */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Academic Branch Distribution</h3>
            <p className="text-[11px] text-slate-500">Breakdown across engineering and technology departments</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Live
          </span>
        </div>

        {/* Stacked Bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          {branchData.map((item, idx) => (
            <div
              key={idx}
              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              className="h-full transition-all hover:opacity-90"
              title={`${item.label}: ${item.percentage}% (${item.count} users)`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {branchData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="text-xs min-w-0">
                <span className="font-medium text-slate-700 block truncate text-[11px]">{item.label}</span>
                <span className="font-bold text-slate-900">{item.percentage}% ({item.count})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graduation Batch Distribution */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Graduation Batch Distribution</h3>
            <p className="text-[11px] text-slate-500">Student & alumni population by cohort year</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Cohorts
          </span>
        </div>

        {/* Horizontal Bars */}
        <div className="space-y-2.5">
          {batchData.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">{item.domain}</span>
                <span className="font-bold text-slate-900">{item.percentage}% ({item.count})</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-700 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(5, item.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
