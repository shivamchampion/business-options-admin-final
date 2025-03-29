import admin from '../firebase/admin.js';
import { UserStatus, UserRole } from '../constants/userTypes.js';

const db = admin.firestore();
const USERS_COLLECTION = 'users';

/**
 * Get admin panel users with pagination and filtering
 */
export const getAdminPanelUsers = async (
  pageSize = 10, 
  lastDoc = null,
  filters = {}
) => {
  try {
    // Start with a basic query
    let baseQuery = db.collection(USERS_COLLECTION);
    
    // Add role condition (baseline filter)
    let finalQuery = baseQuery.where('role', 'in', 
      [UserRole.ADMIN, UserRole.ADVISOR, UserRole.MODERATOR, UserRole.SUPER_ADMIN]);
    
    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      finalQuery = finalQuery.where('status', 'in', filters.status);
    }
    
    // Apply role filter (additional filter)
    if (filters.role && filters.role.length > 0) {
      finalQuery = finalQuery.where('role', 'in', filters.role);
    }
    
    // Apply email verification filter
    if (filters.isVerified !== undefined) {
      finalQuery = finalQuery.where('emailVerified', '==', filters.isVerified);
    }
    
    // Apply ordering
    finalQuery = finalQuery.orderBy('createdAt', 'desc');
    
    // Apply pagination
    if (lastDoc) {
      finalQuery = finalQuery.startAfter(lastDoc).limit(pageSize);
    } else {
      finalQuery = finalQuery.limit(pageSize);
    }
    
    // Execute the query
    const snapshot = await finalQuery.get();
    
    // Process the results
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate(),
        lastLogin: data.lastLogin?.toDate(),
        verificationCodeExpiry: data.verificationCodeExpiry?.toDate()
      };
    });
    
    // Handle search filter on server (since we can't use Firebase for this)
    let filteredUsers = users;
    if (filters.search) {
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
    throw new Error(`Failed to fetch admin users: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get website users with pagination and filtering
 */
export const getWebsiteUsers = async (
  pageSize = 10, 
  lastDoc = null,
  filters = {}
) => {
  try {
    let baseQuery = db.collection(USERS_COLLECTION).where('role', '==', UserRole.USER);
    
    // Apply filters
    if (filters.status && filters.status.length > 0) {
      baseQuery = baseQuery.where('status', 'in', filters.status);
    }
    
    if (filters.isVerified !== undefined) {
      baseQuery = baseQuery.where('emailVerified', '==', filters.isVerified);
    }
    
    // Apply ordering
    let finalQuery = baseQuery.orderBy('createdAt', 'desc');
    
    // Apply pagination
    if (lastDoc) {
      finalQuery = finalQuery.startAfter(lastDoc).limit(pageSize);
    } else {
      finalQuery = finalQuery.limit(pageSize);
    }
    
    const snapshot = await finalQuery.get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate(),
        lastLogin: data.lastLogin?.toDate()
      };
    });
    
    // Client-side filtering for search
    let filteredUsers = users;
    if (filters.search) {
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
    throw new Error(`Failed to fetch website users: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get a single user by ID
 */
export const getUserById = async (userId) => {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    return {
      ...userData,
      id: userSnap.id,
      createdAt: userData.createdAt?.toDate(),
      lastLogin: userData.lastLogin?.toDate(),
      verificationCodeExpiry: userData.verificationCodeExpiry?.toDate()
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw new Error(`Failed to fetch user: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Update a user's status
 */
export const updateUserStatus = async (userId, status) => {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    await userRef.update({ 
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() 
    });
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw new Error(`Failed to update user status: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Create a new user in Firestore
 */
export const createUserDocument = async (userId, uid, userData, profileImageUrl = null) => {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    await userRef.set({
      id: userId,
      uid: uid,
      name: userData.name,
      email: userData.email,
      loginEmail: userData.loginEmail,
      role: userData.role,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      isWebsiteUser: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      profileImageUrl
    });
    return true;
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new Error(`Failed to create user document: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Delete a user document
 */
export const deleteUserDocument = async (userId) => {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    await userRef.delete();
    return true;
  } catch (error) {
    console.error('Error deleting user document:', error);
    throw new Error(`Failed to delete user document: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Update a user's last login time
 */
export const updateUserLastLogin = async (userId) => {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    await userRef.update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating last login time:', error);
    return false; // Non-critical update, don't throw
  }
};

/**
 * Check if a user with the given email exists
 */
export const checkUserEmailExists = async (email) => {
  try {
    const snapshot = await db.collection(USERS_COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if email exists:', error);
    throw new Error(`Failed to check email: ${error.message || 'Unknown error'}`);
  }
};

export default {
  getAdminPanelUsers,
  getWebsiteUsers,
  getUserById,
  updateUserStatus,
  createUserDocument,
  deleteUserDocument,
  updateUserLastLogin,
  checkUserEmailExists
};