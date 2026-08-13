import React from 'react';
import { RefreshCw, SearchX, RotateCcw } from 'lucide-react';

/**
 * Skeleton Loader for Person Cards Grid
 */
export const NetworkSkeletons = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-200 rounded w-5/6" />
              <div className="h-2.5 bg-slate-200 rounded w-1/3" />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="h-3 bg-slate-200 rounded w-1/4" />
            <div className="flex gap-1">
              <div className="h-4 bg-slate-200 rounded w-12" />
              <div className="h-4 bg-slate-200 rounded w-16" />
              <div className="h-4 bg-slate-200 rounded w-10" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <div className="h-7 bg-slate-200 rounded-lg" />
            <div className="h-7 bg-slate-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Empty Network State
 */
export const NetworkEmptyState = ({ onResetFilters, searchQuery }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center space-y-3 shadow-2xs">
      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <SearchX className="w-5 h-5" />
      </div>

      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm font-bold text-slate-900">No people found</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {searchQuery
            ? `No members matched "${searchQuery}". Try searching by another skill, company, or name.`
            : 'Try changing or clearing your search and filters to find community members.'}
        </p>
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={onResetFilters}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear filters</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Error Network State
 */
export const NetworkErrorState = ({ onRetry }) => {
  return (
    <div className="bg-white rounded-xl border border-rose-200 p-6 text-center space-y-3 shadow-2xs">
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm font-bold text-slate-900">Couldn't load people</h3>
        <p className="text-xs text-slate-500">
          Something went wrong while loading the JECRC community.
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
};
