/**
 * DocumentCategoryMapper - Standardizes document categories across the application
 * This utility ensures that document categories are consistently named and displayed.
 */

// Canonical category identifiers for internal use
export const DOCUMENT_CATEGORIES = {
  ESSENTIAL: 'essential',
  FINANCIAL: 'financial',
  OPERATIONAL: 'operational',
  LEGAL: 'legal',
  IDENTITY: 'identity',
  SALE: 'sale',
  FRANCHISE: 'franchise',
  TRAINING: 'training',
  PITCH: 'pitch',
  PRODUCT: 'product',
  MARKET: 'market',
  INVESTMENT: 'investment',
  PORTFOLIO: 'portfolio',
  PROCESS: 'process',
  TECHNICAL: 'technical',
  VERIFICATION: 'verification',
  OTHER: 'other'
};

// Map for display names used in UI
export const CATEGORY_DISPLAY_NAMES = {
  [DOCUMENT_CATEGORIES.ESSENTIAL]: 'Essential Documents',
  [DOCUMENT_CATEGORIES.FINANCIAL]: 'Financial Documents',
  [DOCUMENT_CATEGORIES.OPERATIONAL]: 'Operational Documents',
  [DOCUMENT_CATEGORIES.LEGAL]: 'Legal Documents',
  [DOCUMENT_CATEGORIES.IDENTITY]: 'Identity Documents',
  [DOCUMENT_CATEGORIES.SALE]: 'Sale Documents',
  [DOCUMENT_CATEGORIES.FRANCHISE]: 'Franchise Documents',
  [DOCUMENT_CATEGORIES.TRAINING]: 'Training & Support Documents',
  [DOCUMENT_CATEGORIES.PITCH]: 'Pitch Documents',
  [DOCUMENT_CATEGORIES.PRODUCT]: 'Product Documents',
  [DOCUMENT_CATEGORIES.MARKET]: 'Market Research Documents',
  [DOCUMENT_CATEGORIES.INVESTMENT]: 'Investment Documents',
  [DOCUMENT_CATEGORIES.PORTFOLIO]: 'Portfolio Documents',
  [DOCUMENT_CATEGORIES.PROCESS]: 'Process Documents',
  [DOCUMENT_CATEGORIES.TECHNICAL]: 'Technical Documents',
  [DOCUMENT_CATEGORIES.VERIFICATION]: 'Verification Documents',
  [DOCUMENT_CATEGORIES.OTHER]: 'Other Documents',
};

// Alternative strings that might be used to refer to each category
export const CATEGORY_ALTERNATIVES = {
  // Essential
  'essential': DOCUMENT_CATEGORIES.ESSENTIAL,
  'essential documents': DOCUMENT_CATEGORIES.ESSENTIAL,
  'required': DOCUMENT_CATEGORIES.ESSENTIAL,
  'required documents': DOCUMENT_CATEGORIES.ESSENTIAL,
  
  // Financial
  'financial': DOCUMENT_CATEGORIES.FINANCIAL,
  'financial documents': DOCUMENT_CATEGORIES.FINANCIAL,
  'finance': DOCUMENT_CATEGORIES.FINANCIAL,
  'finances': DOCUMENT_CATEGORIES.FINANCIAL,
  'financial statement': DOCUMENT_CATEGORIES.FINANCIAL,
  'financial statements': DOCUMENT_CATEGORIES.FINANCIAL,
  'finance documents': DOCUMENT_CATEGORIES.FINANCIAL,
  'financial report': DOCUMENT_CATEGORIES.FINANCIAL,
  'financial reports': DOCUMENT_CATEGORIES.FINANCIAL,
  'profit and loss': DOCUMENT_CATEGORIES.FINANCIAL,
  'income statement': DOCUMENT_CATEGORIES.FINANCIAL,
  'balance sheet': DOCUMENT_CATEGORIES.FINANCIAL,
  'cash flow': DOCUMENT_CATEGORIES.FINANCIAL,
  'revenue': DOCUMENT_CATEGORIES.FINANCIAL,
  'tax returns': DOCUMENT_CATEGORIES.FINANCIAL,
  'tax documents': DOCUMENT_CATEGORIES.FINANCIAL,
  'accounting': DOCUMENT_CATEGORIES.FINANCIAL,
  
  // Operational
  'operational': DOCUMENT_CATEGORIES.OPERATIONAL,
  'operational documents': DOCUMENT_CATEGORIES.OPERATIONAL,
  'operations': DOCUMENT_CATEGORIES.OPERATIONAL,
  'business operations': DOCUMENT_CATEGORIES.OPERATIONAL,
  
  // Legal
  'legal': DOCUMENT_CATEGORIES.LEGAL,
  'legal documents': DOCUMENT_CATEGORIES.LEGAL,
  'law': DOCUMENT_CATEGORIES.LEGAL,
  'agreements': DOCUMENT_CATEGORIES.LEGAL,
  
  // Identity
  'identity': DOCUMENT_CATEGORIES.IDENTITY,
  'identity documents': DOCUMENT_CATEGORIES.IDENTITY,
  'identification': DOCUMENT_CATEGORIES.IDENTITY,
  'id': DOCUMENT_CATEGORIES.IDENTITY,
  
  // Sale
  'sale': DOCUMENT_CATEGORIES.SALE,
  'sale documents': DOCUMENT_CATEGORIES.SALE,
  'selling': DOCUMENT_CATEGORIES.SALE,
  'sell': DOCUMENT_CATEGORIES.SALE,
  
  // Others follow similar pattern...
  'franchise': DOCUMENT_CATEGORIES.FRANCHISE,
  'training': DOCUMENT_CATEGORIES.TRAINING,
  'pitch': DOCUMENT_CATEGORIES.PITCH,
  'product': DOCUMENT_CATEGORIES.PRODUCT,
  'market': DOCUMENT_CATEGORIES.MARKET,
  'investment': DOCUMENT_CATEGORIES.INVESTMENT,
  'portfolio': DOCUMENT_CATEGORIES.PORTFOLIO,
  'process': DOCUMENT_CATEGORIES.PROCESS,
  'technical': DOCUMENT_CATEGORIES.TECHNICAL,
  'verification': DOCUMENT_CATEGORIES.VERIFICATION,
  'other': DOCUMENT_CATEGORIES.OTHER,
};

/**
 * Normalizes a category string to a canonical category ID
 * 
 * @param {string} category - The category string to normalize
 * @returns {string} A canonical category ID from DOCUMENT_CATEGORIES
 */
export const normalizeCategory = (category) => {
  if (!category) return DOCUMENT_CATEGORIES.OTHER;
  
  // Log the original category for debugging
  console.log('[DEBUG] DocumentCategoryMapper: Normalizing category:', category);
  
  // Convert to lowercase for case-insensitive comparison
  const lowercaseCategory = category.toLowerCase();
  
  // Check if it's a direct match for a canonical category
  if (Object.values(DOCUMENT_CATEGORIES).includes(lowercaseCategory)) {
    console.log('[DEBUG] DocumentCategoryMapper: Direct match found');
    return lowercaseCategory;
  }
  
  // Check if it matches an alternative
  if (CATEGORY_ALTERNATIVES[lowercaseCategory]) {
    console.log('[DEBUG] DocumentCategoryMapper: Alternative match found:', CATEGORY_ALTERNATIVES[lowercaseCategory]);
    return CATEGORY_ALTERNATIVES[lowercaseCategory];
  }
  
  // Check if the category contains any of our known keywords
  for (const [key, value] of Object.entries(CATEGORY_ALTERNATIVES)) {
    if (lowercaseCategory.includes(key)) {
      console.log('[DEBUG] DocumentCategoryMapper: Partial match found:', value);
      return value;
    }
  }
  
  // Default to other if no match
  console.log('[DEBUG] DocumentCategoryMapper: No match found, using OTHER');
  return DOCUMENT_CATEGORIES.OTHER;
};

/**
 * Gets the display name for a category
 * 
 * @param {string} category - The category ID or string
 * @returns {string} The user-friendly display name
 */
export const getCategoryDisplayName = (category) => {
  const normalizedCategory = normalizeCategory(category);
  return CATEGORY_DISPLAY_NAMES[normalizedCategory] || 'Other Documents';
};

export default {
  DOCUMENT_CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
  normalizeCategory,
  getCategoryDisplayName
}; 