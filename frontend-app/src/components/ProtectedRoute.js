import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    // masterAdmin should always pass admin checks
    if (user.role === 'masterAdmin' && roles.includes('admin')) {
      return children;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
