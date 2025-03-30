import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Check, 
  AlertTriangle, 
  Star, 
  Trash2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

/**
 * Media Upload Component - Step 2 of the listing form
 * 
 * Handles image uploads for listings with:
 * - Drag and drop functionality
 * - Image previews
 * - Featured image selection
 * - Image validation (type, size, dimensions)
 * - Progress tracking
 * - Delete functionality
 */
const MediaUpload = ({ 
  uploadedImages = [], 
  onImageUpload,
  onImageDelete,
  submitAttempted = false,
  isEdit = false,
  isLoading = false,
  listingType
}) => {
  // State for tracking images
  const [images, setImages] = useState(uploadedImages);
  const [featured, setFeatured] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);

  // Update local state when props change
  useEffect(() => {
    if (uploadedImages && uploadedImages.length > 0) {
      setImages(uploadedImages);
    }
  }, [uploadedImages]);

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

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    // Reset errors
    setErrors([]);
    
    // Check if adding these files would exceed the maximum
    if (images.length + acceptedFiles.length > 10) {
      setErrors([`You can upload a maximum of 10 images. ${10 - images.length} more can be added.`]);
      return;
    }
    
    setIsUploading(true);
    const newErrors = [];
    const validFiles = [];
    const progressTracking = {};
    
    // Validate each file
    for (const file of acceptedFiles) {
      try {
        // Initialize progress tracking
        progressTracking[file.name] = 0;
        
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
        
        // If passed all checks, add to valid files
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          progress: 0,
          uploaded: false
        });
      } catch (error) {
        newErrors.push(`${file.name}: ${error.message}`);
      }
    }
    
    // Set initial progress state
    setUploadProgress(progressTracking);
    
    // Simulate upload progress for each file
    validFiles.forEach((fileObj) => {
      const { name } = fileObj.file;
      let progress = 0;
      
      const interval = setInterval(() => {
        progress += 5;
        if (progress >= 100) {
          clearInterval(interval);
          setUploadProgress(prev => ({
            ...prev,
            [name]: 100
          }));
          
          // Update the parent component
          if (onImageUpload) {
            onImageUpload([{ 
              ...fileObj,
              progress: 100,
              uploaded: true
            }]);
          }
        } else {
          setUploadProgress(prev => ({
            ...prev,
            [name]: progress
          }));
        }
      }, 100); // Simulate upload progress
    });
    
    // Set errors if any
    if (newErrors.length > 0) {
      setErrors(newErrors);
    }
    
    // Complete upload process
    setTimeout(() => {
      setIsUploading(false);
    }, validFiles.length * 2000); // Give time for "uploads" to complete
  }, [images, onImageUpload]);

  // Configure dropzone
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    disabled: isLoading || images.length >= 10,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  // Handle deletion of an image
  const handleDeleteImage = (index) => {
    if (onImageDelete) {
      onImageDelete(images[index]);
    }
    
    // If we deleted the featured image, set the first image as featured
    if (featured === index) {
      setFeatured(images.length > 1 ? 0 : -1);
    } else if (featured > index) {
      // Adjust featured index if we deleted an image before it
      setFeatured(featured - 1);
    }
  };

  // Set an image as the featured image
  const handleSetFeatured = (index) => {
    setFeatured(index);
    // In a real application, you would also update this on the backend
    toast.success(`Image ${index + 1} set as main image`);
  };

  // Get appropriate progress color
  const getProgressColor = (progress) => {
    if (progress < 30) return 'bg-amber-500';
    if (progress < 70) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // Image requirements helper component
  const ImageRequirements = () => (
    <div className="flex items-start p-4 bg-gray-50 border border-gray-200 rounded-lg mt-6">
      <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
      <div className="text-sm text-gray-700">
        <p className="font-medium mb-1">Image Requirements</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Upload 3-10 images (minimum 3 required)</li>
          <li>File types: JPEG or PNG only</li>
          <li>Maximum file size: 5MB per image</li>
          <li>Minimum dimensions: 800×600 pixels</li>
          <li>First image will be used as the main image unless changed</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Listing Images</h2>
        <p className="text-sm text-gray-600">
          Add high-quality images to showcase your listing. You must upload at least 3 images.
        </p>
      </div>

      {/* Display errors if any */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">The following issues were found:</p>
              <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload status indicator */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-3"></div>
            <p className="text-sm font-medium text-blue-800">
              Uploading images... Please wait.
            </p>
          </div>
        </div>
      )}

      {/* Upload area */}
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer transition-colors duration-200",
          isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          isDragAccept ? "border-green-500 bg-green-50" : "",
          isDragReject ? "border-red-500 bg-red-50" : "",
          (isLoading || images.length >= 10) ? "opacity-50 cursor-not-allowed" : ""
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center">
          <div className="bg-blue-100 rounded-full p-3 mb-4">
            <Upload className="h-6 w-6 text-blue-700" />
          </div>
          
          {isDragActive ? (
            <p className="text-sm font-medium text-blue-700">Drop the files here...</p>
          ) : images.length >= 10 ? (
            <p className="text-sm font-medium text-gray-700">Maximum 10 images reached</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Drag & drop images here, or click to select files
              </p>
              <p className="text-xs text-gray-500">
                JPEG or PNG, max 5MB each, minimum 800×600px
              </p>
            </>
          )}
        </div>
      </div>

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Uploaded Images ({images.length}/10)
          </h3>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {images.map((image, index) => (
              <div 
                key={index} 
                className={cn(
                  "relative rounded-lg border overflow-hidden group",
                  featured === index ? "ring-2 ring-blue-500 border-blue-400" : "border-gray-200"
                )}
              >
                {/* Featured badge */}
                {featured === index && (
                  <div className="absolute top-1 left-1 z-10 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center">
                    <Star className="h-2 w-2 mr-0.5" />
                    <span>Main</span>
                  </div>
                )}
                
                {/* Image preview */}
                <div className="relative bg-gray-100 overflow-hidden" style={{ height: "100px" }}>
                  <img 
                    src={image.preview || image.url} 
                    alt={`Listing image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      // Revoke object URL to free memory if it's a local file
                      if (image.preview && !image.uploaded) {
                        URL.revokeObjectURL(image.preview);
                      }
                    }}
                  />
                  
                  {/* Upload progress overlay */}
                  {image.progress !== undefined && image.progress < 100 && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                      <div className="w-3/4 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColor(image.progress)}`}
                          style={{ width: `${image.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700 mt-2">
                        {Math.round(image.progress)}%
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Image controls */}
                <div className="p-1 flex items-center justify-between bg-gray-50 text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSetFeatured(index);
                    }}
                    disabled={featured === index}
                    className={cn(
                      "p-1 rounded text-xs flex items-center transition-colors",
                      featured === index 
                        ? "bg-blue-100 text-blue-700 cursor-default" 
                        : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 hover:text-blue-600"
                    )}
                  >
                    <Star className="h-2.5 w-2.5 mr-0.5" />
                    <span className="hidden md:inline text-[10px]">{featured === index ? 'Main' : 'Set'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteImage(index);
                    }}
                    className="p-1.5 rounded-full bg-white text-red-600 border border-gray-300 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image count warning */}
      {images.length < 3 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
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

      {/* Image requirements */}
      <ImageRequirements />
    </div>
  );
};

export default MediaUpload;