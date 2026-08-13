import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * Reusable page-level error state
 */
export const ErrorState = ({
  title = 'Something went wrong',
  message = "We couldn't load this content. Please check your connection and try again.",
  onRetry,
}) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-2xs">
      <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
