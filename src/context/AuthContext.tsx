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
import { toast } from 'react-hot-toast';

// Custom event for Firebase auth errors
const createFirebaseErrorEvent = (error: any) => {
  const errorEvent = new CustomEvent('firebase-auth-error', { 
    detail: { error } 
  });
  window.dispatchEvent(errorEvent);
};

interface AuthContextType {
  user: UserDetails | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  error: Error | null;
  refreshToken: () => Promise<boolean>;
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
  const tokenRefreshInProgress = useRef(false);
  const authErrorOccurred = useRef(false);
  
  // Cleanup function for all timeouts
  const clearAllTimeouts = useCallback(() => {
    if (tokenRefreshTimeout.current) {
      clearTimeout(tokenRefreshTimeout.current);
      tokenRefreshTimeout.current = null;
    }
  }, []);
  
  // Internal logout function that can be used within this file without creating circular dependencies
  const performLogout = useCallback(async (): Promise<void> => {
    if (signOutInProgress.current) return;
    signOutInProgress.current = true;
    
    try {
      // Clear cached user data first
      sessionStorage.removeItem('user_data');
      
      // Clear all timeouts
      clearAllTimeouts();
      
      // Update state first to prevent UI flickering
      setUser(null);
      setIsAuthenticated(false);
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      signOutInProgress.current = false;
    }
  }, [clearAllTimeouts]);
  
  // Function to refresh the auth token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser || signOutInProgress.current || tokenRefreshInProgress.current) {
      return false;
    }
    
    tokenRefreshInProgress.current = true;
    
    try {
      await auth.currentUser.getIdToken(true);
      console.log("Token refreshed successfully");
      authErrorOccurred.current = false;
      tokenRefreshInProgress.current = false;
      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      authErrorOccurred.current = true;
      tokenRefreshInProgress.current = false;
      createFirebaseErrorEvent(error);
      return false;
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

  // Token refresh effect with auth error handling
  useEffect(() => {
    // Schedule a periodic token refresh
    const scheduleTokenRefresh = async () => {
      if (auth.currentUser && !signOutInProgress.current) {
        try {
          // Force refresh token 
          await auth.currentUser.getIdToken(true);
          console.log("Token refreshed successfully");
          
          // Schedule next refresh (every 50 minutes instead of 55 to be safer)
          tokenRefreshTimeout.current = setTimeout(scheduleTokenRefresh, 50 * 60 * 1000);
          
          // Reset any auth error flags or states
          authErrorOccurred.current = false;
        } catch (error) {
          console.error("Error refreshing token:", error);
          
          // Mark auth error
          authErrorOccurred.current = true;
          
          // Try one more refresh after a short delay
          tokenRefreshTimeout.current = setTimeout(scheduleTokenRefresh, 30 * 1000); // 30 seconds
        }
      }
    };
    
    // Immediately refresh token when auth state becomes authenticated
    if (isAuthenticated && !isLoading) {
      scheduleTokenRefresh();
    }
    
    // Listen for Firestore errors that might indicate token issues
    const handleFirestoreError = (event: ErrorEvent) => {
      if (!isAuthenticated || signOutInProgress.current) return;
      
      const errorMessage = event.error?.message || event.message || '';
      if (typeof errorMessage === 'string' && 
          (errorMessage.includes('Firestore') || 
           errorMessage.includes('permission') || 
           errorMessage.includes('token') ||
           errorMessage.includes('transport errored'))) {
        
        // Force a token refresh if we haven't already marked an auth error
        if (!authErrorOccurred.current) {
          console.log("Firestore error detected, refreshing authentication");
          refreshToken();
        }
      }
    };
    
    // Add listener for Firestore errors
    window.addEventListener('error', handleFirestoreError);
    
    // Handle Firebase auth error events
    const handleAuthError = (event: CustomEvent) => {
      const error = event.detail?.error;
      if (!error || !isAuthenticated || signOutInProgress.current) return;
      
      const errorCode = error?.code;
      const errorMessage = error?.message || '';
      
      // Check if error requires token refresh
      if (errorMessage.includes('permission-denied') || 
          errorMessage.includes('unauthenticated') ||
          errorMessage.includes('token') ||
          errorCode === 'auth/network-request-failed' ||
          errorCode === 'auth/user-token-expired') {
        
        console.log("Firebase auth error detected, attempting token refresh");
        toast.loading("Refreshing authentication...", { id: "auth-refresh-toast" });
        
        refreshToken()
          .then(success => {
            if (success) {
              toast.success("Authentication refreshed", { id: "auth-refresh-toast" });
            } else {
              toast.error("Authentication failed. Please log in again.", { id: "auth-refresh-toast" });
              // Use performLogout instead of signOut to avoid circular dependency
              setTimeout(() => performLogout(), 1000);
            }
          });
      }
    };
    
    // Listen for custom auth error events
    window.addEventListener('firebase-auth-error', handleAuthError as unknown as EventListener);
    
    return () => {
      clearAllTimeouts();
      window.removeEventListener('error', handleFirestoreError);
      window.removeEventListener('firebase-auth-error', handleAuthError as unknown as EventListener);
    };
  }, [isAuthenticated, isLoading, clearAllTimeouts, refreshToken, performLogout]);

  // Sign in function with improved error handling
  const signIn = useCallback(async (email: string, password: string, rememberMe = false) => {
    if (loginVerificationInProgress.current) return;
    
    loginVerificationInProgress.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Set the persistence type based on remember me checkbox
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      
      // Attempt sign in with email and password
      await signInWithEmailAndPassword(auth, email, password);
      
      // Auth success is handled by the auth state listener in the useEffect
      
    } catch (error: any) {
      // Clear any existing cached user data
      sessionStorage.removeItem('user_data');
      
      // Reset auth state
      setUser(null);
      setIsAuthenticated(false);
      
      // Convert Firebase errors to user-friendly messages
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.code) {
        // Create user-friendly error messages based on Firebase error codes
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'Account not found. Please check your email address.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid login credentials. Please check your email and password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address format.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          default:
            errorMessage = 'Authentication failed. Please try again or contact support.';
        }
      } else if (error.message) {
        // Handle non-code errors, but don't expose raw Firebase messages
        if (error.message.includes('Firebase: Error')) {
          // Extract the error code if possible
          const errorCodeMatch = error.message.match(/\((.*?)\)/);
          if (errorCodeMatch && errorCodeMatch[1]) {
            const errorCode = errorCodeMatch[1];
            
            switch (errorCode) {
              case 'auth/invalid-credential':
                errorMessage = 'Invalid login credentials. Please check your email and password.';
                break;
              case 'auth/user-not-found':
                errorMessage = 'We couldn\'t find an account with this email. Please check your email.';
                break;
              case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
              case 'auth/wrong-password':
                errorMessage = 'The password you entered is incorrect. Please try again.';
                break;
              default:
                errorMessage = 'Authentication failed. Please try again or contact support.';
            }
          }
        }
      }
      
      setError(new Error(errorMessage));
      loginVerificationInProgress.current = false;
      throw error; // Re-throw to be caught by the component
    } finally {
      setIsLoading(false);
      loginVerificationInProgress.current = false;
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
      
      // Set a flag in session storage to indicate successful sign-out
      // This will be used by the Login component to show the success toast
      sessionStorage.setItem('signedOut', 'true');
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Log out toast message with consistent ID to prevent duplicates
      toast.success("Logged out successfully", { id: "logout-success-toast" });
      
      // Add a longer delay to ensure the loading spinner is visible for a reasonable time
      // This gives users visual feedback that the sign-out process is happening
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(new Error(error.message));
      toast.error("Error signing out", { id: "logout-error-toast" });
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
    // Also hide loading state after initial auth check to prevent "establishing secure connection" message
    isLoading: isLoading && !loginVerificationInProgress.current && !initialAuthCheckComplete.current,
    signIn,
    signOut,
    error,
    refreshToken
  }), [user, isAuthenticated, isLoading, loginVerificationInProgress, signIn, signOut, error, refreshToken]);

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