import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getPortalHomePath } from '../../utils/navigation';

/**
 * AdminRoute Wrapper
 * Protects administrative routes and ensures active user has Admin capabilities.
 * If authenticated user is a Student or Alumni, redirects them to their community home.
 */
export const AdminRoute = ({ children }) => {
  const { isLoading, isAuthenticated, activeRole, authUser } = useApp();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-400">Verifying administrator privileges...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = authUser?.role?.toUpperCase() === 'ADMIN' || activeRole === 'admin';

  if (!isAdmin) {
    return <Navigate to={getPortalHomePath(activeRole)} replace />;
  }

  return children;
};
