/**
 * Firebase-related TypeScript interfaces
 * Provides type safety for user management operations
 */

/**
 * User roles in the system
 * Defines the different permission levels in the admin panel
 */
export type UserRole = 'user' | 'moderator' | 'advisor' | 'admin' | 'super_admin';

/**
 * User details interface
 * Contains all user-related information stored in Firestore
 */
export interface UserDetails {
  id: string; // Document ID (from Firestore)
  uid: string; // Firebase Authentication UID
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  lastLogin?: Date;
}

/**
 * Auth state type
 * Used for managing authentication state in the application
 */
export interface AuthState {
  user: UserDetails | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: Error;
}
