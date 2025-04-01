import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  AlertCircle,
  RefreshCw,
  X,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { ListingType } from '@/types/listings';
import listingStorage from '@/lib/ListingStorageService';

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

// Create a placeholder document function
const createPlaceholderDocument = (meta) => {
  return {
    id: meta.id || `placeholder-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    name: meta.name || 'Document',
    description: meta.description || '',
    type: meta.type || 'unknown',
    category: meta.category || 'essential',
    format: meta.format || 'unknown',
    size: meta.size || 0,
    isPublic: meta.isPublic || false,
    verificationStatus: 'pending',
    uploadedAt: meta.uploadedAt ? new Date(meta.uploadedAt) : new Date(),
    isPlaceholder: true,
    progress: 100,
    uploaded: true
  };
};

const Documents = ({
  documents = [],
  onChange,
  onError,
  isEdit = false,
  isLoading = false,
  listingType,
  formId = 'default' // Form ID (can be listing ID when in edit mode)
}) => {
  // State management
  const [uploadedDocuments, setUploadedDocuments] = useState(documents);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [activeCategory, setActiveCategory] = useState('essential');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newDocVisibility, setNewDocVisibility] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replacingDocId, setReplacingDocId] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [needsReupload, setNeedsReupload] = useState(false);
  const [activeUploads, setActiveUploads] = useState(new Set());

  // References for scroll actions and cleanup
  const uploadFormRef = useRef(null);
  const dropzoneRef = useRef(null);
  const isMounted = useRef(true);
  const intervalsRef = useRef({});

  // Clean up on unmount
  useEffect(() => {
    // Attempt to restore active category from storage
    const savedCategory = listingStorage.getActiveCategory(formId);
    if (savedCategory) {
      setActiveCategory(savedCategory);
    }

    // Clean up function
    return () => {
      isMounted.current = false;
      // Clean up all intervals
      Object.values(intervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [formId]);

  // Update parent component when documents change
  useEffect(() => {
    if (onChange) {
      // Only send non-placeholder documents to parent
      const nonPlaceholderDocs = uploadedDocuments.filter(doc => !doc.isPlaceholder && !doc.uploading);
      onChange({
        documents: nonPlaceholderDocs
      });
    }
  }, [uploadedDocuments, onChange]);

  // Save active category when it changes
  useEffect(() => {
    listingStorage.saveActiveCategory(activeCategory, formId);
  }, [activeCategory, formId]);

  // Initialize documents from props or restore from storage
  useEffect(() => {
    console.log("Initializing documents component with props:", documents?.length);

    const initializeDocuments = async () => {
      // If we have documents from props (e.g., in edit mode), use those
      if (documents && documents.length > 0) {
        console.log("Using documents from props:", documents.length);
        setUploadedDocuments(documents);

        // Save to storage for potential restore after reload
        listingStorage.saveDocumentMetadata(documents, formId);
      } else {
        // Otherwise, try to restore from storage
        const savedMeta = listingStorage.getDocumentMetadata(formId);

        if (savedMeta && savedMeta.length > 0) {
          console.log("Found saved document metadata:", savedMeta);

          const restoredDocs = [];
          let needReupload = false;

          // Process each saved document
          for (const meta of savedMeta) {
            // If this is already a placeholder or has no path/url, create a placeholder
            if (meta.isPlaceholder || (!meta.path && !meta.url)) {
              restoredDocs.push(createPlaceholderDocument(meta));
              needReupload = true;
              continue;
            }

            // Otherwise, it's a valid document
            restoredDocs.push({
              id: meta.id,
              name: meta.name,
              description: meta.description || '',
              type: meta.type,
              category: meta.category,
              size: meta.size || 0,
              format: meta.format,
              isPublic: !!meta.isPublic,
              verificationStatus: meta.verificationStatus || 'pending',
              uploadedAt: meta.uploadedAt ? new Date(meta.uploadedAt) : new Date(),
              path: meta.path,
              url: meta.url,
              progress: 100,
              uploaded: true
            });
          }

          if (needReupload) {
            setNeedsReupload(true);
            toast.error(`Please re-upload ${restoredDocs.filter(doc => doc.isPlaceholder).length} document(s) that were lost during page refresh`, {
              duration: 5000
            });
          }

          // Update state with restored documents
          setUploadedDocuments(restoredDocs);
        }
      }
    };

    initializeDocuments();
  }, [documents, formId]);

  // Track active uploads
  useEffect(() => {
    const newActiveUploads = new Set();
    
    // Add all documents with uploading: true to activeUploads
    uploadedDocuments.forEach(doc => {
      if (doc.uploading) {
        newActiveUploads.add(doc.id);
      }
    });
    
    setActiveUploads(newActiveUploads);
    
    // If we have active uploads, isUploading should be true
    if (newActiveUploads.size > 0 && !isUploading) {
      setIsUploading(true);
    } else if (newActiveUploads.size === 0 && isUploading) {
      // Delay setting isUploading to false to prevent flicker
      const timer = setTimeout(() => {
        setIsUploading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [uploadedDocuments, isUploading]);

  // Count of already uploaded documents by type
  const getDocumentTypeCount = (type) => {
    return uploadedDocuments.filter(doc =>
      doc.type === type && doc.category === activeCategory && !doc.isPlaceholder && !doc.uploading
    ).length;
  };

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

    let result = [];

    switch (listingType) {
      case ListingType.BUSINESS:
        if (category === 'essential') result = essentialDocs;
        if (category === 'financial') result = financialDocs;
        if (category === 'operational') result = operationalDocs;
        if (category === 'sale') {
          result = [
            { type: 'sale_memorandum', name: 'Sale Memorandum' },
            { type: 'asset_list', name: 'Asset List' },
            { type: 'lease_agreement', name: 'Lease Agreement' }
          ];
        }
        break;

      case ListingType.FRANCHISE:
        if (category === 'essential') result = essentialDocs;
        if (category === 'franchise') {
          result = [
            { type: 'franchise_disclosure', name: 'Franchise Disclosure Document (FDD)' },
            { type: 'franchise_agreement', name: 'Franchise Agreement Sample' },
            { type: 'brand_guidelines', name: 'Brand Guidelines' }
          ];
        }
        if (category === 'financial') {
          result = [
            { type: 'unit_economics', name: 'Unit Economics Model' },
            { type: 'investment_breakdown', name: 'Investment Breakdown' }
          ];
        }
        if (category === 'training') {
          result = [
            { type: 'training_overview', name: 'Training Program Overview' },
            { type: 'support_structure', name: 'Support Structure' },
            { type: 'marketing_materials', name: 'Marketing Materials' }
          ];
        }
        break;

      case ListingType.STARTUP:
        if (category === 'essential') result = essentialDocs;
        if (category === 'pitch') {
          result = [
            { type: 'pitch_deck', name: 'Pitch Deck' },
            { type: 'executive_summary', name: 'Executive Summary' },
            { type: 'business_plan', name: 'Business Plan' }
          ];
        }
        if (category === 'financial') {
          result = [
            { type: 'financial_projections', name: 'Financial Projections' },
            { type: 'cap_table', name: 'Cap Table' },
            { type: 'use_of_funds', name: 'Use of Funds' }
          ];
        }
        if (category === 'product') {
          result = [
            { type: 'product_demo', name: 'Product Demo' },
            { type: 'technical_architecture', name: 'Technical Architecture' },
            { type: 'product_roadmap', name: 'Product Roadmap' }
          ];
        }
        if (category === 'market') {
          result = [
            { type: 'market_research', name: 'Market Research' },
            { type: 'competitor_analysis', name: 'Competitor Analysis' },
            { type: 'traction_metrics', name: 'Traction Metrics' }
          ];
        }
        break;

      case ListingType.INVESTOR:
        if (category === 'essential') {
          result = [
            { type: 'investor_profile', name: 'Investor Profile' },
            { type: 'credentials', name: 'Credentials & Certifications' }
          ];
        }
        if (category === 'investment') {
          result = [
            { type: 'investment_thesis', name: 'Investment Thesis' },
            { type: 'investment_criteria', name: 'Investment Criteria' }
          ];
        }
        if (category === 'portfolio') {
          result = [
            { type: 'portfolio_summary', name: 'Portfolio Summary' },
            { type: 'case_studies', name: 'Success Case Studies' }
          ];
        }
        if (category === 'process') {
          result = [
            { type: 'due_diligence', name: 'Due Diligence Checklist' },
            { type: 'term_sheet', name: 'Term Sheet Template' },
            { type: 'investment_process', name: 'Investment Process' }
          ];
        }
        break;

      case ListingType.DIGITAL_ASSET:
        if (category === 'essential') {
          result = [
            { type: 'ownership_proof', name: 'Ownership Proof' },
            { type: 'asset_overview', name: 'Asset Overview' }
          ];
        }
        if (category === 'verification') {
          result = [
            { type: 'traffic_analytics', name: 'Traffic Analytics' },
            { type: 'revenue_proof', name: 'Revenue Proof' },
            { type: 'account_access', name: 'Account Access Details' }
          ];
        }
        if (category === 'financial') {
          result = [
            { type: 'revenue_breakdown', name: 'Revenue Breakdown' },
            { type: 'expense_report', name: 'Expense Report' }
          ];
        }
        if (category === 'technical') {
          result = [
            { type: 'technical_specs', name: 'Technical Specifications' },
            { type: 'codebase_overview', name: 'Codebase Overview' },
            { type: 'content_inventory', name: 'Content Inventory' }
          ];
        }
        break;

      default:
        result = [];
    }

    // Always add "Other" document type as the last option
    return [
      ...result,
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

  // Replace a placeholder document
  const replacePlaceholderDocument = async (newDocument) => {
    if (!isReplacing || !replacingDocId) {
      return false;
    }

    const updatedDocs = uploadedDocuments.map(doc => {
      if (doc.id === replacingDocId) {
        return {
          ...newDocument,
          id: replacingDocId // Keep the original ID
        };
      }
      return doc;
    });

    setUploadedDocuments(updatedDocs);
    listingStorage.saveDocumentMetadata(updatedDocs, formId);

    // Reset replacement state
    setIsReplacing(false);
    setReplacingDocId(null);

    return true;
  };

  // Update the simulateProgress function
  const simulateProgress = (fileId, fileName, callback) => {
    let progress = 0;
    
    // Clear existing interval for this file if it exists
    if (intervalsRef.current[fileId]) {
      clearInterval(intervalsRef.current[fileId]);
    }
    
    intervalsRef.current[fileId] = setInterval(() => {
      progress += 10;
      if (!isMounted.current) {
        clearInterval(intervalsRef.current[fileId]);
        delete intervalsRef.current[fileId];
        return;
      }
      
      // Update both the document's progress and the overall progress
      setUploadProgress(prev => ({
        ...prev,
        [fileName]: Math.min(progress, 100)
      }));
      
      // Update the uploading state on the document
      setUploadedDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { ...doc, progress: Math.min(progress, 100) }
            : doc
        )
      );
      
      if (progress >= 100) {
        clearInterval(intervalsRef.current[fileId]);
        delete intervalsRef.current[fileId];
        
        setTimeout(() => {
          if (!isMounted.current) return;
          
          // Remove from progress tracking
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileName];
            return newProgress;
          });
          
          if (callback) callback(100);
        }, 1000);
      }
    }, 200);
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    // Reset errors
    setErrors([]);

    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    toast.loading('Uploading documents...', { id: 'document-upload' });

    const newErrors = [];
    const validFiles = [];

    // Validate each file
    for (const file of acceptedFiles) {
      try {
        // Check file size (20MB limit for documents)
        if (file.size > 20 * 1024 * 1024) {
          newErrors.push(`${file.name}: File size must be less than 20MB`);
          continue;
        }

        // Add to valid files
        validFiles.push(file);
      } catch (error) {
        newErrors.push(`${file.name}: ${error.message}`);
      }
    }

    // Set errors if any
    if (newErrors.length > 0) {
      setErrors(newErrors);
      if (onError) onError(newErrors);
      toast.error('Some files could not be uploaded', { id: 'document-upload' });
    }

    // Process valid files
    const newUploadedDocs = [];

    for (const file of validFiles) {
      // Update progress state for this file
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 0
      }));

      try {
        // Create document object with temp data
        const tempId = listingStorage.generateUniqueId();
        const tempUrl = listingStorage.createTempUrl(file, tempId);

        // Temporary document for immediate display
        const tempDocument = {
          id: tempId,
          name: file.name,
          description: newDocDescription,
          size: file.size,
          format: file.type,
          category: activeCategory,
          type: selectedDocType,
          isPublic: newDocVisibility,
          verificationStatus: 'pending',
          uploadedAt: new Date(),
          progress: 0,
          uploaded: false,
          url: tempUrl,
          preview: tempUrl,
          file: file,
          tempUrl: true,
          uploading: true
        };

        // If replacing, update existing document
        let replacementMade = false;

        if (isReplacing && replacingDocId) {
          // Add to state for immediate feedback
          setUploadedDocuments(prev =>
            prev.map(doc => doc.id === replacingDocId ? tempDocument : doc)
          );

          // Upload with progress simulation
          simulateProgress(tempId, file.name, async (progress) => {
            if (progress >= 100) {
              try {
                // Upload to Firebase
                const uploadedDoc = await listingStorage.uploadFile(file, 'documents', formId);

                // Add additional document info
                const finalDoc = {
                  ...uploadedDoc,
                  description: newDocDescription,
                  category: activeCategory,
                  type: selectedDocType,
                  isPublic: newDocVisibility,
                  verificationStatus: 'pending',
                  uploadedAt: new Date(),
                  tempUrl: false,
                  uploading: false,
                  progress: 100
                };

                // Replace the temporary document with the uploaded one
                setUploadedDocuments(prevDocs => {
                  const newDocs = prevDocs.map(doc =>
                    doc.id === replacingDocId ? finalDoc : doc
                  );

                  // Save to storage
                  listingStorage.saveDocumentMetadata(newDocs, formId);

                  return newDocs;
                });

                // Add to new documents array
                newUploadedDocs.push(finalDoc);

                // Revoke temp URL
                listingStorage.revokeTempUrl(tempId);

                toast.success('Document replaced successfully', { id: 'document-upload' });
              } catch (error) {
                console.error("Error uploading to Firebase:", error);
                toast.error(`Error uploading ${file.name}`, { id: 'document-upload' });
                
                // Update the document to show error state
                setUploadedDocuments(prevDocs => {
                  const newDocs = prevDocs.map(doc =>
                    doc.id === replacingDocId ? { ...doc, uploading: false, error: true } : doc
                  );
                  return newDocs;
                });
              }
            }
          });

          replacementMade = true;
        } else {
          // Add to state for immediate feedback
          setUploadedDocuments(prev => [...prev, tempDocument]);

          // Upload with progress simulation
          simulateProgress(tempId, file.name, async (progress) => {
            if (progress >= 100) {
              try {
                // Upload to Firebase
                const uploadedDoc = await listingStorage.uploadFile(file, 'documents', formId);

                // Add additional document info
                const finalDoc = {
                  ...uploadedDoc,
                  description: newDocDescription,
                  category: activeCategory,
                  type: selectedDocType,
                  isPublic: newDocVisibility,
                  verificationStatus: 'pending',
                  uploadedAt: new Date(),
                  tempUrl: false,
                  uploading: false,
                  progress: 100
                };

                // Replace the temporary document with the uploaded one
                setUploadedDocuments(prevDocs => {
                  const newDocs = prevDocs.map(doc =>
                    doc.id === tempId ? finalDoc : doc
                  );

                  // Save metadata
                  listingStorage.saveDocumentMetadata(newDocs, formId);

                  return newDocs;
                });

                // Add to new documents array
                newUploadedDocs.push(finalDoc);

                // Revoke temp URL
                listingStorage.revokeTempUrl(tempId);
              } catch (error) {
                console.error("Error uploading to Firebase:", error);
                toast.error(`Error uploading ${file.name}`, { id: 'document-upload' });
                
                // Update the document to show error state
                setUploadedDocuments(prevDocs => {
                  const newDocs = prevDocs.map(doc =>
                    doc.id === tempId ? { ...doc, uploading: false, error: true } : doc
                  );
                  return newDocs;
                });
              }
            }
          });
        }
      } catch (error) {
        console.error("Error processing file:", error);
        newErrors.push(`${file.name}: ${error.message}`);
      }
    }

    // Reset form fields after all uploads are initiated
    setTimeout(() => {
      if (!isMounted.current) return;

      setNewDocDescription('');
      setSelectedDocType(null);
      setShowUploadForm(false);
      setIsReplacing(false);
      setReplacingDocId(null);

      // Success toast if no errors
      if (newErrors.length === 0) {
        toast.success(`${validFiles.length} document(s) uploading`, {
          id: 'document-upload'
        });
      }
    }, 500);

  }, [newDocDescription, activeCategory, selectedDocType, newDocVisibility, isReplacing, replacingDocId, onError, formId]);

  // Configure dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open
  } = useDropzone({
    onDrop,
    disabled: isLoading || !selectedDocType,
    maxSize: 20 * 1024 * 1024, // 20MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    noClick: true,
    noKeyboard: true
  });

  // Handle document type selection
  const handleDocumentTypeSelect = (type, name) => {
    setSelectedDocType(type);
    setShowUploadForm(true);

    // Scroll to upload form
    setTimeout(() => {
      if (uploadFormRef.current) {
        uploadFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Clear any replacing state if selecting a new document type
    if (!isReplacing) {
      setIsReplacing(false);
      setReplacingDocId(null);
    }
  };

  // Handle deletion of a document
  const handleDeleteDocument = async (id, name) => {
    // Find the document
    const docToDelete = uploadedDocuments.find(doc => doc.id === id);

    if (!docToDelete) {
      console.warn("No document found with ID:", id);
      return;
    }

    try {
      // Delete from Firebase Storage if it has a path
      if (docToDelete.path && !docToDelete.isPlaceholder) {
        await listingStorage.deleteFile(docToDelete.path);
      }

      // If it has a temp URL, revoke it
      if (docToDelete.tempUrl) {
        listingStorage.revokeTempUrl(docToDelete.id);
      }

      // Remove from state
      const updatedDocs = uploadedDocuments.filter(doc => doc.id !== id);
      setUploadedDocuments(updatedDocs);

      // Update storage
      listingStorage.saveDocumentMetadata(updatedDocs, formId);

      toast.success(`Document "${name}" deleted successfully`);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Error deleting document");
    }
  };

  // Handle replacing a document
  const handleReplaceDocument = (id, type, name) => {
    setIsReplacing(true);
    setReplacingDocId(id);
    setSelectedDocType(type);
    setShowUploadForm(true);

    // Scroll to upload form
    setTimeout(() => {
      if (uploadFormRef.current) {
        uploadFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Show toast message with instruction
        toast.info(`Select a file to replace: ${name}`, { duration: 4000 });
      }
    }, 100);
  };

  // Filter documents by category with robust error handling
  const filteredDocuments = uploadedDocuments.filter(doc => {
    // Check if document matches current category
    const matchesCategory = doc.category === activeCategory;
    return matchesCategory;
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

  // Get document name from type for display
  const getDocumentTypeName = (type) => {
    const allCategories = documentCategories.map(category =>
      getRecommendedDocuments(category.id)
    ).flat();

    const docType = allCategories.find(doc => doc.type === type);
    return docType ? docType.name : 'Unknown Document Type';
  };

  // Find if a document type is already uploaded
  const isDocumentTypeUploaded = (type) => {
    return uploadedDocuments.some(doc =>
      doc.type === type &&
      doc.category === activeCategory &&
      !doc.isPlaceholder &&
      !doc.uploading
    );
  };

  // Find if document type has a placeholder
  const hasPlaceholderDocument = (type) => {
    return uploadedDocuments.some(doc =>
      doc.isPlaceholder &&
      doc.type === type &&
      doc.category === activeCategory
    );
  };

  // Get uploading documents
  const getUploadingDocuments = () => {
    return uploadedDocuments.filter(doc => doc.uploading);
  };

  const uploadingDocuments = getUploadingDocuments();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Supporting Documents</h2>
        <p className="text-sm text-gray-600">
          Add documents to verify your listing information and increase your credibility with potential buyers.
        </p>
      </div>

      {/* Re-upload Warning */}
      {needsReupload && (
        <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg animate-pulse">
          <div className="flex items-start">
            <RefreshCw className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0 animate-spin" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">Some documents need to be re-uploaded</p>
              <p>Due to page refresh, {uploadedDocuments.filter(doc => doc.isPlaceholder).length} document(s) need to be re-uploaded. Please click on the document type to restore them.</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload status indicator */}
      {(isUploading || uploadingDocuments.length > 0) && (
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-3"></div>
            <p className="text-sm font-medium text-blue-800">
              Uploading documents... Please wait.
            </p>
          </div>
          
          {/* Progress bars */}
          <div className="mt-2 space-y-2">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="text-xs">
                <div className="flex justify-between text-gray-700 mb-1">
                  <span className="truncate max-w-xs">{fileName}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={progress < 70 ? "bg-blue-500 h-full" : "bg-green-500 h-full"}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document categories tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-1 overflow-x-auto hide-scrollbar">
          {documentCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setSelectedDocType(null);
                setShowUploadForm(false);
              }}
              className={cn(
                "whitespace-nowrap py-3 px-4 text-sm font-medium border-b-2 focus:outline-none",
                activeCategory === category.id
                  ? "border-[#0031ac] text-[#0031ac]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {category.name}
              {uploadedDocuments.filter(doc => doc.category === category.id && !doc.isPlaceholder && !doc.uploading).length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                  {uploadedDocuments.filter(doc => doc.category === category.id && !doc.isPlaceholder && !doc.uploading).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Active category description and guidance */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              {documentCategories.find(cat => cat.id === activeCategory)?.name}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {documentCategories.find(cat => cat.id === activeCategory)?.description}. 
              Click on a document below to upload it.
            </p>
          </div>
        </div>
      </div>

      {/* Display errors if any */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

      {/* Current Documents Section - Show at the top with recommended documents */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Recommended documents & form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Recommended documents - Optimized for action */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-800 flex items-center">
                <FileText className="h-4 w-4 text-[#0031ac] mr-2" />
                Recommended Documents
              </h3>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getRecommendedDocuments(activeCategory).map((doc, index) => {
                  const isUploaded = isDocumentTypeUploaded(doc.type);
                  const count = getDocumentTypeCount(doc.type);
                  const hasPlaceholder = hasPlaceholderDocument(doc.type);
                  
                  // Check if this document type is currently uploading
                  const isUploading = uploadedDocuments.some(
                    d => d.type === doc.type && d.category === activeCategory && d.uploading
                  );
                  
                  return (
                    <div 
                      key={index} 
                      className={cn(
                        "flex items-start border rounded p-3 cursor-pointer transition-all duration-200",
                        isUploading 
                          ? "bg-blue-50 border-blue-200" // Currently uploading
                          : hasPlaceholder 
                            ? "bg-amber-50 border-amber-200" // Has placeholder
                            : isUploaded && doc.type !== 'other'
                              ? "bg-green-50 border-green-200" // Fully uploaded
                              : "bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                      )}
                      onClick={() => {
                        if (isUploading) {
                          // If uploading, don't do anything
                          toast.info("Document is currently uploading...");
                        } else if (hasPlaceholder) {
                          // If has placeholder, start replacement process
                          const placeholder = uploadedDocuments.find(
                            d => d.isPlaceholder && d.type === doc.type && d.category === activeCategory
                          );
                          if (placeholder) {
                            handleReplaceDocument(placeholder.id, doc.type, doc.name);
                          }
                        } else if (isUploaded && doc.type !== 'other') {
                          // Find the document to highlight
                          const docToHighlight = uploadedDocuments.find(
                            d => d.type === doc.type && d.category === activeCategory && !d.isPlaceholder && !d.uploading
                          );
                          if (docToHighlight) {
                            const docElement = document.getElementById(`document-${docToHighlight.id}`);
                            if (docElement) {
                              docElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              docElement.classList.add('bg-blue-50');
                              setTimeout(() => docElement.classList.remove('bg-blue-50'), 2000);
                            }
                          }
                        } else {
                          // Select document type to upload
                          handleDocumentTypeSelect(doc.type, doc.name);
                        }
                      }}
                    >
                      <FileText className={cn(
                        "h-5 w-5 mt-0.5 mr-3 flex-shrink-0",
                        isUploading ? "text-blue-600" :
                        hasPlaceholder ? "text-amber-600" : 
                        (isUploaded && doc.type !== 'other') ? "text-green-600" : "text-[#0031ac]"
                      )} />
                      <div>
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                          {count > 0 && doc.type === 'other' && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {count}
                            </span>
                          )}
                          {isUploading && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Uploading
                            </span>
                          )}
                          {hasPlaceholder && !isUploading && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center">
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Re-upload
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {isUploading ? (
                            <span className="text-blue-600 flex items-center">
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Uploading...
                            </span>
                          ) : hasPlaceholder ? (
                            <span className="text-amber-600 flex items-center">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Needs re-upload
                            </span>
                          ) : isUploaded && doc.type !== 'other' ? (
                            <span className="text-green-600 flex items-center">
                              <Check className="h-3 w-3 mr-1" />
                              Uploaded
                            </span>
                          ) : (
                            <span className="text-blue-600 flex items-center">
                              <FilePlus className="h-3 w-3 mr-1" />
                              {doc.type === 'other' && count > 0 ? 'Add another' : 'Upload now'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Upload form - Only show when a type is selected */}
          {showUploadForm && (
            <div 
              ref={uploadFormRef} 
              id="upload-form"
              className="bg-white border border-[#0031ac] rounded-lg overflow-hidden shadow-md transition-all"
            >
              <div className="p-4 bg-blue-50 border-b border-[#0031ac] flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#0031ac] flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  {isReplacing ? 'Replace' : 'Upload'}: {getDocumentTypeName(selectedDocType)}
                </h3>
                
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDocType(null);
                    setIsReplacing(false);
                    setReplacingDocId(null);
                    setNewDocDescription('');
                    setShowUploadForm(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close upload form"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  {/* Description field - For ALL document types, but only required for "Other" */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <label htmlFor="doc-description" className="block text-sm font-semibold text-gray-800 mr-2">
                        Document Description {selectedDocType === 'other' ? <span className="text-red-500">*</span> : <span className="text-gray-500">(Optional)</span>}
                      </label>
                      <Tooltip content="Add a description to help identify this document.">
                        <HelpCircle className="h-4 w-4 text-gray-500" />
                      </Tooltip>
                    </div>
                    
                    <input
                      type="text"
                      id="doc-description"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                      placeholder={selectedDocType === 'other' ? "E.g., Employee Handbook" : "Add optional description"}
                      value={newDocDescription}
                      onChange={(e) => setNewDocDescription(e.target.value)}
                      required={selectedDocType === 'other'}
                    />
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedDocType === 'other' 
                        ? "Please provide a clear description for this document." 
                        : "A description helps buyers understand what's in the document."}
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
                  </div>
                  
                  {/* Upload area */}
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-200 mt-4",
                      isDragActive ? "border-[#0031ac] bg-blue-50" : "border-[#0031ac] hover:bg-blue-50",
                      isDragAccept ? "border-green-500 bg-green-50" : "",
                      isDragReject ? "border-red-500 bg-red-50" : "",
                      (isLoading || (selectedDocType === 'other' && !newDocDescription)) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    )}
                    ref={dropzoneRef}
                    onClick={() => {
                      if (!(selectedDocType === 'other' && !newDocDescription) && !isLoading) {
                        open();
                      }
                    }}
                  >
                    <input {...getInputProps()} />
                    
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="bg-blue-100 rounded-full p-3 mb-4">
                        <FilePlus className="h-6 w-6 text-[#0031ac]" />
                      </div>
                      
                      {isDragActive ? (
                        <p className="text-sm font-medium text-[#0031ac]">Drop the file here...</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {selectedDocType === 'other' && !newDocDescription ? (
                              <span className="text-red-600">Please provide a description first</span>
                            ) : (
                              <span>
                                {isReplacing ? 'Drop file to replace' : 'Drop file to upload'}, or
                                <button 
                                  className="ml-1 text-[#0031ac] hover:text-blue-700 focus:outline-none underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!(selectedDocType === 'other' && !newDocDescription)) {
                                      open();
                                    }
                                  }}
                                  id="upload-button"
                                  disabled={selectedDocType === 'other' && !newDocDescription}
                                >
                                  browse files
                                </button>
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF, Word, Excel, CSV, images (max 20MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right column: Uploaded documents list */}
        <div className="lg:col-span-2">
          {/* Uploaded documents list */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 flex items-center justify-between">
                <span className="flex items-center">
                  <File className="h-4 w-4 text-[#0031ac] mr-2" />
                  Uploaded Documents ({filteredDocuments.filter(doc => !doc.isPlaceholder && !doc.uploading).length})
                  {filteredDocuments.some(doc => doc.uploading) && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      {filteredDocuments.filter(doc => doc.uploading).length} uploading
                    </span>
                  )}
                </span>
                
                {!showUploadForm && (
                  <button
                    onClick={() => {
                      setSelectedDocType('other');
                      setShowUploadForm(true);
                      setTimeout(() => {
                        if (uploadFormRef.current) {
                          uploadFormRef.current.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                    className="text-xs flex items-center text-[#0031ac] hover:text-blue-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Other Document
                  </button>
                )}
              </h3>
            </div>
            
            {filteredDocuments.length > 0 ? (
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {filteredDocuments.map((document) => (
                  <div 
                    key={document.id} 
                    id={`document-${document.id}`}
                    className={cn(
                      "p-4 hover:bg-gray-50 transition-colors duration-300",
                      document.isPlaceholder ? "bg-amber-50 opacity-75" : "",
                      document.uploading ? "bg-blue-50" : "",
                      document.error ? "bg-red-50" : ""
                    )}
                  >
                    <div className="flex items-start">
                      {/* Document icon */}
                      <div className="mr-3 mt-1 flex-shrink-0">
                        {getDocumentIcon(document.format)}
                      </div>
                      
                      {/* Document info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 truncate flex items-center">
                                {document.name}
                                {document.isPlaceholder && (
                                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center">
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Needs re-upload
                                  </span>
                                )}
                                {document.uploading && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Uploading
                                  </span>
                                )}
                                {document.error && (
                                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Error
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {getDocumentTypeName(document.type)}
                              </p>
                              {document.description && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  "{document.description}"
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-500 space-x-3">
                              <span>{formatFileSize(document.size)}</span>
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
                            
                            {/* Verification Status */}
                            <div>
                              {document.isPlaceholder ? (
                                <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Missing
                                </span>
                              ) : document.uploading ? (
                                <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                  Uploading
                                </span>
                              ) : document.error ? (
                                <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Failed
                                </span>
                              ) : (
                                getVerificationBadge(document.verificationStatus)
                              )}
                            </div>
                          </div>
                          
                          {/* Upload progress bar if uploading */}
                          {document.uploading && document.progress < 100 && (
                            <div className="mt-2">
                              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={getProgressColor(document.progress)}
                                  style={{ width: `${document.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-gray-500 mt-1">
                                {Math.round(document.progress)}% uploaded
                              </span>
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div className="mt-3 flex space-x-2 justify-end">
                            {document.isPlaceholder ? (
                              <button
                                type="button"
                                onClick={() => handleReplaceDocument(document.id, document.type, document.name)}
                                className="px-2 py-1 text-xs rounded border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center"
                                title="Re-upload document"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Re-upload
                              </button>
                            ) : document.uploading ? (
                              <div className="px-2 py-1 text-xs rounded border border-blue-300 bg-blue-50 text-blue-700 flex items-center">
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Uploading...
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleReplaceDocument(document.id, document.type, document.name)}
                                  className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                                  title="Replace document"
                                  disabled={document.uploading}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Replace
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (document.url) {
                                      // Create a download link
                                      const a = document.createElement('a');
                                      a.href = document.url;
                                      a.download = document.name;
                                      a.target = '_blank';
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                    }
                                  }}
                                  className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                                  title="Download document"
                                  disabled={!document.url || document.uploading}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </button>
                              </>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(document.id, document.name)}
                              disabled={document.uploading}
                              className={cn(
                                "px-2 py-1 text-xs rounded border",
                                document.uploading 
                                  ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed" 
                                  : "border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors"
                              )}
                              title="Delete document"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {document.uploading ? '' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center h-[300px]">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
                  <File className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-gray-900">No documents in this category</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Click on any recommended document to upload it.
                </p>
                <button
                  onClick={() => {
                    setSelectedDocType('other');
                    setShowUploadForm(true);
                    setTimeout(() => {
                      if (uploadFormRef.current) {
                        uploadFormRef.current.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#0031ac] rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  Upload a Document
                </button>
              </div>
            )}
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