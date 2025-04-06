/**
 * Form Persistence Service
 * 
 * This service handles storing and retrieving form data in localStorage
 * with proper validation, serialization, and error handling.
 */

import { migrateListingData } from '@/schemas/listingSchema';
import { enhancedStorage } from '@/lib';

// Storage keys
export const STORAGE_KEYS = {
  FORM_DATA: 'listing_form_data',
  STEP: 'listing_form_step',
  IMAGES: 'listing_form_images',
  FEATURED_IMAGE: 'listing_form_featured_image',
  LAST_SAVE: 'listing_form_last_save',
  IMAGE_METADATA: 'listing_form_image_metadata',
  DOCUMENTS: 'listing_form_documents',
  DOCUMENT_METADATA: 'listing_documents',
};

// Check if storage is near capacity
function isStorageNearCapacity() {
  try {
    // Estimate current usage
    let currentUsage = 0;
    let totalAvailable = 5 * 1024 * 1024; // Approx 5MB localStorage limit in most browsers
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      currentUsage += (key.length + value.length) * 2; // Approx. UTF-16 encoding (2 bytes per char)
    }
    
    const usagePercent = (currentUsage / totalAvailable) * 100;
    console.log(`Storage usage: ${(currentUsage / 1024 / 1024).toFixed(2)}MB (${usagePercent.toFixed(2)}%)`);
    
    return usagePercent > 80; // 80% threshold
  } catch (e) {
    console.error('Error checking storage capacity:', e);
    return true; // Assume storage is near capacity if we can't check
  }
}

// Clean up storage by removing older items
function cleanupStorage() {
  try {
    // Use the enhancedStorage cleanup method
    if (enhancedStorage && typeof enhancedStorage.forceCleanAllOldData === 'function') {
      enhancedStorage.forceCleanAllOldData();
    } else {
      console.warn('enhancedStorage.forceCleanAllOldData not available, using direct cleanup');
      
      // Manually clean up storage if the method is not available
      const keys = Object.keys(localStorage);
      const listingKeys = keys.filter(key => 
        key.startsWith('listing_') || 
        key.includes('listing') || 
        key.includes('form') ||
        key.includes('images') ||
        key.includes('documents')
      );
      
      listingKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove key: ${key}`, e);
        }
      });
    }
    
    // Also try to clean up the problem keys directly
    localStorage.removeItem(STORAGE_KEYS.IMAGES);
    localStorage.removeItem(STORAGE_KEYS.IMAGE_METADATA);
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    
    return true;
  } catch (e) {
    console.error('Error cleaning up storage:', e);
    return false;
  }
}

/**
 * Safe local storage wrapper with error handling
 */
const safeStorage = {
  get: (key) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error getting data from localStorage for key ${key}:`, error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      // Check if storage is near capacity before saving
      if (isStorageNearCapacity()) {
        console.warn('Storage near capacity. Attempting cleanup before saving.');
        cleanupStorage();
      }
      
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting data to localStorage for key ${key}:`, error);
      
      // Try to clean up storage and retry
      if (error.name === 'QuotaExceededError') {
        console.log('Storage quota exceeded. Attempting cleanup and retry.');
        if (cleanupStorage()) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
          } catch (retryError) {
            console.error('Retry failed after cleanup:', retryError);
          }
        }
      }
      
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing data from localStorage for key ${key}:`, error);
      return false;
    }
  }
};

/**
 * Validates loaded form data to ensure it has expected structure
 * and fixes common issues to prevent errors during form initialization
 */
const validateLoadedData = (data) => {
  console.log('Validating loaded form data');
  
  // Check if data is null or not an object
  if (!data || typeof data !== 'object') {
    console.warn('Loaded form data is not valid. Using default values.');
    return null;
  }
  
  // Make a deep copy to avoid mutating the original
  const validatedData = { ...data };
  
  // Make sure classifications is an array with at least one item
  if (!Array.isArray(validatedData.classifications) || validatedData.classifications.length === 0) {
    console.log('Fixing missing or empty classifications array');
    validatedData.classifications = [{
      industry: '',
      industryName: '',
      category: '',
      categoryName: '',
      subCategories: [],
      subCategoryNames: []
    }];
  } else {
    // Ensure each classification has the correct structure
    validatedData.classifications = validatedData.classifications.map(c => ({
      industry: c?.industry || '',
      industryName: c?.industryName || '',
      category: c?.category || '',
      categoryName: c?.categoryName || '',
      subCategories: Array.isArray(c?.subCategories) ? c.subCategories : [],
      subCategoryNames: Array.isArray(c?.subCategoryNames) ? c.subCategoryNames : []
    }));
  }
  
  // Ensure location object exists with correct structure
  if (!validatedData.location || typeof validatedData.location !== 'object') {
    console.log('Fixing missing or invalid location object');
    validatedData.location = {
      country: 'IN',
      countryName: 'India',
      state: '',
      city: '',
    };
  }
  
  // Ensure contact info exists with correct structure
  if (!validatedData.contactInfo || typeof validatedData.contactInfo !== 'object') {
    console.log('Fixing missing or invalid contactInfo object');
    validatedData.contactInfo = {
      email: '',
      phone: '',
    };
  }

  // Check if numeric fields have correct types
  // This helps fix issues when string numbers are saved in localStorage but schema expects numbers
  const convertNumericFields = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return obj;
    
    Object.keys(obj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      
      // Check if this value is a numeric string (like "5" or "10.5")
      if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
        // Is this a decimal or integer?
        if (value.includes('.')) {
          obj[key] = parseFloat(value);
        } else {
          obj[key] = parseInt(value, 10);
        }
        console.log(`Converted string to number at ${currentPath}: ${value} → ${obj[key]}`);
      }
      
      // Recursively process nested objects and arrays
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          // Handle arrays
          obj[key] = value.map((item, index) => {
            if (item && typeof item === 'object') {
              return convertNumericFields(item, `${currentPath}[${index}]`);
            }
            return item;
          });
        } else {
          // Handle objects
          obj[key] = convertNumericFields(value, currentPath);
        }
      }
    });
    
    return obj;
  };
  
  // Convert numeric fields recursively
  convertNumericFields(validatedData);
  
  // Apply any data migrations
  return migrateListingData(validatedData);
};

/**
 * Helper to normalize data before loading into the form
 * Handles nullable values and ensures consistent data types
 */
const normalizeData = (data) => {
  if (!data) return {};
  
  // Handle null values in nested objects
  if (data.location === null) data.location = {};
  if (data.contactInfo === null) data.contactInfo = {};
  if (data.businessDetails === null) data.businessDetails = {};
  if (data.franchiseDetails === null) data.franchiseDetails = {};
  if (data.startupDetails === null) data.startupDetails = {};
  if (data.investorDetails === null) data.investorDetails = {};
  if (data.digitalAssetDetails === null) data.digitalAssetDetails = {};
  
  // Fix any arrays that are null instead of empty arrays
  if (data.classifications === null) data.classifications = [];
  
  // Fix essential arrays that might be missing or null in various details sections
  const fixArrays = (obj, paths) => {
    if (!obj) return;
    
    paths.forEach(path => {
      const parts = path.split('.');
      let current = obj;
      
      // Navigate to the parent object
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) return; // Path doesn't exist
        current = current[parts[i]];
      }
      
      // Fix the array if needed
      const lastPart = parts[parts.length - 1];
      if (current[lastPart] === null || current[lastPart] === undefined) {
        current[lastPart] = [];
      }
    });
  };
  
  // Fix arrays in various sections
  fixArrays(data, [
    'classifications',
    'subCategories',
    'subCategoryNames',
    'businessDetails.operations.employees.partTime',
    'franchiseDetails.availableTerritories',
    'startupDetails.team.founders',
    'startupDetails.team.intellectualProperty',
    'investorDetails.investment.preferredRounds',
    'investorDetails.focus.primaryIndustries',
    'investorDetails.focus.secondaryIndustries',
    'investorDetails.focus.businessStagePreference',
    'investorDetails.focus.geographicFocus',
    'digitalAssetDetails.traffic.trafficSources'
  ]);
  
  return data;
};

/**
 * Form Persistence Service for saving and loading form data
 */
export const formPersistenceService = {
  /**
   * Save form data to localStorage with timestamp
   */
  saveFormData: (formId, data) => {
    const formIdKey = formId ? `${STORAGE_KEYS.FORM_DATA}_${formId}` : STORAGE_KEYS.FORM_DATA;
    
    try {
      // Create a copy of the data
      const dataToSave = { ...data };
      
      // Remove fields that can't be serialized
      delete dataToSave.file;
      delete dataToSave.mediaUploads;
      
      // Save to localStorage
      const saved = safeStorage.set(formIdKey, dataToSave);
      
      // Save timestamp
      if (saved) {
        const timestamp = new Date().toISOString();
        safeStorage.set(
          formId ? `${STORAGE_KEYS.LAST_SAVE}_${formId}` : STORAGE_KEYS.LAST_SAVE, 
          timestamp
        );
      }
      
      return saved;
    } catch (error) {
      console.error('Error saving form data:', error);
      return false;
    }
  },
  
  /**
   * Load form data from localStorage with validation
   */
  loadFormData: (formId) => {
    const formIdKey = formId ? `${STORAGE_KEYS.FORM_DATA}_${formId}` : STORAGE_KEYS.FORM_DATA;
    
    try {
      // Get data from localStorage
      const savedData = safeStorage.get(formIdKey);
      
      // Validate the data structure
      const validatedData = validateLoadedData(savedData);
      
      // Normalize data before returning
      return normalizeData(validatedData);
    } catch (error) {
      console.error('Error loading form data:', error);
      return null;
    }
  },
  
  /**
   * Clear form data from localStorage
   */
  clearFormData: (formId) => {
    const keysToRemove = Object.values(STORAGE_KEYS).map(key => 
      formId ? `${key}_${formId}` : key
    );
    
    try {
      keysToRemove.forEach(key => safeStorage.remove(key));
      return true;
    } catch (error) {
      console.error('Error clearing form data:', error);
      return false;
    }
  },
  
  /**
   * Get the last save timestamp
   */
  getLastSaveTimestamp: (formId) => {
    try {
      // Try sessionStorage first (more recent)
      let timestamp = sessionStorage.getItem(
        formId ? `${STORAGE_KEYS.LAST_SAVE}_${formId}` : STORAGE_KEYS.LAST_SAVE
      );
      
      // Fall back to localStorage if not found in sessionStorage
      if (!timestamp) {
        timestamp = localStorage.getItem(
          formId ? `${STORAGE_KEYS.LAST_SAVE}_${formId}` : STORAGE_KEYS.LAST_SAVE
        );
      }
      
      return timestamp;
    } catch (error) {
      console.error('Error getting last save timestamp:', error);
      return null;
    }
  },
  
  /**
   * Save current step
   */
  saveStep: (formId, step) => {
    const stepKey = formId ? `${STORAGE_KEYS.STEP}_${formId}` : STORAGE_KEYS.STEP;
    
    try {
      localStorage.setItem(stepKey, step);
      return true;
    } catch (error) {
      console.error('Error saving step:', error);
      return false;
    }
  },
  
  /**
   * Load current step
   */
  loadStep: (formId) => {
    const stepKey = formId ? `${STORAGE_KEYS.STEP}_${formId}` : STORAGE_KEYS.STEP;
    
    try {
      const step = localStorage.getItem(stepKey);
      return step !== null ? parseInt(step, 10) : 0;
    } catch (error) {
      console.error('Error loading step:', error);
      return 0;
    }
  },
  
  /**
   * Save image metadata
   */
  saveImageMetadata: async (formId, images) => {
    const imageKey = formId ? `${STORAGE_KEYS.IMAGE_METADATA}_${formId}` : STORAGE_KEYS.IMAGE_METADATA;
    
    try {
      // Sanitize images before saving
      const sanitizedImages = images.map(img => {
        const sanitized = { 
          id: img.id,
          name: img.name,
          type: img.type,
          size: img.size,
          path: img.path,
          url: img.url,
          // Don't include preview data to save space
          preview: img.preview && !img.preview.startsWith('data:') ? img.preview : null
        };
        
        // Add any base64 data if it exists (but normally shouldn't for memory reasons)
        if (img.base64 && img.base64.length < 1000) sanitized.base64 = img.base64;
        
        return sanitized;
      });
      
      // First try using the enhanced enhancedStorage for 'listing_form_images'
      if (imageKey === STORAGE_KEYS.IMAGES || imageKey === STORAGE_KEYS.IMAGE_METADATA) {
        try {
          if (typeof enhancedStorage.saveImageMetadata === 'function') {
            await enhancedStorage.saveImageMetadata(sanitizedImages, formId || 'default');
          } else {
            throw new Error('No suitable image storage method available');
          }
          console.log('Successfully saved images using enhancedStorage');
          return true;
        } catch (storageError) {
          console.warn('Error using enhancedStorage, falling back to traditional method:', storageError);
        }
      }
      
      // If not using the enhanced service, or it failed, try the traditional method
      if (isStorageNearCapacity()) {
        console.warn('Storage near capacity before saving images. Cleaning up...');
        cleanupStorage();
      }
      
      // Try to save with traditional method
      try {
        safeStorage.set(imageKey, sanitizedImages);
        return true;
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          console.error('Storage quota exceeded while saving images. Emergency cleanup needed.');
          
          // Emergency cleanup - remove all but the essential
          localStorage.removeItem(STORAGE_KEYS.IMAGES);
          localStorage.removeItem(STORAGE_KEYS.IMAGE_METADATA);
          
          // Try one more time with minimal data (just id, url and path)
          const minimalImages = sanitizedImages.map(img => ({
            id: img.id,
            url: img.url,
            path: img.path,
            name: img.name
          }));
          
          try {
            safeStorage.set(imageKey, minimalImages);
            console.log('Saved minimal image data after quota error');
            return true;
          } catch (finalError) {
            console.error('Failed to save even minimal image data:', finalError);
            return false;
          }
        }
        
        console.error('Error saving image metadata:', error);
        return false;
      }
    } catch (error) {
      console.error('Error in saveImageMetadata:', error);
      return false;
    }
  },
  
  /**
   * Load image metadata
   */
  loadImageMetadata: (formId) => {
    const imageKey = formId ? `${STORAGE_KEYS.IMAGE_METADATA}_${formId}` : STORAGE_KEYS.IMAGE_METADATA;
    
    try {
      const images = safeStorage.get(imageKey);
      return Array.isArray(images) ? images : [];
    } catch (error) {
      console.error('Error loading image metadata:', error);
      return [];
    }
  },
  
  /**
   * Save featured image index
   */
  saveFeaturedImageIndex: (formId, index) => {
    const featuredKey = formId ? `${STORAGE_KEYS.FEATURED_IMAGE}_${formId}` : STORAGE_KEYS.FEATURED_IMAGE;
    
    try {
      localStorage.setItem(featuredKey, index);
      return true;
    } catch (error) {
      console.error('Error saving featured image index:', error);
      return false;
    }
  },
  
  /**
   * Load featured image index
   */
  loadFeaturedImageIndex: (formId) => {
    const featuredKey = formId ? `${STORAGE_KEYS.FEATURED_IMAGE}_${formId}` : STORAGE_KEYS.FEATURED_IMAGE;
    
    try {
      const index = localStorage.getItem(featuredKey);
      return index !== null ? parseInt(index, 10) : 0;
    } catch (error) {
      console.error('Error loading featured image index:', error);
      return 0;
    }
  },
  
  /**
   * Save document metadata
   */
  saveDocumentMetadata: (formId, documents) => {
    const documentKey = formId ? `${STORAGE_KEYS.DOCUMENT_METADATA}_${formId}` : STORAGE_KEYS.DOCUMENT_METADATA;
    
    try {
      // Sanitize documents before saving
      const sanitizedDocuments = documents.map(doc => {
        const sanitized = { 
          id: doc.id,
          name: doc.name,
          description: doc.description || '',
          type: doc.type,
          category: doc.category || 'other',
          size: doc.size || 0,
          format: doc.format,
          isPublic: !!doc.isPublic,
          verificationStatus: doc.verificationStatus || 'pending',
          uploadedAt: doc.uploadedAt ? 
            (typeof doc.uploadedAt === 'string' ? doc.uploadedAt : doc.uploadedAt.toISOString()) 
            : new Date().toISOString(),
          isPlaceholder: !!doc.isPlaceholder,
          path: doc.path || null,
          url: doc.url && !doc.url.startsWith('blob:') ? doc.url : null
        };
        
        return sanitized;
      });
      
      safeStorage.set(documentKey, sanitizedDocuments);
      console.log(`Saved ${sanitizedDocuments.length} documents to ${documentKey}`);
      return true;
    } catch (error) {
      console.error('Error saving document metadata:', error);
      return false;
    }
  },
  
  /**
   * Load document metadata
   */
  loadDocumentMetadata: (formId) => {
    const documentKey = formId ? `${STORAGE_KEYS.DOCUMENT_METADATA}_${formId}` : STORAGE_KEYS.DOCUMENT_METADATA;
    
    try {
      const documents = safeStorage.get(documentKey);
      console.log(`Loaded ${Array.isArray(documents) ? documents.length : 0} documents from ${documentKey}`);
      return Array.isArray(documents) ? documents : [];
    } catch (error) {
      console.error('Error loading document metadata:', error);
      return [];
    }
  },
  
  /**
   * Clear image metadata
   */
  clearImageMetadata: (formId) => {
    try {
      const imageKey = formId ? `${STORAGE_KEYS.IMAGE_METADATA}_${formId}` : STORAGE_KEYS.IMAGE_METADATA;
      localStorage.removeItem(imageKey);
      
      // Also clear from enhanced storage if available
      if (typeof enhancedStorage.clearImageMetadata === 'function') {
        enhancedStorage.clearImageMetadata(formId || 'default');
      }
      
      console.log(`Cleared image metadata for ${formId || 'default'}`);
      return true;
    } catch (error) {
      console.error('Error clearing image metadata:', error);
      return false;
    }
  },
  
  /**
   * Clear document metadata
   */
  clearDocumentMetadata: (formId) => {
    try {
      const documentKey = formId ? `${STORAGE_KEYS.DOCUMENT_METADATA}_${formId}` : STORAGE_KEYS.DOCUMENT_METADATA;
      localStorage.removeItem(documentKey);
      
      // Also clear from enhanced storage if available
      if (typeof enhancedStorage.clearDocumentMetadata === 'function') {
        enhancedStorage.clearDocumentMetadata(formId || 'default');
      }
      
      console.log(`Cleared document metadata for ${formId || 'default'}`);
      return true;
    } catch (error) {
      console.error('Error clearing document metadata:', error);
      return false;
    }
  },
  
  /**
   * Clear featured image index
   */
  clearFeaturedImageIndex: (formId) => {
    try {
      const featuredKey = formId ? `${STORAGE_KEYS.FEATURED_IMAGE}_${formId}` : STORAGE_KEYS.FEATURED_IMAGE;
      localStorage.removeItem(featuredKey);
      console.log(`Cleared featured image index for ${formId || 'default'}`);
      return true;
    } catch (error) {
      console.error('Error clearing featured image index:', error);
      return false;
    }
  },
  
  /**
   * Clear step
   */
  clearStep: (formId) => {
    try {
      const stepKey = formId ? `${STORAGE_KEYS.STEP}_${formId}` : STORAGE_KEYS.STEP;
      localStorage.removeItem(stepKey);
      console.log(`Cleared step for ${formId || 'default'}`);
      return true;
    } catch (error) {
      console.error('Error clearing step:', error);
      return false;
    }
  },
  
  /**
   * Save visited steps array
   */
  saveVisitedSteps: (steps, formId) => {
    try {
      const visitedStepsKey = `listing_form_visited_steps${formId ? `_${formId}` : ''}`;
      localStorage.setItem(visitedStepsKey, JSON.stringify(steps));
      console.log(`Saved ${steps.length} visited steps for ${formId || 'default'}`);
      return true;
    } catch (error) {
      console.error('Error saving visited steps:', error);
      return false;
    }
  },
  
  /**
  uploadFile: async (file, progressCallback) => {
    // Mock implementation - in a real app, this would call an API
    return new Promise((resolve, reject) => {
      try {
        // Simulate network request
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          if (progressCallback) progressCallback(progress);
          
          if (progress >= 100) {
            clearInterval(interval);
            
            // Create a file URL
            const fileData = {
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              name: file.name,
              size: file.size,
              type: file.type,
              path: `/uploads/${file.name}`,
              url: URL.createObjectURL(file)
            };
            
            // For images, create a preview
            if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = () => {
                fileData.preview = reader.result;
                resolve(fileData);
              };
              reader.onerror = () => {
                reject(new Error('Failed to read file'));
              };
              reader.readAsDataURL(file);
            } else {
              resolve(fileData);
            }
          }
        }, 100);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  /**
   * Delete a file
   */
  deleteFile: async (path) => {
    // Mock implementation - in a real app, this would call an API
    return new Promise((resolve) => {
      // Simulate network request
      setTimeout(() => {
        console.log(`File deleted: ${path}`);
        resolve(true);
      }, 500);
    });
  }
};

export default formPersistenceService; 