import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  AlertCircle, 
  Info, 
  CheckCircle,
  X,
  ChevronDown,
  ChevronRight,
  Image,
  File,
  FileText,
  Star,
  Camera
} from 'lucide-react';
import { ListingType } from '@/types/listings';
import BusinessReview from './reviews/BusinessReview';
import FranchiseReview from './reviews/FranchiseReview';
import StartupReview from './reviews/StartupReview';
import InvestorReview from './reviews/InvestorReview';
import DigitalAssetReview from './reviews/DigitalAssetReview';
import { cn } from '@/lib/utils';

// Collapsible section component
const ReviewSection = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mb-4">
      <div 
        className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-4 w-4 text-blue-600" />}
          <h3 className="text-sm font-medium text-gray-800">{title}</h3>
        </div>
        <button 
          type="button"
          className="text-gray-500 hover:text-blue-600 transition-colors"
          aria-label={isOpen ? "Collapse section" : "Expand section"}
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
      {isOpen && (
        <div className="p-3">
          {children}
        </div>
      )}
    </div>
  );
};

// Clear row-based field display
const ReviewField = ({ 
  label, 
  value, 
  highlight = false, 
  optional = false 
}) => (
  <div className="flex items-center border-b border-gray-100 last:border-0 py-1.5">
    <div className="w-1/2 pr-2">
      <span className={cn(
        "text-sm text-gray-500 font-normal",
        highlight && "font-medium"
      )}>
        {label}
        {optional && <span className="text-gray-400 text-xs ml-1">(Optional)</span>}
      </span>
    </div>
    <div className="w-1/2 pl-2 border-l border-gray-100">
      <span className={cn(
        "text-sm font-medium",
        highlight ? "text-blue-600" : "text-gray-800",
        !value && "text-gray-400 italic font-normal"
      )}>
        {value || 'Not Provided'}
      </span>
    </div>
  </div>
);

// Helper to get document icon based on file type
const getDocumentIcon = (format) => {
  if (!format) return <File className="h-4 w-4 text-gray-500" />;
  
  if (format.includes('pdf')) {
    return <FileText className="h-4 w-4 text-red-500" />;
  } else if (format.includes('excel') || format.includes('spreadsheet') || format.includes('csv')) {
    return <FileText className="h-4 w-4 text-green-600" />;
  } else if (format.includes('word') || format.includes('document')) {
    return <FileText className="h-4 w-4 text-blue-600" />;
  } else if (format.includes('image')) {
    return <Image className="h-4 w-4 text-purple-600" />;
  }
  return <File className="h-4 w-4 text-gray-500" />;
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Default placeholder image when image fails to load
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="9" cy="9" r="2"%3E%3C/circle%3E%3Cpath d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"%3E%3C/path%3E%3C/svg%3E';

// Storage keys for localStorage
const STORAGE_KEYS = {
  IMAGES: 'listingFormImages',
  DOCUMENTS: 'listingFormDocuments',
  FEATURED_IMAGE: 'listingFormFeaturedImage'
};

export default function ReviewSubmit({ 
  onStepChange, 
  currentStep, 
  totalSteps, 
  uploadedImages = [], 
  featuredImageIndex = 0,
  uploadedDocuments = []
}) {
  const { 
    watch, 
    register, 
    formState: { errors }, 
    trigger 
  } = useFormContext();

  const [showFullErrors, setShowFullErrors] = useState(false);
  const listingType = watch('type');
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  // Load images and documents from props or localStorage
  useEffect(() => {
    const loadSavedData = () => {
      try {
        // First try to use the props provided
        if (uploadedImages && uploadedImages.length > 0) {
          setImages(uploadedImages);
        } else {
          // Try to load images from localStorage as backup
          const savedImagesString = localStorage.getItem(STORAGE_KEYS.IMAGES);
          if (savedImagesString) {
            const savedImages = JSON.parse(savedImagesString);
            if (Array.isArray(savedImages) && savedImages.length > 0) {
              console.log("Found saved images in localStorage", savedImages.length);
              setImages(savedImages);
            }
          }
        }
        
        // Same for documents
        if (uploadedDocuments && uploadedDocuments.length > 0) {
          setDocuments(uploadedDocuments);
        } else {
          // Try to load documents from localStorage as backup
          const savedDocsString = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
          if (savedDocsString) {
            const savedDocs = JSON.parse(savedDocsString);
            if (Array.isArray(savedDocs) && savedDocs.length > 0) {
              console.log("Found saved documents in localStorage", savedDocs.length);
              setDocuments(savedDocs);
            }
          }
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
      }
    };
    
    loadSavedData();
  }, [uploadedImages, uploadedDocuments]);
  
  // Helper function to persist data to localStorage
  useEffect(() => {
    try {
      // Save current data to localStorage for persistence
      if (images && images.length > 0) {
        // Sanitize images to prevent circular references
        const sanitizedImages = images.map(img => ({
          id: img.id || `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: img.name || 'Unnamed image',
          size: img.size || 0,
          type: img.type || 'image/jpeg',
          path: img.path || null,
          url: img.url && !img.url.startsWith('blob:') ? img.url : null,
          preview: img.preview && !img.preview.startsWith('blob:') ? img.preview : null,
          base64: img.base64 || null
        }));
        
        localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(sanitizedImages));
      }
      
      if (documents && documents.length > 0) {
        // Sanitize documents to prevent circular references
        const sanitizedDocs = documents.map(doc => ({
          id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: doc.name || 'Unnamed document',
          size: doc.size || 0,
          type: doc.type || 'application/pdf',
          format: doc.format || null,
          category: doc.category || 'other',
          description: doc.description || null,
          isPublic: !!doc.isPublic,
          path: doc.path || null,
          url: doc.url && !doc.url.startsWith('blob:') ? doc.url : null,
          uploadedAt: doc.uploadedAt || new Date().toISOString(),
          verificationStatus: doc.verificationStatus || 'pending'
        }));
        
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(sanitizedDocs));
      }
      
      // Save featured image index
      localStorage.setItem(STORAGE_KEYS.FEATURED_IMAGE, String(featuredImageIndex));
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
    }
  }, [images, documents, featuredImageIndex]);
  
  // Track which sections contain errors
  const [sectionsWithErrors, setSectionsWithErrors] = useState({});

  // Validate entire form
  const validateForm = async () => {
    const result = await trigger();
    setShowFullErrors(true);
    
    // If there are errors, identify which sections they belong to
    if (!result && Object.keys(errors).length > 0) {
      const sectionErrors = {};
      
      // Map error fields to their respective sections
      Object.keys(errors).forEach(field => {
        if (field.startsWith('businessDetails')) sectionErrors.business = true;
        else if (field.startsWith('franchiseDetails')) sectionErrors.franchise = true;
        else if (field.startsWith('startupDetails')) sectionErrors.startup = true;
        else if (field.startsWith('investorDetails')) sectionErrors.investor = true;
        else if (field.startsWith('digitalAssetDetails')) sectionErrors.digitalAsset = true;
        else if (field.startsWith('contactInfo')) sectionErrors.contact = true;
        else if (field.startsWith('location')) sectionErrors.location = true;
        else if (field === 'name' || field === 'description' || field === 'type') sectionErrors.basic = true;
        else if (field === 'mediaValidation') sectionErrors.media = true;
        else sectionErrors.other = true;
      });
      
      setSectionsWithErrors(sectionErrors);
    }
    
    return result;
  };

  // Render specific review component based on listing type
  const renderReviewContent = () => {
    switch (listingType) {
      case ListingType.BUSINESS:
        return <BusinessReview ReviewSection={ReviewSection} ReviewField={ReviewField} />;
      case ListingType.FRANCHISE:
        return <FranchiseReview ReviewSection={ReviewSection} ReviewField={ReviewField} />;
      case ListingType.STARTUP:
        return <StartupReview ReviewSection={ReviewSection} ReviewField={ReviewField} />;
      case ListingType.INVESTOR:
        return <InvestorReview ReviewSection={ReviewSection} ReviewField={ReviewField} />;
      case ListingType.DIGITAL_ASSET:
        return <DigitalAssetReview ReviewSection={ReviewSection} ReviewField={ReviewField} />;
      default:
        return <div className="p-3 text-gray-500 text-sm">Unsupported Listing Type</div>;
    }
  };

  // Helper to navigate to a specific form step when errors are found
  const navigateToSection = (sectionIndex) => {
    if (onStepChange) {
      onStepChange(sectionIndex);
      window.scrollTo(0, 0);
    }
  };

  // Use the available images (from props, state, or localStorage)
  const displayImages = images.length > 0 ? images : uploadedImages;
  
  // Use the available documents (from props, state, or localStorage)
  const displayDocuments = documents.length > 0 ? documents : uploadedDocuments;

  return (
    <div className="space-y-4">
      {/* Info Message */}
      <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-0.5">Final Review Before Submission</p>
          <p className="text-xs">
            Please review all information carefully. You can go back to previous steps if you need to make changes.
          </p>
        </div>
      </div>

      {/* Business/Listing Information Sections */}
      <div>
        {renderReviewContent()}
      </div>

      {/* Images Section - Improved Layout */}
      <ReviewSection
        title="Images"
        icon={Camera}
        defaultOpen={true}
      >
        {displayImages && displayImages.length > 0 ? (
          <div className="space-y-4">
            {/* Display featured image prominently */}
            {featuredImageIndex >= 0 && featuredImageIndex < displayImages.length && (
              <div className="mb-4">
                <div className="bg-gray-50 p-2 rounded-md">
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <Star className="h-3 w-3 text-blue-500 mr-1" /> 
                    <span className="font-medium">Main Image</span>
                    <span className="ml-1 text-gray-400">(shown first in search results)</span>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-32 h-24 overflow-hidden rounded border border-blue-300">
                      <img 
                        src={displayImages[featuredImageIndex].url || displayImages[featuredImageIndex].preview || PLACEHOLDER_IMAGE} 
                        alt="Featured image"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {displayImages[featuredImageIndex].name || `Featured Image`}
                      </p>
                      {displayImages[featuredImageIndex].size && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(displayImages[featuredImageIndex].size)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Gallery images in grid */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Gallery Images ({displayImages.length})</div>
              <div className="grid grid-cols-5 gap-2">
                {displayImages.map((image, index) => (
                  index !== featuredImageIndex && (
                    <div 
                      key={image.id || index} 
                      className="aspect-square rounded border border-gray-200 overflow-hidden bg-gray-50"
                    >
                      <img 
                        src={image.url || image.preview || PLACEHOLDER_IMAGE} 
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-center p-4 text-gray-500 bg-gray-50 rounded border border-gray-200">
            No images found. Please go back to the Media step and upload at least 3 images.
          </div>
        )}
      </ReviewSection>

      {/* Documents Section - Improved Layout */}
      <ReviewSection
        title="Supporting Documents"
        icon={File}
        defaultOpen={true}
      >
        {displayDocuments && displayDocuments.length > 0 ? (
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">Uploaded Documents ({displayDocuments.length})</div>
            <div className="rounded-md border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {displayDocuments.map((document, index) => (
                <div key={document.id || index} className="p-2.5 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-start">
                    <div className="mr-3 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 flex-shrink-0">
                      {getDocumentIcon(document.format || document.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {document.name}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        {document.type && (
                          <span className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
                            {document.type.replace(/_/g, ' ')}
                          </span>
                        )}
                        {document.category && (
                          <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                            {document.category.replace(/_/g, ' ')}
                          </span>
                        )}
                        {document.size && (
                          <span className="text-xs text-gray-500">
                            {formatFileSize(document.size)}
                          </span>
                        )}
                      </div>
                      {document.description && (
                        <p className="text-xs text-gray-500 mt-1 italic truncate">
                          "{document.description}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-center p-4 text-gray-500 bg-gray-50 rounded border border-gray-200">
            No documents uploaded. Documents are optional but can improve the credibility of your listing.
          </div>
        )}
      </ReviewSection>

      {/* Global Errors */}
      {showFullErrors && Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-4">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">
                Please fix the following issues:
              </h4>
              <ul className="space-y-0.5 text-xs text-red-700 list-disc list-inside">
                {Object.values(errors).slice(0, 5).map((error, index) => (
                  <li key={index}>
                    {error.message}
                  </li>
                ))}
                {Object.values(errors).length > 5 && (
                  <li>And {Object.values(errors).length - 5} more issues...</li>
                )}
              </ul>
              
              <div className="mt-2 flex flex-wrap gap-2">
                <button 
                  type="button"
                  onClick={() => navigateToSection(0)}
                  className="text-xs bg-white text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50"
                >
                  Basic Info
                </button>
                <button 
                  type="button"
                  onClick={() => navigateToSection(1)}
                  className="text-xs bg-white text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50"
                >
                  Media
                </button>
                <button 
                  type="button"
                  onClick={() => navigateToSection(2)}
                  className="text-xs bg-white text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50"
                >
                  Details
                </button>
                <button 
                  type="button"
                  onClick={() => navigateToSection(3)}
                  className="text-xs bg-white text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50"
                >
                  Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              id="confirmSubmission"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register('confirmSubmission', {
                required: 'You must confirm the accuracy of your submission'
              })}
            />
          </div>
          <div>
            <label 
              htmlFor="confirmSubmission" 
              className="text-sm font-medium text-gray-900"
            >
              I confirm that all information provided is accurate and complete
            </label>
            
            {errors.confirmSubmission && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <X className="h-3 w-3 mr-1" />
                {errors.confirmSubmission.message}
              </p>
            )}
            
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p>Upon submission, your listing will be reviewed by our team before being published. You'll receive email notifications about its status.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}