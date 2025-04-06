// Export Firebase services
export { db, auth, storage } from './firebase';

// Export storage services
export { default as listingStorage } from './ListingStorageService';
export { default as enhancedStorage } from './EnhancedStorageService';

// Export form persistence service from the correct location
export { default as formPersistenceService } from '../services/formPersistenceService';

// Export file utilities
export const uploadFileWithProgress = async (file, path, options = {}) => {
  return enhancedStorage.uploadFile(file, path, options);
};

export const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    // Create download link and trigger download
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
    
    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    return false;
  }
};

// Export helper functions
export * from './utils'; 