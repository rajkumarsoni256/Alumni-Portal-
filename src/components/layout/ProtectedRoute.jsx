import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppShell } from './AppShell';

/**
 * ProtectedRoute Wrapper
 * Enforces authentication & completed onboarding before rendering the authenticated shell.
 */
export const ProtectedRoute = ({ children, hideSidebar = false }) => {
  const { isAuthenticated, authStatus } = useApp();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (authStatus === 'EMAIL_UNVERIFIED') {
    return <Navigate to="/verify-email" replace />;
  }

  if (authStatus === 'ONBOARDING' && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AppShell hideSidebar={hideSidebar}>
      {children}
    </AppShell>
  );
};
