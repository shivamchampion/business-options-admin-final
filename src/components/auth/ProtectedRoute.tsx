import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  const location = useLocation();

  // Show loading screen while auth state is being determined
  if (isLoading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="lg" 
        text="Verifying authentication..." 
      />
    );
  }

  // Handle authentication errors
  if (error) {
    return (
      <LoadingSpinner 
        fullScreen 
        error={error.message} 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based permissions
  if (allowedRoles && !allowedRoles.includes(user?.role || '')) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render the protected content
  return <>{children}</>;
};