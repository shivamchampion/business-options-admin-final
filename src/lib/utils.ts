import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserDetails } from '@/types/firebase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a random numeric code of specified length
 */
export function generateRandomCode(length: number): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * Format date to a readable string
 */
export function formatDate(date: Date | undefined | null): string {
  if (!date) return 'N/A';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | undefined | null): string {
  if (!date) return 'N/A';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
}

/**
 * Format currency value
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'INR', 
  locale: string = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  fractionDigits: number = 1
): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
    .trim() // Remove whitespace from both ends
    .substring(0, 100); // Limit length
}

/**
 * Get the currently logged in user's details from Firestore
 */
export async function getCurrentUser(): Promise<UserDetails | null> {
  try {
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      return null;
    }
    
    // Query for the user with matching Firebase UID
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', currentAuthUser.uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('User document not found for UID:', currentAuthUser.uid);
      return null;
    }
    
    // Get the first matching document
    const userDoc = querySnapshot.docs[0];
    
    return {
      ...userDoc.data(),
      id: userDoc.id
    } as UserDetails;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Calculate time remaining until a specific date
 */
export function getTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} left`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} left`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} left`;
  return `${diffSec} second${diffSec > 1 ? 's' : ''} left`;
}

/**
 * Generate a readable ID from a listing ID
 * e.g. "BIZ-12345" for a business listing
 */
export function formatListingId(type: string, id: string): string {
  const shortId = id.slice(-5).toUpperCase();
  
  switch(type) {
    case 'business':
      return `BIZ-${shortId}`;
    case 'franchise':
      return `FRN-${shortId}`;
    case 'startup':
      return `STR-${shortId}`;
    case 'investor':
      return `INV-${shortId}`;
    case 'digital_asset':
      return `DIG-${shortId}`;
    default:
      return `LST-${shortId}`;
  }
}