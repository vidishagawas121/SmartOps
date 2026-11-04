import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useOperations } from '../store/OperationsContext';

/**
 * AuthLayout — transparent shell for all auth pages.
 *
 * The Login page (and other auth pages) are full-viewport components that
 * manage their own layout.  This layout only handles the redirect-if-authed
 * guard; it renders no wrapping chrome of its own.
 */
export const AuthLayout: React.FC = () => {
  const { user } = useOperations();

  // If user is already authenticated, redirect to their designated dashboard
  if (user) {
    const role = (user.role || '').toLowerCase();
    if (role === 'driver') return <Navigate to="/driver" replace />;
    if (role === 'supervisor') return <Navigate to="/supervisor" replace />;
    if (role === 'worker') return <Navigate to="/worker" replace />;
    return <Navigate to="/owner" replace />;
  }

  // Render the matched child route directly — no centering wrapper
  return <Outlet />;
};
