// src/types/firebase.ts - Extended with advisor-specific types

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
 * Commission tiers for advisors
 */
export enum CommissionTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

/**
 * Lead status enum
 */
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost'
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * User details interface
 * Contains all user-related information stored in Firestore
 */
export interface UserDetails {
  id: string;
  uid: string;
  email: string; // Regular email address
  loginEmail: string; // Admin panel login email (for admin roles)
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  lastLogin?: Date;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
  emailVerified: boolean;
  profileImageUrl?: string;
  isWebsiteUser: boolean;
  // Advisor specific fields
  phone: string; // Changed to required
  commissionTier?: CommissionTier;
  commissionRate?: number;
  currency?: string; // Added currency field (USD/INR)
  totalCommissionEarned?: number;
  assignedLeads?: number;
  activeLeads?: number;
  successRate?: number;
  country: string; // Changed to required
  state: string; // Changed to required
  city: string; // Changed to required
  bio?: string;
}

/**
 * Commission structure interface
 */
export interface CommissionStructure {
  id: string;
  tier: CommissionTier;
  name: string;
  baseRate: number;
  thresholds: CommissionThreshold[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  description: string;
}

/**
 * Commission threshold interface
 * Defines the commission rate based on deal value thresholds
 */
export interface CommissionThreshold {
  minAmount: number;
  maxAmount: number | null;
  rate: number;
  description: string;
}

/**
 * Lead interface
 */
export interface Lead {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  type: string;
  value: number;
  status: LeadStatus;
  advisorId: string | null;
  assignedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  notes: string;
  lastContactDate: Date | null;
  businessDetails: {
    name: string;
    industry: string;
    description: string;
    location: string;
    revenue?: number;
    employees?: number;
  };
}

/**
 * Payment interface
 */
export interface Payment {
  id: string;
  advisorId: string;
  amount: number;
  status: PaymentStatus;
  date: Date;
  dueDate: Date;
  paymentMethod?: string;
  referenceNumber?: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  relatedLeads: string[]; // Array of lead IDs this payment is for
  commissionDetails: {
    baseAmount: number;
    commissionRate: number;
    bonusAmount?: number;
  };
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

/**
 * Advisor filter options
 */
export interface AdvisorFilters extends UserFilters {
  commissionTier?: CommissionTier[];
  country?: string[];
  state?: string[];
  city?: string[];
  minCommissionRate?: number;
  maxCommissionRate?: number;
  currency?: string;
}

/**
 * Lead filter options
 */
export interface LeadFilters {
  search?: string;
  status?: LeadStatus[];
  advisorId?: string;
  type?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  minValue?: number;
  maxValue?: number;
}

/**
 * Payment filter options
 */
export interface PaymentFilters {
  search?: string;
  status?: PaymentStatus[];
  advisorId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string[];
}