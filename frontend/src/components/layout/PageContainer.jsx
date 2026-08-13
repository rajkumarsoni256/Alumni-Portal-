import React from 'react';

/**
 * Reusable PageContainer for authenticated pages.
 * Ensures consistent page spacing, typography, headers, and container widths across all modules.
 */
export const PageContainer = ({
  title,
  description,
  badge,
  actionSlot,
  children,
  maxWidth = 'max-w-7xl',
  className = '',
}) => {

  return (
    <div className={`w-full ${maxWidth} mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 ${className}`}>
      
      {/* Page Header */}
      {(title || description || actionSlot) && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              {badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                  {badge}
                </span>
              )}
              {title && (
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                  {title}
                </h1>
              )}
            </div>
            {description && (
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {actionSlot && (
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              {actionSlot}
            </div>
          )}
        </div>
      )}

      {/* Page Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};
