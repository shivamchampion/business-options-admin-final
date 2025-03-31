import { useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectAuthenticated?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectAuthenticated = '/' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const initialRender = useRef(true);
  
  // Track initial render
  useEffect(() => {
    // Set to false after initial render
    initialRender.current = false;
  }, []);

  // Important: Don't show any loading state on public routes
  // This ensures login page appears immediately without "checking authentication"
  // spinner that was causing the issues
  
  // During initial render with loading, render nothing to prevent flicker
  if (isLoading && initialRender.current) {
    return null;
  }

  // Redirect if authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectAuthenticated} replace />;
  }

  // Render children if not authenticated
  return <>{children}</>;
};