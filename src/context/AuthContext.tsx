/**
 * Authentication context - optimized for performance and smooth transitions
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  
  // Use refs to track async operations and prevent race conditions
  const signOutInProgress = useRef(false);
  const initialAuthCheckComplete = useRef(false);
  const loginVerificationInProgress = useRef(false);
  const tokenRefreshTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup function for all timeouts
  const clearAllTimeouts = useCallback(() => {
    if (tokenRefreshTimeout.current) {
      clearTimeout(tokenRefreshTimeout.current);
      tokenRefreshTimeout.current = null;
    }
  }, []);
  
  // Check for cached user data and set up auth state listener
  useEffect(() => {
    let unsubscribe: () => void;
    let mounted = true;
    
    const initialize = async () => {
      try {
        // Try to load data from session storage for immediate UI rendering
        try {
          const cachedUser = sessionStorage.getItem('user_data');
          if (cachedUser && mounted) {
            const userData = JSON.parse(cachedUser);
            setUser(userData);
            // On page refresh, temporarily set authenticated true to prevent flicker
            // This will be verified properly when Firebase auth completes
            setIsAuthenticated(true);
          }
        } catch (e) {
          console.error('Error parsing cached user data');
          sessionStorage.removeItem('user_data');
        }
        
        // Set up auth state listener
        unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
          // Prevent processing if unmounted or logout in progress
          if (!mounted || signOutInProgress.current) return;
          
          if (firebaseUser) {
            try {
              // Ensure token is fresh
              await firebaseUser.getIdToken(true);
              
              // Query Firestore by uid
              const userQuery = query(
                collection(db, 'users'),
                where('uid', '==', firebaseUser.uid)
              );
              const userDocs = await getDocs(userQuery);
              
              // Only proceed if component is still mounted
              if (!mounted) return;
              
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
                  
                  if (mounted) {
                    // Important: Update user data first before setting authenticated
                    setUser(userWithDates);
                    
                    // Cache user data
                    sessionStorage.setItem('user_data', JSON.stringify(userWithDates));
                    
                    // Now set authenticated state after all data is loaded
                    setIsAuthenticated(true);
                    setError(null);
                    
                    // If this was a login verification, mark it as complete
                    loginVerificationInProgress.current = false;
                  }
                } else {
                  if (mounted) {
                    // Clean up user data since role is not authorized
                    sessionStorage.removeItem('user_data');
                    setUser(null);
                    setIsAuthenticated(false);
                    setError(new Error('Access denied: User role is not allowed to access admin panel'));
                    loginVerificationInProgress.current = false;
                    
                    // Sign out from Firebase
                    await firebaseSignOut(auth);
                  }
                }
              } else {
                if (mounted) {
                  // Clean up user data since user not found
                  sessionStorage.removeItem('user_data');
                  setUser(null);
                  setIsAuthenticated(false);
                  setError(new Error('User not found in system'));
                  loginVerificationInProgress.current = false;
                  
                  // Sign out from Firebase
                  await firebaseSignOut(auth);
                }
              }
            } catch (error: any) {
              if (mounted) {
                // Clean up on error
                sessionStorage.removeItem('user_data');
                setUser(null);
                setIsAuthenticated(false);
                setError(new Error('Failed to fetch user data: ' + error.message));
                console.error('Error in auth state change:', error);
                loginVerificationInProgress.current = false;
                
                // Sign out from Firebase
                await firebaseSignOut(auth);
              }
            } finally {
              // Mark initial auth check as complete
              initialAuthCheckComplete.current = true;
              
              // Update loading state if still mounted
              if (mounted) {
                setIsLoading(false);
              }
            }
          } else {
            // No Firebase user - sign out case
            if (mounted) {
              // Clean up when user is signed out
              sessionStorage.removeItem('user_data');
              setUser(null);
              setIsAuthenticated(false);
              setError(null);
              loginVerificationInProgress.current = false;
              
              // Mark initial auth check as complete
              initialAuthCheckComplete.current = true;
              setIsLoading(false);
            }
          }
        });
      } catch (error) {
        // Handle initialization errors
        console.error("Error setting up authentication:", error);
        
        if (mounted) {
          initialAuthCheckComplete.current = true;
          setIsLoading(false);
          loginVerificationInProgress.current = false;
        }
      }
    };
    
    initialize();
    
    // Cleanup function
    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // Token refresh effect
  useEffect(() => {
    const refreshToken = async () => {
      if (auth.currentUser && !signOutInProgress.current) {
        try {
          await auth.currentUser.getIdToken(true);
          console.log("Token refreshed successfully");
          
          // Schedule next refresh (every 55 minutes)
          tokenRefreshTimeout.current = setTimeout(refreshToken, 55 * 60 * 1000);
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      }
    };
    
    if (isAuthenticated && !isLoading) {
      refreshToken();
    }
    
    return () => clearAllTimeouts();
  }, [isAuthenticated, isLoading, clearAllTimeouts]);

  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    // Mark sign out as not in progress
    signOutInProgress.current = false;
    
    // Mark login verification as in progress - this should NOT trigger loading state in UI
    loginVerificationInProgress.current = true;
    
    try {
      // Clear any previous errors
      setError(null);
      
      // Clear any existing session data
      sessionStorage.removeItem('user_data');
      
      // Set persistence based on remember me option
      await setPersistence(auth,
        rememberMe 
          ? browserLocalPersistence 
          : browserSessionPersistence 
      );
      
      // Sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // The onIdTokenChanged listener will handle the rest of the process
      // We don't need to set any loading state here - it should be handled by the component
    } catch (error: any) {
      // Reset login verification flag
      loginVerificationInProgress.current = false;
      
      // Set error state
      setError(new Error(error.message));
      console.error('Sign in error:', error);
      
      // Rethrow to let component handle it
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    // Set flag to prevent race conditions
    signOutInProgress.current = true;
    
    try {
      // Set global loading state for the logout process
      setIsLoading(true);
      
      // Clear any errors
      setError(null);
      
      // Clear cached user data first
      sessionStorage.removeItem('user_data');
      
      // Clear all timeouts
      clearAllTimeouts();
      
      // Update state first to prevent UI flickering
      setUser(null);
      setIsAuthenticated(false);
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(new Error(error.message));
      throw error;
    } finally {
      // Reset loading state
      setIsLoading(false);
      
      // Reset flags after operation completes
      signOutInProgress.current = false;
      loginVerificationInProgress.current = false;
    }
  }, [clearAllTimeouts]);

  // Computed values for context
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    // Hide loading state during login verification - crucial for UX
    isLoading: isLoading && !loginVerificationInProgress.current,
    signIn,
    signOut,
    error
  }), [user, isAuthenticated, isLoading, loginVerificationInProgress, signIn, signOut, error]);

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