# 3. FIREBASE INTEGRATION

This module provides comprehensive Firebase integration for the Business Options Admin Panel, including authentication, Firestore, Storage, and Cloud Functions.

## 3.1 Firebase Configuration (src/lib/firebase.ts)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
  
  if (useEmulators) {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    
    console.log('Connected to Firebase emulators');
  }
}

export default app;
```

## 3.2 Authentication Service (src/services/auth.ts)

```typescript
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
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserDetails, UserRole } from '@/types/user';

// Sign in with email and password
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
    
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw handleAuthError(error);
  }
};

// Sign out the current user
export const signOut = async (): Promise<void> => {
  try {
    // Log the sign out activity
    if (auth.currentUser) {
      await logUserActivity(auth.currentUser.uid, 'sign_out');
    }
    
    return await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw handleAuthError(error);
  }
};

// Create a new user account
export const createUser = async (
  email: string,
  password: string,
  userData: Partial<UserDetails>
): Promise<UserCredential> => {
  try {
    // Create authentication account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      profile: userData.profile || {
        firstName: '',
        lastName: '',
        fullName: '',
        preferredLanguage: 'en'
      },
      role: userData.role || 'user',
      status: userData.status || 'active',
      permissions: userData.permissions || {},
      loginActivity: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Log user creation activity
    await logUserActivity(user.uid, 'account_created');
    
    return userCredential;
  } catch (error: any) {
    console.error('Create user error:', error);
    throw handleAuthError(error);
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    return await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Reset password error:', error);
    throw handleAuthError(error);
  }
};

// Confirm password reset with code
export const confirmResetPassword = async (
  code: string,
  newPassword: string
): Promise<void> => {
  try {
    return await confirmPasswordReset(auth, code, newPassword);
  } catch (error: any) {
    console.error('Confirm reset password error:', error);
    throw handleAuthError(error);
  }
};

// Change user password (requires recent authentication)
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      throw new Error('No authenticated user found');
    }
    
    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Change password
    await updatePassword(user, newPassword);
    
    // Log password change activity
    await logUserActivity(user.uid, 'password_changed');
    
    return;
  } catch (error: any) {
    console.error('Change password error:', error);
    throw handleAuthError(error);
  }
};

// Update user email (requires recent authentication)
export const changeEmail = async (
  currentPassword: string,
  newEmail: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      throw new Error('No authenticated user found');
    }
    
    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update email in Firebase Auth
    await updateEmail(user, newEmail);
    
    // Update email in Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      email: newEmail,
      updatedAt: serverTimestamp()
    });
    
    // Log email change activity
    await logUserActivity(user.uid, 'email_changed');
    
    return;
  } catch (error: any) {
    console.error('Change email error:', error);
    throw handleAuthError(error);
  }
};

// Get current user details including Firestore data
export const getCurrentUserDetails = async (user: User): Promise<UserDetails | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data() as UserDetails;
    
    // Log user login activity
    await logUserActivity(user.uid, 'sign_in');
    
    return {
      ...userData,
      uid: user.uid,
      email: user.email || '',
      emailVerified: user.emailVerified,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
      deletedAt: userData.deletedAt?.toDate() || undefined
    };
  } catch (error: any) {
    console.error('Get user details error:', error);
    throw error;
  }
};

// Log user activity for audit purposes
export const logUserActivity = async (
  userId: string,
  activityType: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return;
    }
    
    // Get current activity log
    const userData = userDoc.data();
    const loginActivity = userData.loginActivity || [];
    
    // Prepare activity data
    const activity = {
      timestamp: new Date(),
      type: activityType,
      ipAddress: window.localStorage.getItem('lastKnownIP') || 'unknown',
      deviceInfo: navigator.userAgent,
      details: details || {}
    };
    
    // Add to beginning of array, keep last 10 entries
    loginActivity.unshift(activity);
    if (loginActivity.length > 10) {
      loginActivity.pop();
    }
    
    // Update user document
    await updateDoc(userRef, {
      loginActivity,
      updatedAt: serverTimestamp()
    });
    
    // Also log to activity logs collection for admins
    const activityLogRef = doc(db, 'activityLogs', `${userId}_${Date.now()}`);
    await setDoc(activityLogRef, {
      userId,
      userRef: userRef,
      action: activityType,
      entity: 'users',
      entityId: userId,
      description: `User ${activityType.replace('_', ' ')}`,
      metadata: details || {},
      ipAddress: window.localStorage.getItem('lastKnownIP') || 'unknown',
      userAgent: navigator.userAgent,
      timestamp: serverTimestamp(),
      severity: 'info'
    });
    
    return;
  } catch (error: any) {
    console.error('Log user activity error:', error);
    // Don't throw, just log the error - we don't want authentication to fail because of logging
  }
};

// Handle common authentication errors with user-friendly messages
export const handleAuthError = (error: any): Error => {
  const errorMap: Record<string, string> = {
    'auth/user-not-found': 'No user found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-email': 'The email address is invalid',
    'auth/user-disabled': 'This account has been disabled',
    'auth/email-already-in-use': 'This email is already in use',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/operation-not-allowed': 'Operation not allowed',
    'auth/requires-recent-login': 'Please log in again before retrying this request',
    'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later'
  };
  
  const errorMessage = errorMap[error.code] || error.message || 'An unknown error occurred';
  return new Error(errorMessage);
};

// Get user roles from Firestore
export const getUserRoles = async (): Promise<UserRole[]> => {
  // In a real implementation, you might fetch this from Firestore
  // For now, we'll return the static list
  return ['super_admin', 'admin', 'moderator', 'advisor', 'user'];
};
```

## 3.3 User Management Service (src/services/users.ts)

```typescript
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateEmail,
  sendPasswordResetEmail
} from 'firebase/auth';
import { db, auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { UserDetails, UserRole } from '@/types/user';

// Set user role (uses Cloud Function for security)
const setUserRole = httpsCallable<{ uid: string; role: UserRole }, { success: boolean }>(
  functions, 
  'setUserRole'
);

// Fetch a single user by ID
export const getUserById = async (uid: string): Promise<UserDetails | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return {
      ...userDoc.data(),
      uid: userDoc.id,
      createdAt: userDoc.data().createdAt?.toDate(),
      updatedAt: userDoc.data().updatedAt?.toDate(),
      deletedAt: userDoc.data().deletedAt?.toDate()
    } as UserDetails;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Fetch multiple users with filtering, pagination
export const getUsers = async ({
  role,
  status = 'active',
  searchTerm,
  orderByField = 'createdAt',
  orderDirection = 'desc',
  lastDoc,
  pageSize = 10
}: {
  role?: UserRole;
  status?: string;
  searchTerm?: string;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  lastDoc?: DocumentSnapshot;
  pageSize?: number;
}) => {
  try {
    // Start building the query
    let constraints = [];
    
    // Filter by role if provided
    if (role) {
      constraints.push(where('role', '==', role));
    }
    
    // Filter by status if provided
    if (status && status !== 'all') {
      constraints.push(where('status', '==', status));
    }
    
    // Add ordering
    constraints.push(orderBy(orderByField, orderDirection));
    
    // Add pagination
    constraints.push(limit(pageSize));
    
    // Add starting point for pagination if provided
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    // Execute query
    const q = query(collection(db, 'users'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    // Process results
    const users = [];
    let totalUsers = 0;
    
    for (const doc of querySnapshot.docs) {
      const userData = doc.data();
      
      // If searching, filter results client-side
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        const fullName = userData.profile?.fullName?.toLowerCase() || '';
        const email = userData.email.toLowerCase();
        
        if (!fullName.includes(searchTermLower) && !email.includes(searchTermLower)) {
          continue;
        }
      }
      
      users.push({
        ...userData,
        uid: doc.id,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate(),
        deletedAt: userData.deletedAt?.toDate()
      });
      
      totalUsers++;
    }
    
    return {
      users,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      totalItems: totalUsers
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Create a new user
export const createUser = async (userData: Partial<UserDetails>, password: string) => {
  try {
    // Create authentication account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email!,
      password
    );
    
    const { uid } = userCredential.user;
    const timestamp = serverTimestamp();
    
    // Generate default values
    const defaultProfile = {
      firstName: userData.profile?.firstName || '',
      lastName: userData.profile?.lastName || '',
      fullName: `${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`.trim(),
      displayName: userData.profile?.displayName || '',
      preferredLanguage: userData.profile?.preferredLanguage || 'en'
    };
    
    // Prepare user document
    const newUser = {
      uid,
      email: userData.email,
      emailVerified: false,
      profile: {
        ...defaultProfile,
        ...userData.profile
      },
      role: userData.role || 'user',
      permissions: userData.permissions || {},
      status: userData.status || 'active',
      loginActivity: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // Save to Firestore
    await setDoc(doc(db, 'users', uid), newUser);
    
    // Set role using Cloud Function
    await setUserRole({ uid, role: userData.role || 'user' });
    
    return { uid };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update an existing user
export const updateUser = async (uid: string, updates: Partial<UserDetails>) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentData = userDoc.data();
    
    // Handle special case for updating email
    if (updates.email && updates.email !== currentData.email) {
      // Update in Auth
      await updateEmail(auth.currentUser!, updates.email);
    }
    
    // Handle role change
    if (updates.role && updates.role !== currentData.role) {
      await setUserRole({ uid, role: updates.role });
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    // If profile is updated, merge it with existing profile
    if (updates.profile) {
      updateData.profile = {
        ...currentData.profile,
        ...updates.profile
      };
      
      // Ensure fullName is updated if firstName or lastName changes
      if (updates.profile.firstName || updates.profile.lastName) {
        updateData.profile.fullName = `${updateData.profile.firstName || currentData.profile.firstName} ${updateData.profile.lastName || currentData.profile.lastName}`.trim();
      }
    }
    
    // Update in Firestore
    await updateDoc(userRef, updateData);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete a user
export const deleteUser = async (uid: string, hardDelete = false) => {
  try {
    const userRef = doc(db, 'users', uid);
    
    if (hardDelete) {
      // Hard delete - remove from Firestore
      await deleteDoc(userRef);
      
      // Delete from Auth (requires Admin SDK in Cloud Function)
      const deleteAuthUser = httpsCallable(functions, 'deleteAuthUser');
      await deleteAuthUser({ uid });
    } else {
      // Soft delete - update status and add deletedAt timestamp
      await updateDoc(userRef, {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Reset user password
export const resetUserPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};
```

## 3.4 Firebase Storage Service (src/services/storage.ts)

```typescript
import { 
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
  UploadMetadata
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Progress callback type
export type ProgressCallback = (progress: number) => void;

// Upload a single file with progress reporting
export const uploadFile = async (
  path: string,
  file: File,
  metadata?: UploadMetadata,
  onProgress?: ProgressCallback
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Report progress if callback provided
          if (onProgress) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          }
        },
        (error) => {
          // Handle errors during upload
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully, get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Upload multiple files with progress reporting
export const uploadMultipleFiles = async (
  basePath: string,
  files: File[],
  metadata?: UploadMetadata,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<string[]> => {
  try {
    const results: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${basePath}/${file.name}`;
      
      // Create individual progress callback if needed
      const fileProgressCallback = onProgress
        ? (progress: number) => onProgress(i, progress)
        : undefined;
      
      const downloadURL = await uploadFile(filePath, file, metadata, fileProgressCallback);
      results.push(downloadURL);
    }
    
    return results;
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
};

// Delete a file by URL or path
export const deleteFile = async (fileURL: string): Promise<void> => {
  try {
    // If URL provided, convert to storage path
    let fileRef: StorageReference;
    
    if (fileURL.startsWith('https://')) {
      // Extract path from URL - for Firebase Storage URLs, create a reference from URL
      fileRef = ref(storage, fileURL);
    } else {
      // Direct path provided
      fileRef = ref(storage, fileURL);
    }
    
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// List all files in a directory
export const listFiles = async (path: string): Promise<string[]> => {
  try {
    const directoryRef = ref(storage, path);
    const fileList = await listAll(directoryRef);
    
    // Get download URLs for all items
    const downloadURLs = await Promise.all(
      fileList.items.map(item => getDownloadURL(item))
    );
    
    return downloadURLs;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

// Get file metadata by URL or path
export const getFileMetadata = async (fileURL: string): Promise<Record<string, any>> => {
  try {
    // If URL provided, convert to storage path
    let fileRef: StorageReference;
    
    if (fileURL.startsWith('https://')) {
      // Extract path from URL - for Firebase Storage URLs, create a reference from URL
      fileRef = ref(storage, fileURL);
    } else {
      // Direct path provided
      fileRef = ref(storage, fileURL);
    }
    
    const metadata = await getDownloadURL(fileRef);
    return metadata;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
};
```

## 3.5 Firestore API Service (src/services/firestore.ts)

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentReference,
  CollectionReference,
  DocumentData,
  Query
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Generic Firestore API service for reusable database operations

// Create a document with auto-generated or custom ID
export const createDocument = async <T extends DocumentData>(
  collectionPath: string,
  data: T,
  documentId?: string
): Promise<{ id: string; data: T }> => {
  try {
    // Add timestamps
    const timestampedData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    let docRef: DocumentReference;
    
    if (documentId) {
      // Use provided ID
      docRef = doc(db, collectionPath, documentId);
      await setDoc(docRef, timestampedData);
    } else {
      // Auto-generate ID
      const collectionRef = collection(db, collectionPath);
      docRef = doc(collectionRef);
      await setDoc(docRef, timestampedData);
    }
    
    return {
      id: docRef.id,
      data: timestampedData as T
    };
  } catch (error) {
    console.error(`Error creating document in ${collectionPath}:`, error);
    throw error;
  }
};

// Get a document by ID
export const getDocument = async <T extends DocumentData>(
  collectionPath: string,
  documentId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionPath, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data() as T;
    
    // Convert Firestore Timestamps to JavaScript Dates for easier consumption
    const processedData = processTimestamps(data);
    
    return {
      ...processedData,
      id: docSnap.id
    } as T;
  } catch (error) {
    console.error(`Error getting document ${documentId} from ${collectionPath}:`, error);
    throw error;
  }
};

// Update a document
export const updateDocument = async <T extends DocumentData>(
  collectionPath: string,
  documentId: string,
  data: Partial<T>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionPath, documentId);
    
    // Add updated timestamp
    const timestampedData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, timestampedData);
  } catch (error) {
    console.error(`Error updating document ${documentId} in ${collectionPath}:`, error);
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (
  collectionPath: string,
  documentId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionPath, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${documentId} from ${collectionPath}:`, error);
    throw error;
  }
};

// Query collection with pagination
export const queryCollection = async <T extends DocumentData>(
  collectionPath: string,
  options: {
    constraints?: QueryConstraint[];
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    lastDoc?: DocumentSnapshot;
    limit?: number;
  } = {}
): Promise<{
  documents: T[];
  lastDoc: DocumentSnapshot | null;
}> => {
  try {
    const {
      constraints = [],
      orderByField = 'createdAt',
      orderDirection = 'desc',
      lastDoc,
      limit: limitCount = 10
    } = options;
    
    // Build query constraints
    const queryConstraints = [
      ...constraints,
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    ];
    
    // Add pagination starting point if provided
    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }
    
    // Create and execute query
    const q = query(collection(db, collectionPath), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    // Process results
    const documents: T[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data() as T;
      
      // Convert Firestore Timestamps to JavaScript Dates
      const processedData = processTimestamps(data);
      
      documents.push({
        ...processedData,
        id: doc.id
      } as T);
    });
    
    return {
      documents,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error(`Error querying collection ${collectionPath}:`, error);
    throw error;
  }
};

// Helper function to recursively convert Firestore Timestamps to JavaScript Dates
const processTimestamps = (data: any): any => {
  if (!data) return data;
  
  if (data instanceof Timestamp) {
    return data.toDate();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => processTimestamps(item));
  }
  
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = processTimestamps(data[key]);
      }
    }
    
    return result;
  }
  
  return data;
};

// Generate a query with filter conditions
export const generateQuery = <T extends DocumentData>(
  collectionPath: string,
  filters: Array<{
    field: string;
    operator: '==' | '!=' | '>' | '>=' | '<' | '<=';
    value: any;
  }> = [],
  orderByField?: string,
  orderDirection?: 'asc' | 'desc',
  limitCount?: number
): Query<T> => {
  // Create base collection reference
  const collectionRef = collection(db, collectionPath) as CollectionReference<T>;
  
  // Generate constraints from filters
  const constraints: QueryConstraint[] = filters.map(filter => 
    where(filter.field, filter.operator, filter.value)
  );
  
  // Add ordering if specified
  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection || 'asc'));
  }
  
  // Add limit if specified
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  
  return query<T>(collectionRef, ...constraints);
};
```

## 3.6 Cloud Functions Service (src/services/functions.ts)

```typescript
import { httpsCallable, Functions, HttpsCallableResult } from 'firebase/functions';
import { functions } from '@/lib/firebase';

// Generic function for calling Firebase Cloud Functions
export const callFunction = async <TData = any, TResult = any>(
  functionName: string,
  data: TData
): Promise<TResult> => {
  try {
    const functionRef = httpsCallable<TData, TResult>(functions, functionName);
    const result = await functionRef(data);
    return result.data;
  } catch (error) {
    console.error(`Error calling function ${functionName}:`, error);
    throw handleFunctionError(error);
  }
};

// Role management functions
export const setUserRole = async (
  uid: string, 
  role: string
): Promise<{ success: boolean }> => {
  return callFunction('setUserRole', { uid, role });
};

// Admin-level user functions
export const adminDeleteUser = async (
  uid: string
): Promise<{ success: boolean }> => {
  return callFunction('deleteUser', { uid });
};

// Generate signed URL for secure file uploads
export const getSignedUploadUrl = async (
  path: string,
  contentType: string,
  expirationMinutes: number = 10
): Promise<{ url: string; fields: Record<string, string> }> => {
  return callFunction('getSignedUploadUrl', { 
    path, 
    contentType, 
    expirationMinutes 
  });
};

// Process listing approval request
export const approveListingRequest = async (
  listingId: string, 
  reviewerId: string, 
  reviewNotes?: string
): Promise<{ success: boolean }> => {
  return callFunction('approveListingRequest', { 
    listingId, 
    reviewerId, 
    reviewNotes 
  });
};

// Process listing rejection
export const rejectListingRequest = async (
  listingId: string, 
  reviewerId: string, 
  rejectionReason: string
): Promise<{ success: boolean }> => {
  return callFunction('rejectListingRequest', { 
    listingId, 
    reviewerId, 
    rejectionReason 
  });
};

// Error handling helper for Cloud Functions
const handleFunctionError = (error: any): Error => {
  // Extract the error message from the Firebase Functions error
  if (error.code === 'functions/invalid-argument') {
    return new Error('Invalid arguments provided');
  }
  
  if (error.code === 'functions/permission-denied') {
    return new Error('You do not have permission to perform this action');
  }
  
  if (error.code === 'functions/unauthenticated') {
    return new Error('You must be logged in to perform this action');
  }
  
  if (error.code === 'functions/not-found') {
    return new Error('The requested resource was not found');
  }
  
  if (error.code === 'functions/already-exists') {
    return new Error('The resource already exists');
  }
  
  // Try to extract detailed error message if available
  const message = error.message || error.details || 'An unknown error occurred';
  return new Error(message);
};
```

## 3.7 Authentication Context (src/contexts/AuthContext.tsx)

```typescript
import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserDetails } from '@/types/user';
import { getCurrentUserDetails, signIn, signOut } from '@/services/auth';

// Define the context type
interface AuthContextType {
  currentUser: UserDetails | null;
  firebaseUser: User | null;
  userLoading: boolean;
  userPermissions: Record<string, boolean>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshUserData: () => Promise<void>;
}

// Create the context with default values
export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  firebaseUser: null,
  userLoading: true,
  userPermissions: {},
  login: async () => {},
  logout: async () => {},
  hasPermission: () => false,
  refreshUserData: async () => {}
});

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserDetails | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  
  // Handle login
  const login = async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ) => {
    const userCredential = await signIn(email, password, rememberMe);
    
    // User data will be fetched by the auth state change listener
    return userCredential;
  };
  
  // Handle logout
  const logout = async () => {
    await signOut();
    setCurrentUser(null);
    setFirebaseUser(null);
    setUserPermissions({});
  };
  
  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!permission) return true;
    
    // Check direct permission
    if (userPermissions[permission]) return true;
    
    // Check wildcard permission for the module
    const [module] = permission.split('.');
    if (userPermissions[`${module}.*`]) return true;
    
    return false;
  };
  
  // Refresh user data from Firestore
  const refreshUserData = async () => {
    if (!firebaseUser) return;
    
    try {
      const userData = await getCurrentUserDetails(firebaseUser);
      
      if (userData) {
        setCurrentUser(userData);
        
        // Extract permissions
        const permissions = userData.permissions || {};
        setUserPermissions(permissions);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };
  
  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          const userData = await getCurrentUserDetails(user);
          
          if (userData) {
            setCurrentUser(userData);
            
            // Extract permissions
            const permissions = userData.permissions || {};
            setUserPermissions(permissions);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setCurrentUser(null);
        setUserPermissions({});
      }
      
      setUserLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);
  
  // Provide auth context to children
  const value = {
    currentUser,
    firebaseUser,
    userLoading,
    userPermissions,
    login,
    logout,
    hasPermission,
    refreshUserData
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 3.8 Auth Hook (src/hooks/useAuth.ts)

```typescript
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

// Hook for easy access to auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;
```

## 3.9 Types for Firebase Integration (src/types/firebase.ts)

```typescript
import { Timestamp, DocumentReference } from 'firebase/firestore';

// Common Firestore types
export interface FirestoreDocument {
  id?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  deletedAt?: Date | Timestamp | null;
}

// Options for pagination
export interface PaginationOptions {
  pageSize?: number;
  startAfter?: any;
}

// Options for sorting
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Options for filtering
export interface FilterOption {
  field: string;
  operator: '==' | '!=' | '>' | '>=' | '<' | '<=';
  value: any;
}

// Generic query options
export interface QueryOptions {
  filters?: FilterOption[];
  sort?: SortOptions;
  pagination?: PaginationOptions;
}

// Generic query response
export interface QueryResponse<T> {
  data: T[];
  lastDoc: any | null;
  hasMore: boolean;
}

// Document metadata
export interface DocumentMetadata {
  path: string;
  name: string;
  size: number;
  contentType: string;
  uploadedBy: string;
  uploadedAt: Date | Timestamp;
  customMetadata?: Record<string, string>;
}

// Reference type
export interface Reference<T> {
  id: string;
  ref: DocumentReference<T>;
}
```

## 3.10 Firebase Cloud Functions (functions/src/index.ts)

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// User role management function
export const setUserRole = functions.https.onCall(async (data, context) => {
  // Verify caller has admin privileges
  if (!context.auth || !['admin', 'super_admin'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can set user roles'
    );
  }
  
  const { uid, role } = data;
  
  // Validate role is a permitted value
  const validRoles = ['super_admin', 'admin', 'moderator', 'advisor', 'user'];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid role specified'
    );
  }
  
  try {
    // Set custom claims on the user's auth profile
    await admin.auth().setCustomUserClaims(uid, { role });
    
    // Update the user document in Firestore
    await admin.firestore().collection('users').doc(uid).update({
      role: role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid
    });
    
    // Add to activity log
    await admin.firestore().collection('activityLogs').add({
      action: 'user_role_change',
      entity: 'users',
      entityId: uid,
      description: `User role changed to ${role}`,
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      severity: 'info'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new functions.https.HttpsError('internal', 'Error setting user role');
  }
});

// Delete user function (both Auth and Firestore)
export const deleteAuthUser = functions.https.onCall(async (data, context) => {
  // Verify caller has admin privileges
  if (!context.auth || !['super_admin'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only super admins can delete user accounts'
    );
  }
  
  const { uid } = data;
  
  try {
    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(uid);
    
    // Note: Firestore document is typically not deleted for audit purposes
    // Instead, we soft delete by updating status
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting auth user:', error);
    throw new functions.https.HttpsError('internal', 'Error deleting user account');
  }
});

// Approve listing function
export const approveListingRequest = functions.https.onCall(async (data, context) => {
  // Verify caller has admin or moderator privileges
  if (!context.auth || !['admin', 'super_admin', 'moderator'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators and moderators can approve listings'
    );
  }
  
  const { listingId, reviewerId, reviewNotes } = data;
  
  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    // Update the listing document
    await admin.firestore().collection('listings').doc(listingId).update({
      status: 'active',
      publishedAt: timestamp,
      reviewedBy: reviewerId,
      reviewNotes: reviewNotes || '',
      updatedAt: timestamp
    });
    
    // Get listing details to include in notification
    const listingDoc = await admin.firestore().collection('listings').doc(listingId).get();
    const listingData = listingDoc.data();
    
    if (!listingData) {
      throw new functions.https.HttpsError('not-found', 'Listing not found');
    }
    
    // Create notification for the listing owner
    await admin.firestore().collection('notifications').add({
      userId: listingData.ownerId,
      type: 'listing_approved',
      title: 'Listing Approved',
      message: `Your listing "${listingData.name}" has been approved and is now live.`,
      read: false,
      data: {
        listingId: listingId
      },
      createdAt: timestamp
    });
    
    // Add to activity log
    await admin.firestore().collection('activityLogs').add({
      action: 'listing_approved',
      entity: 'listings',
      entityId: listingId,
      description: `Listing "${listingData.name}" approved`,
      userId: reviewerId,
      timestamp: timestamp,
      severity: 'info'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error approving listing:', error);
    throw new functions.https.HttpsError('internal', 'Error approving listing');
  }
});

// Reject listing function
export const rejectListingRequest = functions.https.onCall(async (data, context) => {
  // Verify caller has admin or moderator privileges
  if (!context.auth || !['admin', 'super_admin', 'moderator'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators and moderators can reject listings'
    );
  }
  
  const { listingId, reviewerId, rejectionReason } = data;
  
  // Validate rejection reason
  if (!rejectionReason || rejectionReason.trim() === '') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Rejection reason is required'
    );
  }
  
  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    // Update the listing document
    await admin.firestore().collection('listings').doc(listingId).update({
      status: 'rejected',
      reviewedBy: reviewerId,
      rejectionReason: rejectionReason,
      updatedAt: timestamp
    });
    
    // Get listing details to include in notification
    const listingDoc = await admin.firestore().collection('listings').doc(listingId).get();
    const listingData = listingDoc.data();
    
    if (!listingData) {
      throw new functions.https.HttpsError('not-found', 'Listing not found');
    }
    
    // Create notification for the listing owner
    await admin.firestore().collection('notifications').add({
      userId: listingData.ownerId,
      type: 'listing_rejected',
      title: 'Listing Rejected',
      message: `Your listing "${listingData.name}" has been rejected. Reason: ${rejectionReason}`,
      read: false,
      data: {
        listingId: listingId,
        rejectionReason: rejectionReason
      },
      createdAt: timestamp
    });
    
    // Add to activity log
    await admin.firestore().collection('activityLogs').add({
      action: 'listing_rejected',
      entity: 'listings',
      entityId: listingId,
      description: `Listing "${listingData.name}" rejected. Reason: ${rejectionReason}`,
      userId: reviewerId,
      timestamp: timestamp,
      severity: 'info'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting listing:', error);
    throw new functions.https.HttpsError('internal', 'Error rejecting listing');
  }
});

// Generate signed URL for direct file uploads
export const getSignedUploadUrl = functions.https.onCall(async (data, context) => {
  // Verify caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }
  
  const { path, contentType, expirationMinutes = 10 } = data;
  
  try {
    // Generate signed URL with specified expiration
    const expires = Date.now() + (expirationMinutes * 60 * 1000);
    const bucket = admin.storage().bucket();
    const file = bucket.file(path);
    
    // Create signed URL
    const [url] = await file.getSignedUrl({
      action: 'write',
      expires,
      contentType,
      version: 'v4'
    });
    
    return { url };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new functions.https.HttpsError('internal', 'Error generating upload URL');
  }
});

// Firebase Auth user cleanup when user is deleted from Firestore
export const onUserDeleted = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snap, context) => {
    const userId = context.params.userId;
    
    try {
      // Attempt to delete the user from Firebase Auth
      await admin.auth().deleteUser(userId);
      console.log(`Deleted Firebase Auth user ${userId}`);
    } catch (error) {
      // If user doesn't exist in Auth, that's okay
      if (error.code === 'auth/user-not-found') {
        console.log(`User ${userId} not found in Auth, already deleted`);
      } else {
        console.error(`Error deleting Auth user ${userId}:`, error);
        throw error;
      }
    }
  });
```

This comprehensive Firebase integration module provides all the necessary services for authentication, database operations, storage management, and cloud functions for the Business Options Admin Panel.
