import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp, 
    orderBy, 
    limit, 
    startAfter
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  import { UserDetails, UserRole, UserStatus, UserFilters } from '@/types/firebase';
  import { generateRandomCode } from '@/lib/utils';
  import { uploadProfileImage } from './storageService';
  
  const USERS_COLLECTION = 'users';
  
  /**
   * Get admin panel users with pagination and filtering
   */
  export const getAdminPanelUsers = async (
    pageSize: number = 10, 
    lastDoc: any = null,
    filters?: UserFilters
  ): Promise<{users: UserDetails[], lastDoc: any}> => {
    try {
      // Start with a basic query
      let baseQuery = collection(db, USERS_COLLECTION);
      
      // Create an array to hold conditions
      const conditions = [];
      
      // Add role condition
      conditions.push(where('role', 'in', [UserRole.ADMIN, UserRole.ADVISOR, UserRole.MODERATOR, UserRole.SUPER_ADMIN]));
      
      // Apply filters one by one with individual queries
      let snapshot;
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          conditions.push(where('status', 'in', filters.status));
        }
        
        if (filters.role && filters.role.length > 0) {
          conditions.push(where('role', 'in', filters.role));
        }
        
        if (filters.isVerified !== undefined) {
          conditions.push(where('emailVerified', '==', filters.isVerified));
        }
      }
      
      // Create the query with conditions
      let finalQuery = query(baseQuery, ...conditions, orderBy('createdAt', 'desc'));
      
      // Apply pagination
      if (lastDoc) {
        finalQuery = query(finalQuery, startAfter(lastDoc), limit(pageSize));
      } else {
        finalQuery = query(finalQuery, limit(pageSize));
      }
      
      // Execute the query
      snapshot = await getDocs(finalQuery);
      
      // Process the results
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          lastLogin: data.lastLogin?.toDate(),
          verificationCodeExpiry: data.verificationCodeExpiry?.toDate()
        } as UserDetails;
      });
      
      // For client-side filtering (search)
      let filteredUsers = users;
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredUsers = users.filter(user => 
          user.name.toLowerCase().includes(searchTerm) || 
          user.email.toLowerCase().includes(searchTerm) ||
          (user.loginEmail && user.loginEmail.toLowerCase().includes(searchTerm))
        );
      }
      
      return {
        users: filteredUsers,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error getting admin users:', error);
      throw new Error(`Failed to fetch admin users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Get website users with pagination and filtering
   */
  export const getWebsiteUsers = async (
    pageSize: number = 10, 
    lastDoc: any = null,
    filters?: UserFilters
  ): Promise<{users: UserDetails[], lastDoc: any}> => {
    try {
      let baseQuery = query(
        collection(db, USERS_COLLECTION),
        where('role', '==', UserRole.USER)
      );
      
      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          baseQuery = query(baseQuery, where('status', 'in', filters.status));
        }
        
        if (filters.isVerified !== undefined) {
          baseQuery = query(baseQuery, where('emailVerified', '==', filters.isVerified));
        }
      }
      
      // Apply ordering and pagination
      let finalQuery = query(baseQuery, orderBy('createdAt', 'desc'));
      
      if (lastDoc) {
        finalQuery = query(finalQuery, startAfter(lastDoc), limit(pageSize));
      } else {
        finalQuery = query(finalQuery, limit(pageSize));
      }
      
      const snapshot = await getDocs(finalQuery);
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          lastLogin: data.lastLogin?.toDate()
        } as UserDetails;
      });
      
      // Client-side filtering for search
      let filteredUsers = users;
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredUsers = users.filter(user => 
          user.name.toLowerCase().includes(searchTerm) || 
          user.email.toLowerCase().includes(searchTerm)
        );
      }
      
      return {
        users: filteredUsers,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error getting website users:', error);
      throw new Error(`Failed to fetch website users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Environment-aware API URL configuration
  const getApiUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.warn('VITE_API_URL is not defined, using default localhost:5000');
      return process.env.NODE_ENV === 'production' 
        ? 'https://api.businessoptions.in' 
        : 'http://localhost:5000';
    }
    return apiUrl;
  };
  
  /**
   * Create a new admin panel user
   */
  export const createAdminPanelUser = async (
    userData: Partial<UserDetails>,
    profileImage?: File
  ): Promise<{userId: string, loginEmail: string, password: string}> => {
    try {
      // Validation checks
      if (!userData.name || !userData.email || !userData.role) {
        throw new Error('Name, email and role are required');
      }
      
      if (userData.role === UserRole.USER) {
        throw new Error('Cannot create website users from admin panel');
      }
      
      if (userData.role === UserRole.SUPER_ADMIN) {
        throw new Error('Super Admin users cannot be created');
      }
      
      // Check if a user with this email already exists
      const emailQuery = query(
        collection(db, USERS_COLLECTION),
        where('email', '==', userData.email)
      );
      const existingUserSnapshot = await getDocs(emailQuery);
      
      if (!existingUserSnapshot.empty) {
        throw new Error('A user with this email already exists. Please use a different email.');
      }
      
      // Generate a random login email for admin panel users
      const namePart = userData.name.toLowerCase().replace(/\s+/g, '.').substring(0, 15);
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const loginEmail = `${namePart}.${randomPart}@businessoptions.in`;
      
      // Create user document in Firestore first (without uid)
      const userRef = doc(collection(db, USERS_COLLECTION));
      const userId = userRef.id;
      
      // Upload profile image if provided
      let profileImageUrl = userData.profileImageUrl || null;
      if (profileImage) {
        profileImageUrl = await uploadProfileImage(profileImage, userId);
      }
      
      // Call the backend API to create the Firebase Auth user
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/auth/createUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          loginEmail: loginEmail
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user account');
      }
      
      const { uid, password } = await response.json();
      
      // Now save the user document with the uid
      await setDoc(userRef, {
        id: userId,
        uid: uid,
        name: userData.name,
        email: userData.email,
        loginEmail: loginEmail,
        role: userData.role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        isWebsiteUser: false,
        createdAt: serverTimestamp(),
        profileImageUrl
      });
      
      return {
        userId,
        loginEmail,
        password
      };
    } catch (error) {
      console.error('Error creating admin user:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Unknown error occurred while creating user');
      }
    }
  };
  
  /**
   * Reset user password
   */
  export const resetUserPassword = async (loginEmail: string): Promise<string> => {
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/auth/resetPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loginEmail }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
      
      const { password } = await response.json();
      return password;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
    }
  };
    
  /**
   * Update a user's status (active/inactive)
   */
  export const updateUserStatus = async (
    userId: string,
    status: UserStatus
  ): Promise<boolean> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, { status });
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error(`Failed to update user status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
    
  /**
   * Bulk update user statuses
   */
  export const bulkUpdateUserStatus = async (
    userIds: string[],
    status: UserStatus
  ): Promise<boolean> => {
    try {
      // In a production app, we'd use a batch or transaction
      for (const userId of userIds) {
        await updateUserStatus(userId, status);
      }
      return true;
    } catch (error) {
      console.error('Error bulk updating users:', error);
      throw new Error(`Failed to bulk update users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
    
  /**
   * Delete a user completely (Firestore and Auth)
   */
  export const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      // First, get the user document to find the loginEmail
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userSnap.data() as UserDetails;
      
      // If this is an admin user with loginEmail, we need to delete the auth user
      if (userData.loginEmail) {
        try {
          const API_URL = getApiUrl();
          const response = await fetch(`${API_URL}/api/auth/deleteAuthUser`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ loginEmail: userData.loginEmail }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            // We only log this error but continue with Firestore deletion
            console.error('Error deleting auth user:', errorData.error);
          }
        } catch (authError) {
          // Only log auth deletion errors, don't abort the process
          console.error('Error deleting Firebase Auth user:', authError);
        }
      }
      
      // Delete the Firestore document
      await deleteDoc(userRef);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };