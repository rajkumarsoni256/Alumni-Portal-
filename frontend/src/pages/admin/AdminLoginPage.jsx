import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * AdminLoginPage — Redirects to unified single Login portal (/login)
 */
export const AdminLoginPage = () => {
  return <Navigate to="/login" replace />;
};
