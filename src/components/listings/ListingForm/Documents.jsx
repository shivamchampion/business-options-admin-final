import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  File, 
  FileText, 
  FilePlus, 
  Trash2, 
  AlertTriangle, 
  Check, 
  Info, 
  Eye, 
  EyeOff, 
  Clock, 
  Download, 
  BadgeCheck, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { ListingType } from '@/types/listings';

/**
 * Document Upload Component - Step 4 of the listing form
 * 
 * Handles document uploads for listings with:
 * - Category-based document organization
 * - Document description fields
 * - Public/private visibility toggle
 * - Document previews
 * - Delete functionality
 * - Listing type-specific document requirements
 */
const Documents = ({ 
  documents = [], 
  onChange,
  onError,
  isEdit = false,
  isLoading = false,
  listingType
}) => {
  // State management
  const [uploadedDocuments, setUploadedDocuments] = useState(documents);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [activeCategory, setActiveCategory] = useState('essential');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newDocVisibility, setNewDocVisibility] = useState(false);
  const [newDocCategory, setNewDocCategory] = useState('essential');
  const [newDocType, setNewDocType] = useState('');

  // Update parent component when documents change
  useEffect(() => {
    if (onChange) {
      onChange({
        documents: uploadedDocuments
      });
    }
  }, [uploadedDocuments, onChange]);

  // Update local state when props change (e.g., in edit mode)
  useEffect(() => {
    if (documents && documents.length > 0) {
      setUploadedDocuments(documents);
    }
  }, [documents]);

  // Tooltip component
  const Tooltip = ({ content, children }) => {
    return (
      <div className="group relative inline-block">
        {children}
        <div className="absolute z-50 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible 
          transform -translate-x-1/2 left-1/2 bottom-full mb-2 transition-all duration-200 ease-in-out pointer-events-none">
          <div className="relative bg-gray-800 text-white text-xs rounded-md p-2 text-center shadow-lg">
            {content}
            <div className="absolute w-2.5 h-2.5 bg-gray-800 transform rotate-45 -bottom-[5px] left-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </div>
    );
  };

  // Get document categories based on listing type
  const getDocumentCategories = () => {
    const essentialDocs = {
      id: 'essential',
      name: 'Essential Documents',
      description: 'Required documents that verify your listing'
    };

    const financialDocs = {
      id: 'financial',
      name: 'Financial Documents',
      description: 'Documents that demonstrate financial performance'
    };

    const operationalDocs = {
      id: 'operational',
      name: 'Operational Documents',
      description: 'Documents related to day-to-day operations'
    };

    const verificationDocs = {
      id: 'verification',
      name: 'Verification Documents',
      description: 'Documents that verify business details and claims'
    };

    // Add type-specific categories
    switch (listingType) {
      case ListingType.BUSINESS:
        return [
          essentialDocs,
          financialDocs,
          operationalDocs,
          {
            id: 'sale',
            name: 'Sale Documents',
            description: 'Documents related to the sale of the business'
          }
        ];
      case ListingType.FRANCHISE:
        return [
          essentialDocs,
          {
            id: 'franchise',
            name: 'Franchise Documents',
            description: 'Franchise disclosure and agreement documents'
          },
          financialDocs,
          {
            id: 'training',
            name: 'Training & Support',
            description: 'Documents related to franchise training and support'
          }
        ];
      case ListingType.STARTUP:
        return [
          essentialDocs,
          {
            id: 'pitch',
            name: 'Pitch Documents',
            description: 'Pitch deck and executive summary'
          },
          financialDocs,
          {
            id: 'product',
            name: 'Product Documents',
            description: 'Product specifications, roadmap and technical details'
          },
          {
            id: 'market',
            name: 'Market Research',
            description: 'Market analysis and traction metrics'
          }
        ];
      case ListingType.INVESTOR:
        return [
          essentialDocs,
          {
            id: 'investment',
            name: 'Investment Thesis',
            description: 'Investment philosophy and criteria'
          },
          {
            id: 'portfolio',
            name: 'Portfolio Documents',
            description: 'Past investments and success cases'
          },
          {
            id: 'process',
            name: 'Process Documents',
            description: 'Investment process and due diligence materials'
          }
        ];
      case ListingType.DIGITAL_ASSET:
        return [
          essentialDocs,
          verificationDocs,
          financialDocs,
          {
            id: 'technical',
            name: 'Technical Documents',
            description: 'Technical specifications and infrastructure details'
          }
        ];
      default:
        return [essentialDocs, financialDocs, operationalDocs];
    }
  };

  // Get recommended document types based on listing type and category
  const getRecommendedDocuments = (category) => {
    const essentialDocs = [
      { type: 'business_registration', name: 'Business Registration Certificate' },
      { type: 'id_proof', name: 'Identity Proof' },
      { type: 'address_proof', name: 'Address Proof' }
    ];

    const financialDocs = [
      { type: 'financial_summary', name: 'Financial Summary' },
      { type: 'profit_loss', name: 'Profit & Loss Statement' },
      { type: 'balance_sheet', name: 'Balance Sheet' },
      { type: 'tax_returns', name: 'Tax Returns' }
    ];

    const operationalDocs = [
      { type: 'business_overview', name: 'Business Overview' },
      { type: 'inventory_list', name: 'Inventory List' },
      { type: 'equipment_list', name: 'Equipment List' },
      { type: 'operations_manual', name: 'Operations Manual' }
    ];

    switch (listingType) {
      case ListingType.BUSINESS:
        if (category === 'essential') return essentialDocs;
        if (category === 'financial') return financialDocs;
        if (category === 'operational') return operationalDocs;
        if (category === 'sale') {
          return [
            { type: 'sale_memorandum', name: 'Sale Memorandum' },
            { type: 'asset_list', name: 'Asset List' },
            { type: 'lease_agreement', name: 'Lease Agreement' }
          ];
        }
        break;

      case ListingType.FRANCHISE:
        if (category === 'essential') return essentialDocs;
        if (category === 'franchise') {
          return [
            { type: 'franchise_disclosure', name: 'Franchise Disclosure Document (FDD)' },
            { type: 'franchise_agreement', name: 'Franchise Agreement Sample' },
            { type: 'brand_guidelines', name: 'Brand Guidelines' }
          ];
        }
        if (category === 'financial') {
          return [
            { type: 'unit_economics', name: 'Unit Economics Model' },
            { type: 'investment_breakdown', name: 'Investment Breakdown' }
          ];
        }
        if (category === 'training') {
          return [
            { type: 'training_overview', name: 'Training Program Overview' },
            { type: 'support_structure', name: 'Support Structure' },
            { type: 'marketing_materials', name: 'Marketing Materials' }
          ];
        }
        break;

      case ListingType.STARTUP:
        if (category === 'essential') return essentialDocs;
        if (category === 'pitch') {
          return [
            { type: 'pitch_deck', name: 'Pitch Deck' },
            { type: 'executive_summary', name: 'Executive Summary' },
            { type: 'business_plan', name: 'Business Plan' }
          ];
        }
        if (category === 'financial') {
          return [
            { type: 'financial_projections', name: 'Financial Projections' },
            { type: 'cap_table', name: 'Cap Table' },
            { type: 'use_of_funds', name: 'Use of Funds' }
          ];
        }
        if (category === 'product') {
          return [
            { type: 'product_demo', name: 'Product Demo' },
            { type: 'technical_architecture', name: 'Technical Architecture' },
            { type: 'product_roadmap', name: 'Product Roadmap' }
          ];
        }
        if (category === 'market') {
          return [
            { type: 'market_research', name: 'Market Research' },
            { type: 'competitor_analysis', name: 'Competitor Analysis' },
            { type: 'traction_metrics', name: 'Traction Metrics' }
          ];
        }
        break;

      case ListingType.INVESTOR:
        if (category === 'essential') {
          return [
            { type: 'investor_profile', name: 'Investor Profile' },
            { type: 'credentials', name: 'Credentials & Certifications' }
          ];
        }
        if (category === 'investment') {
          return [
            { type: 'investment_thesis', name: 'Investment Thesis' },
            { type: 'investment_criteria', name: 'Investment Criteria' }
          ];
        }
        if (category === 'portfolio') {
          return [
            { type: 'portfolio_summary', name: 'Portfolio Summary' },
            { type: 'case_studies', name: 'Success Case Studies' }
          ];
        }
        if (category === 'process') {
          return [
            { type: 'due_diligence', name: 'Due Diligence Checklist' },
            { type: 'term_sheet', name: 'Term Sheet Template' },
            { type: 'investment_process', name: 'Investment Process' }
          ];
        }
        break;

      case ListingType.DIGITAL_ASSET:
        if (category === 'essential') {
          return [
            { type: 'ownership_proof', name: 'Ownership Proof' },
            { type: 'asset_overview', name: 'Asset Overview' }
          ];
        }
        if (category === 'verification') {
          return [
            { type: 'traffic_analytics', name: 'Traffic Analytics' },
            { type: 'revenue_proof', name: 'Revenue Proof' },
            { type: 'account_access', name: 'Account Access Details' }
          ];
        }
        if (category === 'financial') {
          return [
            { type: 'revenue_breakdown', name: 'Revenue Breakdown' },
            { type: 'expense_report', name: 'Expense Report' }
          ];
        }
        if (category === 'technical') {
          return [
            { type: 'technical_specs', name: 'Technical Specifications' },
            { type: 'codebase_overview', name: 'Codebase Overview' },
            { type: 'content_inventory', name: 'Content Inventory' }
          ];
        }
        break;

      default:
        return [];
    }

    return [];
  };

  // Get all document types for the current category
  const getCategoryDocumentTypes = (category) => {
    const recommended = getRecommendedDocuments(category);
    return [
      { type: '', name: 'Select document type' }, // Added placeholder as first option
      ...recommended,
      { type: 'other', name: 'Other Document' }
    ];
  };

  // Get icon for document type
  const getDocumentIcon = (format) => {
    if (format.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (format.includes('excel') || format.includes('spreadsheet') || format.includes('csv')) {
      return <FileText className="h-6 w-6 text-green-600" />;
    } else if (format.includes('word') || format.includes('document')) {
      return <FileText className="h-6 w-6 text-blue-600" />;
    } else if (format.includes('image')) {
      return <FileText className="h-6 w-6 text-purple-600" />;
    }
    return <File className="h-6 w-6 text-gray-500" />;
  };

  // Get formatted file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    // Reset errors
    setErrors([]);
    
    if (acceptedFiles.length === 0) return;
    
    // Set active category to match the upload category for immediate feedback
    setActiveCategory(newDocCategory);
    
    setIsUploading(true);
    toast.loading('Uploading documents...', { id: 'document-upload' });
    
    const newErrors = [];
    const validFiles = [];
    const progressTracking = {};
    
    // Validate each file
    for (const file of acceptedFiles) {
      try {
        // Initialize progress tracking
        progressTracking[file.name] = 0;
        
        // Check file size (20MB limit for documents)
        if (file.size > 20 * 1024 * 1024) {
          newErrors.push(`${file.name}: File size must be less than 20MB`);
          continue;
        }
        
        // Add to valid files
        validFiles.push({
          file,
          name: file.name,
          size: file.size,
          format: file.type,
          progress: 0,
          uploaded: false,
          description: newDocDescription,
          category: newDocCategory,
          type: newDocType || 'other',
          isPublic: newDocVisibility,
          verificationStatus: 'pending',
          uploadedAt: new Date()
        });
      } catch (error) {
        newErrors.push(`${file.name}: ${error.message}`);
      }
    }
    
    // Set initial progress state
    setUploadProgress(progressTracking);
    
    // Simulate upload progress for each file (in a real app, this would be real upload progress)
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
          
          // Generate unique ID
          const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2);
          
          // Mark file as uploaded
          setUploadedDocuments(prev => 
            [...prev, { 
              ...fileObj,
              id: uniqueId,
              progress: 100,
              uploaded: true,
              url: URL.createObjectURL(fileObj.file) // In real implementation, this would be a Firebase Storage URL
            }]
          );
        } else {
          setUploadProgress(prev => ({
            ...prev,
            [name]: progress
          }));
        }
      }, 100);
    });
    
    // Set errors if any
    if (newErrors.length > 0) {
      setErrors(newErrors);
      if (onError) onError(newErrors);
      toast.error('Some files could not be uploaded', { id: 'document-upload' });
    } else {
      // Show success toast only if there were no errors
      setTimeout(() => {
        toast.success('Documents uploaded successfully', { id: 'document-upload' });
      }, validFiles.length * 2000); // After all uploads complete
    }
    
    // Complete upload process
    setTimeout(() => {
      setIsUploading(false);
      
      // Only reset description, keep the document type for better UX
      setNewDocDescription('');
      // Don't reset document type to allow for consecutive uploads of the same type
      // setNewDocType('');
    }, validFiles.length * 2000); // Give time for "uploads" to complete
  }, [newDocDescription, newDocCategory, newDocVisibility, newDocType, onError]);

  // Configure dropzone
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    disabled: isLoading || !newDocCategory || !activeCategory || !newDocType,
    maxSize: 20 * 1024 * 1024, // 20MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    }
  });

  // Handle deletion of a document
  const handleDeleteDocument = (id, name) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== id));
    toast.success(`Document "${name}" deleted successfully`);
  };

  // Filter documents by category with robust error handling
  const filteredDocuments = uploadedDocuments.filter(doc => {
    // Ensure we only display fully uploaded documents (progress is 100 or undefined after successful upload)
    const isFullyUploaded = doc.progress === undefined || doc.progress === 100;
    // Check if document matches current category
    const matchesCategory = doc.category === activeCategory;
    return isFullyUploaded && matchesCategory;
  });

  // Get progress color
  const getProgressColor = (progress) => {
    if (progress < 30) return 'bg-amber-500';
    if (progress < 70) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // Get verification status badge
  const getVerificationBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
            <BadgeCheck className="h-3 w-3 mr-1" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  // Document categories
  const documentCategories = getDocumentCategories();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Supporting Documents</h2>
        <p className="text-sm text-gray-600">
          Add documents to verify your listing information and increase your credibility with potential buyers.
        </p>
      </div>

      {/* Info Message */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Documents</p>
          <p>
            Upload supporting documents to increase credibility and verification of your listing. 
            Your documents are securely stored and only shared with verified buyers as per your settings.
          </p>
        </div>
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

      {/* Document categories tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-1 overflow-x-auto hide-scrollbar">
          {documentCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "whitespace-nowrap py-3 px-4 text-sm font-medium border-b-2 focus:outline-none",
                activeCategory === category.id
                  ? "border-[#0031ac] text-[#0031ac]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {category.name}
              {uploadedDocuments.filter(doc => doc.category === category.id).length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                  {uploadedDocuments.filter(doc => doc.category === category.id).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Active category description */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {documentCategories.find(cat => cat.id === activeCategory)?.name}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {documentCategories.find(cat => cat.id === activeCategory)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Recommended documents - Placed at top for better visibility */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <FileText className="h-4 w-4 text-[#0031ac] mr-2" />
            Recommended Documents for {documentCategories.find(cat => cat.id === activeCategory)?.name}
          </h3>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {getRecommendedDocuments(activeCategory).map((doc, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-start border rounded p-3 cursor-pointer transition-all duration-200",
                  uploadedDocuments.some(d => d.type === doc.type) 
                    ? "bg-green-50 border-green-200" 
                    : "bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                )}
                onClick={() => {
                  // Pre-select this document type when clicked
                  setNewDocType(doc.type);
                }}
              >
                <FileText className={cn(
                  "h-5 w-5 mt-0.5 mr-3 flex-shrink-0",
                  uploadedDocuments.some(d => d.type === doc.type) ? "text-green-600" : "text-[#0031ac]"
                )} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {uploadedDocuments.some(d => d.type === doc.type) ? 
                      <span className="text-green-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Uploaded
                      </span> : 
                      <span className="text-blue-600 flex items-center">
                        <FilePlus className="h-3 w-3 mr-1" />
                        Click to upload
                      </span>
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Uploading Documents - Show when active */}
      {isUploading && uploadedDocuments.filter(doc => doc.progress < 100).length > 0 && (
        <div className="bg-white border border-blue-200 rounded-lg overflow-hidden">
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <h3 className="text-sm font-medium text-blue-700 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-3"></div>
              Uploading Documents
            </h3>
          </div>
          
          <div className="divide-y divide-blue-100">
            {uploadedDocuments
              .filter(doc => doc.progress < 100)
              .map((document) => (
                <div key={document.id} className="p-4 bg-blue-50 bg-opacity-30">
                  <div className="flex items-start">
                    {/* Document icon */}
                    <div className="mr-4 mt-1">
                      {getDocumentIcon(document.format)}
                    </div>
                    
                    {/* Document info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.name}
                      </h4>
                      
                      {/* Upload progress bar */}
                      <div className="mt-2">
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getProgressColor(document.progress)}`}
                            style={{ width: `${document.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-500 mt-1">
                          {Math.round(document.progress)}% uploaded
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Document list - Show existing documents */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <File className="h-4 w-4 text-[#0031ac] mr-2" />
            {activeCategory && documentCategories.find(cat => cat.id === activeCategory)?.name} Documents ({filteredDocuments.length})
          </h3>
        </div>
        
        {filteredDocuments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start">
                  {/* Document icon */}
                  <div className="mr-4 mt-1">
                    {getDocumentIcon(document.format)}
                  </div>
                  
                  {/* Document info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {document.name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {document.type && getCategoryDocumentTypes(document.category).find(t => t.type === document.type)?.name}
                        </p>
                        {document.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {document.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Document status badge */}
                      <div>
                        {getVerificationBadge(document.verificationStatus)}
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-2 text-xs text-gray-500 space-x-4">
                      <span>{formatFileSize(document.size)}</span>
                      <span>Uploaded {document.uploadedAt?.toLocaleDateString()}</span>
                      <span className="flex items-center">
                        {document.isPublic ? (
                          <>
                            <Eye className="h-3 w-3 mr-1 text-green-500" />
                            Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1 text-gray-400" />
                            Private
                          </>
                        )}
                      </span>
                    </div>
                    
                    {/* Upload progress bar */}
                    {document.progress !== undefined && document.progress < 100 && (
                      <div className="mt-2">
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getProgressColor(document.progress)}`}
                            style={{ width: `${document.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-500 mt-1">
                          {Math.round(document.progress)}% uploaded
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {/* Preview document functionality */}}
                      className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(document.id, document.name)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
              <File className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-900">No documents in this category</h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload documents to improve your listing credibility.
            </p>
          </div>
        )}
      </div>

      {/* Upload form - Placed at the end after viewing what's needed */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800 flex items-center">
            <Upload className="h-4 w-4 text-[#0031ac] mr-2" />
            Upload New Document
          </h3>
        </div>
        
        <div className="p-4">
          <div className="space-y-4">
            {/* Document Type Selection */}
            <div className="space-y-2">
              <div className="flex items-center">
                <label htmlFor="doc-type" className="block text-sm font-semibold text-gray-800 mr-2">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <Tooltip content="Select the type of document you're uploading to help categorize and organize your listing documents.">
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </Tooltip>
              </div>
              
              <select
                id="doc-type"
                className={cn(
                  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  !newDocType ? "border-red-300" : "border-gray-300"
                )}
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value)}
              >
                {getCategoryDocumentTypes(activeCategory).map((docType) => (
                  <option key={docType.type} value={docType.type}>
                    {docType.name}
                  </option>
                ))}
              </select>
              
              <p className="text-xs text-gray-500 mt-1">
                {!newDocType ? 
                  <span className="text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Please select a document type before uploading
                  </span> :
                  "Selecting the correct document type helps buyers find the information they need."
                }
              </p>
            </div>
            
            {/* Document description */}
            <div className="space-y-2">
              <div className="flex items-center">
                <label htmlFor="doc-description" className="block text-sm font-semibold text-gray-800 mr-2">
                  Document Description <span className="text-gray-500">(Optional)</span>
                </label>
                <Tooltip content="Add a brief description of the document to provide context for potential buyers.">
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </Tooltip>
              </div>
              
              <input
                type="text"
                id="doc-description"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                placeholder="E.g., Financial statements for the past year"
                value={newDocDescription}
                onChange={(e) => setNewDocDescription(e.target.value)}
              />
              
              <p className="text-xs text-gray-500 mt-1">
                A clear description helps buyers understand the document's content without opening it.
              </p>
            </div>
            
            {/* Document visibility */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="doc-visibility"
                  className="h-4 w-4 text-[#0031ac] rounded border-gray-300 focus:ring-[#0031ac]"
                  checked={newDocVisibility}
                  onChange={(e) => setNewDocVisibility(e.target.checked)}
                />
                <label htmlFor="doc-visibility" className="ml-2 block text-sm font-medium text-gray-700">
                  Make document publicly visible to potential buyers
                </label>
                <Tooltip content="Public documents are visible to all users browsing your listing. Private documents are only shared with verified buyers after your approval.">
                  <HelpCircle className="h-4 w-4 text-gray-500 ml-2" />
                </Tooltip>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Public documents are visible to all users. Private documents are only visible to verified buyers after approval.
              </p>
            </div>
            
            {/* Upload area */}
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors duration-200 mt-4",
                isDragActive ? "border-[#0031ac] bg-blue-50" : "border-gray-300 hover:border-gray-400",
                isDragAccept ? "border-green-500 bg-green-50" : "",
                isDragReject ? "border-red-500 bg-red-50" : "",
                isLoading || !newDocType ? "opacity-50 cursor-not-allowed" : ""
              )}
            >
              <input {...getInputProps()} />
              
              <div className="flex flex-col items-center justify-center py-4">
                <div className="bg-blue-100 rounded-full p-3 mb-4">
                  <FilePlus className="h-6 w-6 text-[#0031ac]" />
                </div>
                
                {isDragActive ? (
                  <p className="text-sm font-medium text-[#0031ac]">Drop the files here...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {!newDocType ? "Please select a document type first" : "Drag & drop documents here, or click to select files"}
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, Word, Excel, CSV, images (max 20MB each)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document requirements - Kept at the bottom as reference information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Document Requirements & Guidelines</p>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Supported file types: PDF, Word, Excel, CSV, Image files</li>
              <li>Maximum file size: 20MB per document</li>
              <li>All documents must be legible and complete</li>
              <li>Documents must be in English or include an English translation</li>
              <li>Sensitive information should be redacted as appropriate</li>
              <li>Verified documents receive higher credibility scores and improved listing visibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;