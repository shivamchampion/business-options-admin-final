import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { 
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  Printer,
  File,
  FileText,
  Star,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';
import { ListingType } from '@/types/listings';
import BusinessReview from './reviews/BusinessReview';
import FranchiseReview from './reviews/FranchiseReview';
import StartupReview from './reviews/StartupReview';
import InvestorReview from './reviews/InvestorReview';
import DigitalAssetReview from './reviews/DigitalAssetReview';
import EnhancedDocumentCard from './EnhancedDocumentCard';
import { normalizeCategory, getCategoryDisplayName } from './DocumentCategoryMapper';
import DocumentCard from './DocumentCard';
import enhancedStorage from '@/lib/EnhancedStorageService';

// Custom components for review display
const ReviewSection = ({ title, children, className }) => {
  return (
    <div className={cn("mb-4", className)}>
      <h3 className="text-sm font-semibold mb-2 pb-1 border-b border-gray-200">{title}</h3>
      <div className="pl-2">{children}</div>
    </div>
  );
};

const ReviewField = ({ label, value, icon, highlight = false, optional = false }) => {
  return (
    <div className="mb-2">
      <div className="flex items-center text-xs text-gray-500 mb-0.5">
        {icon && <span className="mr-1">{icon}</span>}
        <span className={cn(
            highlight && "font-semibold"
        )}>
          {label}
          {optional && <span className="text-gray-400 text-xs ml-1">(Optional)</span>}
        </span>
      </div>
      <span className="text-xs break-words w-full inline-block">{value || 'Not provided'}</span>
    </div>
  );
};

// Helper to get document icon based on file type
const getDocumentIcon = (format) => {
  if (!format) return <File className="h-4 w-4 text-gray-500" />;
  
  const fileType = typeof format === 'string' ? format.toLowerCase() : '';
  
  if (fileType.includes('pdf') || fileType === 'pdf') {
    return <File className="h-4 w-4 text-red-500" />;
  } else if (fileType.includes('document') || fileType.includes('word') || fileType === 'doc' || fileType === 'docx') {
    return <File className="h-4 w-4 text-blue-500" />;
  } else if (fileType.includes('sheet') || fileType.includes('excel') || fileType === 'xls' || fileType === 'xlsx') {
    return <File className="h-4 w-4 text-green-500" />;
  } else if (fileType.includes('image') || fileType === 'image' || fileType === 'photo') {
    return <File className="h-4 w-4 text-purple-500" />;
  } else if (fileType.includes('text') || fileType === 'txt') {
    return <FileText className="h-4 w-4 text-gray-500" />;
  } else {
    return <File className="h-4 w-4 text-gray-500" />;
  }
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

// Default placeholder image when image fails to load
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="9" cy="9" r="2"%3E%3C/circle%3E%3Cpath d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"%3E%3C/path%3E%3C/svg%3E';

const ReviewSubmit = ({ 
  onSubmit, 
  uploadedImages = [], 
  featuredImageIndex = 0,
  uploadedDocuments = [],
  formId
}) => {
  const { 
    watch, 
    formState: { errors, isSubmitting }, 
    trigger 
  } = useFormContext();

  const [showFullErrors, setShowFullErrors] = useState(false);
  const [images, setImages] = useState(uploadedImages);
  const [documents, setDocuments] = useState(uploadedDocuments);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  
  /**
   * Load documents from localStorage or EnhancedStorageService if none are provided
   */
  const loadDocumentsFromStorage = async () => {
    if ((!uploadedDocuments || uploadedDocuments.length === 0) && formId) {
      setIsLoadingDocuments(true);
      console.log("[DEBUG] ReviewSubmit: Attempting to load documents from storage for formId:", formId);
      
      try {
        // First try with EnhancedStorage service
        const docs = await enhancedStorage.getDocumentMetadata(formId || 'default');
        
        if (docs && Array.isArray(docs) && docs.length > 0) {
          console.log("[DEBUG] ReviewSubmit: Successfully loaded", docs.length, "documents from EnhancedStorage");
          setDocuments(docs);
          return;
        }
        
        // If that fails, try direct localStorage
        try {
          const storageKey = `listing_form_documents_${formId || 'default'}`;
          const storedDocs = localStorage.getItem(storageKey);
          
          if (storedDocs) {
            const parsedDocs = JSON.parse(storedDocs);
            if (Array.isArray(parsedDocs) && parsedDocs.length > 0) {
              console.log("[DEBUG] ReviewSubmit: Successfully loaded", parsedDocs.length, "documents from localStorage");
              setDocuments(parsedDocs);
              return;
            }
          }
          
          console.log("[DEBUG] ReviewSubmit: No documents found in localStorage");
        } catch (localStorageError) {
          console.error("[DEBUG] ReviewSubmit: Error loading documents from localStorage:", localStorageError);
        }
      } catch (error) {
        console.error("[DEBUG] ReviewSubmit: Error loading documents from storage:", error);
      } finally {
        setIsLoadingDocuments(false);
      }
    }
  };
  
  // Load images and documents from props
  useEffect(() => {
    if (uploadedImages && uploadedImages.length > 0) {
      setImages(uploadedImages);
      console.log("ReviewSubmit: Received images:", uploadedImages.length);
    }
    
    if (uploadedDocuments && uploadedDocuments.length > 0) {
      console.log("ReviewSubmit: Received documents:", uploadedDocuments.length, uploadedDocuments);
      setDocuments(uploadedDocuments);
    } else {
      console.log("ReviewSubmit: No documents received or empty array:", uploadedDocuments);
      loadDocumentsFromStorage();
    }
  }, [uploadedImages, uploadedDocuments, formId]);

  // Validate entire form
  const validateForm = async () => {
    const result = await trigger();
    return errors;
  };
  
  // Get form values for review
  const formValues = watch();
  const listingType = watch('type');

  // Function to render listing type specific form
  const renderListingTypeForm = () => {
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
        return (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Invalid listing type selected</span>
            </div>
            <p className="text-xs text-red-500 mt-1">
              Please go back to the first step and select a valid listing type.
            </p>
          </div>
        );
    }
  };

  const renderValidationStatus = () => {
    const hasErrors = Object.keys(errors).length > 0;

    // Helper to get friendly name for error fields
    const getFriendlyFieldName = (fieldPath) => {
      // Handle nested fields
      if (fieldPath.includes('.')) {
        const [parent, child] = fieldPath.split('.');
        
        // Map parent field names
        const parentMap = {
          'startupDetails': 'Startup Details',
          'investorDetails': 'Investor Details',
          'businessDetails': 'Business Details',
          'franchiseDetails': 'Franchise Details',
          'contactInfo': 'Contact Information',
          'location': 'Location'
        };
        
        // Map child field names
        const childMap = {
          // Startup Details fields
          'missionStatement': 'Mission Statement',
          'problemStatement': 'Problem Statement',
          'solutionDescription': 'Solution Description',
          'developmentStage': 'Development Stage',
          'foundedDate': 'Founded Date',
          'launchDate': 'Launch Date',
          
          // Investor Details fields
          'investorType': 'Investor Type',
          'yearsOfExperience': 'Years of Experience',
          'investmentPhilosophy': 'Investment Philosophy',
          'backgroundSummary': 'Background Summary',
          'investment.preferredRounds': 'Preferred Investment Rounds',
          'investment.decisionTimeline': 'Decision Timeline',
          'focus.primaryIndustries': 'Primary Industries',
          'focus.investmentCriteria': 'Investment Criteria',
          'portfolio.investmentProcess': 'Investment Process',
          'portfolio.postInvestmentSupport': 'Post-Investment Support'
        };
        
        const parentName = parentMap[parent] || parent;
        const childName = childMap[child] || child.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        return `${parentName} - ${childName}`;
      }
      
      // Map top-level fields
      const fieldMap = {
        'name': 'Listing Name',
        'type': 'Listing Type',
        'price': 'Price',
        'description': 'Description',
        'status': 'Status',
        'startupDetails': 'Startup Details',
        'investorDetails': 'Investor Details'
      };
      
      return fieldMap[fieldPath] || fieldPath.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    if (hasErrors) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="text-red-500 h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Validation Issues</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {showFullErrors ? (
                    Object.entries(errors).map(([key, error]) => (
                      <li key={key}>
                        <span className="font-medium">{getFriendlyFieldName(key)}:</span> {error.message || 'This field requires attention'}
                      </li>
                    ))
                  ) : (
                    Object.entries(errors).slice(0, 5).map(([key, error]) => (
                      <li key={key}>
                        <span className="font-medium">{getFriendlyFieldName(key)}:</span> {error.message || 'This field requires attention'}
                      </li>
                    ))
                  )}
                </ul>
                {Object.keys(errors).length > 5 && !showFullErrors && (
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 text-xs mt-2 underline"
                    onClick={() => setShowFullErrors(true)}
                  >
                    Show all {Object.keys(errors).length} errors
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
        <div className="flex">
          <CheckCircle className="text-green-500 h-5 w-5 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">All fields validated</h3>
            <div className="mt-1 text-sm text-green-700">
              You can now submit your business listing for review.
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full w-full">
      {/* Info Alert */}
      <div className="p-2 border border-blue-200 bg-blue-50 rounded-md flex items-start mb-3">
        <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700">
          <p className="font-semibold mb-0.5">Review Your Listing</p>
          <p>
            Please review all information before submitting. You can go back to previous steps to make changes if needed.
          </p>
        </div>
      </div>

      {/* Main content area */}
      <div className="space-y-4 pt-1">
        {/* Validation status */}
        {renderValidationStatus()}

        {/* Basic Information */}
        <ReviewSection title="Basic Information">
          <div className="grid grid-cols-2 gap-3">
            <ReviewField 
              label="Listing Type" 
              value={
                listingType === ListingType.BUSINESS ? 'Business' :
                listingType === ListingType.FRANCHISE ? 'Franchise' :
                listingType === ListingType.STARTUP ? 'Startup' :
                listingType === ListingType.INVESTOR ? 'Investor' :
                listingType === ListingType.DIGITAL_ASSET ? 'Digital Asset' :
                'Unknown'
              } 
              highlight
            />
            <ReviewField label="Listing Title" value={formValues.name} highlight />
            <ReviewField label="Status" value={formValues.status === 'draft' ? 'Draft' : 'Ready for Review'} />
            <ReviewField label="Plan" value={formValues.plan ? formValues.plan.replace('_', ' ').toUpperCase() : 'Free'} />

            {/* Location details */}
            <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
              <h4 className="text-xs font-medium mb-1 text-gray-700">Location Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <ReviewField 
                  label="Country" 
                  value={formValues.location?.countryName || formValues.location?.country} 
                />
                <ReviewField 
                  label="State/Province" 
                  value={formValues.location?.stateName || formValues.location?.state} 
                />
                <ReviewField 
                  label="City" 
                  value={formValues.location?.cityName || formValues.location?.city} 
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
              <h4 className="text-xs font-medium mb-1 text-gray-700">Contact Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <ReviewField 
                  label="Email" 
                  value={formValues.contactInfo?.email} 
                />
                <ReviewField 
                  label="Phone" 
                  value={formValues.contactInfo?.phone} 
                  optional
                />
                <ReviewField 
                  label="Website" 
                  value={formValues.contactInfo?.website} 
                  optional
                />
                <ReviewField 
                  label="Contact Person" 
                  value={formValues.contactInfo?.contactName} 
                  optional
                />
              </div>
            </div>
          </div>
        </ReviewSection>

        {/* Media & Images */}
        <ReviewSection title="Media & Images">
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-500 mb-2">Gallery Images</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {images.map((image, index) => (
                <div 
                  key={image.id || `img_${index}_${image.name?.replace(/\s+/g, '_') || Date.now()}_${Math.random().toString(36).substring(2, 8)}`}
                  className={cn(
                    "rounded-sm border overflow-hidden relative bg-gray-50 max-w-full",
                    index === featuredImageIndex && "ring-1 ring-blue-500"
                  )}
                  style={{ width: '100%' }}
                >
                  {/* Reduced height for images with explicit width */}
                  <div className="aspect-[3/2] h-20 relative w-full">
                    <img 
                      src={image.preview || image.url || image.base64 || PLACEHOLDER_IMAGE} 
                      alt={image.name || `Image ${index + 1}`}
                      className="object-cover w-full h-full max-w-full" 
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </div>
                  
                  {index === featuredImageIndex && (
                    <div className="absolute top-0.5 right-0.5 bg-blue-500 text-white rounded-full p-0.5">
                      <Star className="h-2.5 w-2.5" />
                    </div>
                  )}
                  
                  <div className="p-0.5 text-[10px] text-gray-500 truncate bg-white border-t border-gray-100 w-full">
                    {image.name || `Image ${index + 1}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ReviewSection>

        {/* Type-specific details */}
        <ReviewSection
          title={`${
            listingType === ListingType.BUSINESS ? 'Business' :
            listingType === ListingType.FRANCHISE ? 'Franchise' :
            listingType === ListingType.STARTUP ? 'Startup' :
            listingType === ListingType.INVESTOR ? 'Investor' :
            listingType === ListingType.DIGITAL_ASSET ? 'Digital Asset' :
            'Listing'
          } Details`}
        >
          {renderListingTypeForm()}
        </ReviewSection>
        
        {/* Documents */}
        <ReviewSection title="Documents">
          <div className="mb-2 p-2 border border-blue-100 bg-blue-50 rounded-md flex items-start">
            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p>The following documents have been uploaded to support your listing. Documents such as business licenses, financial statements, and legal agreements help verify your listing information.</p>
            </div>
          </div>

          {isLoadingDocuments ? (
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-4 flex items-center justify-center">
              <Clock className="h-4 w-4 text-gray-400 mr-2 animate-spin" />
              Loading documents...
            </div>
          ) : documents && documents.length > 0 ? (
            <>
              {(() => {
                // Log all documents with their categories for debugging
                console.log('[DEBUG] ReviewSubmit: Processing documents:', documents.map(doc => ({
                  name: doc.name,
                  category: doc.category
                })));
                
                // Group documents by category using our normalizer
                const groupedDocs = documents.reduce((groups, doc) => {
                  // Ensure the document has a category, provide a default if not
                  const docCategory = doc.category || 'other';
                  console.log('[DEBUG] ReviewSubmit: Processing document:', doc.name, 'with category:', docCategory);
                  
                  // FINANCIAL DOCUMENTS FIX: Check if this could be a financial document
                  if (docCategory.toLowerCase().includes('financial') || 
                      docCategory.toLowerCase().includes('finance') ||
                      (doc.name && (doc.name.toLowerCase().includes('financial') || 
                                   doc.name.toLowerCase().includes('finance') ||
                                   doc.name.toLowerCase().includes('statement') ||
                                   doc.name.toLowerCase().includes('balance'))))
                  {
                    // Force into Financial Documents category
                    const financialCategoryName = getCategoryDisplayName('financial');
                    console.log('[DEBUG] ReviewSubmit: Document seems to be financial - placing in:', financialCategoryName);
                    
                    if (!groups[financialCategoryName]) {
                      groups[financialCategoryName] = [];
                    }
                    groups[financialCategoryName].push(doc);
                    return groups;
                  }
                  
                  // Normal case - normalize and categorize
                  const normalizedCategory = normalizeCategory(docCategory);
                  const categoryName = getCategoryDisplayName(normalizedCategory);
                  console.log('[DEBUG] ReviewSubmit: After normalization:', normalizedCategory, '→', categoryName);
                  
                  if (!groups[categoryName]) {
                    groups[categoryName] = [];
                  }
                  groups[categoryName].push(doc);
                  return groups;
                }, {});

                // Log the grouped documents for debugging
                console.log('[DEBUG] Grouped documents by category:', Object.keys(groupedDocs).map(cat => 
                  `${cat}: ${groupedDocs[cat].length} documents`
                ));

                // Prioritize common categories but include ALL categories
                const priorityOrder = [
                  'Essential Documents',
                  'Identity Documents', 
                  'Legal Documents', 
                  'Financial Documents', 
                  'Operational Documents',
                  'Sale Documents',
                  'Franchise Documents',
                  'Training & Support Documents',
                  'Other Documents'
                ];
                
                // Sort categories by priority but ensure all categories appear
                const sortedCategories = Object.keys(groupedDocs).sort((a, b) => {
                  const indexA = priorityOrder.indexOf(a);
                  const indexB = priorityOrder.indexOf(b);
                  // If both categories are in the priority list, sort by priority order
                  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                  // If only one category is in the priority list, prioritize it
                  if (indexA !== -1) return -1;
                  if (indexB !== -1) return 1;
                  // If neither category is in the priority list, sort alphabetically
                  return a.localeCompare(b);
                });

                return sortedCategories.map(categoryName => (
                  <div key={categoryName} className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">{categoryName}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groupedDocs[categoryName].map((doc, index) => (
                        <DocumentCard key={doc.id || `doc_${index}_${doc.name?.replace(/\s+/g, '_') || Date.now()}_${Math.random().toString(36).substring(2, 8)}`} document={doc} index={index} />
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </>
          ) : (
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-4 flex items-center justify-center">
              <FileText className="h-4 w-4 text-gray-400 mr-2" />
              No documents provided
            </div>
          )}
        </ReviewSection>
      </div>
    </div>
  );
};

export default ReviewSubmit;