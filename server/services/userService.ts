import { UserDetails, UserRole, UserStatus, UserFilters } from '@/types/firebase';
import api from './api';

/**
 * Get admin panel users with pagination and filtering
 */
export const getAdminPanelUsers = async (
  pageSize: number = 10, 
  lastDoc: any = null,
  filters?: UserFilters
): Promise<{users: UserDetails[], lastDoc: any}> => {
  try {
    return await api.getAdminPanelUsers(pageSize, lastDoc, filters);
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
    return await api.getWebsiteUsers(pageSize, lastDoc, filters);
  } catch (error) {
    console.error('Error getting website users:', error);
    throw new Error(`Failed to fetch website users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Create a new admin panel user
 */
export const createAdminPanelUser = async (
  userData: Partial<UserDetails>,
  profileImage?: File
): Promise<{userId: string, loginEmail: string, password: string}> => {
  try {
    return await api.createAdminPanelUser(userData, profileImage);
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
    return await api.resetUserPassword(loginEmail);
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
    return await api.updateUserStatus(userId, status);
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
    return await api.bulkUpdateUserStatus(userIds, status);
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
    return await api.deleteUser(userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};