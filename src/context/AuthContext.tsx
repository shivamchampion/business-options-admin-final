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
  
  // Check for cached user data
  useEffect(() => {
    // Try to load data from session storage for immediate UI rendering
    const cachedUser = sessionStorage.getItem('user_data');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (e) {
        console.error('Error parsing cached user data');
        sessionStorage.removeItem('user_data');
      }
    }
    
    // More efficient token change listener (instead of onAuthStateChanged)
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
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
        setError(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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