import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/Skeleton';

export interface ProtectedRouteProps {
  children: ReactNode;
  requireStaff?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireStaff = false,
}) => {
  const { isAuthenticated, isLoading, isStaff } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="space-y-4 max-w-sm w-full text-center">
          <Skeleton className="h-10 w-10 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireStaff && !isStaff) {
    return <Navigate to="/my-issues" replace />;
  }

  return <>{children}</>;
};
