import React, { useState } from 'react';
import { 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  PenSquare, 
  X,
  Send
} from 'lucide-react';

/**
 * Skeleton Loader for Feed Posts
 */
export const FeedSkeletons = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 bg-slate-200 rounded w-1/4" />
              <div className="h-2.5 bg-slate-200 rounded w-1/3" />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-5/6" />
          </div>

          {idx === 1 && (
            <div className="h-40 bg-slate-200 rounded-lg w-full" />
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="h-6 bg-slate-200 rounded w-16" />
            <div className="h-6 bg-slate-200 rounded w-16" />
            <div className="h-6 bg-slate-200 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Empty Feed State
 */
export const FeedEmptyState = ({ onResetFilter, onCreatePostClick, filterName = 'All' }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm font-bold text-slate-900">
          {filterName !== 'all' && filterName !== 'All' 
            ? `No posts found in "${filterName}"`
            : "No posts yet"}
        </h3>
        <p className="text-xs text-slate-500">
          {filterName !== 'all' && filterName !== 'All'
            ? "Try resetting your filter to view all updates."
            : "Be the first student or alumnus to share an update with the community."}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          onClick={onCreatePostClick}
          className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer"
        >
          Create a Post
        </button>

        {filterName !== 'all' && filterName !== 'All' && (
          <button
            onClick={onResetFilter}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Show All
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Error Feed State
 */
export const FeedErrorState = ({ onRetry }) => {
  return (
    <div className="bg-white rounded-xl border border-red-200 p-6 text-center space-y-3">
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm font-bold text-slate-900">Unable to load feed</h3>
        <p className="text-xs text-slate-500">
          Something went wrong while fetching community updates.
        </p>
      </div>

      <button
        onClick={onRetry}
        className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Try Again</span>
      </button>
    </div>
  );
};

/**
 * Share Modal Component
 */
export const ShareModal = ({ isOpen, onClose, post, onCopyLink }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !post) return null;

  const shareUrl = `${window.location.origin}/#post-${post.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    if (onCopyLink) onCopyLink();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div 
        className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-4 space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-sm font-bold text-slate-900">Share Post</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-500 block">
            Post Link
          </label>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-md">
            <input 
              type="text" 
              readOnly 
              value={shareUrl} 
              className="bg-transparent text-xs text-slate-700 w-full outline-none font-mono px-1"
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                copied 
                  ? "bg-emerald-600 text-white" 
                  : "bg-slate-900 text-white hover:bg-red-700"
              }`}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
