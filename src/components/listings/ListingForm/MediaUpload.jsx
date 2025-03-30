import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Upload, 
  AlertTriangle, 
  Star, 
  Trash2,
  Info,
  AlertCircle,
  HelpCircle,
  ImageOff
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

const MediaUpload = ({ 
  uploadedImages = [], 
  onImageUpload,
  onImageDelete,
  onSetFeatured,
  featuredImageIndex = 0,
  submitAttempted = false,
  isLoading = false
}) => {
  const { setValue, register, formState: { errors } } = useFormContext();
  
  // State for tracking images
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validated, setValidated] = useState(false);

  // Register validation field once on mount
  useEffect(() => {
    register('mediaValidation', { 
      required: 'You must upload at least 3 images'
    });
  }, [register]);

  // Update local state when props change
  useEffect(() => {
    if (uploadedImages && Array.isArray(uploadedImages)) {
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
    }
  }, [uploadedImages, setValue]);

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
    
    if (images.length < 3) {
      errors.push('You must upload at least 3 images to continue.');
    }
    
    setValidationErrors(errors);
    setValue('mediaValidation', images.length >= 3);
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

  // Handle file selection from input
  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    console.log("Files selected:", selectedFiles.length);
    
    if (selectedFiles.length === 0) return;
    
    // Check if adding these files would exceed the maximum
    if (images.length + selectedFiles.length > 10) {
      setValidationErrors([`You can upload a maximum of 10 images. ${10 - images.length} more can be added.`]);
      return;
    }
    
    setIsUploading(true);
    const newErrors = [];
    const validFiles = [];
    
    // Validate each file
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
        const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        // Create object URL for preview
        const objectUrl = URL.createObjectURL(file);
        
        // If passed all checks, add to valid files
        validFiles.push({
          file,
          preview: objectUrl,
          url: objectUrl,
          name: file.name,
          size: file.size,
          id,
          type: file.type
        });
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
      const wasEmpty = images.length === 0;
      
      // Call parent handler
      if (onImageUpload) {
        onImageUpload(validFiles);
      }
      
      // If this is our first image(s), set featured automatically
      if (wasEmpty && validFiles.length > 0 && onSetFeatured) {
        onSetFeatured(0);
      }
    }
    
    // Complete upload process
    setIsUploading(false);
    
    // Reset the file input
    event.target.value = '';
  };

  // Handle image deletion
  const handleDeleteImage = (index) => {
    // Get the image to delete
    const imageToDelete = images[index];
    
    // Call parent handler
    if (onImageDelete) {
      onImageDelete(imageToDelete);
    }
  };

  // Handle setting featured image
  const handleSetFeatured = (index) => {
    if (onSetFeatured) {
      onSetFeatured(index);
      toast.success(`Image ${index + 1} set as main image`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Listing Images</h2>
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

      {/* Form validation error */}
      {(submitAttempted || validated) && images.length < 3 && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium mb-1">Required Field Error</p>
              <p>You must upload at least 3 images before proceeding. Currently uploaded: {images.length}/3</p>
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
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
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
            images.length >= 3 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
          )}>
            {images.length}/10 ({images.length < 3 ? `need ${3 - images.length} more` : "complete"})
          </span>
        </div>
        
        <Tooltip content="Upload at least 3 high-quality images to showcase your listing. The first image will be shown as the main image in search results.">
          <HelpCircle className="h-4 w-4 text-gray-400" />
        </Tooltip>
      </div>

      {/* Basic file upload */}
      <div className="mb-6">
        <label 
          htmlFor="image-upload"
          className={cn(
            "block w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer",
            "transition-colors duration-200 ease-in-out",
            "hover:bg-gray-50 hover:border-gray-400",
            "border-gray-300 bg-white",
            isLoading || images.length >= 10 || isUploading 
              ? "opacity-50 cursor-not-allowed" 
              : "cursor-pointer"
          )}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="p-2 rounded-full bg-blue-50 mb-3">
              <Upload className="h-8 w-8 text-blue-500" />
            </div>
            <span className="font-medium text-gray-900 mb-1">
              Click to add images
            </span>
            <span className="text-sm text-gray-500 mb-4">
              Or drag and drop files here
            </span>
            
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/jpeg, image/png"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isLoading || images.length >= 10 || isUploading}
            />
            
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
      </div>

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Uploaded Images ({images.length}/10)
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
                
                {/* Image preview */}
                <div className="relative bg-gray-100 aspect-video overflow-hidden">
                  {image && (image.preview || image.url) ? (
                    <img 
                      src={image.preview || image.url} 
                      alt={`Listing image ${index + 1}`}
                      className="w-full h-full object-cover"
                      // Add error handler for images that fail to load
                      onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off"%3E%3Cline x1="2" y1="2" x2="22" y2="22"%3E%3C/line%3E%3Cpath d="M10.41 10.41a2 2 0 1 1-2.83-2.83"%3E%3C/path%3E%3Cline x1="13.5" y1="13.5" x2="6" y2="21"%3E%3C/line%3E%3Cpath d="M18 12l-7 9"%3E%3C/path%3E%3Cpath d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59"%3E%3C/path%3E%3Cpath d="M21 15V5a2 2 0 0 0-2-2H9"%3E%3C/path%3E%3C/svg%3E';
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
                    disabled={featuredImageIndex === index}
                    className={cn(
                      "px-2 py-1 rounded text-xs flex items-center transition-colors",
                      featuredImageIndex === index 
                        ? "bg-blue-100 text-blue-700 cursor-default" 
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
      {images.length < 3 && !submitAttempted && !validated && (
        <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg mt-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                You need to upload at least 3 images ({images.length}/3)
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
        value={images.length >= 3 ? 'true' : 'false'}
      />
    </div>
  );
};

export default MediaUpload;