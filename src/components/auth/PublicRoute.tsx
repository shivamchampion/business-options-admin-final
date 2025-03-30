import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectAuthenticated?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectAuthenticated = '/' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen size="lg" text="Checking authentication..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectAuthenticated} replace />;
  }

  return <>{children}</>;
};