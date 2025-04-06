import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, collection, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import ToastManager, { TOAST_IDS } from "@/utils/ToastManager";

/**
 * ListingStorageService
 * 
 * A professional service for handling image and document uploads, metadata storage,
 * and persistence for listing data in both Firestore and local storage.
 */
class ListingStorageService {
  constructor() {
    this.storage = getStorage();
    this.tempUrls = new Map();
    this.pendingUploads = new Map();
  }

  /**
   * Upload a file to Firebase Storage
   * 
   * @param {File} file - The file to upload
   * @param {string} path - The storage path for the file
   * @param {object} options - Additional metadata options
   * @returns {Promise<{path: string, url: string}>} - Path and URL for the uploaded file
   */
  async uploadFile(file, path, options = {}) {
    try {
      if (!file || !path) {
        throw new Error('File and path are required for upload');
      }

      // Create storage reference
      const storageRef = ref(this.storage, path);
      
      // Set upload operation ID for tracking
      const uploadId = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      this.pendingUploads.set(uploadId, { file, path, status: 'pending' });
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file, options);
      
      // Get download URL
      const url = await getDownloadURL(snapshot.ref);
      
      // Update pending upload status
      this.pendingUploads.set(uploadId, { file, path, status: 'completed', url });
      
      return {
        path,
        url,
        id: uploadId,
        size: file.size,
        type: file.type,
        name: file.name
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from Firebase Storage
   * 
   * @param {string} path - The storage path for the file to delete
   * @returns {Promise<void>}
   */
  async deleteFile(path) {
    try {
      if (!path) {
        throw new Error('File path is required for deletion');
      }
      
      const fileRef = ref(this.storage, path);
      await deleteObject(fileRef);
      
      return { success: true };
    } catch (error) {
      console.error('Delete failed:', error);
      throw new Error(`Delete failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Save image metadata to Firestore and local storage
   * 
   * @param {Array} images - Array of image objects
   * @param {string} formId - The form/listing ID
   * @returns {Promise<boolean>} - Success status
   */
  async saveImageMetadata(images, formId) {
    if (!formId) return false;
    
    try {
      // Before saving, check if localStorage is near full
      if (this.isStorageNearFull()) {
        console.warn('LocalStorage nearly full, cleaning old data before saving images');
        this.forceCleanAllOldData();
      }
      
      // Try chunking approach for large datasets
      if (images && images.length > 5) {
        console.log(`Large image set detected (${images.length} images), using chunked storage`);
        
        // Store basic metadata separately from full image data
        const basicMeta = images.map(img => ({
          id: img.id,
          name: img.name,
          path: img.path,
          url: img.url,
          size: img.size,
          type: img.type
        }));
        
        // Save basic metadata (essential info)
        localStorage.setItem(`listing_images_${formId}`, JSON.stringify(basicMeta));
        
        // For large sets, split the full data into chunks
        const CHUNK_SIZE = 3; // Store 3 images per chunk
        const chunks = Math.ceil(images.length / CHUNK_SIZE);
        
        // Clear any existing chunks
        for (let i = 0; i < 10; i++) { // Assume max 10 chunks
          localStorage.removeItem(`listing_images_${formId}_chunk_${i}`);
        }
        
        // Store each chunk
        for (let i = 0; i < chunks; i++) {
          const chunkStart = i * CHUNK_SIZE;
          const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, images.length);
          const chunk = images.slice(chunkStart, chunkEnd);
          
          // Attempt to save chunk
          try {
            localStorage.setItem(`listing_images_${formId}_chunk_${i}`, JSON.stringify(chunk));
            console.log(`Saved image chunk ${i+1}/${chunks}`);
          } catch (chunkError) {
            console.error(`Failed to save image chunk ${i+1}/${chunks}:`, chunkError);
            // Continue saving other chunks even if one fails
          }
        }
      } else {
        // For smaller sets, save directly
        localStorage.setItem(`listing_images_${formId}`, JSON.stringify(images));
      }
      
      // Save to Firestore for persistence
      try {
        const docRef = doc(db, 'listings', formId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          await updateDoc(docRef, { images });
        } else {
          await setDoc(docRef, { images, updatedAt: new Date().toISOString() });
        }
        console.log(`Successfully saved ${images.length} images to Firestore`);
      } catch (firestoreError) {
        console.error('Firestore save failed, but localStorage succeeded:', firestoreError);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving image metadata:', error);
      
      // Try alternative storage if localStorage fails (quota exceeded)
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, attempting to save minimal metadata');
        
        try {
          // Clear old data first
          this.forceCleanAllOldData();
          
          // Save only essential metadata
          const minimalMeta = images.map(img => ({
            id: img.id,
            path: img.path,
            url: img.url
          }));
          
          localStorage.setItem(`listing_images_${formId}_minimal`, JSON.stringify(minimalMeta));
          console.log('Saved minimal image metadata as fallback');
          return true;
        } catch (fallbackError) {
          console.error('Fallback storage also failed:', fallbackError);
        }
      }
      
      return false;
    }
  }

  /**
   * Get image metadata from storage
   * 
   * @param {string} formId - The form/listing ID
   * @returns {Array} - Array of image objects
   */
  getImageMetadata(formId) {
    if (!formId) return [];
    
    try {
      const storedData = localStorage.getItem(`listing_images_${formId}`);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Error retrieving image metadata:', error);
      return [];
    }
  }

  /**
   * Save featured image index
   * 
   * @param {number} index - The index of the featured image
   * @param {string} formId - The form/listing ID
   * @returns {boolean} - Success status
   */
  saveFeaturedImageIndex(index, formId) {
    if (!formId) return false;
    
    try {
      localStorage.setItem(`listing_featured_${formId}`, index.toString());
      return true;
    } catch (error) {
      console.error('Error saving featured image index:', error);
      return false;
    }
  }

  /**
   * Get featured image index
   * 
   * @param {string} formId - The form/listing ID
   * @returns {number} - The featured image index
   */
  getFeaturedImageIndex(formId) {
    if (!formId) return 0;
    
    try {
      const index = localStorage.getItem(`listing_featured_${formId}`);
      return index !== null ? parseInt(index, 10) : 0;
    } catch (error) {
      console.error('Error retrieving featured image index:', error);
      return 0;
    }
  }

  /**
   * Save document metadata
   * 
   * @param {Array} documents - Array of document objects
   * @param {string} formId - The form/listing ID
   * @returns {Promise<boolean>} - Success status
   */
  async saveDocumentMetadata(documents, formId) {
    if (!formId) return false;
    
    try {
      // Before saving, check if localStorage is near full
      if (this.isStorageNearFull()) {
        console.warn('LocalStorage nearly full, cleaning old data before saving documents');
        this.forceCleanAllOldData();
      }
      
      // Try chunking approach for large datasets
      if (documents && documents.length > 5) {
        console.log(`Large document set detected (${documents.length} documents), using chunked storage`);
        
        // Store basic metadata separately from full data
        const basicMeta = documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          path: doc.path,
          url: doc.url,
          size: doc.size,
          type: doc.type,
          category: doc.category,
          isPublic: doc.isPublic
        }));
        
        // Save basic metadata (essential info)
        localStorage.setItem(`listing_documents_${formId}`, JSON.stringify(basicMeta));
        
        // For large sets, split the full data into chunks
        const CHUNK_SIZE = 3; // Store 3 documents per chunk
        const chunks = Math.ceil(documents.length / CHUNK_SIZE);
        
        // Clear any existing chunks
        for (let i = 0; i < 10; i++) { // Assume max 10 chunks
          localStorage.removeItem(`listing_documents_${formId}_chunk_${i}`);
        }
        
        // Store each chunk
        for (let i = 0; i < chunks; i++) {
          const chunkStart = i * CHUNK_SIZE;
          const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, documents.length);
          const chunk = documents.slice(chunkStart, chunkEnd);
          
          // Attempt to save chunk
          try {
            localStorage.setItem(`listing_documents_${formId}_chunk_${i}`, JSON.stringify(chunk));
            console.log(`Saved document chunk ${i+1}/${chunks}`);
          } catch (chunkError) {
            console.error(`Failed to save document chunk ${i+1}/${chunks}:`, chunkError);
            // Continue saving other chunks even if one fails
          }
        }
      } else {
        // For smaller sets, save directly
        localStorage.setItem(`listing_documents_${formId}`, JSON.stringify(documents));
      }
      
      // Save to Firestore for persistence
      try {
        const docRef = doc(db, 'listings', formId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          await updateDoc(docRef, { documents });
        } else {
          await setDoc(docRef, { documents, updatedAt: new Date().toISOString() });
        }
        console.log(`Successfully saved ${documents.length} documents to Firestore`);
      } catch (firestoreError) {
        console.error('Firestore save failed, but localStorage succeeded:', firestoreError);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving document metadata:', error);
      
      // Try alternative storage if localStorage fails (quota exceeded)
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, attempting to save minimal metadata');
        
        try {
          // Clear old data first
          this.forceCleanAllOldData();
          
          // Save only essential metadata
          const minimalMeta = documents.map(doc => ({
            id: doc.id,
            path: doc.path,
            url: doc.url,
            name: doc.name
          }));
          
          localStorage.setItem(`listing_documents_${formId}_minimal`, JSON.stringify(minimalMeta));
          console.log('Saved minimal document metadata as fallback');
          return true;
        } catch (fallbackError) {
          console.error('Fallback storage also failed:', fallbackError);
        }
      }
      
      return false;
    }
  }

  /**
   * Get document metadata
   * 
   * @param {string} formId - The form/listing ID
   * @returns {Array} - Array of document objects
   */
  getDocumentMetadata(formId) {
    if (!formId) return [];
    
    try {
      const storedData = localStorage.getItem(`listing_documents_${formId}`);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Error retrieving document metadata:', error);
      return [];
    }
  }

  /**
   * Revoke a temporary URL to prevent memory leaks
   * 
   * @param {string} id - The ID of the temporary URL
   */
  revokeTempUrl(id) {
    if (this.tempUrls.has(id)) {
      URL.revokeObjectURL(this.tempUrls.get(id));
      this.tempUrls.delete(id);
    }
  }

  /**
   * Save changes to Firebase
   * 
   * @param {string} formId - The form/listing ID
   * @param {object} data - The data to save
   * @returns {Promise<boolean>} - Success status
   */
  async saveToFirebase(formId, data = {}) {
    if (!formId) return false;
    
    try {
      const docRef = doc(db, 'listings', formId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, { 
          ...data,
          updatedAt: new Date().toISOString() 
        });
      } else {
        await setDoc(docRef, { 
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString() 
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      throw new Error('Failed to save data to Firebase');
    }
  }

  /**
   * Clear form data
   * 
   * @param {string} formId - The form/listing ID
   * @returns {boolean} - Success status
   */
  clearFormData(formId) {
    if (!formId) return false;
    
    try {
      localStorage.removeItem(`listing_images_${formId}`);
      localStorage.removeItem(`listing_documents_${formId}`);
      localStorage.removeItem(`listing_featured_${formId}`);
      return true;
    } catch (error) {
      console.error('Error clearing form data:', error);
      return false;
    }
  }
  
  /**
   * Force clean all old data from local storage
   * Removes any listing-related data that might be causing storage issues
   * 
   * @returns {boolean} - Success status
   */
  forceCleanAllOldData() {
    try {
      console.log('Cleaning up old listing storage data');
      
      // Get all keys in localStorage
      const keys = Object.keys(localStorage);
      
      // Find and remove listing-related keys
      const listingKeys = keys.filter(key => 
        key.startsWith('listing_') || 
        key.includes('listing') || 
        key.includes('form') ||
        key.includes('images') ||
        key.includes('documents')
      );
      
      console.log(`Found ${listingKeys.length} listing-related keys to clean`);
      
      // Remove old data
      listingKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove key: ${key}`, e);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return false;
    }
  }

  /**
   * Save form images - specialized method for form persistence
   * 
   * @param {Array} images - Array of sanitized image objects
   * @param {string} formId - The form/listing ID
   * @returns {Promise<boolean>} - Success status
   */
  async saveFormImages(images, formId) {
    if (!formId) return false;
    
    try {
      console.log(`Saving ${images.length} form images for formId: ${formId}`);
      
      // Save to local storage for immediate access
      localStorage.setItem(`listing_form_images_${formId}`, JSON.stringify(images));
      
      // Also save to our standard image storage for consistency
      await this.saveImageMetadata(images, formId);
      
      return true;
    } catch (error) {
      console.error('Error saving form images:', error);
      return false;
    }
  }

  /**
   * Save documents to Firestore
   * 
   * @param {Array} documents - Array of document objects
   * @param {string} formId - The form/listing ID
   * @returns {Promise<boolean>} - Success status
   */
  async saveDocumentsToFirestore(documents, formId) {
    if (!formId) return false;
    
    try {
      console.log(`Saving ${documents.length} documents to Firestore for formId: ${formId}`);
      
      // Sanitize documents before saving to Firestore
      const sanitizedDocuments = documents.map(doc => {
        // Create a safe copy without circular references or functions
        return {
          id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: doc.name || 'Unnamed document',
          description: doc.description || '',
          type: doc.type || 'application/pdf',
          category: doc.category || 'other',
          size: doc.size || 0,
          format: doc.format || doc.type || null,
          isPublic: !!doc.isPublic,
          verificationStatus: doc.verificationStatus || 'pending',
          uploadedAt: doc.uploadedAt || new Date().toISOString(),
          path: doc.path || null,
          url: doc.url && !doc.url.startsWith('blob:') ? doc.url : null
        };
      });
      
      // Save to Firestore for persistence
      const docRef = doc(db, 'listings', formId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, { documents: sanitizedDocuments });
      } else {
        await setDoc(docRef, { 
          documents: sanitizedDocuments, 
          updatedAt: new Date().toISOString() 
        });
      }
      
      // Also save to localStorage for faster access
      localStorage.setItem(`listing_documents_${formId}`, JSON.stringify(sanitizedDocuments));
      
      return true;
    } catch (error) {
      console.error('Error saving documents to Firestore:', error);
      
      // Try to save to localStorage even if Firestore fails
      try {
        const minimizedDocs = documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          path: doc.path,
          url: doc.url
        }));
        localStorage.setItem(`listing_documents_${formId}`, JSON.stringify(minimizedDocs));
        console.log('Saved minimized document data to localStorage after Firestore error');
      } catch (localStorageError) {
        console.error('Failed to save to localStorage as well:', localStorageError);
      }
      
      return false;
    }
  }

  /**
   * Get documents from Firestore
   * 
   * @param {string} formId - The form/listing ID
   * @returns {Promise<Array>} - Array of document objects
   */
  async getDocumentsFromFirestore(formId) {
    if (!formId) return [];
    
    try {
      console.log(`Fetching documents from Firestore for formId: ${formId}`);
      
      // Try to get from Firestore first
      const docRef = doc(db, 'listings', formId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.documents && Array.isArray(data.documents)) {
          console.log(`Found ${data.documents.length} documents in Firestore`);
          
          // Also cache in localStorage for faster access next time
          localStorage.setItem(`listing_documents_${formId}`, JSON.stringify(data.documents));
          
          return data.documents;
        }
      }
      
      console.log('No documents found in Firestore, checking localStorage');
      
      // Fall back to localStorage if not in Firestore
      const localData = localStorage.getItem(`listing_documents_${formId}`);
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log(`Found ${parsedData.length} documents in localStorage backup`);
            return parsedData;
          }
        } catch (parseError) {
          console.error('Error parsing localStorage document data:', parseError);
        }
      }
      
      // No documents found in either place
      console.log('No documents found in Firestore or localStorage');
      return [];
    } catch (error) {
      console.error('Error retrieving documents from Firestore:', error);
      
      // Try localStorage as a fallback
      try {
        const localData = localStorage.getItem(`listing_documents_${formId}`);
        if (localData) {
          const parsedData = JSON.parse(localData);
          if (Array.isArray(parsedData)) {
            console.log(`Firestore fetch failed, but found ${parsedData.length} documents in localStorage backup`);
            return parsedData;
          }
        }
      } catch (localStorageError) {
        console.error('Error retrieving from localStorage backup:', localStorageError);
      }
      
      return [];
    }
  }

  /**
   * Get image metadata with fallback mechanisms
   * 
   * @param {string} formId - The form/listing ID
   * @returns {Promise<Array>} - Array of image objects
   */
  async getImageMetadataWithFallback(formId) {
    if (!formId) return [];
    
    try {
      console.log(`Fetching image metadata for formId: ${formId} with fallback`);
      
      // Try to get from Firestore first
      const docRef = doc(db, 'listings', formId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.images && Array.isArray(data.images)) {
          console.log(`Found ${data.images.length} images in Firestore`);
          
          // Also cache in localStorage for faster access next time
          localStorage.setItem(`listing_images_${formId}`, JSON.stringify(data.images));
          
          return data.images;
        }
      }
      
      console.log('No images found in Firestore, checking localStorage');
      
      // Check various localStorage keys for images
      const possibleKeys = [
        `listing_images_${formId}`,
        `listing_form_images_${formId}`,
        'listingFormImagesData'
      ];
      
      for (const key of possibleKeys) {
        const localData = localStorage.getItem(key);
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              console.log(`Found ${parsedData.length} images in localStorage (${key})`);
              return parsedData;
            }
          } catch (parseError) {
            console.error(`Error parsing localStorage image data from ${key}:`, parseError);
          }
        }
      }
      
      // No images found in any location
      console.log('No images found in Firestore or localStorage');
      return [];
    } catch (error) {
      console.error('Error retrieving images with fallback:', error);
      
      // Last resort - try standard method
      return this.getImageMetadata(formId);
    }
  }

  /**
   * Check if localStorage is near its capacity limit
   * @returns {boolean} - True if storage is near full
   */
  isStorageNearFull() {
    try {
      // Rough estimate of total localStorage space (typically 5MB)
      const totalStorageSpace = 5 * 1024 * 1024;
      
      // Calculate current usage
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        totalSize += (key.length + value.length) * 2; // Unicode chars are 2 bytes
      }
      
      // Log storage usage info
      const usagePercentage = (totalSize / totalStorageSpace) * 100;
      console.log(`Storage usage: ${(totalSize / (1024 * 1024)).toFixed(2)}MB (${usagePercentage.toFixed(2)}%)`);
      
      // Return true if over 80% full
      return usagePercentage > 80;
    } catch (e) {
      console.error('Error checking storage capacity:', e);
      return true; // Assume it's near full if we can't check
    }
  }
}

// Create a singleton instance
const listingStorage = new ListingStorageService();

export default listingStorage;