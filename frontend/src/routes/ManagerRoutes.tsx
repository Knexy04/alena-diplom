import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/user';

const ManagerRoutes: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== UserRole.MANAGER) return <Navigate to="/parent/dashboard" />;

  return <Outlet />;
};

export default ManagerRoutes;
