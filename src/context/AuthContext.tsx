import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { UserDetails, UserRole } from '@/types/firebase';
import { loginUser, logoutUser, verifyToken } from '../../server/services/api'

interface AuthContextType {
  user: UserDetails | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Allowed roles for admin panel access
const ALLOWED_ROLES = ['super_admin', 'admin', 'moderator', 'advisor'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Check for cached user data and token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check for cached user data for immediate UI rendering
        const cachedUser = sessionStorage.getItem('user_data');
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            setUser(userData);
            setIsAuthenticated(true);
          } catch (e) {
            console.error('Error parsing cached user data');
            sessionStorage.removeItem('user_data');
          }
        }
        
        // Then verify token with server if available
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
          const userData = await verifyToken(token);
          
          if (ALLOWED_ROLES.includes(userData.role)) {
            setUser(userData);
            setIsAuthenticated(true);
            setError(null);
            
            // Cache user data
            sessionStorage.setItem('user_data', JSON.stringify(userData));
          } else {
            await signOut();
            setError(new Error('Access denied: User role is not allowed to access admin panel'));
          }
        } else {
          // No token found, clear state
          sessionStorage.removeItem('user_data');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        
        // Clear data on token verification failure
        sessionStorage.removeItem('user_data');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        
        setUser(null);
        setIsAuthenticated(false);
        setError(error instanceof Error ? error : new Error('Authentication failed'));
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await loginUser(email, password);
      
      // Store in session/local storage based on remember me option
      if (rememberMe) {
        localStorage.setItem('authToken', result.token);
      } else {
        sessionStorage.setItem('authToken', result.token);
      }
      
      // Cache user data
      sessionStorage.setItem('user_data', JSON.stringify(result.user));
      
      setUser(result.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(new Error(error.message));
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear cached user data
      sessionStorage.removeItem('user_data');
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      
      await logoutUser();
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize context value to prevent unnecessary renders
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    error
  }), [user, isAuthenticated, isLoading, signIn, signOut, error]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};