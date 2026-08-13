import React, { useState } from 'react';
import { Filter, X, RotateCcw, ChevronDown } from 'lucide-react';

export const BRANCH_OPTIONS = [
  { value: 'all', label: 'All Branches' },
  { value: 'CSE', label: 'Computer Science (CSE)' },
  { value: 'AI/ML', label: 'AI & Machine Learning' },
  { value: 'IT', label: 'Information Technology (IT)' },
  { value: 'ECE', label: 'Electronics (ECE)' },
  { value: 'Data Science', label: 'Data Science' },
  { value: 'Design', label: 'Design (B.Des)' },
  { value: 'Mechanical', label: 'Mechanical Eng' },
  { value: 'Civil', label: 'Civil Eng' },
];

export const BATCH_OPTIONS = [
  { value: 'all', label: 'All Batches' },
  { value: '2027', label: 'Class of 2027' },
  { value: '2026', label: 'Class of 2026' },
  { value: '2025', label: 'Class of 2025' },
  { value: '2024', label: 'Class of 2024' },
  { value: '2023', label: 'Class of 2023' },
  { value: '2022', label: 'Class of 2022' },
  { value: '2021', label: 'Class of 2021' },
  { value: '2020', label: 'Class of 2020' },
  { value: '2019', label: 'Class of 2019' },
  { value: '2018', label: 'Class of 2018' },
  { value: '2017', label: 'Class of 2017' },
  { value: '2016', label: 'Class of 2016' },
  { value: '2015', label: 'Class of 2015' },
  { value: '2014', label: 'Class of 2014' },
];

export const LOCATION_OPTIONS = [
  { value: 'all', label: 'All Locations' },
  { value: 'Bengaluru', label: 'Bengaluru' },
  { value: 'Jaipur', label: 'Jaipur' },
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Mumbai', label: 'Mumbai' },
  { value: 'Delhi NCR', label: 'Delhi NCR' },
  { value: 'San Francisco', label: 'San Francisco' },
  { value: 'Seattle', label: 'Seattle' },
];

export const NetworkFilters = ({
  roleType,
  setRoleType,
  selectedBranch,
  setSelectedBranch,
  selectedBatch,
  setSelectedBatch,
  selectedLocation,
  setSelectedLocation,
  onResetAll,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const roleTabs = [
    { id: 'all', label: 'All' },
    { id: 'alumni', label: 'Alumni' },
    { id: 'student', label: 'Students' },
  ];

  const hasActiveFilters =
    roleType !== 'all' ||
    selectedBranch !== 'all' ||
    selectedBatch !== 'all' ||
    selectedLocation !== 'all';

  const activeFilterCount = [
    roleType !== 'all',
    selectedBranch !== 'all',
    selectedBatch !== 'all',
    selectedLocation !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Desktop & Tablet Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* 1. Role Type Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            {roleTabs.map((tab) => {
              const active = roleType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoleType(tab.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 2. Desktop Dropdowns */}
          <div className="hidden md:flex items-center gap-2 flex-wrap flex-1 justify-end">
            {/* Branch */}
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer pr-6 appearance-none"
                aria-label="Filter by branch"
              >
                {BRANCH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Batch */}
            <div className="relative">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer pr-6 appearance-none"
                aria-label="Filter by batch"
              >
                {BATCH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Location */}
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer pr-6 appearance-none"
                aria-label="Filter by location"
              >
                {LOCATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Clear Filters Button (Desktop) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetAll}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Mobile Filter Trigger Button */}
          <div className="md:hidden flex items-center justify-between pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-700 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetAll}
                className="text-xs text-red-700 font-semibold hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Active Filter Chips / Badges Row */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap px-1">
          <span className="text-[11px] text-slate-500 font-medium">Active:</span>

          {roleType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-200 text-slate-800">
              <span>{roleType === 'alumni' ? 'Alumni' : 'Students'}</span>
              <button
                type="button"
                onClick={() => setRoleType('all')}
                className="hover:text-red-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedBranch !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-200 text-slate-800">
              <span>Branch: {selectedBranch}</span>
              <button
                type="button"
                onClick={() => setSelectedBranch('all')}
                className="hover:text-red-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedBatch !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-200 text-slate-800">
              <span>Batch: {selectedBatch}</span>
              <button
                type="button"
                onClick={() => setSelectedBatch('all')}
                className="hover:text-red-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedLocation !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-200 text-slate-800">
              <span>Location: {selectedLocation}</span>
              <button
                type="button"
                onClick={() => setSelectedLocation('all')}
                className="hover:text-red-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onResetAll}
            className="text-[11px] font-semibold text-red-700 hover:underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile Filter Modal / Drawer */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="bg-white rounded-t-2xl sm:rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-4 space-y-4 animate-in slide-in-from-bottom duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">Filter Network</h3>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Type</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                  {roleTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRoleType(tab.id)}
                      className={`py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        roleType === tab.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                >
                  {BRANCH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Batch</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                >
                  {BATCH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                >
                  {LOCATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onResetAll();
                  setIsMobileOpen(false);
                }}
                className="py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
