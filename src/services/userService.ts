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
    startAfter,
    QuerySnapshot,
    DocumentData
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  import { UserDetails, UserRole, UserStatus, UserFilters } from '@/types/firebase';
  import { generateRandomCode } from '@/lib/utils';
  
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
          user.email.toLowerCase().includes(searchTerm)
        );
      }
      
      return {
        users: filteredUsers,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error getting admin users:', error);
      throw error;
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
      
      // Apply filters (similar to above)
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
      throw error;
    }
  };
  
  /**
   * Create a new admin panel user
   */
  // Modify the createAdminPanelUser function
export const createAdminPanelUser = async (
    userData: Partial<UserDetails>
  ): Promise<{userId: string, verificationCode: string}> => {
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
      
      // Generate verification code (6 digits)
      const verificationCode = generateRandomCode(6);
      const codeExpiry = new Date();
      codeExpiry.setHours(codeExpiry.getHours() + 24); // Code valid for 24 hours
      
      // Create user document in Firestore
      const userRef = doc(collection(db, USERS_COLLECTION));
      await setDoc(userRef, {
        id: userRef.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: UserStatus.VERIFICATION_PENDING,
        emailVerified: false,
        isWebsiteUser: false,
        createdAt: serverTimestamp(),
        verificationCode,
        verificationCodeExpiry: codeExpiry,
        profileImageUrl: userData.profileImageUrl || null
      });
      
      return {
        userId: userRef.id,
        verificationCode
      };
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  };
  
  /**
   * Verify a user's email and set password
   */
  export const verifyUserAndSetPassword = async (
    userId: string, 
    verificationCode: string,
    password: string
  ): Promise<boolean> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data() as UserDetails;
      
      if (userData.verificationCode !== verificationCode) {
        throw new Error('Invalid verification code');
      }
      
      const now = new Date();
      if (userData.verificationCodeExpiry && userData.verificationCodeExpiry < now) {
        throw new Error('Verification code has expired');
      }
      
      // In a real application, we'd create the Firebase Auth account here
      // and set the password
      
      // Update user document
      await updateDoc(userRef, {
        status: UserStatus.ACTIVE,
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null
      });
      
      return true;
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error;
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
      throw error;
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
      throw error;
    }
  };
  
  /**
   * Delete a user
   */
  export const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      // In a real application, we'd also delete the Firebase Auth account
      await deleteDoc(doc(db, USERS_COLLECTION, userId));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };