import { useState, useEffect, useRef } from 'react';
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
  const [showLoading, setShowLoading] = useState(false);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadCompleted = useRef(false);
  const initialVerification = useRef(true);
  const pageRefreshing = useRef(true);
  
  // Clean up any timers on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);
  
  // Effect to handle initial verification
  useEffect(() => {
    if (!isLoading) {
      initialLoadCompleted.current = true;
      
      // After first load completes, set pageRefreshing to false
      // This prevents premature redirects on page refresh
      setTimeout(() => {
        pageRefreshing.current = false;
      }, 50);
    }
    
    // Only show loading if verification takes too long
    if (isLoading && initialLoadCompleted.current) {
      // If we're already authenticated, don't show loading again
      if (isAuthenticated && !initialVerification.current) {
        return;
      }
      
      // Clear any existing timer
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      
      // Set a delay before showing loading
      loadingTimerRef.current = setTimeout(() => {
        setShowLoading(true);
      }, 300);
    } else {
      // Reset loading state
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setShowLoading(false);
      
      // Mark initial verification as complete if we're authenticated
      if (isAuthenticated) {
        initialVerification.current = false;
      }
    }
  }, [isLoading, isAuthenticated]);

  // Show loading screen only if it's taking a significant amount of time
  // AND it's not the initial login verification
  if (isLoading && showLoading) {
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
  // CRITICAL FIX: Don't redirect immediately during page refresh
  if (!isAuthenticated && !isLoading && !pageRefreshing.current) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based permissions, but only after initial loading
  if (!isLoading && isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role || '')) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Show children once authenticated or during initial load
  // This prevents flashing during page refresh
  return <>{children}</>;
};