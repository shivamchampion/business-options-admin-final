import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Upload,
  AlertTriangle,
  Star,
  Trash2,
  Info,
  AlertCircle,
  HelpCircle,
  ImageOff,
  Check,
  RefreshCw,
  UploadCloud,
  Loader,
  Trash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { enhancedStorage } from '@/lib';
import ToastManager, { TOAST_IDS } from "@/utils/ToastManager";

/**
 * Simple circular progress indicator
 * @param {Object} props Component props
 * @param {number} props.value Current progress value (0-100)
 * @returns {JSX.Element} CircularProgress component
 */
const CircularProgress = ({ value = 0 }) => {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 10; // r = 10, circumference = 2πr
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-10 h-10" viewBox="0 0 24 24">
        {/* Background circle */}
        <circle
          className="text-gray-300"
          strokeWidth="2"
          stroke="currentColor"
          fill="transparent"
          r="10"
          cx="12"
          cy="12"
        />
        {/* Progress circle */}
        <circle
          className="text-blue-600"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="10"
          cx="12"
          cy="12"
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
        />
      </svg>
      <span className="absolute text-xs font-semibold text-blue-700">
        {Math.round(normalizedValue)}%
      </span>
    </div>
  );
};

/**
 * Tooltip component for UI help elements
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child elements
 * @param {string} props.content Tooltip content
 * @returns {JSX.Element} Tooltip component
 */
const Tooltip = ({ content, children }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute z-50 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible 
        transform -translate-x-1/2 left-1/2 bottom-full mb-2 transition-all duration-200 ease-in-out pointer-events-none">
        <div className="relative bg-gray-800 text-white text-sm rounded-md p-2.5 text-center shadow-lg">
          {content}
          <div className="absolute w-2.5 h-2.5 bg-gray-800 transform rotate-45 -bottom-[5px] left-1/2 -translate-x-1/2"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Function to generate a fallback image URL for broken images
 * @returns {string} Data URL for fallback image
 */
const getImageFallbackUrl = () => {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off"%3E%3Cline x1="2" y1="2" x2="22" y2="22"%3E%3C/line%3E%3Cpath d="M10.41 10.41a2 2 0 1 1-2.83-2.83"%3E%3C/path%3E%3Cline x1="13.5" y1="13.5" x2="6" y2="21"%3E%3C/line%3E%3Cpath d="M18 12l-7 9"%3E%3C/path%3E%3Cpath d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59"%3E%3C/path%3E%3Cpath d="M21 15V5a2 2 0 0 0-2-2H9"%3E%3C/path%3E%3C/svg%3E';
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Creates a placeholder image object
 * @param {number} index Index number for the placeholder
 * @param {Object} metadata Optional metadata to include
 * @returns {Object} Placeholder image object
 */
const createPlaceholderImage = (index, metadata = {}) => {
  return {
    id: metadata.id || `placeholder-${index}`,
    name: metadata.name || `Image ${index + 1}`,
    isPlaceholder: true,
    url: getImageFallbackUrl(),
    preview: getImageFallbackUrl(),
    type: metadata.type || 'image/svg+xml',
    size: metadata.size || 0
  };
};

/**
 * Error boundary for image rendering errors
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child elements
 * @param {React.ReactNode} props.fallback Fallback UI when error occurs
 * @returns {JSX.Element} Error boundary component
 */
const ImageErrorBoundary = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = (event) => {
      // Only handle image errors
      if (event.target.tagName === 'IMG') {
        setHasError(true);
        event.preventDefault();
      }
    };
    
    // Add global error handler
    window.addEventListener('error', handleError, true);
    
    return () => {
      window.removeEventListener('error', handleError, true);
    };
  }, []);
  
  if (hasError) {
    return fallback;
  }
  
  return children;
};

/**
 * Media Upload Component
 * Handles image upload, validation, and management for listings
 * 
 * @param {Object} props Component props
 * @param {Array} props.uploadedImages Images passed from parent
 * @param {Function} props.onImageUpload Callback when images are uploaded
 * @param {Function} props.onImageDelete Callback when images are deleted
 * @param {Function} props.onSetFeatured Callback when featured image is set
 * @param {number} props.featuredImageIndex Index of featured image
 * @param {boolean} props.submitAttempted Whether form submission was attempted
 * @param {boolean} props.isLoading Loading state
 * @param {string} props.formId Form/listing ID
 * @returns {JSX.Element} MediaUpload component
 */
const MediaUpload = ({
  uploadedImages = [],
  onImageUpload,
  onImageDelete,
  onSetFeatured,
  featuredImageIndex = 0,
  submitAttempted = false,
  isLoading = false,
  formId = 'default'
}) => {
  // Form context for validation
  const { setValue, register, formState: { errors }, trigger } = useFormContext();

  // Component state
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validated, setValidated] = useState(false);
  const [needsReupload, setNeedsReupload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [failedImageLoads, setFailedImageLoads] = useState({});

  // Refs
  const imageInputRef = useRef(null);
  const isMounted = useRef(true);
  const uploadPromisesRef = useRef([]);
  const loadingToastIdsRef = useRef([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      
      // Dismiss any loading toasts to prevent them from getting stuck
      ToastManager.dismissAllLoading();
      
      // Also explicitly dismiss any tracked loading toasts
      if (loadingToastIdsRef.current.length > 0) {
        loadingToastIdsRef.current.forEach(id => {
          ToastManager.dismiss(id);
        });
        loadingToastIdsRef.current = [];
      }
      
      // Cleanup any file uploads still in progress
      if (uploadPromisesRef.current.length > 0) {
        console.log('Cleaning up incomplete uploads on unmount');
      }
    };
  }, []);

  // Register validation field on mount
  useEffect(() => {
    register('mediaValidation', {
      required: 'You must upload at least 3 images'
    });
  }, [register]);

  // Initialize images from props or restore from storage
  useEffect(() => {
    if (!isMounted.current) return;

    const initializeImages = async () => {
      // Track initial load to prevent duplicate success messages
      window._isInitialLoad = true;

      // Case 1: Use images passed from parent component
      if (uploadedImages && uploadedImages.length > 0) {
        // Process images to ensure consistent format
        const processedImages = uploadedImages.map((img, idx) => ({
          ...img,
          id: img.id || `img-${Date.now()}-${idx}`,
          url: img.url || img.preview || '',
          preview: img.preview || img.url || '',
          name: img.name || `Image ${idx + 1}`,
          type: img.type || 'image/jpeg'
        }));

        // Update state
        setImages(processedImages);
        setValue('mediaValidation', processedImages.length >= 3);

        // Save for persistence
        await enhancedStorage.saveImageMetadata(processedImages, formId);

        // Set featured image if available from storage
        const savedFeaturedIndex = enhancedStorage.getFeaturedImageIndex(formId);
        if (savedFeaturedIndex !== featuredImageIndex && onSetFeatured) {
          onSetFeatured(savedFeaturedIndex, true);
        }
      } 
      // Case 2: Restore from local storage with Firestore fallback
      else {
        try {
          // Use the fallback version that tries both localStorage and Firestore
          const savedMeta = await enhancedStorage.getImageMetadata(formId);

        if (savedMeta && savedMeta.length > 0) {
          const restoredImages = [];
          let needReupload = false;

          // Process each saved image
          for (let i = 0; i < savedMeta.length; i++) {
            const meta = savedMeta[i];

              // Check if placeholder or missing data
            if (meta.isPlaceholder || (!meta.path && !meta.url)) {
              restoredImages.push(createPlaceholderImage(i, meta));
              needReupload = true;
              continue;
            }

              // Otherwise it's a valid image
            restoredImages.push({
              id: meta.id,
              name: meta.name,
              type: meta.type,
              size: meta.size,
              path: meta.path,
              url: meta.url,
              preview: meta.url
            });
          }

            // Show reupload warning if needed
          if (needReupload) {
            setNeedsReupload(true);
              const count = restoredImages.filter(img => img.isPlaceholder).length;
              ToastManager.error(
                `Please re-upload ${count} image(s) that need to be restored`, 
                TOAST_IDS.REUPLOAD_ERROR
              );
            }
            
            // Update state
          setImages(restoredImages);

            // Update validation state
          const usableCount = restoredImages.filter(img => !img.isPlaceholder).length;
          setValue('mediaValidation', usableCount >= 3);

            // Tell parent about restored images
          const validImages = restoredImages.filter(img => !img.isPlaceholder);
          if (validImages.length > 0 && onImageUpload) {
              onImageUpload(validImages, true);
          }

            // Restore featured image if available
          const savedFeaturedIndex = enhancedStorage.getFeaturedImageIndex(formId);
          if (savedFeaturedIndex !== featuredImageIndex && onSetFeatured) {
              onSetFeatured(savedFeaturedIndex, true);
            }
          }
        } catch (error) {
          console.error("Failed to retrieve image metadata:", error);
          ToastManager.error(
            "Failed to load saved images. Please try uploading them again.", 
            TOAST_IDS.GENERIC_ERROR
          );
        }
      }
      
      // Reset initial load flag
      window._isInitialLoad = false;
    };

    initializeImages();
  }, [uploadedImages, setValue, formId, onImageUpload, onSetFeatured, featuredImageIndex]);

  // Form validation on submit attempt
  useEffect(() => {
    if (submitAttempted && !validated) {
      validateImages();
      setValidated(true);
      
      // Clear any failed loads when validating
      if (validationErrors.length > 0) {
        setFailedImageLoads({});
      }
    }
  }, [submitAttempted, validationErrors.length, validated]);
  
  /**
   * Validates that enough images have been uploaded
   * @returns {boolean} Validation result
   */
  const validateImages = useCallback(() => {
    const errors = [];

    // Count usable (non-placeholder) images
    const usableImages = images.filter(img => !img.isPlaceholder);

    // Check minimum image count
    if (usableImages.length < 3) {
      errors.push('You must upload at least 3 images to continue.');

      if (needsReupload) {
        errors.push('Some images were lost during page refresh and need to be re-uploaded.');
      }
    }

    // Update state
    setValidationErrors(errors);
    setValue('mediaValidation', usableImages.length >= 3);
    return errors.length === 0;
  }, [images, needsReupload, setValue]);

  /**
   * Set featured image
   * @param {number} index Index of image to set as featured
   */
  const handleSetFeatured = useCallback((index) => {
    if (index < 0 || index >= images.length) {
      console.warn(`Invalid featured image index: ${index}`);
      return;
    }
    
    // Call parent handler
    if (onSetFeatured) {
      onSetFeatured(index);
    }
    
    // Save to storage
    enhancedStorage.saveFeaturedImageIndex(index, formId);
    
    // Show success message
    if (!window._isInitialLoad) {
      ToastManager.success('Featured image updated', TOAST_IDS.FEATURED_SUCCESS);
    }
  }, [images.length, onSetFeatured, formId]);

  /**
   * Replace placeholders with actual images
   * @param {Object} newImage New image to replace a placeholder
   * @returns {Promise<boolean>} Whether a placeholder was replaced
   */
  const replacePlaceholder = useCallback(async (newImage) => {
    // Find first placeholder
    const placeholderIndex = images.findIndex(img => img.isPlaceholder);
    if (placeholderIndex === -1) return false;

    // Create new array with placeholder replaced
    const newImages = [...images];
    newImages[placeholderIndex] = newImage;

    // Update state
    setImages(newImages);

    // Handle if this was featured image
    if (placeholderIndex === featuredImageIndex) {
      handleSetFeatured(placeholderIndex);
    }

    // Save metadata
    await enhancedStorage.saveImageMetadata(newImages, formId);

    return true;
  }, [images, featuredImageIndex, formId, handleSetFeatured]);

  /**
   * Delete an image
   * @param {number} index Index of image to delete
   */
  const handleDeleteImage = useCallback(async (index) => {
    // Dismiss existing toasts
    ToastManager.dismissAll();
    
    // Set flag to prevent duplicate toasts
    window._lastDeleteOperation = Date.now();
    
    // Show loading toast
    ToastManager.loading('Deleting image...', TOAST_IDS.DELETE_SUCCESS);

    // Get the image to delete
    const imageToDelete = images[index];
    if (!imageToDelete) {
      console.warn("No image at index:", index);
      ToastManager.dismiss(TOAST_IDS.DELETE_SUCCESS);
      return;
    }

    try {
      // Delete from Firebase if not a placeholder
      if (!imageToDelete.isPlaceholder && imageToDelete.path) {
        try {
          await enhancedStorage.deleteFile(imageToDelete.path);
        } catch (e) {
          console.error("Error deleting from Firebase:", e);
          // Continue with local deletion even if Firebase fails
        }
      }

      // Revoke temp URL if present
      if (imageToDelete.tempUrl) {
        URL.revokeObjectURL(imageToDelete.tempUrl);
      }

      // Create new array without deleted image
      const newImages = [...images];
      newImages.splice(index, 1);

      // Update state
      setImages(newImages);

      // Notify parent
      if (onImageDelete) {
        onImageDelete(imageToDelete, true);
      }

      // Handle featured image changes
      let newFeaturedIndex = featuredImageIndex;

      if (index === featuredImageIndex) {
        // If deleting featured image, set first remaining as featured
        if (newImages.length > 0) {
          newFeaturedIndex = 0;
        } else {
          newFeaturedIndex = -1;
        }
        handleSetFeatured(newFeaturedIndex);
      } else if (index < featuredImageIndex) {
        // If deleting before featured image, decrement index
        newFeaturedIndex = featuredImageIndex - 1;
        handleSetFeatured(newFeaturedIndex);
      }

      // Update validation
      await enhancedStorage.saveImageMetadata(newImages, formId);
      
      // Update validation
      const usableCount = newImages.filter(img => !img.isPlaceholder).length;
      setValue('mediaValidation', usableCount >= 3);
      validateImages();

      // Show success toast
      ToastManager.success('Image deleted successfully', TOAST_IDS.DELETE_SUCCESS);
    } catch (error) {
      console.error("Error deleting image:", error);
      ToastManager.error(
        `Failed to delete image: ${error.message}`,
        TOAST_IDS.GENERIC_ERROR
      );
    }
  }, [images, featuredImageIndex, handleSetFeatured, setValue, 
      validateImages, formId, onImageDelete]);

  /**
   * Enhanced error messaging based on filename patterns
   * @param {string} filename Filename to analyze
   * @param {string} defaultMessage Default error message
   * @returns {string} Enhanced error message
   */
  const getEnhancedErrorMessage = useCallback((filename, defaultMessage) => {
    const lowerName = filename.toLowerCase();
    
    // Handle loading or corruption errors specially
    if (defaultMessage.includes('Unable to load') || 
        defaultMessage.includes('Unable to read')) {
      
      // Check for screenshots with standard extensions
      if ((lowerName.includes('screenshot') || 
           lowerName.includes('screen') || 
           lowerName.includes('capture') || 
           lowerName.match(/scr(ee)?n_?shot/)) && 
          (lowerName.endsWith('.png') || 
           lowerName.endsWith('.jpg') || 
           lowerName.endsWith('.jpeg'))) {
        return 'This image appears to be corrupted or in an invalid format. Try re-saving it as a standard PNG or JPEG file.';
      }
      
      // Check for screenshots with unsupported extensions
      if (lowerName.includes('screenshot') || 
          lowerName.includes('screen') || 
          lowerName.includes('capture') || 
          lowerName.match(/scr(ee)?n_?shot/)) {
        return 'This screenshot format is not supported. Please save it as a JPEG or PNG file first.';
      }
      
      // Check for unsupported file extensions
      if (lowerName.endsWith('.webp') || 
          lowerName.endsWith('.gif') || 
          lowerName.endsWith('.bmp') || 
          lowerName.endsWith('.tiff') || 
          lowerName.endsWith('.tif') || 
          lowerName.endsWith('.svg')) {
        return `File format not supported. Only JPEG and PNG are accepted. This appears to be a ${lowerName.split('.').pop().toUpperCase()} file.`;
      }
    }
    
    return defaultMessage;
  }, []);
  
  /**
   * Check if a file has the same name as an existing image
   * @param {File} file File to check
   * @returns {boolean} True if a duplicate exists
   */
  const checkForDuplicateFilename = useCallback((file) => {
    // Find existing image with same name
    return images.some(img => 
      img.name === file.name && 
      !img.isPlaceholder
    );
  }, [images]);
  
  /**
   * Validate image dimensions
   * @param {File} file File to validate
   * @returns {Promise<boolean>} Validation result
   */
  const validateDimensions = useCallback((file) => {
    return new Promise((resolve, reject) => {
      try {
        // Create URL for image
        const url = URL.createObjectURL(file);
        
        // Create image element
        const img = new Image();
        
        // Set timeout for loading
        const timeout = setTimeout(() => {
          URL.revokeObjectURL(url);
          
          // Store this in failed loads
          setFailedImageLoads(prev => ({
            ...prev,
            [file.name]: {
              error: 'timeout',
              message: 'Image took too long to load. The file may be corrupted.'
            }
          }));
          
          // Fail validation
          reject(new Error('Unable to load this image. The file may be corrupted.'));
        }, 20000);
        
        // Handle load event
        img.onload = () => {
          // Clear timeout
          clearTimeout(timeout);
          
          // Check dimensions
          const minWidth = 800;
          const minHeight = 600;
          
          if (img.width < minWidth || img.height < minHeight) {
            // Cleanup
            URL.revokeObjectURL(url);
            
            // Store failure
            setFailedImageLoads(prev => ({
              ...prev,
              [file.name]: {
                error: 'dimensions',
                message: `Image dimensions must be at least ${minWidth}x${minHeight} pixels.`,
                width: img.width,
                height: img.height
              }
            }));
            
            // Fail validation
            reject(new Error(`Image dimensions must be at least ${minWidth}x${minHeight} pixels. This image is ${img.width}x${img.height}.`));
          } else {
            // Check if alpha channel - warn but don't block
            // This is a heuristic check and not perfect
            if (file.type === 'image/png') {
              // For PNGs, we can't reliably detect transparency here
              // But we can warn about potential issues with this format
              console.log('PNG format detected. Checking file integrity.');
            }
            
            // All checks passed
            URL.revokeObjectURL(url);
            resolve(true);
          }
        };
        
        // Handle error event
        img.onerror = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(url);
          
          // Store failure
          setFailedImageLoads(prev => ({
            ...prev,
            [file.name]: {
              error: 'load',
              message: 'Unable to load this image. The file may be corrupted.'
            }
          }));
          
          // Check PNG errors specifically for better guidance
          if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
            reject(new Error('Unable to read this PNG file. It may be corrupted or in screenshot format not supported.'));
          } else {
            reject(new Error('Unable to read this file. It may be corrupted or in a format not supported.'));
          }
        };
        
        // Start loading
        img.src = url;
      } catch (error) {
        // Handle unexpected errors
        setFailedImageLoads(prev => ({
          ...prev,
          [file.name]: {
            error: 'unknown',
            message: error.message || 'Unknown error validating image.'
          }
        }));
        
        reject(error);
      }
    });
  }, []);

  /**
   * Simulates and tracks upload progress
   * @param {string} uniqueId Unique identifier for the upload
   * @param {string} fileName Name of the file being uploaded
   * @param {Promise} uploadPromise Promise from the upload operation
   */
  const simulateProgress = useCallback((uniqueId, fileName, uploadPromise) => {
    // Use uniqueId instead of filename to track progress
    const progressKey = uniqueId;
    
    // Initialize progress at 0
      setUploadProgress(prev => ({
        ...prev,
      [progressKey]: { 
        progress: 0,
        fileName
      } 
    }));
    
    // Create interval to simulate gradual progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[progressKey]?.progress || 0;
        
        // Gradually increase but never reach 100% until complete
        if (current < 90) {
          return { 
            ...prev, 
            [progressKey]: {
              ...prev[progressKey],
              progress: current + Math.random() * 10
            }
          };
        }
        
        return prev;
      });
    }, 500);
    
    // Handle upload completion
    uploadPromise
      .then(() => {
        // Set progress to 100%
        setUploadProgress(prev => ({ 
          ...prev, 
          [progressKey]: {
            ...prev[progressKey],
            progress: 100
          }
        }));
        
        // Clear progress after delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const { [progressKey]: _, ...rest } = prev;
            return rest;
          });
        }, 1000);
          })
          .catch(error => {
        console.error(`Error uploading ${fileName}:`, error);
  
        // Clear progress
            setUploadProgress(prev => {
          const { [progressKey]: _, ...rest } = prev;
          return rest;
        });
      })
      .finally(() => {
        clearInterval(interval);
      });
  }, []);
  
  /**
   * Open file dialog programmatically
   */
  const handleOpenFileDialog = useCallback(() => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  }, []);
  
  /**
   * Get usable (non-placeholder) images count
   * @returns {number} Number of usable images
   */
  const getUsableImagesCount = useCallback(() => {
    return images.filter(img => !img.isPlaceholder).length;
  }, [images]);
  
  /**
   * Render form completion indicator
   * @returns {JSX.Element} Completion indicator component
   */
  const renderCompletionIndicator = useCallback(() => {
    const usableCount = getUsableImagesCount();
    const isComplete = usableCount >= 3;

    return (
      <div className={cn(
        "rounded-full px-3 py-1 text-xs font-medium flex items-center",
        isComplete ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
      )}>
        {isComplete ? (
          <Check className="h-3 w-3 mr-1" />
        ) : (
          <AlertTriangle className="h-3 w-3 mr-1" />
        )}
        {isComplete ? "Complete" : `Need ${3 - usableCount} more`}
      </div>
    );
  }, [getUsableImagesCount]);

  /**
   * Handle file selection from input
   * @param {Event} event - Change event from file input
   */
  const handleFileSelect = useCallback(async (event) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    // Dismiss existing toasts
    ToastManager.dismissAll();
    
    try {
      const files = Array.from(event.target.files);
      
      // Enforce max files limit (10 total including existing)
      const availableSlots = 10 - images.filter(img => !img.isPlaceholder).length;
      const filesToProcess = files.slice(0, availableSlots);
      
      if (filesToProcess.length === 0) {
        ToastManager.info('Maximum number of images already uploaded (10)', TOAST_IDS.UPLOAD_LIMIT);
        return;
      }
      
      if (filesToProcess.length < files.length) {
        ToastManager.info(
          `Only processing ${filesToProcess.length} images - max 10 allowed total`, 
          TOAST_IDS.UPLOAD_LIMIT
        );
      }
      
      // Set uploading state
      setIsUploading(true);
      
      // Show loading toast
      const toastId = ToastManager.loading(
        `Uploading ${filesToProcess.length} image${filesToProcess.length > 1 ? 's' : ''}...`,
        TOAST_IDS.UPLOAD_SUCCESS
      );
      loadingToastIdsRef.current.push(toastId);
      
      // Validate and upload files
      const validationPromises = [];
      const uploadPromises = [];
      const newImages = [];
      const validationErrors = [];
      const duplicates = [];
      
      // First pass - check for basic errors and duplicates
      for (const file of filesToProcess) {
        // Check file type
        if (!file.type.match(/image\/(jpeg|jpg|png)/i)) {
          validationErrors.push(`${file.name}: Only JPG and PNG images are supported.`);
          continue;
        }
        
        // Check file size
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          validationErrors.push(`${file.name}: File size exceeds 5MB limit.`);
          continue;
        }
        
        // Check for duplicates
        if (checkForDuplicateFilename(file)) {
          duplicates.push(file.name);
          continue;
        }
        
        // Add to validation queue
        validationPromises.push(
          validateDimensions(file)
            .then(() => ({ file, valid: true }))
            .catch(error => ({ 
              file, 
              valid: false,
              error: getEnhancedErrorMessage(file.name, error.message) 
            }))
        );
      }
      
      // Wait for all validation to complete
      const validationResults = await Promise.all(validationPromises);
      
      // Process results - upload valid files
      for (const result of validationResults) {
        if (result.valid) {
          // Create unique ID for tracking this upload
          const uniqueId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Prepare upload path
          const timestamp = Date.now();
          const userId = auth?.currentUser?.uid || 'anonymous';
          const sanitizedName = result.file.name
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase();
          
          const uploadPath = `listings/${formId}/images/${timestamp}_${sanitizedName}`;
          
          // Create upload promise
          const uploadPromise = enhancedStorage.uploadFile(
            result.file, 
            uploadPath,
            { contentType: result.file.type }
          );
          
          // Track progress
          simulateProgress(uniqueId, result.file.name, uploadPromise);
          
          // Store promise for tracking
          uploadPromises.push(
            uploadPromise
              .then(metadata => {
                // Create image object
                const newImage = {
                  id: `img_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
                  file: result.file,
                  name: result.file.name,
                  size: result.file.size,
                  type: result.file.type,
                  path: metadata.path,
                  url: metadata.url,
                  preview: metadata.url,
                  uploaded: new Date().toISOString()
                };
                
                // Add to new images array
                newImages.push(newImage);
                
                return newImage;
              })
              .catch(error => {
                console.error(`Error uploading ${result.file.name}:`, error);
                validationErrors.push(`Failed to upload ${result.file.name}: ${error.message}`);
                return null;
              })
          );
        } else {
          // Store validation error
          validationErrors.push(`${result.file.name}: ${result.error}`);
        }
      }
      
      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter(Boolean);
      
      // Update state with new images
      if (successfulUploads.length > 0) {
        // If we have placeholders, replace them first
        let remainingImages = [...successfulUploads];
        const placeholders = images.filter(img => img.isPlaceholder);
        
        if (placeholders.length > 0 && remainingImages.length > 0) {
          // Create a new array with placeholders replaced
          const updatedImages = [...images];
          
          for (let i = 0; i < placeholders.length && remainingImages.length > 0; i++) {
            const placeholderIndex = images.findIndex(img => img.isPlaceholder);
            if (placeholderIndex !== -1) {
              updatedImages[placeholderIndex] = remainingImages.shift();
            }
          }
          
          // Add any remaining new images
          const finalImages = [...updatedImages, ...remainingImages];
          
          // Update state
          setImages(finalImages);
          
          // Update validation
          const usableCount = finalImages.filter(img => !img.isPlaceholder).length;
          setValue('mediaValidation', usableCount >= 3);
          
          // Notify parent
          if (onImageUpload) {
            onImageUpload(finalImages.filter(img => !img.isPlaceholder));
          }
          
          // Save to storage
          await enhancedStorage.saveImageMetadata(finalImages, formId);
        } else {
          // Just append new images
          const updatedImages = [...images, ...successfulUploads];
          
          // Update state
          setImages(updatedImages);
          
          // Update validation
          const usableCount = updatedImages.filter(img => !img.isPlaceholder).length;
          setValue('mediaValidation', usableCount >= 3);
          
          // Notify parent
          if (onImageUpload) {
            onImageUpload(updatedImages.filter(img => !img.isPlaceholder));
          }
          
          // Save to storage
          await enhancedStorage.saveImageMetadata(updatedImages, formId);
        }
        
        // Set featured image if none set yet
        if (featuredImageIndex === -1 && successfulUploads.length > 0) {
          handleSetFeatured(images.length); // Index of first new image
        }
      }
      
      // Reset the file input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      
      // Show results
      if (successfulUploads.length > 0) {
        ToastManager.success(
          `Successfully uploaded ${successfulUploads.length} image${successfulUploads.length !== 1 ? 's' : ''}`,
          TOAST_IDS.UPLOAD_SUCCESS
        );
        
        // Run validation
        validateImages();
      } else {
        ToastManager.dismiss(TOAST_IDS.UPLOAD_SUCCESS);
      }
      
      // Show errors if any
      if (validationErrors.length > 0) {
        // Group similar errors for cleaner display
        const errorGroups = {};
        
        validationErrors.forEach(error => {
          const match = error.match(/^(.*?):\s*(.*?)$/);
          if (match) {
            const [, filename, message] = match;
            if (!errorGroups[message]) {
              errorGroups[message] = [filename];
            } else {
              errorGroups[message].push(filename);
            }
          } else {
            if (!errorGroups['Other errors']) {
              errorGroups['Other errors'] = [error];
            } else {
              errorGroups['Other errors'].push(error);
            }
          }
        });
        
        // Format error message
        let errorMsg = 'Some images couldn\'t be uploaded:\n';
        
        Object.entries(errorGroups).forEach(([message, filenames]) => {
          if (filenames.length <= 2) {
            errorMsg += `• ${filenames.join(', ')}: ${message}\n`;
          } else {
            errorMsg += `• ${filenames.length} files: ${message}\n`;
          }
        });
        
        ToastManager.error(errorMsg, TOAST_IDS.UPLOAD_ERROR);
      }
      
      // Show duplicates warning if any
      if (duplicates.length > 0) {
        ToastManager.warn(
          `Skipped ${duplicates.length} duplicate file${duplicates.length !== 1 ? 's' : ''}`,
          TOAST_IDS.DUPLICATE_WARNING
        );
      }
    } catch (error) {
      console.error('Error handling file upload:', error);
      ToastManager.error(
        `Upload failed: ${error.message}`,
        TOAST_IDS.GENERIC_ERROR
      );
    } finally {
      // Reset uploading state
      setIsUploading(false);
      
      // Clear loading toast IDs
      loadingToastIdsRef.current = [];
    }
  }, [
    images, formId, checkForDuplicateFilename, validateDimensions, 
    enhancedStorage, onImageUpload, setValue, validateImages,
    getEnhancedErrorMessage, simulateProgress, featuredImageIndex,
    handleSetFeatured
  ]);

  // Main render function
  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Upload Listing Images</h2>
          {renderCompletionIndicator()}
        </div>
        <p className="text-sm text-gray-600">
          Add high-quality images to showcase your listing. You must upload at least 3 images.
        </p>
      </div>

      {/* Info Message */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Image Requirements</p>
          <ul className="space-y-1">
            <li>• Upload 3-10 high-quality images that showcase your listing</li>
            <li>• Only JPG/JPEG and PNG formats are accepted</li>
            <li>• Each image must be less than 5MB in size</li>
            <li>• Minimum dimensions: 800×600 pixels</li>
            <li>• Set one image as the "Main" image (first image by default)</li>
          </ul>
        </div>
      </div>

      {/* Reupload Warning */}
      {needsReupload && (
        <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg animate-pulse">
          <div className="flex items-start">
            <RefreshCw className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0 animate-spin" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">Some images need to be re-uploaded</p>
              <p>Due to page refresh, {images.filter(img => img.isPlaceholder).length} image(s) need to be re-uploaded. Please click the upload button to restore them.</p>
            </div>
          </div>
        </div>
      )}

      {/* Required Field Error */}
      {(submitAttempted || validated) && getUsableImagesCount() < 3 && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium mb-1">Required Field Error</p>
              <p>You must upload at least 3 images before proceeding. Currently uploaded: {getUsableImagesCount()}/3</p>
              {needsReupload && (
                <p className="mt-1 font-medium">Please re-upload the images that were lost during page refresh.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && validationErrors.some(error => !error.includes('upload at least 3 images')) && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium mb-1">Please fix these format or size issues:</p>
              <ul className="list-disc pl-5 space-y-1">
                {validationErrors.filter(error => !error.includes('upload at least 3 images')).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Image Loading Errors */}
      {Object.keys(failedImageLoads).length > 0 && (
        <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg mt-3">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">Image issues detected:</p>
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(failedImageLoads).map(([filename, error], index) => {
                  // Determine error category
                  let errorType = "format issue";
                  
                  if (error.error === 'dimensions') {
                    errorType = "size issue";
                  } else if (error.error === 'load') {
                    errorType = "loading issue";
                  }
                  
                  return (
                    <li key={index}>
                      <strong>{filename}</strong> 
                      <span className="mx-1">-</span>
                      <span className="font-medium">{errorType}:</span> {error.message}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-sm font-medium">Troubleshooting tips:</p>
              <ul className="list-disc pl-5 space-y-0.5 mt-1 text-xs">
                <li>Make sure the file is a valid JPEG or PNG image</li>
                <li>Images must be at least 800×600 pixels in size</li>
                <li>For PNG files with issues, try opening in an image editor and saving as a new file</li>
                <li>Try converting between formats (PNG to JPEG or vice versa)</li>
                <li>Some screenshot tools create non-standard formats - use standard image editors</li>
                <li>Check if the file is complete and not partially downloaded</li>
                <li>Avoid images with transparency if possible</li>
              </ul>
            </div>
          </div>
        </div>
      )}

{(isUploading || Object.keys(uploadProgress).length > 0) && (
  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
    <div className="flex items-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-3"></div>
      <p className="text-sm font-medium text-blue-800">
              Uploading {Object.keys(uploadProgress).length} file(s)...
              {uploadProgress && Object.entries(uploadProgress).map(([key, data]) => (
                <span key={key} className="block mt-1 text-xs">
                  {data.fileName}: {Math.round(data.progress)}%
                </span>
              ))}
      </p>
    </div>
      </div>
    )}

      {/* Image count badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-700">Images</h3>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            getUsableImagesCount() >= 3 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
          )}>
            {getUsableImagesCount()}/10 ({getUsableImagesCount() < 3 ? `need ${3 - getUsableImagesCount()} more` : "complete"})
          </span>
        </div>

        <Tooltip content="Upload at least 3 high-quality images to showcase your listing. The first image will be shown as the main image in search results.">
          <HelpCircle className="h-4 w-4 text-gray-500" />
        </Tooltip>
      </div>

      {/* Image Grid and Upload Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Existing Images */}
            {images.map((image, index) => (
              <div 
                key={image.id || index}
                className={cn(
                  "relative group cursor-default overflow-hidden transform transition-all p-0.5 rounded-lg",
                  "border border-gray-200 shadow-sm hover:shadow-md mb-2",
                  index === featuredImageIndex && "ring-2 ring-blue-500 border-blue-500",
                  image.isPlaceholder && "opacity-75 bg-gray-50 border-dashed border-2",
                  failedImageLoads[image.name] && "border-red-300 border-dashed"
                )}
              >
                {/* Featured badge - make it more visible */}
                {index === featuredImageIndex && (
                  <div className="absolute top-0.5 right-0.5 z-20 bg-blue-500 text-white px-2 py-0.5 text-xs rounded-bl-md rounded-tr-md font-medium shadow-sm">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 mr-1 text-yellow-200 fill-yellow-200" />
                      <span>Featured</span>
                    </div>
                  </div>
                )}
                
                {/* Image container */}
                <div className="relative">
                  {/* Image preview */}
                  <div className="relative h-32 bg-gray-100 rounded overflow-hidden">
                    {!image.isPlaceholder && !failedImageLoads[image.name] ? (
                      <ImageErrorBoundary fallback={(<div className="flex items-center justify-center h-full bg-gray-200">
                        <ImageOff className="h-6 w-6 text-gray-400" />
                      </div>)}>
                        <img
                          src={image.preview || image.url || getImageFallbackUrl()}
                          alt={image.name || `Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = getImageFallbackUrl();
                          }}
                        />
                      </ImageErrorBoundary>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        {image.isPlaceholder ? (
                          <>
                            <Upload className="h-8 w-8 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Replacement needed</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-8 w-8 text-red-400 mb-1" />
                            <span className="text-xs text-red-500">Error loading image</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Upload progress overlay */}
                    {index === featuredImageIndex && uploadProgress[index] && uploadProgress[index].progress < 100 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                        <CircularProgress value={uploadProgress[index].progress} />
                        <span className="text-white text-xs mt-1">Uploading... {Math.round(uploadProgress[index].progress)}%</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Image info panel */}
                  <div className="p-2 bg-white">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-medium text-gray-700 truncate w-full">
                        {image.name || `Image ${index + 1}`}
                      </p>
                    </div>
                    
                    {!image.isPlaceholder && !failedImageLoads[image.name] && (
                      <div className="flex justify-between items-center mt-1 text-2xs text-gray-500">
                        <span>{formatFileSize(image.size)}</span>
                        {index === featuredImageIndex ? (
                          <span className="text-blue-600 flex items-center">
                            <Star className="h-3 w-3 mr-0.5 fill-blue-600" />
                            Main Image
                          </span>
                        ) : (
                          <span></span>
                        )}
                      </div>
                    )}
                    
                    {/* Error message */}
                    {failedImageLoads[image.name] && (
                      <div className="mt-1 text-2xs text-red-500 truncate">
                        {failedImageLoads[image.name].message || 'Error loading image'}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions toolbar */}
                  <div className="absolute top-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity 
                                flex justify-between items-center">
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(index)}
                      className="rounded-full p-1 bg-red-500 text-white hover:bg-red-600 focus:outline-none 
                                focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors"
                      aria-label="Delete image"
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                    
                    {/* Feature button - only show if not already featured */}
                    {index !== featuredImageIndex && (
                      <button
                        type="button"
                        onClick={() => handleSetFeatured(index)}
                        className="rounded-full p-1 bg-blue-500 text-white hover:bg-blue-600 focus:outline-none 
                                  focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-colors"
                        aria-label="Set as featured image"
                      >
                        <Star className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
      
        {/* Upload Button */}
        {images.length < 10 && (
          <button
            type="button"
            onClick={handleOpenFileDialog}
            disabled={isUploading || isLoading}
            className={`
              flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6
              transition duration-150 aspect-[4/3] h-auto
              ${isUploading || isLoading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
              }
            `}
          >
            {isUploading ? (
              <>
                <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                <span className="text-sm font-medium text-gray-500">Uploading...</span>
              </>
            ) : isLoading ? (
              <>
                <Loader className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                <span className="text-sm font-medium text-gray-500">Processing...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-500">Upload Images</span>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {needsReupload ? 'Replace missing images' : `${10 - images.length} slots remaining`}
                </p>
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || isLoading}
      />
    </div>
  );
};

export default MediaUpload;
