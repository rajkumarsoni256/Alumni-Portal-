import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPortalHomePath } from '../utils/navigation';

export const NotFoundPage = () => {
  const { activeRole } = useApp();
  const isAdmin = activeRole === 'admin';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center space-y-5 shadow-2xs">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center justify-center mx-auto">
          {isAdmin ? <ShieldAlert className="w-7 h-7" /> : <Compass className="w-7 h-7" />}
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-50 px-2.5 py-0.5 rounded-full">
            404 Error
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight pt-2">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {isAdmin 
              ? 'The administrative route you requested does not exist or has been relocated.' 
              : 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            to={getPortalHomePath(activeRole)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-md text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isAdmin ? 'Admin Dashboard' : 'Go to Home Feed'}</span>
          </Link>

          {isAdmin ? (
            <Link
              to="/admin/users"
              className="w-full sm:w-auto px-4 py-2 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-center cursor-pointer"
            >
              Users Directory
            </Link>
          ) : (
            <Link
              to="/explore"
              className="w-full sm:w-auto px-4 py-2 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-center cursor-pointer"
            >
              Explore Alumni
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
