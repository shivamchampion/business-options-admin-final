import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, db } from "../config/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

/**
 * ListingStorageService - Professional service for handling listing images.
 * This service manages all storage operations for listing images, including:
 * - Uploading images to Firebase Storage
 * - Deleting images from Firebase Storage
 * - Managing image metadata in Firestore
 * - Handling image placeholders for recovery after page refreshes
 */
class ListingStorageService {
  constructor() {
    // Base path for all listing images
    this.STORAGE_BASE_PATH = "listings";
    
    // Collections and document paths
    this.IMAGE_METADATA_COLLECTION = "listingImageMetadata";
  }

  /**
   * Generates a unique path for a listing image
   * @param {string} formId - The form ID for the listing
   * @param {string} originalFilename - Original filename to preserve in path
   * @returns {string} - The unique storage path
   */
  generateImagePath(formId, originalFilename) {
    // Generate a unique ID for the image
    const uniqueId = uuidv4().slice(0, 8);
    
    // Clean the original filename to remove special characters and spaces
    const cleanFilename = originalFilename.replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
    
    // Build the path: listings/formId/uniqueId_cleanFilename
    return `${this.STORAGE_BASE_PATH}/${formId}/${uniqueId}_${cleanFilename}`;
  }

  /**
   * Uploads an image to Firebase Storage
   * @param {File} file - The file to upload
   * @param {string} formId - The form ID for the listing
   * @param {Function} onProgress - Progress callback (0-100)
   * @param {Function} onComplete - Completion callback with URL and path
   * @param {Function} onError - Error callback with error message
   */
  uploadImage(file, formId, onProgress, onComplete, onError) {
    try {
      // Generate the storage path for this file
      const imagePath = this.generateImagePath(formId, file.name);
      
      // Create the upload task
      const storageRef = ref(storage, imagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Set up the event observers
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Calculate and report progress
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          if (onProgress) onProgress(progress);
        },
        (error) => {
          // Handle failed uploads
          console.error("Upload failed:", error);
          let errorMessage = "Failed to upload image. Please try again.";
          
          // Provide more specific error messages based on error code
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = "You don't have permission to upload this file.";
              break;
            case 'storage/canceled':
              errorMessage = "Upload was cancelled.";
              break;
            case 'storage/quota-exceeded':
              errorMessage = "Storage quota exceeded. Contact support.";
              break;
            case 'storage/invalid-checksum':
              errorMessage = "File was corrupted during upload. Please try again.";
              break;
            case 'storage/server-file-wrong-size':
              errorMessage = "File size mismatch. Please try again.";
              break;
            default:
              // Leave the generic message
              break;
          }
          
          if (onError) onError(errorMessage, error);
        },
        async () => {
          try {
            // Handle successful uploads
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            if (onComplete) {
              onComplete({
                url: downloadURL,
                path: imagePath,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                uploadedAt: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error("Error getting download URL:", error);
            if (onError) onError("Failed to get image URL. Please try again.", error);
          }
        }
      );

      // Return the upload task for potential cancellation
      return uploadTask;
    } catch (error) {
      console.error("Error initiating upload:", error);
      if (onError) onError("Failed to start upload. Please try again.", error);
      return null;
    }
  }

  /**
   * Deletes an image from Firebase Storage
   * @param {string} imagePath - The storage path of the image
   * @returns {Promise<void>}
   */
  async deleteImage(imagePath) {
    if (!imagePath) {
      console.warn("No image path provided for deletion");
      return Promise.reject("No image path provided");
    }

    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      return Promise.resolve();
    } catch (error) {
      console.error("Error deleting image:", error);
      return Promise.reject(error);
    }
  }

  /**
   * Saves image metadata to Firestore for recovery after page refreshes
   * @param {Array} images - Array of image objects
   * @param {string} formId - The form ID
   * @returns {Promise<void>}
   */
  async saveImageMetadata(images, formId) {
    if (!formId) {
      console.warn("No form ID provided for saving image metadata");
      return Promise.reject("No form ID provided");
    }

    try {
      // Create a clean copy of the images array with necessary data only
      const metadataToSave = images.map(image => ({
        url: image.url || null,
        path: image.path || null,
        name: image.name || null,
        featured: !!image.featured,
        isPlaceholder: !!image.isPlaceholder,
        timestamp: image.uploadedAt || new Date().toISOString(),
      }));

      // Save to Firestore
      const metadataRef = doc(db, this.IMAGE_METADATA_COLLECTION, formId);
      await setDoc(metadataRef, { images: metadataToSave, updatedAt: new Date().toISOString() });
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error saving image metadata:", error);
      return Promise.reject(error);
    }
  }

  /**
   * Retrieves image metadata from Firestore
   * @param {string} formId - The form ID
   * @returns {Promise<Array>} - Array of image objects
   */
  async getImageMetadata(formId) {
    if (!formId) {
      console.warn("No form ID provided for retrieving image metadata");
      return Promise.reject("No form ID provided");
    }

    try {
      const metadataRef = doc(db, this.IMAGE_METADATA_COLLECTION, formId);
      const metadataSnap = await getDoc(metadataRef);
      
      if (metadataSnap.exists()) {
        return metadataSnap.data().images || [];
      }
      
      return [];
    } catch (error) {
      console.error("Error retrieving image metadata:", error);
      return Promise.reject(error);
    }
  }

  /**
   * Creates placeholder objects for images that need to be re-uploaded
   * @param {Array} metadata - Array of image metadata objects
   * @returns {Array} - Array of image objects with placeholders where needed
   */
  createPlaceholders(metadata) {
    if (!metadata || !Array.isArray(metadata)) {
      return [];
    }

    return metadata.map(image => {
      // If the image has a URL and path, it's a valid image
      if (image.url && image.path) {
        return image;
      }
      
      // Otherwise, it's a placeholder that needs re-upload
      return {
        ...image,
        isPlaceholder: true,
      };
    });
  }
}

// Create and export a singleton instance
const listingStorage = new ListingStorageService();
export default listingStorage; 