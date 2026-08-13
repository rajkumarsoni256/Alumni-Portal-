import React from 'react';

/**
 * Reusable skeleton loader for route/content transitions
 */
export const LoadingState = ({ message = 'Loading content...' }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-2xs animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-slate-200 rounded w-1/3" />
          <div className="h-2.5 bg-slate-100 rounded w-1/4" />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
        <div className="h-3 bg-slate-100 rounded w-4/6" />
      </div>

      <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px]">{message}</span>
      </div>
    </div>
  );
};
