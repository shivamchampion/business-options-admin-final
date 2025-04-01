import localforage from 'localforage';

/**
 * FileStorageService - A service for reliable file storage in the browser
 * Uses IndexedDB via localforage for improved storage capacity and reliability
 */
class FileStorageService {
  constructor(namespace = 'listing-form') {
    // Create separate instances for different data types
    this.metadataStore = localforage.createInstance({
      name: namespace,
      storeName: 'metadata'
    });
    
    this.fileStore = localforage.createInstance({
      name: namespace,
      storeName: 'files'
    });
  }
  
  /**
   * Save metadata
   * @param {string} key - The storage key
   * @param {Array|Object} metadata - The metadata to store
   * @returns {Promise<boolean>} Success status
   */
  async saveMetadata(key, metadata) {
    try {
      await this.metadataStore.setItem(key, metadata);
      return true;
    } catch (error) {
      console.error('Error saving metadata:', error);
      return false;
    }
  }
  
  /**
   * Get stored metadata
   * @param {string} key - The storage key
   * @returns {Promise<Array|Object|null>} The stored metadata or null
   */
  async getMetadata(key) {
    try {
      return await this.metadataStore.getItem(key);
    } catch (error) {
      console.error('Error getting metadata:', error);
      return null;
    }
  }
  
  /**
   * Save a file
   * @param {string} id - Unique identifier for the file
   * @param {File} file - The file to store
   * @returns {Promise<boolean>} Success status
   */
  async saveFile(id, file) {
    try {
      // Store the file directly
      await this.fileStore.setItem(id, file);
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }
  
  /**
   * Get a stored file
   * @param {string} id - The file identifier
   * @returns {Promise<File|null>} The file or null
   */
  async getFile(id) {
    try {
      return await this.fileStore.getItem(id);
    } catch (error) {
      console.error('Error getting file:', error);
      return null;
    }
  }
  
  /**
   * Delete a file
   * @param {string} id - The file identifier
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(id) {
    try {
      await this.fileStore.removeItem(id);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  
  /**
   * Clear all stored data for a specific key
   * @param {string} key - The metadata key to clear
   */
  async clearMetadata(key) {
    try {
      await this.metadataStore.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error clearing metadata:', error);
      return false;
    }
  }
  
  /**
   * Check if storage is available
   * @returns {Promise<boolean>} Whether storage is available
   */
  async isStorageAvailable() {
    try {
      // Test storage by setting and getting a small item
      await this.metadataStore.setItem('__test__', 'test');
      const result = await this.metadataStore.getItem('__test__');
      await this.metadataStore.removeItem('__test__');
      return result === 'test';
    } catch (error) {
      console.error('Storage not available:', error);
      return false;
    }
  }
}

// Create a singleton instance
const fileStorage = new FileStorageService();
export default fileStorage;