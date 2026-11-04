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

  // If user is already authenticated, redirect to their home node
  if (user) {
    return <Navigate to={user.role === 'Driver' ? '/driver' : '/owner'} replace />;
  }

  // Render the matched child route directly — no centering wrapper
  return <Outlet />;
};
