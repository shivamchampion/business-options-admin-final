/**
 * Firebase-related TypeScript interfaces
 * Provides type safety for user management operations
 */

/**
 * User roles in the system
 * Defines the different permission levels in the admin panel
 */
export enum UserRole {
  USER = 'user',
  ADVISOR = 'advisor',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

/**
 * User status in the system
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  VERIFICATION_PENDING = 'verification_pending'
}

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
  status: UserStatus;
  createdAt: Date;
  lastLogin?: Date;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
  emailVerified: boolean;
  profileImageUrl?: string;
  isWebsiteUser: boolean; // To differentiate between website and admin panel users
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

/**
 * User filter options
 */
export interface UserFilters {
  search?: string;
  status?: UserStatus[];
  role?: UserRole[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  isVerified?: boolean;
}