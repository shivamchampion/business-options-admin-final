/**
 * Authentication service
 * Handles user authentication and management
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  UserCredential,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  collection, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserDetails, UserRole } from '@/types/firebase';

/**
 * Check if user role is allowed to access the admin panel
 * @param role User's role
 * @returns boolean indicating if access is allowed
 */
const isAllowedToAccessAdmin = (role: UserRole): boolean => {
  return role !== 'user'; // Only users with roles other than 'user' can access admin panel
};

/**
 * Sign in user with email and password
 * @param email User's email address
 * @param password User's password
 * @param rememberMe Whether to remember the user's session
 * @returns Promise containing user credentials
 */
export const signIn = async (
  email: string, 
  password: string,
  rememberMe: boolean = false
): Promise<UserCredential> => {
  try {
    // Set persistence based on remember me option
    auth.setPersistence(
      rememberMe 
        ? 'LOCAL' // Persists across sessions
        : 'SESSION' // Cleared when window is closed
    );
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get user role from Firestore by querying for the uid
    const userQuery = query(
      collection(db, 'users'),
      where('uid', '==', userCredential.user.uid)
    );
    const userDocs = await getDocs(userQuery);
    
    if (userDocs.empty) {
      console.error('User not found in Firestore:', userCredential.user.uid);
      throw new Error('User not found in system. Please contact support.');
    }
    
    const userData = userDocs.docs[0].data() as UserDetails;
    
    // Check if user can access admin panel
    if (!isAllowedToAccessAdmin(userData.role)) {
      console.error('Access denied for user:', userData);
      throw new Error('Access denied: User role is not allowed to access admin panel');
    }
    
    console.log('Login successful:', {
      email: userData.email,
      role: userData.role,
      status: userData.status
    });
    
    return userCredential;
  } catch (error: any) {
    console.error('Sign in error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    
    // More specific error messages based on Firebase error codes
    let errorMessage = 'Login failed. Please check your credentials and try again.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Account not found. Please check your email address.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many login attempts. Please try again later.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address format.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Sign out the current user
 * @returns Promise that resolves when sign out is complete
 */
export const signOut = async (): Promise<void> => {
  try {
    return await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Create a new user account
 * @param userData User's profile information
 * @param password User's chosen password
 * @returns Promise containing user credentials
 */
export const createUser = async (userData: Partial<UserDetails>, password: string) => {
  try {
    // Validate role
    if (!Object.values(UserRole).includes(userData.role as UserRole)) {
      throw new Error('Invalid user role');
    }
    
    // Create authentication account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      password
    );

    // Create user document in Firestore
    const userRef = doc(db, 'users'); // Create reference without ID
    await setDoc(userRef, {
      id: userRef.id, // Use Firebase's auto-generated document ID
      uid: userCredential.user.uid, // Firebase UID
      email: userData.email,
      name: userData.name,
      role: userData.role,
      status: 'active',
      createdAt: serverTimestamp(),
      ...userData
    });
    
    return userCredential;
  } catch (error: any) {
    console.error('Create user error:', error);
    throw error;
  }
};
