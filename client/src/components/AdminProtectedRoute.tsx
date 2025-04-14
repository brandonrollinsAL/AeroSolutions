import React from 'react';
import { Route, Redirect } from 'wouter';
import { useAdmin } from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ path, component: Component }) => {
  const { isAuthenticated, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading...</span>
        </div>
      </Route>
    );
  }

  if (!isAuthenticated) {
    return (
      <Route path={path}>
        <Redirect to="/admin/login" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
};

export default AdminProtectedRoute;