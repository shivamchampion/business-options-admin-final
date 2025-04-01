import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

/**
 * Storage service for listing form files (images and documents)
 * Uses Firebase Storage for cloud storage with local caching
 */
class ListingStorageService {
  constructor() {
    // Initialize localStorage keys
    this.KEYS = {
      IMAGES: 'listing_form_images',
      DOCUMENTS: 'listing_form_documents',
      FEATURED_IMAGE: 'listing_form_featured_image',
      ACTIVE_CATEGORY: 'listing_form_active_category'
    };
    
    // Map to track temporary object URLs
    this.objectUrls = new Map();
  }
  
  /**
   * Generate a Firebase Storage path for a file
   * @param {string} type - The file type (images or documents)
   * @param {string} formId - The form ID or listing ID
   * @param {string} fileId - The unique file ID
   * @returns {string} Firebase Storage path
   */
  getStoragePath(type, formId, fileId) {
    return `listings/${formId}/${type}/${fileId}`;
  }
  
  /**
   * Generate a unique ID for a file
   * @returns {string} A unique ID
   */
  generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Upload a file to Firebase Storage
   * @param {File} file - The file to upload
   * @param {string} type - The file type (images or documents)
   * @param {string} formId - The form ID or listing ID
   * @param {string} fileId - Optional file ID (generates one if not provided)
   * @returns {Promise<Object>} The uploaded file metadata
   */
  async uploadFile(file, type, formId, fileId = null) {
    try {
      // Generate ID if not provided
      const id = fileId || this.generateUniqueId();
      
      // Create storage reference
      const storagePath = this.getStoragePath(type, formId, id);
      const storageRef = ref(storage, storagePath);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        path: storagePath,
        url: downloadURL,
        preview: downloadURL,
        uploaded: true,
        tempUrl: null
      };
    } catch (error) {
      console.error(`Error uploading ${type} file:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a file from Firebase Storage
   * @param {string} path - The storage path of the file
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(path) {
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }
  
  /**
   * Create a temporary object URL for a file
   * @param {File} file - The file
   * @param {string} id - The file ID
   * @returns {string} The object URL
   */
  createTempUrl(file, id) {
    // Revoke previous URL if exists
    if (this.objectUrls.has(id)) {
      URL.revokeObjectURL(this.objectUrls.get(id));
    }
    
    // Create new URL
    const url = URL.createObjectURL(file);
    this.objectUrls.set(id, url);
    
    return url;
  }
  
  /**
   * Revoke a temporary object URL
   * @param {string} id - The file ID
   */
  revokeTempUrl(id) {
    if (this.objectUrls.has(id)) {
      URL.revokeObjectURL(this.objectUrls.get(id));
      this.objectUrls.delete(id);
    }
  }
  
  /**
   * Revoke all temporary object URLs
   */
  revokeAllTempUrls() {
    this.objectUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.objectUrls.clear();
  }
  
  /**
   * Save image metadata to localStorage
   * @param {Array} images - The image metadata to save
   * @param {string} formId - The form ID
   * @returns {boolean} Success status
   */
  saveImageMetadata(images, formId) {
    try {
      const key = `${this.KEYS.IMAGES}_${formId}`;
      const metadata = images.map(img => ({
        id: img.id,
        name: img.name,
        size: img.size,
        type: img.type,
        path: img.path || null,
        url: img.url && !img.url.startsWith('blob:') ? img.url : null,
        isPlaceholder: !!img.isPlaceholder
      }));
      
      localStorage.setItem(key, JSON.stringify(metadata));
      return true;
    } catch (error) {
      console.error("Error saving image metadata:", error);
      return false;
    }
  }
  
  /**
   * Get image metadata from localStorage
   * @param {string} formId - The form ID
   * @returns {Array|null} The image metadata or null
   */
  getImageMetadata(formId) {
    try {
      const key = `${this.KEYS.IMAGES}_${formId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting image metadata:", error);
      return null;
    }
  }
  
  /**
   * Save document metadata to localStorage
   * @param {Array} documents - The document metadata to save
   * @param {string} formId - The form ID
   * @returns {boolean} Success status
   */
  saveDocumentMetadata(documents, formId) {
    try {
      const key = `${this.KEYS.DOCUMENTS}_${formId}`;
      const metadata = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        description: doc.description || '',
        type: doc.type,
        category: doc.category,
        size: doc.size || 0,
        format: doc.format,
        isPublic: !!doc.isPublic,
        verificationStatus: doc.verificationStatus || 'pending',
        uploadedAt: doc.uploadedAt ? doc.uploadedAt.toISOString() : new Date().toISOString(),
        isPlaceholder: !!doc.isPlaceholder,
        path: doc.path || null,
        url: doc.url && !doc.url.startsWith('blob:') ? doc.url : null
      }));
      
      localStorage.setItem(key, JSON.stringify(metadata));
      return true;
    } catch (error) {
      console.error("Error saving document metadata:", error);
      return false;
    }
  }
  
  /**
   * Get document metadata from localStorage
   * @param {string} formId - The form ID
   * @returns {Array|null} The document metadata or null
   */
  getDocumentMetadata(formId) {
    try {
      const key = `${this.KEYS.DOCUMENTS}_${formId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting document metadata:", error);
      return null;
    }
  }
  
  /**
   * Save featured image index
   * @param {number} index - The featured image index
   * @param {string} formId - The form ID
   * @returns {boolean} Success status
   */
  saveFeaturedImageIndex(index, formId) {
    try {
      const key = `${this.KEYS.FEATURED_IMAGE}_${formId}`;
      localStorage.setItem(key, index.toString());
      return true;
    } catch (error) {
      console.error("Error saving featured image index:", error);
      return false;
    }
  }
  
  /**
   * Get featured image index
   * @param {string} formId - The form ID
   * @returns {number|null} The featured image index or null
   */
  getFeaturedImageIndex(formId) {
    try {
      const key = `${this.KEYS.FEATURED_IMAGE}_${formId}`;
      const data = localStorage.getItem(key);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      console.error("Error getting featured image index:", error);
      return 0;
    }
  }
  
  /**
   * Save active document category
   * @param {string} category - The active category
   * @param {string} formId - The form ID
   * @returns {boolean} Success status
   */
  saveActiveCategory(category, formId) {
    try {
      const key = `${this.KEYS.ACTIVE_CATEGORY}_${formId}`;
      localStorage.setItem(key, category);
      return true;
    } catch (error) {
      console.error("Error saving active category:", error);
      return false;
    }
  }
  
  /**
   * Get active document category
   * @param {string} formId - The form ID
   * @returns {string} The active category or default
   */
  getActiveCategory(formId) {
    try {
      const key = `${this.KEYS.ACTIVE_CATEGORY}_${formId}`;
      return localStorage.getItem(key) || 'essential';
    } catch (error) {
      console.error("Error getting active category:", error);
      return 'essential';
    }
  }
  
  /**
   * Clear form data
   * @param {string} formId - The form ID
   */
  clearFormData(formId) {
    try {
      localStorage.removeItem(`${this.KEYS.IMAGES}_${formId}`);
      localStorage.removeItem(`${this.KEYS.DOCUMENTS}_${formId}`);
      localStorage.removeItem(`${this.KEYS.FEATURED_IMAGE}_${formId}`);
      localStorage.removeItem(`${this.KEYS.ACTIVE_CATEGORY}_${formId}`);
    } catch (error) {
      console.error("Error clearing form data:", error);
    }
  }
}

// Create singleton instance
const listingStorage = new ListingStorageService();
export default listingStorage;