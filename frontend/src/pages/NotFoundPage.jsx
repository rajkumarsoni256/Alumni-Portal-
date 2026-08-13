import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center space-y-5 shadow-2xs">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-50 px-2.5 py-0.5 rounded-full">
            404 Error
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight pt-2">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Home Feed</span>
          </Link>
          <Link
            to="/explore"
            className="w-full sm:w-auto px-4 py-2 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-center"
          >
            Explore Alumni
          </Link>
        </div>
      </div>
    </div>
  );
};
