/**
 * Authentication context - optimized for performance
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { UserDetails, UserRole } from '@/types/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  browserLocalPersistence,  
  browserSessionPersistence,  
  setPersistence,
  onIdTokenChanged
} from 'firebase/auth';

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
  
  // Add a new state for token readiness
  const [isTokenReady, setIsTokenReady] = useState(false);
  
  // Check for cached user data
  useEffect(() => {
    // Try to load data from session storage for immediate UI rendering
    const cachedUser = sessionStorage.getItem('user_data');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        // Don't set isAuthenticated=true yet, we'll wait for token initialization
        setIsLoading(false);
      } catch (e) {
        console.error('Error parsing cached user data');
        sessionStorage.removeItem('user_data');
      }
    }
    
    // More efficient token change listener (instead of onAuthStateChanged)
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      // Reset token readiness whenever auth state changes
      setIsTokenReady(false);
      
      if (firebaseUser) {
        try {
          // Ensure token is fresh
          await firebaseUser.getIdToken(true);
          setIsTokenReady(true);
          
          // Query Firestore by uid
          const userQuery = query(
            collection(db, 'users'),
            where('uid', '==', firebaseUser.uid)
          );
          const userDocs = await getDocs(userQuery);
          
          if (!userDocs.empty) {
            const userData = userDocs.docs[0].data() as UserDetails;
            
            if (ALLOWED_ROLES.includes(userData.role)) { 
              // Update last login time in Firestore
              await updateDoc(userDocs.docs[0].ref, {
                lastLogin: serverTimestamp()
              });
              
              const userWithDates = {
                ...userData,
                lastLogin: new Date() 
              };
              
              setUser(userWithDates);
              setIsAuthenticated(true);
              setError(null);
              
              // Cache user data
              sessionStorage.setItem('user_data', JSON.stringify(userWithDates));
            } else {
              await signOut();
              setError(new Error('Access denied: User role is not allowed to access admin panel'));
            }
          } else {
            await signOut();
            setError(new Error('User not found in system'));
          }
        } catch (error: any) {
          await signOut();
          setError(new Error('Failed to fetch user data: ' + error.message));
          console.error('Error in auth state change:', error);
        }
      } else {
        sessionStorage.removeItem('user_data');
        setUser(null);
        setIsAuthenticated(false);
        setIsTokenReady(false);
        setError(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Second effect: Handle cached authentication explicitly
  useEffect(() => {
    // If we have a user from cache but auth.currentUser is null,
    // we need to wait until onIdTokenChanged fires
    const handleCachedAuth = async () => {
      if (user && !isAuthenticated && !auth.currentUser) {
        setIsLoading(true);
        console.log("Waiting for auth token to initialize...");
        
        // Wait for auth to initialize - poll with timeout
        let attempts = 0;
        const checkAuth = async () => {
          if (auth.currentUser) {
            // Token is available, force refresh
            await auth.currentUser.getIdToken(true);
            setIsTokenReady(true);
            setIsAuthenticated(true);
            setIsLoading(false);
            console.log("Token initialized from cached auth");
          } else if (attempts < 10) { // Limit retry attempts
            attempts++;
            setTimeout(checkAuth, 500); // Check again in 500ms
          } else {
            // Give up after ~5 seconds
            console.error("Failed to initialize auth token");
            setIsLoading(false);
          }
        };
        
        checkAuth();
      }
    };
    
    handleCachedAuth();
  }, [user, isAuthenticated]);

  // Token refresh effect to handle auth state synchronization
  useEffect(() => {
    const refreshToken = async () => {
      if (auth.currentUser) {
        try {
          await auth.currentUser.getIdToken(true);
          console.log("Token refreshed successfully");
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      } else if (isAuthenticated) {
        // If we think we're authenticated but auth.currentUser is null,
        // log this to help debug timing issues
        console.log("Auth state mismatch: isAuthenticated true but auth.currentUser null");
      }
    };
    
    if (isAuthenticated && !isLoading) {
      refreshToken();
    }
  }, [isAuthenticated, isLoading]);

  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Set persistence based on remember me option
      await setPersistence(auth,
        rememberMe 
          ? browserLocalPersistence 
          : browserSessionPersistence 
      );
      
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change listener will handle the rest
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
      
      await firebaseSignOut(auth);
    } catch (error: any) {
      setError(new Error(error.message));
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
    isLoading: isLoading || (isAuthenticated && !isTokenReady), // Important: Consider loading until token is ready
    signIn,
    signOut,
    error
  }), [user, isAuthenticated, isLoading, isTokenReady, signIn, signOut, error]);

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