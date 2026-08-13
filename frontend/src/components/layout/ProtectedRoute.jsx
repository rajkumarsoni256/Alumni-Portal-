import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppShell } from './AppShell';

/**
 * ProtectedRoute Wrapper
 * Enforces authentication & completed onboarding before rendering the authenticated shell.
 */
export const ProtectedRoute = ({ children, hideSidebar = false }) => {
  const { isLoading, isAuthenticated, authStatus, authUser } = useApp();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-400">Restoring session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (authStatus === 'EMAIL_UNVERIFIED') {
    return <Navigate to="/verify-email" replace />;
  }

  const isProfileComplete = authUser?.profileComplete !== false;
  const isAdmin = authUser?.role?.toUpperCase() === 'ADMIN';

  if (!isAdmin && (!isProfileComplete || authStatus === 'ONBOARDING')) {
    if (!location.pathname.startsWith('/onboarding')) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return (
    <AppShell hideSidebar={hideSidebar}>
      {children}
    </AppShell>
  );
};
