import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Check role-based permissions after initial loading
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        setIsAuthorized(false);
        return;
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
    }
  }, [isAuthenticated, user, isLoading, allowedRoles]);

  // If not authenticated, redirect to login
  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If not authorized for this route, redirect to unauthorized page
  if (isAuthorized === false) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If still checking authorization, render nothing (root loading will show)
  if (isAuthorized === null || isLoading) {
    return null;
  }

  // If authorized, render the protected content
  return <>{children}</>;
};