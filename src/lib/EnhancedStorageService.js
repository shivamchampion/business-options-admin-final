/**
 * Enhanced Storage Service using IndexedDB for metadata storage
 * This service maintains the same interface as the existing ListingStorageService
 * but uses IndexedDB to avoid localStorage quota issues
 * 
 * @typedef {Object} DocumentMetadata
 * @property {string} id - Document ID
 * @property {string} name - Document name
 * @property {number} size - Document size in bytes
 * @property {string} [category] - Document category
 * @property {string} [type] - Document type
 * @property {string} [description] - Document description
 * @property {string|null} [url] - Document URL
 * @property {string|null} [path] - Document path in storage
 * @property {boolean} [isPublic] - Whether document is public
 * @property {'pending'|'verified'|'rejected'} [verificationStatus] - Document verification status
 * @property {string} [uploadedAt] - When document was uploaded
 * @property {boolean} [isPlaceholder] - Whether document is a placeholder
 * @property {boolean} [completed] - Whether upload is completed
 * @property {boolean} [uploading] - Whether document is uploading
 * @property {string} [error] - Error message if upload failed
 */

/**
 * @typedef {Object} PendingOperation
 * @property {string} name - Operation name
 * @property {Function} execute - Operation function to execute
 */

import { auth, storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { DocumentObject } from '@/types/listings';

class EnhancedStorageService {
  dbName: string;
  dbVersion: number;
  dbReady: boolean;
  db: IDBDatabase | null;
  pendingOperations: PendingOperation[];
  tempUrls: Map<string, string>;
  storage: any; // Firebase storage

  constructor() {
    this.dbName = 'businessOptionsDB';
    this.dbVersion = 1;
    this.dbReady = false;
    this.db = null;
    this.initDb();
    
    // Expose the Firebase storage for direct access
    this.storage = storage;
    
    // Stores for pending operations if DB isn't ready yet
    this.pendingOperations = [];
    
    // Store temp URLs for cleanup
    this.tempUrls = new Map();
  }
  
  /**
   * Initialize the IndexedDB database
   * @returns {Promise<IDBDatabase>} The database instance
   */
  async initDb() {
    return new Promise((resolve, reject) => {
      if (this.dbReady && this.db) {
        resolve(this.db);
        return;
      }
      
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains('images')) {
            db.createObjectStore('images', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('documents')) {
            db.createObjectStore('documents', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('formData')) {
            db.createObjectStore('formData', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = (event) => {
          this.db = event.target.result;
          this.dbReady = true;
          console.log('IndexedDB initialized successfully');
          
          // Process any pending operations
          this.processPendingOperations();
          
          resolve(this.db);
        };
        
        request.onerror = (event) => {
          console.error('Error initializing IndexedDB:', event.target.error);
          this.dbReady = false;
          reject(event.target.error);
        };
      } catch (error) {
        console.error('IndexedDB not supported or error occurred:', error);
        this.dbReady = false;
        reject(error);
      }
    });
  }
  
  /**
   * Process any operations that were attempted before DB was ready
   * @returns {Promise<void>}
   */
  async processPendingOperations() {
    if (this.pendingOperations.length > 0) {
      console.log(`Processing ${this.pendingOperations.length} pending operations`);
      
      for (const op of this.pendingOperations) {
        try {
          await op.execute();
          console.log('Completed pending operation:', op.name);
        } catch (error) {
          console.error('Error processing pending operation:', op.name, error);
        }
      }
      
      // Clear the queue
      this.pendingOperations = [];
    }
  }
  
  /**
   * Add operation to queue if DB isn't ready
   * @param {string} name Operation name for logging
   * @param {Function} operation The function to execute
   * @returns {void}
   */
  queueOperation(name, operation) {
    this.pendingOperations.push({
      name,
      execute: operation
    });
    console.log(`Queued operation: ${name}. DB ready: ${this.dbReady}`);
  }
  
  /**
   * Save image metadata to IndexedDB and Firestore
   * @param {Array} images - Array of image objects
   * @param {string} formId - The form/listing ID
   * @returns {Promise<boolean>} - Success status
   */
  async saveImageMetadata(images: any[], formId: string): Promise<boolean> {
    if (!formId) return false;
    
    const operation = async () => {
      try {
        // First try to save to IndexedDB
        if (this.dbReady && this.db) {
          const transaction = this.db.transaction(['images'], 'readwrite');
          const store = transaction.objectStore('images');
          
          // Create a transaction promise
          const txPromise = new Promise<boolean>((resolve, reject) => {
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = (e) => reject(e.target.error);
          });
          
          // Store images with proper key
          await store.put({
            id: `listing_images_${formId}`,
            data: images,
            timestamp: Date.now()
          });
          
          // Wait for transaction to complete
          await txPromise;
          
          // Also store minimal data in localStorage for quick access
          try {
            const minimalData = images.map(img => ({
              id: img.id,
              url: img.url,
              name: img.name
            }));
            
            localStorage.setItem(`listing_images_minimal_${formId}`, 
              JSON.stringify(minimalData));
          } catch (localStorageError) {
            console.warn('Failed to save minimal image data to localStorage');
          }
          
          console.log(`Successfully saved ${images.length} images to IndexedDB`);
        } else {
          // Fall back to localStorage with chunking if IndexedDB not available
          return this.saveImageMetadataToLocalStorage(images, formId);
        }
        
        // Also save to Firestore for persistence across devices
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
          console.error('Firestore save failed, but IndexedDB succeeded:', firestoreError);
        }
        
        return true;
      } catch (error) {
        console.error('Error saving image metadata to IndexedDB:', error);
        // Try localStorage as backup
        return this.saveImageMetadataToLocalStorage(images, formId);
      }
    };
    
    // If DB isn't ready yet, queue the operation
    if (!this.dbReady) {
      this.queueOperation(`saveImageMetadata_${formId}`, operation);
      await this.initDb(); // Try to initialize DB again
      return true; // Assume it will succeed when processed
    }
    
    return operation();
  }
  
  /**
   * Fallback method to save image metadata to localStorage with chunking
   * @param {Array} images - Array of image objects
   * @param {string} formId - The form/listing ID
   * @returns {Promise<boolean>} - Success status
   */
  async saveImageMetadataToLocalStorage(images: any[], formId: string): Promise<boolean> {
    try {
      // Check if localStorage is nearly full
      if (this.isStorageNearFull()) {
        console.warn('LocalStorage nearly full, cleaning old data');
        this.cleanupLocalStorage();
      }
      
      // For large sets, split into chunks
      if (images && images.length > 3) {
        console.log(`Using chunked storage for ${images.length} images`);
        
        // Store basic metadata separately
        const basicMeta = images.map(img => ({
          id: img.id,
          name: img.name,
          url: img.url,
          path: img.path
        }));
        
        localStorage.setItem(`listing_images_${formId}`, JSON.stringify(basicMeta));
        
        // Split full data into chunks
        const CHUNK_SIZE = 2; // Store 2 images per chunk
        const chunks = Math.ceil(images.length / CHUNK_SIZE);
        
        // Clear existing chunks first
        for (let i = 0; i < 20; i++) {
          localStorage.removeItem(`listing_images_${formId}_chunk_${i}`);
        }
        
        // Store each chunk
        for (let i = 0; i < chunks; i++) {
          const chunkStart = i * CHUNK_SIZE;
          const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, images.length);
          const chunk = images.slice(chunkStart, chunkEnd);
          
          try {
            localStorage.setItem(
              `listing_images_${formId}_chunk_${i}`, 
              JSON.stringify(chunk)
            );
          } catch (chunkError) {
            console.error(`Failed to save chunk ${i}:`, chunkError);
            // Continue with other chunks
          }
        }
      } else {
        // For smaller sets, try direct storage
        try {
          localStorage.setItem(`listing_images_${formId}`, JSON.stringify(images));
        } catch (directError) {
          console.error('Direct storage failed, trying minimal storage:', directError);
          
          // Store only essential data
          const minimalData = images.map(img => ({
            id: img.id,
            url: img.url,
            name: img.name
          }));
          
          localStorage.setItem(`listing_images_minimal_${formId}`, 
            JSON.stringify(minimalData));
        }
      }
      
      return true;
    } catch (error) {
      console.error('All localStorage attempts failed:', error);
      return false;
    }
  }
  
  /**
   * Get image metadata from IndexedDB with localStorage and Firestore fallbacks
   * @param {string} formId - The form ID to retrieve
   * @returns {Promise<Array>} - Array of image metadata
   */
  async getImageMetadata(formId: string): Promise<any[]> {
    if (!formId) return [];
    
    // First try IndexedDB
    try {
      if (this.dbReady && this.db) {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.get(`listing_images_${formId}`);
        
        const result = await new Promise<any>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        if (result && result.data && Array.isArray(result.data)) {
          console.log(`Retrieved ${result.data.length} images from IndexedDB`);
          return result.data;
        }
      }
    } catch (idbError) {
      console.error('Error retrieving from IndexedDB:', idbError);
    }
    
    // Then try localStorage
    try {
      // First try regular storage
      const data = localStorage.getItem(`listing_images_${formId}`);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`Retrieved ${parsed.length} images from localStorage`);
          
          // If data looks like it might be chunked (has only basic fields)
          if (parsed[0] && !parsed[0].preview && parsed[0].url) {
            return this.getChunkedImageData(formId, parsed);
          }
          
          return parsed;
        }
      }
      
      // Try minimal storage
      const minimalData = localStorage.getItem(`listing_images_minimal_${formId}`);
      if (minimalData) {
        const parsed = JSON.parse(minimalData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`Retrieved ${parsed.length} minimal images from localStorage`);
          return parsed;
        }
      }
      
      // Try chunked data directly
      return this.getChunkedImageData(formId);
    } catch (localError) {
      console.error('Error retrieving from localStorage:', localError);
    }
    
    // Finally try Firestore
    try {
      const docRef = doc(db, 'listings', formId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().images) {
        const firestoreImages = docSnap.data().images;
        console.log(`Retrieved ${firestoreImages.length} images from Firestore`);
        
        // Save to IndexedDB for next time
        this.saveImageMetadata(firestoreImages, formId).catch(console.error);
        
        return firestoreImages;
      }
    } catch (firestoreError) {
      console.error('Error retrieving from Firestore:', firestoreError);
    }
    
    return [];
  }
  
  /**
   * Helper to retrieve chunked image data from localStorage
   * @param {string} formId - The form ID
   * @param {Array} basicData - Optional basic metadata
   * @returns {Array} - Combined image data
   */
  getChunkedImageData(formId: string, basicData: any[] | null = null): any[] {
    try {
      const allImages: any[] = [];
      
      // If basic data was provided, use it
      if (basicData && Array.isArray(basicData)) {
        allImages.push(...basicData);
      }
      
      // Try to find chunks
      for (let i = 0; i < 20; i++) {
        const chunkKey = `listing_images_${formId}_chunk_${i}`;
        const chunkData = localStorage.getItem(chunkKey);
        
        if (!chunkData) break;
        
        try {
          const chunkImages = JSON.parse(chunkData);
          if (Array.isArray(chunkImages)) {
            // If we have basic data, merge with full data from chunks
            if (basicData) {
              // Match and merge by ID
              chunkImages.forEach(fullImg => {
                const index = allImages.findIndex(img => img.id === fullImg.id);
                if (index >= 0) {
                  allImages[index] = { ...allImages[index], ...fullImg };
                } else {
                  allImages.push(fullImg);
                }
              });
            } else {
              // Just add chunk images if no basic data
              allImages.push(...chunkImages);
            }
          }
        } catch (parseError) {
          console.error(`Error parsing chunk ${i}:`, parseError);
        }
      }
      
      return allImages;
    } catch (error) {
      console.error('Error retrieving chunked data:', error);
      return [];
    }
  }
  
  /**
   * Save document metadata to IndexedDB and Firestore
   * @param {Array} documents - Array of document objects
   * @param {string} formId - The form/listing ID
   * @returns {Promise<boolean>} - Success status
   */
  async saveDocumentMetadata(documents: DocumentMetadata[], formId: string): Promise<boolean> {
    if (!formId) return false;
    
    const operation = async () => {
      try {
        // First try to save to IndexedDB
        if (this.dbReady && this.db) {
          const transaction = this.db.transaction(['documents'], 'readwrite');
          const store = transaction.objectStore('documents');
          
          // Create a transaction promise
          const txPromise = new Promise<boolean>((resolve, reject) => {
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = (e) => reject(e.target.error);
          });
          
          // Store documents with proper key
          await store.put({
            id: `listing_documents_${formId}`,
            data: documents,
            timestamp: Date.now()
          });
          
          // Wait for transaction to complete
          await txPromise;
          
          // Store minimal data in localStorage for quick access
          try {
            const minimalData = documents.map(doc => ({
              id: doc.id,
              name: doc.name,
              url: doc.url,
              category: doc.category,
              isPublic: doc.isPublic
            }));
            
            localStorage.setItem(`listing_documents_minimal_${formId}`, 
              JSON.stringify(minimalData));
          } catch (localStorageError) {
            console.warn('Failed to save minimal document data to localStorage');
          }
          
          console.log(`Successfully saved ${documents.length} documents to IndexedDB`);
        } else {
          // Fall back to localStorage with chunking
          return this.saveDocumentMetadataToLocalStorage(documents, formId);
        }
        
        // Also save to Firestore for persistence
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
          console.error('Firestore save failed, but IndexedDB succeeded:', firestoreError);
        }
        
        return true;
      } catch (error) {
        console.error('Error saving document metadata to IndexedDB:', error);
        // Try localStorage as backup
        return this.saveDocumentMetadataToLocalStorage(documents, formId);
      }
    };
    
    // If DB isn't ready yet, queue the operation
    if (!this.dbReady) {
      this.queueOperation(`saveDocumentMetadata_${formId}`, operation);
      await this.initDb(); // Try to initialize DB again
      return true; // Assume it will succeed when processed
    }
    
    return operation();
  }
  
  /**
   * Fallback method to save document metadata to localStorage with chunking
   * @param {Array} documents - Array of document objects
   * @param {string} formId - The form/listing ID
   * @returns {Promise<boolean>} - Success status
   */
  async saveDocumentMetadataToLocalStorage(documents: DocumentMetadata[], formId: string): Promise<boolean> {
    try {
      // Check if localStorage is nearly full
      if (this.isStorageNearFull()) {
        console.warn('LocalStorage nearly full, cleaning old data');
        this.cleanupLocalStorage();
      }
      
      // For large sets, split into chunks
      if (documents && documents.length > 3) {
        console.log(`Using chunked storage for ${documents.length} documents`);
        
        // Store basic metadata separately
        const basicMeta = documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          url: doc.url,
          path: doc.path,
          category: doc.category,
          isPublic: doc.isPublic
        }));
        
        localStorage.setItem(`listing_documents_${formId}`, JSON.stringify(basicMeta));
        
        // Split full data into chunks
        const CHUNK_SIZE = 2; // Store 2 documents per chunk
        const chunks = Math.ceil(documents.length / CHUNK_SIZE);
        
        // Clear existing chunks first
        for (let i = 0; i < 20; i++) {
          localStorage.removeItem(`listing_documents_${formId}_chunk_${i}`);
        }
        
        // Store each chunk
        for (let i = 0; i < chunks; i++) {
          const chunkStart = i * CHUNK_SIZE;
          const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, documents.length);
          const chunk = documents.slice(chunkStart, chunkEnd);
          
          try {
            localStorage.setItem(
              `listing_documents_${formId}_chunk_${i}`, 
              JSON.stringify(chunk)
            );
          } catch (chunkError) {
            console.error(`Failed to save document chunk ${i}:`, chunkError);
            // Continue with other chunks
          }
        }
      } else {
        // For smaller sets, try direct storage
        try {
          localStorage.setItem(`listing_documents_${formId}`, JSON.stringify(documents));
        } catch (directError) {
          console.error('Direct document storage failed, trying minimal storage:', directError);
          
          // Store only essential data
          const minimalData = documents.map(doc => ({
            id: doc.id,
            url: doc.url,
            name: doc.name,
            category: doc.category
          }));
          
          localStorage.setItem(`listing_documents_minimal_${formId}`, 
            JSON.stringify(minimalData));
        }
      }
      
      return true;
    } catch (error) {
      console.error('All document localStorage attempts failed:', error);
      return false;
    }
  }
  
  /**
   * Get document metadata from IndexedDB with localStorage and Firestore fallbacks
   * @param {string} formId - The form ID to retrieve
   * @returns {Promise<Array>} - Array of document metadata
   */
  async getDocumentMetadata(formId: string): Promise<DocumentMetadata[]> {
    if (!formId) return [];
    
    // First try IndexedDB
    try {
      if (this.dbReady && this.db) {
        const transaction = this.db.transaction(['documents'], 'readonly');
        const store = transaction.objectStore('documents');
        const request = store.get(`listing_documents_${formId}`);
        
        const result = await new Promise<any>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        if (result && result.data && Array.isArray(result.data)) {
          console.log(`Retrieved ${result.data.length} documents from IndexedDB`);
          return result.data;
        }
      }
    } catch (idbError) {
      console.error('Error retrieving documents from IndexedDB:', idbError);
    }
    
    // Then try localStorage
    try {
      // First try regular storage
      const data = localStorage.getItem(`listing_documents_${formId}`);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`Retrieved ${parsed.length} documents from localStorage`);
          
          // If data looks like it might be chunked (has only basic fields)
          if (parsed[0] && !parsed[0].description && parsed[0].url) {
            return this.getChunkedDocumentData(formId, parsed);
          }
          
          return parsed;
        }
      }
      
      // Try minimal storage
      const minimalData = localStorage.getItem(`listing_documents_minimal_${formId}`);
      if (minimalData) {
        const parsed = JSON.parse(minimalData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`Retrieved ${parsed.length} minimal documents from localStorage`);
          return parsed;
        }
      }
      
      // Try chunked data directly
      return this.getChunkedDocumentData(formId);
    } catch (localError) {
      console.error('Error retrieving documents from localStorage:', localError);
    }
    
    // Finally try Firestore
    try {
      const docRef = doc(db, 'listings', formId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().documents) {
        const firestoreDocs = docSnap.data().documents;
        console.log(`Retrieved ${firestoreDocs.length} documents from Firestore`);
        
        // Save to IndexedDB for next time
        this.saveDocumentMetadata(firestoreDocs, formId).catch(console.error);
        
        return firestoreDocs;
      }
    } catch (firestoreError) {
      console.error('Error retrieving documents from Firestore:', firestoreError);
    }
    
    return [];
  }
  
  /**
   * Helper to retrieve chunked document data from localStorage
   * @param {string} formId - The form ID
   * @param {Array} basicData - Optional basic metadata
   * @returns {Array} - Combined document data
   */
  getChunkedDocumentData(formId: string, basicData: DocumentMetadata[] | null = null): DocumentMetadata[] {
    try {
      const allDocs: DocumentMetadata[] = [];
      
      // If basic data was provided, use it
      if (basicData && Array.isArray(basicData)) {
        allDocs.push(...basicData);
      }
      
      // Try to find chunks
      for (let i = 0; i < 20; i++) {
        const chunkKey = `listing_documents_${formId}_chunk_${i}`;
        const chunkData = localStorage.getItem(chunkKey);
        
        if (!chunkData) break;
        
        try {
          const chunkDocs = JSON.parse(chunkData);
          if (Array.isArray(chunkDocs)) {
            // If we have basic data, merge with full data from chunks
            if (basicData) {
              // Match and merge by ID
              chunkDocs.forEach(fullDoc => {
                const index = allDocs.findIndex(doc => doc.id === fullDoc.id);
                if (index >= 0) {
                  allDocs[index] = { ...allDocs[index], ...fullDoc };
                } else {
                  allDocs.push(fullDoc);
                }
              });
            } else {
              // Just add chunk docs if no basic data
              allDocs.push(...chunkDocs);
            }
          }
        } catch (parseError) {
          console.error(`Error parsing document chunk ${i}:`, parseError);
        }
      }
      
      return allDocs;
    } catch (error) {
      console.error('Error retrieving chunked document data:', error);
      return [];
    }
  }
  
  /**
   * Upload a file to Firebase Storage
   * @param {File} file - The file to upload
   * @param {string} path - Storage path
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - Upload result
   */
  async uploadFile(file: File, path: string, options: any = {}): Promise<any> {
    if (!file || !path) {
      throw new Error('File and path are required');
    }
    
    try {
      // Create a storage reference
      const storageRef = ref(storage, path);
      
      // Upload the file
      const uploadResult = await uploadBytes(storageRef, file, options);
      
      // Get the download URL
      const url = await getDownloadURL(uploadResult.ref);
      
      return {
        path,
        url,
        name: file.name,
        type: file.type,
        size: file.size,
        contentType: uploadResult.metadata.contentType,
        fullPath: uploadResult.metadata.fullPath,
        timeCreated: uploadResult.metadata.timeCreated
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  /**
   * Delete a file from Firebase Storage
   * @param {string} path - Path to the file
   * @returns {Promise<void>}
   */
  async deleteFile(path: string): Promise<void> {
    if (!path) {
      return;
    }
    
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
      console.log(`File deleted: ${path}`);
    } catch (error) {
      console.error(`Error deleting file ${path}:`, error);
      throw error;
    }
  }
  
  /**
   * Save the featured image index
   * @param {number} index - Featured image index
   * @param {string} formId - Form ID
   */
  saveFeaturedImageIndex(index: number, formId: string): Promise<boolean> | void {
    if (!formId) return;
    
    const operation = async (): Promise<boolean> => {
      try {
        // Try IndexedDB first
        if (this.dbReady && this.db) {
          const transaction = this.db.transaction(['settings'], 'readwrite');
          const store = transaction.objectStore('settings');
          
          await store.put({
            id: `featured_image_${formId}`,
            index,
            timestamp: Date.now()
          });
        }
        
        // Also save to localStorage for quick access
        localStorage.setItem(`featured_image_${formId}`, index.toString());
        return true;
      } catch (error) {
        console.error('Error saving featured image index:', error);
        // Try localStorage as fallback
        try {
          localStorage.setItem(`featured_image_${formId}`, index.toString());
          return true;
        } catch (localError) {
          console.error('LocalStorage save failed:', localError);
          return false;
        }
      }
    };
    
    // If DB isn't ready yet, queue the operation
    if (!this.dbReady) {
      this.queueOperation(`saveFeaturedImageIndex_${formId}`, operation);
      this.initDb(); // Try to initialize DB again
      // Still try to save to localStorage right away
      try {
        localStorage.setItem(`featured_image_${formId}`, index.toString());
      } catch (e) {
        console.error('Error saving featured index to localStorage:', e);
      }
      return;
    }
    
    return operation();
  }
  
  /**
   * Get the featured image index
   * @param {string} formId - Form ID
   * @returns {number} Featured image index
   */
  getFeaturedImageIndex(formId: string): number {
    if (!formId) return 0;
    
    try {
      // Try localStorage first for speed
      const localIndex = localStorage.getItem(`featured_image_${formId}`);
      if (localIndex !== null) {
        return parseInt(localIndex, 10) || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting featured image index:', error);
      return 0;
    }
  }
  
  /**
   * Check if localStorage is near its capacity limit
   * @returns {boolean} True if storage is nearly full
   */
  isStorageNearFull(): boolean {
    try {
      // Approximate total localStorage space (typically 5MB)
      const totalStorageSpace = 5 * 1024 * 1024;
      
      // Calculate current usage
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        const value = localStorage.getItem(key) || '';
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
  
  /**
   * Clean up old data from localStorage
   */
  cleanupLocalStorage(): void {
    try {
      // Find chunk-related keys
      const chunkKeys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // Add to removal list if it looks like a chunk or temp data
        if (key.includes('_chunk_')) {
          chunkKeys.push(key);
        }
      }
      
      // Remove all chunk keys
      console.log(`Cleaning up ${chunkKeys.length} chunk keys from localStorage`);
      chunkKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Failed to remove key ${key}:`, e);
        }
      });
    } catch (error) {
      console.error('Error cleaning localStorage:', error);
    }
  }
  
  /**
   * Force clean all old data to free up space
   */
  forceCleanAllOldData(): void {
    // First clean up all chunk data
    this.cleanupLocalStorage();
    
    // Then find and remove all duplicate or older items
    const keysToRemove: string[] = [];
    
    try {
      // Create a map of base keys (without chunk suffixes)
      const baseKeyMap = new Map<string, string[]>();
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // Skip current form data and important settings
        if (key.includes('auth') || key.includes('token') || 
            key.includes('session') || key.includes('current')) {
          continue;
        }
        
        // Extract base key without chunk info
        let baseKey = key;
        if (key.includes('_chunk_')) {
          baseKey = key.substring(0, key.indexOf('_chunk_'));
        }
        
        // Add to map, potentially replacing older entries
        if (!baseKeyMap.has(baseKey)) {
          baseKeyMap.set(baseKey, [key]);
        } else {
          baseKeyMap.get(baseKey)?.push(key);
        }
      }
      
      // For each base key, keep only the most important items
      baseKeyMap.forEach((keys, baseKey) => {
        if (keys.length > 1) {
          // Sort by priority (keep minimal and main keys)
          const minimalKey = keys.find(k => k.includes('minimal'));
          const mainKey = keys.find(k => k === baseKey);
          
          const keysToKeep: string[] = [];
          if (minimalKey) keysToKeep.push(minimalKey);
          if (mainKey) keysToKeep.push(mainKey);
          
          // Mark all other keys for removal
          keys.forEach(key => {
            if (!keysToKeep.includes(key)) {
              keysToRemove.push(key);
            }
          });
        }
      });
      
      // Remove marked keys
      console.log(`Removing ${keysToRemove.length} old/duplicate localStorage items`);
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Failed to remove key ${key}:`, e);
        }
      });
    } catch (error) {
      console.error('Error during force clean:', error);
    }
  }
  
  /**
   * Save documents to Firestore (cloud backup)
   * @param {Array} documents - Array of document objects
   * @param {string} formId - The form/listing ID
   * @returns {Promise<boolean>} - Success status
   */
  async saveDocumentsToFirestore(documents: DocumentMetadata[], formId: string): Promise<boolean> {
    if (!documents || !Array.isArray(documents)) return false;
    
    // Ensure formId is valid for Firestore
    if (!formId || formId === 'default' || formId === 'undefined' || formId === 'null') {
      console.warn('Invalid formId for Firestore, using user-documents collection instead');
      try {
        // Use a generic documents collection instead of a specific listing
        const userId = auth?.currentUser?.uid || 'anonymous';
        const docRef = doc(db, 'user-documents', userId);
        await setDoc(docRef, { 
          documents, 
          updatedAt: new Date().toISOString(),
          tempId: formId || 'default'
        });
        console.log(`Saved ${documents.length} documents to user-documents collection`);
        return true;
      } catch (error) {
        console.error('Error saving to user-documents collection:', error);
        return false;
      }
    }
    
    try {
      const docRef = doc(db, 'listings', formId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, { documents });
      } else {
        await setDoc(docRef, { 
          documents, 
          updatedAt: new Date().toISOString() 
        });
      }
      console.log(`Successfully saved ${documents.length} documents to Firestore`);
      return true;
    } catch (error) {
      console.error('Error saving documents to Firestore:', error);
      return false;
    }
  }
  
  /**
   * Get documents from Firestore
   * @param {string} formId - The form/listing ID
   * @returns {Promise<Array<DocumentMetadata>>} - Array of document objects
   */
  async getDocumentsFromFirestore(formId: string): Promise<DocumentMetadata[]> {
    // Ensure formId is valid for Firestore
    if (!formId || formId === 'default' || formId === 'undefined' || formId === 'null') {
      console.warn('Invalid formId for Firestore, trying user-documents collection');
      try {
        // Try to get from generic documents collection
        const userId = auth?.currentUser?.uid || 'anonymous';
        const docRef = doc(db, 'user-documents', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().documents) {
          const firestoreDocs = docSnap.data().documents;
          console.log(`Retrieved ${firestoreDocs.length} documents from user-documents collection`);
          return firestoreDocs;
        }
      } catch (error) {
        console.error('Error retrieving from user-documents collection:', error);
      }
      return [];
    }
    
    try {
      const docRef = doc(db, 'listings', formId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().documents) {
        const firestoreDocs = docSnap.data().documents;
        console.log(`Retrieved ${firestoreDocs.length} documents from Firestore`);
        
        // Save to IndexedDB for next time
        this.saveDocumentMetadata(firestoreDocs, formId).catch(console.error);
        
        return firestoreDocs;
      }
    } catch (error) {
      console.error('Error retrieving documents from Firestore:', error);
    }
    
    return [];
  }
  
  /**
   * Save data to Firebase
   * @param {Object} options - Options object
   * @param {Array} options.documents - Array of document objects
   * @param {Array} options.images - Array of image objects
   * @param {string} options.formId - The form/listing ID
   * @param {string} options.userId - The user ID
   * @returns {Promise<boolean>} - Success status
   */
  async saveToFirebase(options: {
    documents?: DocumentMetadata[];
    images?: any[];
    formId?: string;
    userId?: string;
  } = {}): Promise<boolean> {
    const { documents, images, formId, userId } = options;
    
    // Ensure we have at least one valid data type to save
    if (!documents && !images) {
      console.warn('No documents or images provided for saveToFirebase');
      return false;
    }
    
    // Ensure formId is valid for Firestore
    if (!formId || formId === 'default' || formId === 'undefined' || formId === 'null') {
      console.warn('Invalid formId for Firestore in saveToFirebase, using user-data collection');
      try {
        // Use a generic data collection instead
        const userIdToUse = userId || auth?.currentUser?.uid || 'anonymous';
        const docRef = doc(db, 'user-data', userIdToUse);
        
        const dataToSave = {
          updatedAt: new Date().toISOString(),
          tempId: formId || 'default'
        };
        
        if (documents) dataToSave.documents = documents;
        if (images) dataToSave.images = images;
        
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await updateDoc(docRef, dataToSave);
        } else {
          await setDoc(docRef, dataToSave);
        }
        
        console.log('Saved data to user-data collection');
        return true;
      } catch (error) {
        console.error('Error saving to user-data collection:', error);
        return false;
      }
    }
    
    try {
      const docRef = doc(db, 'listings', formId);
      const docSnap = await getDoc(docRef);
      
      const dataToSave = {
        updatedAt: new Date().toISOString(),
        updatedBy: userId || auth?.currentUser?.uid || 'unknown',
      };
      
      if (documents) dataToSave.documents = documents;
      if (images) dataToSave.images = images;
      
      if (docSnap.exists()) {
        await updateDoc(docRef, dataToSave);
      } else {
        await setDoc(docRef, dataToSave);
      }
      
      console.log(`Successfully saved data to Firestore for form ${formId}`);
      return true;
    } catch (error) {
      console.error('Error saving data to Firebase:', error);
      return false;
    }
  }
  
  /**
   * Revoke a temporary URL
   * @param {string} id - The ID of the object with the temp URL
   * @returns {void}
   */
  revokeTempUrl(id: string): void {
    try {
      // Check if we have this URL in the tempUrls map
      if (id) {
        const url = this.tempUrls.get(id);
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
          this.tempUrls.delete(id);
          console.log(`Revoked temp URL for ${id}`);
        }
      }
    } catch (error) {
      console.error('Error revoking temp URL:', error);
    }
  }
}

// Create and export singleton instance
const enhancedStorage = new EnhancedStorageService();
export default enhancedStorage; 