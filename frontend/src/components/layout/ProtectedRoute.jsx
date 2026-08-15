import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppShell } from './AppShell';

/**
 * ProtectedRoute Wrapper
 * Enforces authentication & completed onboarding for Student & Alumni community routes.
 * Strictly prevents ADMIN users from entering community interfaces, redirecting them to /admin/dashboard.
 */
export const ProtectedRoute = ({ children, hideSidebar = false }) => {
  const { isLoading, isAuthenticated, authStatus, authUser, activeRole } = useApp();
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

  // Strict Portal Isolation Guard:
  // Admin users must NEVER be rendered inside the Student/Alumni Community AppShell.
  const isAdmin = authUser?.role?.toUpperCase() === 'ADMIN' || activeRole === 'admin';
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (authStatus === 'EMAIL_UNVERIFIED') {
    return <Navigate to="/verify-email" replace />;
  }

  const isProfileComplete = authUser?.profileComplete !== false;

  if (!isProfileComplete || authStatus === 'ONBOARDING') {
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
