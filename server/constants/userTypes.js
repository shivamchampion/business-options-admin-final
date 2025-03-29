// server/constants/userTypes.js

/**
 * User roles in the system
 * Defines the different permission levels in the admin panel
 */
export const UserRole = {
    USER: 'user',
    ADVISOR: 'advisor',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
  };
  
  /**
   * User status in the system
   */
  export const UserStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
    VERIFICATION_PENDING: 'verification_pending'
  };