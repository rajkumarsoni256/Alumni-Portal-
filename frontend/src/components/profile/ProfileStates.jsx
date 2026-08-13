import React from 'react';
import { Link } from 'react-router-dom';
import { UserX, ArrowLeft } from 'lucide-react';

/**
 * Skeleton Loader for Professional Profile
 */
export const ProfileSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-36 bg-slate-200" />
        <div className="px-6 pb-6 pt-0 relative">
          <div className="-mt-14 mb-4 flex items-end justify-between">
            <div className="w-24 h-24 rounded-full bg-slate-300 border-4 border-white" />
            <div className="h-8 bg-slate-200 rounded-lg w-28" />
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-slate-200 rounded w-1/3" />
            <div className="h-3.5 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-1/4" />
          </div>
        </div>
      </div>

      {/* About Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-20" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-full" />
          <div className="h-3 bg-slate-200 rounded w-5/6" />
          <div className="h-3 bg-slate-200 rounded w-4/6" />
        </div>
      </div>

      {/* Experience Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
        <div className="space-y-3">
          <div className="h-12 bg-slate-100 rounded-lg" />
          <div className="h-12 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

/**
 * Profile Not Found / Unavailable State
 */
export const ProfileNotFound = () => {
  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-xl border border-slate-200/90 p-8 text-center space-y-4 shadow-2xs">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <UserX className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h2 className="text-base font-bold text-slate-900">Profile not found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          This profile may have been removed or is no longer available in the JECRC community directory.
        </p>
      </div>

      <div className="pt-2">
        <Link
          to="/network"
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Network</span>
        </Link>
      </div>
    </div>
  );
};
