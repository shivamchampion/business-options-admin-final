import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Tooltip component
const Tooltip = ({ content, children }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute z-10 w-60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transform -translate-x-1/2 left-1/2 bottom-full mb-2 transition-all duration-150">
        <div className="relative bg-gray-800 text-white text-xs rounded p-2 text-center shadow-lg">
          {content}
          <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 translate-y-1 translate-x-0 left-1/2 -ml-1 bottom-0"></div>
        </div>
      </div>
    </div>
  );
};

// Function to generate fallback image
const getImageFallbackUrl = () => {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off"%3E%3Cline x1="2" y1="2" x2="22" y2="22"%3E%3C/line%3E%3Cpath d="M10.41 10.41a2 2 0 1 1-2.83-2.83"%3E%3C/path%3E%3Cline x1="13.5" y1="13.5" x2="6" y2="21"%3E%3C/line%3E%3Cpath d="M18 12l-7 9"%3E%3C/path%3E%3Cpath d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59"%3E%3C/path%3E%3Cpath d="M21 15V5a2 2 0 0 0-2-2H9"%3E%3C/path%3E%3C/svg%3E';
};

// Storage keys
const STORAGE_KEYS = {
  IMAGE_META: 'listingFormImageMeta',
  FEATURED_INDEX: 'listingFormFeaturedImage'
};

// Create a placeholder image function
const createPlaceholderImage = (index) => {
  return {
    id: `placeholder-${index}`,
    name: `Image ${index + 1}`,
    isPlaceholder: true,
    url: getImageFallbackUrl(),
    preview: getImageFallbackUrl(),
    type: 'image/svg+xml'
  };
};

const MediaUpload = ({ 
  uploadedImages = [], 
  onImageUpload,
  onImageDelete,
  onSetFeatured,
  featuredImageIndex = 0,
  submitAttempted = false,
  isLoading = false
}) => {
  const { setValue, register, formState: { errors }, trigger } = useFormContext();
  
  // State for tracking images
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validated, setValidated] = useState(false);
  const [needsReupload, setNeedsReupload] = useState(false);
  
  // Refs
  const imageInputRef = useRef(null);
  const objectUrlsRef = useRef([]);
  
  // Track whether component is mounted
  const isMounted = useRef(true);
  
  // Clean up object URLs and set mounted state on unmount
  useEffect(() => {
    // Clean up function
    return () => {
      isMounted.current = false;
      
      // Revoke any object URLs we created
      objectUrlsRef.current.forEach(url => {
        if (url && url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error("Error revoking URL:", e);
          }
        }
      });
      
      objectUrlsRef.current = [];
    };
  }, []);
  
  // Register validation field once on mount
  useEffect(() => {
    register('mediaValidation', { 
      required: 'You must upload at least 3 images'
    });
  }, [register]);
  
  // Load images from props
  useEffect(() => {
    if (!isMounted.current) return;
    
    const initializeImages = () => {
      // If we have images from props (from parent component state), use those
      if (uploadedImages && uploadedImages.length > 0) {
        // Process images to ensure they have all needed properties
        const processedImages = uploadedImages.map((img, idx) => ({
          ...img,
          id: img.id || `img-${Date.now()}-${idx}`,
          url: img.url || img.preview || '',
          preview: img.preview || img.url || '',
          name: img.name || `Image ${idx + 1}`,
          type: img.type || 'image/jpeg'
        }));
        
        setImages(processedImages);
        setValue('mediaValidation', processedImages.length >= 3);
        
        // Save metadata for potential restore after reload
        try {
          const imageMeta = processedImages.map(img => ({
            id: img.id,
            name: img.name,
            type: img.type,
            // Avoid storing blob URLs
            hasServerUrl: Boolean(img.path) || (!img.url?.startsWith('blob:') && !img.preview?.startsWith('blob:'))
          }));
          
          // Save just the metadata (small enough for localStorage)
          localStorage.setItem(STORAGE_KEYS.IMAGE_META, JSON.stringify(imageMeta));
        } catch (error) {
          console.error("Error saving image metadata:", error);
        }
        
        // No need to restore from localStorage
        return;
      }
      
      // If we don't have images from props, try to restore metadata from localStorage
      try {
        const savedMetaStr = localStorage.getItem(STORAGE_KEYS.IMAGE_META);
        if (savedMetaStr) {
          const savedMeta = JSON.parse(savedMetaStr);
          
          if (Array.isArray(savedMeta) && savedMeta.length > 0) {
            console.log("Found saved image metadata:", savedMeta);
            
            // Count how many images need to be reuploaded
            const needReuploadCount = savedMeta.filter(meta => !meta.hasServerUrl).length;
            
            if (needReuploadCount > 0) {
              setNeedsReupload(true);
              toast.error(`Please re-upload ${needReuploadCount} image(s) that were lost during page refresh`);
            }
            
            // Create placeholder images for restored metadata
            const restoredImages = savedMeta.map((meta, idx) => {
              // If it has a server URL, it can be used directly
              if (meta.hasServerUrl) {
                return {
                  ...meta,
                  url: meta.url || '',
                  preview: meta.preview || ''
                };
              }
              
              // Otherwise, create a placeholder
              return createPlaceholderImage(idx);
            });
            
            // Update UI with restored images
            setImages(restoredImages);
            
            // Set validation state based on usable (non-placeholder) images
            const usableCount = restoredImages.filter(img => !img.isPlaceholder).length;
            setValue('mediaValidation', usableCount >= 3);
            
            // If we need to reupload, validation should fail
            if (needReuploadCount > 0) {
              setValue('mediaValidation', false);
            }
            
            // Tell parent component about the restored images
            const validImages = restoredImages.filter(img => !img.isPlaceholder);
            if (validImages.length > 0 && onImageUpload) {
              onImageUpload(validImages);
            }
          }
        }
      } catch (error) {
        console.error("Error restoring image metadata:", error);
      }
    };
    
    initializeImages();
  }, [uploadedImages, setValue, onImageUpload]);

  // Validate when submit is attempted
  useEffect(() => {
    if (submitAttempted && !validated) {
      validateImages();
      setValidated(true);
    }
  }, [submitAttempted]);

  // Validate images
  const validateImages = () => {
    const errors = [];
    
    // Count actual usable images (non-placeholders)
    const usableImages = images.filter(img => !img.isPlaceholder);
    
    if (usableImages.length < 3) {
      errors.push('You must upload at least 3 images to continue.');
      
      if (needsReupload) {
        errors.push('Some images were lost during page refresh and need to be re-uploaded.');
      }
    }
    
    setValidationErrors(errors);
    setValue('mediaValidation', usableImages.length >= 3);
    return errors.length === 0;
  };

  // Validate file dimensions (min 800x600)
  const validateDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const image = new Image();
        image.src = event.target.result;
        image.onload = () => {
          const { width, height } = image;
          if (width < 800 || height < 600) {
            reject(new Error(`Image dimensions must be at least 800x600 pixels. This image is ${width}x${height}.`));
          } else {
            resolve(file);
          }
        };
        image.onerror = () => reject(new Error('Failed to load image for validation'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  // Handle opening the file dialog programmatically
  const handleOpenFileDialog = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  // Replace placeholders with actual images when needed
  const replacePlaceholder = (newImage) => {
    // Find a placeholder to replace
    const placeholderIndex = images.findIndex(img => img.isPlaceholder);
    if (placeholderIndex === -1) return false;
    
    // Create new array with the placeholder replaced
    const newImages = [...images];
    newImages[placeholderIndex] = newImage;
    
    // Update state
    setImages(newImages);
    
    // Update featured image if this was the featured one
    if (placeholderIndex === featuredImageIndex) {
      handleSetFeatured(placeholderIndex);
    }
    
    // Save updated metadata
    saveImageMetadata(newImages);
    
    return true;
  };

  // Save image metadata to localStorage
  const saveImageMetadata = (imagesToSave = images) => {
    try {
      const imageMeta = imagesToSave.map(img => ({
        id: img.id,
        name: img.name,
        type: img.type,
        // Avoid storing blob URLs - just store if it has a server URL
        hasServerUrl: Boolean(img.path) || (!img.url?.startsWith('blob:') && !img.preview?.startsWith('blob:'))
      }));
      
      localStorage.setItem(STORAGE_KEYS.IMAGE_META, JSON.stringify(imageMeta));
    } catch (error) {
      console.error("Error saving image metadata:", error);
    }
  };

  // Handle file selection from input
  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    console.log("Files selected:", selectedFiles.length);
    
    if (selectedFiles.length === 0) return;
    
    // Get actual usable images (non-placeholders)
    const usableImages = images.filter(img => !img.isPlaceholder);
    
    // Check if adding these files would exceed the maximum (accounting for placeholders)
    if (usableImages.length + selectedFiles.length > 10) {
      setValidationErrors([`You can upload a maximum of 10 images. ${10 - usableImages.length} more can be added.`]);
      return;
    }
    
    setIsUploading(true);
    const newErrors = [];
    const validFiles = [];
    
    try {
      // Process each file
      for (const file of selectedFiles) {
        try {
          // Check file type
          if (!file.type.includes('image/jpeg') && !file.type.includes('image/png')) {
            newErrors.push(`${file.name}: Only JPEG and PNG images are allowed`);
            continue;
          }
          
          // Check file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            newErrors.push(`${file.name}: File size must be less than 5MB`);
            continue;
          }
          
          // Check image dimensions
          await validateDimensions(file);
          
          // Create a unique ID for this file
          const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 15)}`;
          
          // Create object URL for preview
          const objectUrl = URL.createObjectURL(file);
          
          // Track object URL for cleanup
          objectUrlsRef.current.push(objectUrl);
          
          // Create processed image object
          const processedImage = {
            file,
            id,
            preview: objectUrl,
            url: objectUrl,
            name: file.name,
            size: file.size,
            type: file.type
          };
          
          // Add to valid files
          validFiles.push(processedImage);
        } catch (error) {
          newErrors.push(`${file.name}: ${error.message}`);
        }
      }
      
      // Set errors if any
      if (newErrors.length > 0) {
        setValidationErrors(newErrors);
      }
      
      // Process valid files
      if (validFiles.length > 0) {
        let updatedImages = [...images];
        let replacementMade = false;
        
        // First, try to replace placeholders if any exist
        if (needsReupload) {
          for (const file of validFiles) {
            const replaced = replacePlaceholder(file);
            if (replaced) replacementMade = true;
          }
          
          // If we replaced at least one placeholder but still have some,
          // keep the reupload notice active
          if (replacementMade) {
            const remainingPlaceholders = updatedImages.filter(img => img.isPlaceholder).length;
            if (remainingPlaceholders === 0) {
              setNeedsReupload(false);
              toast.success("All images have been successfully restored!");
            } else {
              toast.success(`Image restored! ${remainingPlaceholders} more need to be re-uploaded.`);
            }
          }
        }
        
        // Any remaining valid files get added to the end
        if (!replacementMade) {
          const wasEmpty = usableImages.length === 0;
          
          // If we have placeholders, filter them out before adding new images
          if (images.some(img => img.isPlaceholder)) {
            updatedImages = images.filter(img => !img.isPlaceholder);
          }
          
          // Add new images
          updatedImages = [...updatedImages, ...validFiles];
          
          // Update state
          setImages(updatedImages);
          
          // If this is our first image(s), set featured automatically
          if (wasEmpty && validFiles.length > 0) {
            console.log("Setting first image as featured");
            handleSetFeatured(0);
          }
          
          // Save metadata for potential restore after reload
          saveImageMetadata(updatedImages);
        }
        
        // Call parent handler with all valid files
        if (onImageUpload) {
          onImageUpload(validFiles);
        }
        
        // Update validation
        const usableCount = updatedImages.filter(img => !img.isPlaceholder).length;
        setValue('mediaValidation', usableCount >= 3);
        
        // Validate form
        setTimeout(() => {
          validateImages();
          trigger('mediaValidation');
        }, 100);
      }
    } catch (err) {
      console.error("Error processing files:", err);
      setValidationErrors([...newErrors, "An unexpected error occurred while processing your images."]);
    } finally {
      // Complete upload process
      setIsUploading(false);
      
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Handle image deletion
  const handleDeleteImage = (index) => {
    // Get the image to delete
    const imageToDelete = images[index];
    
    if (!imageToDelete) {
      console.warn("No image at index:", index);
      return;
    }
    
    // Cleanup object URL if it exists
    if (imageToDelete.preview && imageToDelete.preview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(imageToDelete.preview);
        objectUrlsRef.current = objectUrlsRef.current.filter(
          url => url !== imageToDelete.preview
        );
      } catch (e) {
        console.error("Error revoking URL:", e);
      }
    }
    
    // Create new array without the deleted image
    const newImages = [...images];
    newImages.splice(index, 1);
    
    // Update state
    setImages(newImages);
    
    // Call parent handler
    if (onImageDelete) {
      onImageDelete(imageToDelete);
    }
    
    // Handle featured image adjustment
    let newFeaturedIndex = featuredImageIndex;
    
    if (index === featuredImageIndex) {
      // If deleting the featured image, set the first remaining as featured
      if (newImages.length > 0) {
        newFeaturedIndex = 0;
      } else {
        newFeaturedIndex = -1;
      }
      handleSetFeatured(newFeaturedIndex);
    } else if (index < featuredImageIndex) {
      // If deleting before the featured image, decrement index
      newFeaturedIndex = featuredImageIndex - 1;
      handleSetFeatured(newFeaturedIndex);
    }
    
    // Save updated metadata
    saveImageMetadata(newImages);
    
    // Validate form after deletion
    setTimeout(() => {
      validateImages();
      trigger('mediaValidation');
    }, 100);
    
    // Show toast
    toast.success("Image deleted");
  };

  // Handle setting featured image
  const handleSetFeatured = (index) => {
    if (onSetFeatured) {
      onSetFeatured(index);
      
      try {
        localStorage.setItem(STORAGE_KEYS.FEATURED_INDEX, index.toString());
      } catch (e) {
        console.error("Error storing featured index:", e);
      }
      
      toast.success(`Image ${index + 1} set as main image`);
    }
  };

  // Get usable images count (non-placeholders)
  const getUsableImagesCount = () => {
    return images.filter(img => !img.isPlaceholder).length;
  };

  // Render a form completion indicator
  const renderCompletionIndicator = () => {
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
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Listing Images</h2>
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
          <p className="font-medium mb-1">Image Requirements</p>
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

      {/* Form validation error */}
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
      
      {/* Display validation errors if any */}
      {validationErrors.length > 0 && validationErrors.some(error => !error.includes('upload at least 3 images')) && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium mb-1">Please fix the following issues:</p>
              <ul className="list-disc pl-5 space-y-1">
                {validationErrors.filter(error => !error.includes('upload at least 3 images')).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload status indicator */}
      {isUploading && (
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg animate-pulse">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-3"></div>
            <p className="text-sm font-medium text-blue-800">
              Processing images... Please wait.
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
          <HelpCircle className="h-4 w-4 text-gray-400" />
        </Tooltip>
      </div>

      {/* File upload area */}
      <div className="mb-6">
        <div className="flex flex-col items-center gap-4">
          {/* Hidden file input */}
          <input
            ref={imageInputRef}
            id="image-upload"
            type="file"
            multiple
            accept="image/jpeg, image/png"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isLoading || getUsableImagesCount() >= 10 || isUploading}
          />
          
          {/* Styled drop zone */}
          <label 
            htmlFor="image-upload"
            className={cn(
              "block w-full border-2 border-dashed rounded-lg p-6 text-center",
              "transition-colors duration-200 ease-in-out",
              "hover:bg-gray-50 hover:border-gray-400",
              "border-gray-300 bg-white",
              isLoading || getUsableImagesCount() >= 10 || isUploading 
                ? "opacity-50 cursor-not-allowed" 
                : needsReupload ? "border-amber-300 bg-amber-50 hover:bg-amber-100 hover:border-amber-400" : "cursor-pointer"
            )}
          >
            <div className="flex flex-col items-center justify-center">
              <div className={cn(
                "p-2 rounded-full mb-3",
                needsReupload ? "bg-amber-100" : "bg-blue-50"
              )}>
                <Upload className={cn(
                  "h-8 w-8",
                  needsReupload ? "text-amber-500" : "text-blue-500"
                )} />
              </div>
              <span className="font-medium text-gray-900 mb-1">
                {needsReupload ? "Re-upload images" : "Click to add images"}
              </span>
              <span className="text-sm text-gray-500 mb-4">
                {needsReupload 
                  ? `${images.filter(img => img.isPlaceholder).length} image(s) need to be restored`
                  : "Or drag and drop files here"
                }
              </span>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  <span>JPEG, PNG</span>
                </div>
                <div>•</div>
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  <span>Max 5MB</span>
                </div>
                <div>•</div>
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  <span>Min 800×600px</span>
                </div>
              </div>
            </div>
          </label>
          
          {/* Explicit upload button for better UX */}
          <button
            type="button"
            onClick={handleOpenFileDialog}
            disabled={isLoading || getUsableImagesCount() >= 10 || isUploading}
            className={cn(
              "px-4 py-2 rounded-md transition-colors",
              "flex items-center justify-center",
              "border shadow-sm",
              isLoading || getUsableImagesCount() >= 10 || isUploading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                : needsReupload 
                  ? "bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 hover:border-amber-300 border-amber-200"
                  : "bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border-gray-300"
            )}
          >
            <Upload className="h-4 w-4 mr-2" />
            {needsReupload ? "Re-upload Images" : "Select Images"}
          </button>
        </div>
      </div>

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Uploaded Images ({getUsableImagesCount()}/10)
              {images.some(img => img.isPlaceholder) && (
                <span className="text-amber-600 text-xs ml-2">
                  ({images.filter(img => img.isPlaceholder).length} need re-upload)
                </span>
              )}
            </h3>
            
            {featuredImageIndex >= 0 && featuredImageIndex < images.length && (
              <p className="text-xs text-gray-500">
                <Star className="h-3 w-3 inline-block text-blue-500 mr-1" />
                Image {featuredImageIndex + 1} is set as the main image
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {images.map((image, index) => (
              <div 
                key={image.id || index} 
                className={cn(
                  "relative rounded-lg border overflow-hidden group",
                  featuredImageIndex === index ? "ring-2 ring-blue-500 border-blue-400" : "border-gray-200",
                  image.isPlaceholder ? "opacity-50 bg-amber-50 border-amber-200" : "",
                  "transition-all duration-200 hover:shadow-md"
                )}
              >
                {/* Featured badge */}
                {featuredImageIndex === index && (
                  <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center">
                    <Star className="h-3 w-3 mr-0.5" />
                    <span>Main</span>
                  </div>
                )}
                
                {/* Placeholder indicator */}
                {image.isPlaceholder && (
                  <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center">
                    <RefreshCw className="h-3 w-3 mr-0.5 animate-spin" />
                    <span>Re-upload</span>
                  </div>
                )}
                
                {/* Image preview */}
                <div className="relative bg-gray-100 aspect-video overflow-hidden">
                  {image.isPlaceholder ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <ImageOff className="h-8 w-8 text-amber-400 mb-2" />
                      <p className="text-xs text-amber-600 font-medium">Image needs to be re-uploaded</p>
                    </div>
                  ) : image && (image.preview || image.url) ? (
                    <img 
                      src={image.preview || image.url || getImageFallbackUrl()} 
                      alt={`Listing image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = getImageFallbackUrl();
                        e.target.classList.add('p-4');
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full p-4">
                      <ImageOff className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Image controls */}
                <div className="p-2 flex items-center justify-between bg-gray-50 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSetFeatured(index)}
                    disabled={featuredImageIndex === index || image.isPlaceholder}
                    className={cn(
                      "px-2 py-1 rounded text-xs flex items-center transition-colors",
                      featuredImageIndex === index 
                        ? "bg-blue-100 text-blue-700 cursor-default" 
                        : image.isPlaceholder
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300"
                          : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 hover:text-blue-600"
                    )}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    <span>{featuredImageIndex === index ? 'Main' : 'Set Main'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(index)}
                    className="p-1 rounded-full bg-white text-red-600 border border-gray-300 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image count warning */}
      {getUsableImagesCount() < 3 && !submitAttempted && !validated && (
        <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg mt-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                You need to upload at least 3 images ({getUsableImagesCount()}/3)
              </p>
              <p className="text-sm text-amber-700 mt-1">
                High-quality images improve your listing's appeal and increase chances of getting inquiries.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden input for form validation */}
      <input 
        type="hidden" 
        name="mediaValidation"
        value={getUsableImagesCount() >= 3 ? 'true' : 'false'}
      />
    </div>
  );
};

export default MediaUpload;