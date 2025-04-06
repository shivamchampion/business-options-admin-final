import React, { useState, useEffect, useRef, createRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  CheckCircle, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Save,
  AlertCircle,
  ArrowLeft,
  X,
  Loader
} from 'lucide-react';
import { useLoading } from '@/context/LoadingContext';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BasicInfo from './BasicInfo';
import MediaUpload from './MediaUpload';
import ListingDetails from './ListingDetails';
import Documents from './Documents';
import ReviewSubmit from './ReviewSubmit';
import {
  getListingById,
  createListing,
  updateListing
} from '@/services/listingService';
import { seedIndustriesData } from '@/services/industryService';
import { ListingType, ListingStatus, ListingPlan } from '@/types/listings';
import { cn } from '@/lib/utils';
import { listingSchema, migrateListingData } from '@/schemas/listingSchema';
import { formPersistenceService, STORAGE_KEYS } from '@/services/formPersistenceService';
import { useAuth } from '@/context/AuthContext';
import ToastManager, { TOAST_IDS } from "@/utils/ToastManager";
import { 
  enhancedStorage, 
  uploadFileWithProgress, 
  downloadFile 
} from '@/lib';

// Step components mapping
const stepComponentsMap = {
  'basic-info': BasicInfo,
  'media': MediaUpload,
  'details': ListingDetails,
  'documents': Documents,
  'review': ReviewSubmit
};

// Define steps for the form wizard based on listing type
const getStepsByListingType = (type) => {
  const baseSteps = [
    { id: 'basic-info', title: 'Basic Information' },
    { id: 'media', title: 'Media' },
  ];
  
  // Add type-specific steps
  if (type === ListingType.BUSINESS || type === ListingType.FRANCHISE) {
    baseSteps.push({ id: 'details', title: 'Business Details' });
  } else if (type === ListingType.STARTUP) {
    baseSteps.push({ id: 'details', title: 'Startup Details' });
  } else if (type === ListingType.INVESTOR) {
    baseSteps.push({ id: 'details', title: 'Investor Details' });
  } else if (type === ListingType.DIGITAL_ASSET) {
    baseSteps.push({ id: 'details', title: 'Digital Asset Details' });
  }
  
  // Add Documents step before final review step
  baseSteps.push({ id: 'documents', title: 'Documents' });
  
  // Add final step
  baseSteps.push({ id: 'review', title: 'Review & Submit' });
  
  return baseSteps;
};

// Helper function to sanitize images for storage
// This prevents circular references and large blob URLs from being stored
const sanitizeImagesForStorage = (images) => {
  if (!images || !Array.isArray(images)) return [];
  
  return images.map(img => ({
    id: img.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: img.name || 'Unnamed image',
    size: img.size || 0,
    type: img.type || 'image/jpeg',
    path: img.path || null,
    // Don't store blob URLs in localStorage
    url: img.url && !img.url.startsWith('blob:') ? img.url : null,
    // Don't store blob URLs in localStorage
    preview: img.preview && !img.preview.startsWith('blob:') ? img.preview : null,
    // Remove file object and other non-serializable data
    file: undefined,
    base64: null
  }));
};

// Helper function to sanitize documents for storage
const sanitizeDocumentsForStorage = (documents) => {
  if (!documents || !Array.isArray(documents)) return [];
  
  return documents.map(doc => ({
    id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: doc.name || 'Unnamed document',
    size: doc.size || 0,
    type: doc.type || 'application/pdf',
    format: doc.format || doc.mime || null,
    category: doc.category || 'other',
    description: doc.description || null,
    isPublic: !!doc.isPublic,
    path: doc.path || null,
    // Don't store blob URLs in localStorage
    url: doc.url && !doc.url.startsWith('blob:') ? doc.url : null,
    uploadedAt: doc.uploadedAt || new Date().toISOString(),
    verificationStatus: doc.verificationStatus || 'pending',
    // Remove file object and other non-serializable data
    file: undefined
  }));
};

function ListingForm({ isEdit = false, externalOnSubmit }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { startLoading, stopLoading } = useLoading();
  const { user } = useAuth();
  
  // Pre-load saved images to prevent flicker
  const initialImages = (() => {
    try {
      const savedImages = formPersistenceService.loadImageMetadata();
      
      if (Array.isArray(savedImages) && savedImages.length > 0) {
          // Ensure all images have required properties
        return savedImages.map((img, idx) => ({
            ...img,
            id: img.id || `local-img-${Date.now()}-${idx}`,
            // Prefer base64 data if available
            url: img.base64 || img.url || img.preview || '',
            preview: img.base64 || img.preview || img.url || '',
            type: img.type || 'image/jpeg'
          }));
      }
    } catch (e) {
      console.error("Error loading saved images:", e);
    }
    return [];
  })();
  
  // Pre-load featured image index
  const initialFeaturedIndex = (() => {
    try {
      return formPersistenceService.loadFeaturedImageIndex();
    } catch (e) {
      console.error("Error loading featured image index:", e);
    }
    return 0;
  })();

  // Pre-load saved documents to prevent flicker
  const initialDocuments = (() => {
    try {
      const savedDocuments = formPersistenceService.loadDocumentMetadata();
      
      if (Array.isArray(savedDocuments) && savedDocuments.length > 0) {
        // Ensure all documents have required properties
        return savedDocuments.map((doc, idx) => ({
          ...doc,
          id: doc.id || `local-doc-${Date.now()}-${idx}`,
          // Add any necessary default properties for documents
        }));
      }
    } catch (e) {
      console.error("Error loading saved documents:", e);
    }
    return [];
  })();
  
  // Get current form methods
  const methods = useForm({
    resolver: zodResolver(listingSchema),
    mode: 'onChange',
    defaultValues: {
      type: undefined,
      name: '',
      classifications: [{
        industry: '',
        industryName: '',
        category: '',
        categoryName: '',
        subCategories: [],
        subCategoryNames: []
      }],
      description: '',
      status: ListingStatus.DRAFT,
      plan: ListingPlan.FREE,
      location: {
        country: 'IN',
        countryName: 'India',
        state: '',
        city: '',
      },
      contactInfo: {
        email: '',
        phone: '',
      },
      mediaValidation: initialImages.length >= 3,
    },
    shouldUnregister: false
  });

  const { handleSubmit, reset, trigger, clearErrors, formState: { errors, isDirty }, watch, setValue, getValues } = methods;

  // Watch listing type to update type-specific forms
  const listingType = watch('type');
  
  // Get steps for the current listing type - always provide a fallback to ensure consistent rendering
  const steps = React.useMemo(() => {
    // Ensure we have a valid listing type
    const validType = listingType || ListingType.BUSINESS;
    return getStepsByListingType(validType);
  }, [listingType]);
  
  // IMPORTANT: Read from localStorage synchronously to avoid flicker
  // This is crucial for proper tab preservation
  const initialStep = (() => {
    try {
      const step = formPersistenceService.loadStep();
      if (step >= 0 && step < steps.length) {
        return step;
      }
    } catch (e) {
      console.error("Error loading initial step:", e);
    }
    return 0;
  })();
  
  // State variables
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState(initialImages);
  const [uploadedDocuments, setUploadedDocuments] = useState(initialDocuments);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [documentsToDelete, setDocumentsToDelete] = useState([]);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(initialFeaturedIndex);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [transitioningStep, setTransitioningStep] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [autosaveStatus, setAutosaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [documentUploadLoading, setDocumentUploadLoading] = useState(false);
  // Add visitedSteps state to track which steps user has visited
  const [visitedSteps, setVisitedSteps] = useState([0]); // Initialize with first step

  // IMPORTANT: Move all useMemo hooks to the top level to ensure consistent ordering
  
  // Get the safe current step index, ensuring it's within valid range
  const safeCurrentStep = React.useMemo(() => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return 0;
    }
    
    if (currentStep >= 0 && currentStep < steps.length) {
      return currentStep;
    }
    return 0; // Default to first step if out of range
  }, [currentStep, steps]);
  
  // Get current step component using useMemo to ensure consistent hook rendering
  const StepComponent = React.useMemo(() => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return stepComponentsMap['basic-info'];
    }
    
    const stepId = steps[safeCurrentStep]?.id || 'basic-info';
    return stepComponentsMap[stepId] || stepComponentsMap['basic-info'];
  }, [steps, safeCurrentStep]);
  
  // Create a memoized hasStepErrors function to ensure consistent behavior
  const hasStepErrors = React.useCallback((step) => {
    if (!errors || Object.keys(errors).length === 0) return false;
    
    switch (step) {
      case 0: // Basic Info
        return ['name', 'type', 'classifications', 'description', 'status', 'plan', 'location', 'contactInfo'].some(
          field => errors[field]
        );
        
      case 1: // Media
        return false; // Media has its own validation
        
      case 2: // Details
        if (listingType === ListingType.BUSINESS) {
          // For business listings, check for errors excluding employee fields
          return Object.keys(errors).some(key => 
            (key === 'businessDetails' || key.startsWith('businessDetails.')) && 
            !key.includes('employees')
          );
        } else if (listingType === ListingType.FRANCHISE) {
          return !!errors.franchiseDetails;
        }
        return false;
        
      case 3: // Documents
        return false; // Documents are optional
        
      case 4: // Review
        // For the review step, ignore business details errors if it's a business listing
        if (listingType === ListingType.BUSINESS) {
          const allErrors = Object.keys(errors);
          // Return true only if there are errors that are NOT related to business details
          return allErrors.some(key => key !== 'businessDetails' && !key.startsWith('businessDetails.'));
        }
        // For franchises, check for any errors
        return Object.keys(errors).length > 0;
        
      default:
        return false;
    }
  }, [errors, listingType]);

  // Refs for debouncing and tracking
  const saveTimeout = useRef(null);
  const pendingStep = useRef(null);
  
  // Create refs for each step - based on safeCurrentStep for consistency
  const stepRefs = useRef([]);
  // Update stepRefs in a useEffect to avoid rendering inconsistencies
  React.useEffect(() => {
    if (steps && Array.isArray(steps)) {
      stepRefs.current = steps.map((_, i) => stepRefs.current[i] || createRef());
    }
  }, [steps]);

  // Initialize default values for type-specific fields when listing type changes
  useEffect(() => {
    // Clear any previous type fields when listing type changes
    const clearPreviousTypeData = () => {
      // Reset validation errors and data for type-specific fields that are not relevant for the current type
      if (listingType !== ListingType.FRANCHISE) {
        clearErrors('franchiseDetails');
        // Completely remove franchise data to avoid validation errors
        setValue('franchiseDetails', undefined, { shouldValidate: false });
      }
      
      if (listingType !== ListingType.BUSINESS) {
        clearErrors('businessDetails');
        setValue('businessDetails', undefined, { shouldValidate: false });
      }
      
      if (listingType !== ListingType.STARTUP) {
        clearErrors('startupDetails');
        setValue('startupDetails', undefined, { shouldValidate: false });
      }
      
      if (listingType !== ListingType.INVESTOR) {
        clearErrors('investorDetails');
        setValue('investorDetails', undefined, { shouldValidate: false });
      }
      
      if (listingType !== ListingType.DIGITAL_ASSET) {
        clearErrors('digitalAssetDetails');
        setValue('digitalAssetDetails', undefined, { shouldValidate: false });
      }
    };
    
    clearPreviousTypeData();
    
    if (listingType === ListingType.FRANCHISE) {
      // Initialize the entire franchise structure with defaults
      const franchiseDetails = getValues('franchiseDetails') || {};
      
      // Ensure all required nested objects exist
      if (!franchiseDetails.support) {
        // Initialize the full support object structure
        setValue('franchiseDetails', {
          ...franchiseDetails,
          support: {
            siteSelection: false,
            // Add other default support fields as needed
            initialTraining: franchiseDetails.support?.initialTraining || '',
            trainingDuration: franchiseDetails.support?.trainingDuration || '',
            trainingLocation: franchiseDetails.support?.trainingLocation || '',
            ongoingSupport: franchiseDetails.support?.ongoingSupport || '',
            fieldSupport: franchiseDetails.support?.fieldSupport || '',
            marketingSupport: franchiseDetails.support?.marketingSupport || '',
            technologySystems: franchiseDetails.support?.technologySystems || ''
          }
        }, { shouldValidate: false, shouldDirty: false });
      } else if (franchiseDetails.support.siteSelection === undefined) {
        // If support exists but siteSelection is undefined
        setValue('franchiseDetails.support.siteSelection', false, { shouldValidate: false, shouldDirty: false });
      }
    }
  }, [listingType, setValue, getValues, clearErrors]);

  // Load saved data on component mount
  useEffect(() => {
    // Flag to track if component is mounted
    let isMounted = true;
    
    const initForm = async () => {
      console.log("Initializing form...");
      if (!isMounted) return;
      setInitialLoading(true);
      
      try {
        if (!isEdit) {
          console.log("New form mode - checking for saved data");
          // Load form data from localStorage
          const savedFormData = formPersistenceService.loadFormData();
          
          if (savedFormData) {
            console.log("Found saved form data, restoring state");
            try {
              // Merge with default values for safety
              const defaultValues = methods.getValues();
              const mergedData = { ...defaultValues, ...savedFormData };
              
              // Debug output
              console.log("Merged form data completed, form has: " + 
                `${mergedData.classifications?.length || 0} classifications, ` +
                `type: ${mergedData.type || 'unset'}`)
              
              // Try to reset the form with the merged data
              try {
                reset(mergedData);
                console.log("Form data restored successfully");
              } catch (resetError) {
                console.error("Error during form reset:", resetError);
                
                // Try with a clean default reset if the merged data caused issues
                reset(defaultValues);
                ToastManager.dismiss();
                ToastManager.error(
                  "There was a problem restoring your form data. Starting with default values.",
                  TOAST_IDS.FORM_ERROR
                );
              }
            } catch (error) {
              console.error("Error restoring saved data:", error);
              
              // Handle restoration failure by clearing saved data and seeding fresh
              console.log("Clearing corrupted form data");
              formPersistenceService.clearFormData();
              reset();
              ToastManager.dismiss();
              ToastManager.error(
                "There was a problem restoring your form data. Starting with default values.",
                TOAST_IDS.FORM_ERROR
              );
            }
          } else {
            console.log("No saved data found, using defaults");
          }
          
          // We already loaded images and featured index in initialization
          if (initialImages.length >= 3) {
            setValue('mediaValidation', true);
          }
          
          setDataLoaded(true);
          setInitialLoading(false);
        }
        
        // Seed industry data (can happen in background)
        await seedIndustriesData();
        
        // If in edit mode, load from server
        if (isEdit && id) {
          setIsLoading(true);
          startLoading('Loading listing data...');
          
          try {
            const listingData = await getListingById(id);
            if (!isMounted) return;
            
            setListing(listingData);
            
            // Migrate and reset form data
            console.log("Migrating listing data from server");
            const migratedData = migrateListingData(listingData);
            reset(migratedData);
            
            // Process images
            if (listingData.media?.galleryImages) {
              const processedImages = listingData.media.galleryImages.map((img, idx) => ({
                ...img,
                id: img.id || `server-img-${Date.now()}-${idx}`,
                url: img.url || img.preview || '',
                preview: img.preview || img.url || '',
                type: img.type || 'image/jpeg'
              }));
              
              setUploadedImages(processedImages);
              setValue('mediaValidation', processedImages.length >= 3);
              
              // Set first image as featured
              if (processedImages.length > 0) {
                setFeaturedImageIndex(0);
              }
            }
            
            // Load documents
            if (listingData.documents) {
              setUploadedDocuments(listingData.documents);
            }
            
            setDataLoaded(true);
          } catch (error) {
            console.error('Error loading listing:', error);
            if (isMounted) {
              ToastManager.dismiss();
              ToastManager.error(
                'Failed to load listing data. Please try again.',
                TOAST_IDS.FORM_ERROR
              );
              navigate('/listings');
            }
          } finally {
            if (isMounted) {
              setIsLoading(false);
              stopLoading();
              setInitialLoading(false);
            }
          }
        } else {
          if (isMounted) {
            setInitialLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        if (isMounted) {
          setDataLoaded(true);
          setInitialLoading(false);
          ToastManager.dismiss();
          ToastManager.error(
            'There was a problem initializing the form. Please try refreshing the page.',
            TOAST_IDS.FORM_ERROR
          );
        }
      }
    };

    initForm();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [id, isEdit, navigate, reset, setValue, startLoading, stopLoading, initialImages.length, methods]);

  // Save form data when it changes
  useEffect(() => {
    // Don't save in edit mode
    if (isEdit) return;
    
    // Clean up on unmount
    let isMounted = true;
    
    const saveFormData = () => {
      if (!isMounted) return;
      
      try {
        const formData = getValues();
        if (formData) {
          console.log("Saving form data...");
          const result = formPersistenceService.saveFormData('', formData);
          if (result) {
            console.log(`Form data saved successfully at ${new Date().toLocaleTimeString()}`);
          } else {
            console.warn("Form save operation failed");
          }
        }
      } catch (error) {
        console.error("Error saving form data:", error);
      }
    };
    
    // Debounced save
    const debouncedSave = () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(saveFormData, 1000); // Increased from 500ms to 1000ms
    };
    
    const subscription = watch(debouncedSave);
    
    return () => {
      isMounted = false;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      subscription.unsubscribe();
    };
  }, [isEdit, getValues, watch]);

  // Save current step when it changes
  useEffect(() => {
    if (isEdit) return;
    
    // IMPORTANT: Save step immediately to ensure it's saved before reload
    formPersistenceService.saveStep('', currentStep);
    
    // Also save in our reference
    pendingStep.current = currentStep;
  }, [currentStep, isEdit]);
  
  // Save featured image index when it changes
  useEffect(() => {
    if (!isEdit) {
      formPersistenceService.saveFeaturedImageIndex('', featuredImageIndex);
    }
  }, [featuredImageIndex, isEdit]);
  
  // Save images when they change
  useEffect(() => {
    if (!isEdit && dataLoaded) {
      formPersistenceService.saveImageMetadata('', uploadedImages);
    }
  }, [uploadedImages, isEdit, dataLoaded]);
  
  // Save documents when they change - ADD THIS NEW EFFECT
  useEffect(() => {
    if (!isEdit && dataLoaded) {
      formPersistenceService.saveDocumentMetadata('', uploadedDocuments);
    }
  }, [uploadedDocuments, isEdit, dataLoaded]);
  
  // Add a useEffect for persisting documents
  useEffect(() => {
    // Save documents when they change
    if (id && uploadedDocuments.length > 0) {
      try {
        console.log(`Saving ${uploadedDocuments.length} documents to storage for form ${id}`);
        
        // Save to local storage
        enhancedStorage.saveDocumentMetadata(uploadedDocuments, id);
        
        // Save to Firebase (with error handling)
        enhancedStorage.saveToFirebase({
          documents: uploadedDocuments,
          formId: id,
          userId: user?.id,
        }).catch(error => {
          console.error("Error saving documents to Firebase:", error);
          // Don't show toast here as it would be too intrusive during normal operation
        });
      } catch (error) {
        console.error("Error saving document data:", error);
      }
    }
  }, [uploadedDocuments, id, user?.id]);
  
  // Update error state
  useEffect(() => {
    const newErrors = {};
    
    // Basic Info errors (step 0)
    const basicInfoFields = ['name', 'type', 'classifications', 'description', 'status', 'plan', 'location', 'contactInfo'];
    const hasBasicInfoErrors = Object.keys(errors).some(key => 
      basicInfoFields.some(field => key === field || key.startsWith(`${field}.`))
    );
    
    if (hasBasicInfoErrors) {
      newErrors[0] = true;
    }
    
    // Media errors (step 1)
    if (uploadedImages.length < 3) {
      newErrors[1] = true;
    }
    
    // Details errors (step 2)
    const detailsField = listingType ? `${listingType.toLowerCase()}Details` : '';
    const hasDetailsErrors = Object.keys(errors).some(key => key.startsWith(detailsField));
    
    if (hasDetailsErrors) {
      newErrors[2] = true;
    }
    
    setErrorMessages(Object.keys(newErrors).map(key => ({ path: key, message: 'Error' })));
  }, [errors, listingType, uploadedImages.length]);

  // Handle image upload
  const handleImageUpload = (files, skipNotifications = false) => {
    // Validate files first
    if (!files || !Array.isArray(files) || files.length === 0) {
      console.warn("No valid files to upload");
      return;
    }
    
    // Create a copy of the current images
    const currentImages = [...uploadedImages];
    const wasEmpty = currentImages.length === 0;
    
    // Add the new images
    const newImages = [...currentImages, ...files];
    
    // Update state
    setUploadedImages(newImages);
    
    // Set featured image if this is the first upload
    if (wasEmpty && files.length > 0) {
      console.log("Setting first image as featured");
      setFeaturedImageIndex(0);
      
      // Save featured index using enhanced storage
      try {
        enhancedStorage.saveFeaturedImageIndex(0, id || 'default')
          .catch(error => console.error("Error saving featured index:", error));
      } catch (e) {
        console.error("Error saving featured index:", e);
      }
    }
    
    // Update validation
    setValue('mediaValidation', newImages.length >= 3);
    
    // Save to enhanced storage
    try {
      // Use enhanced storage to avoid quota issues
      enhancedStorage.saveImageMetadata(newImages, id || 'default')
        .catch(error => console.error("Error saving images to enhanced storage:", error));
    } catch (e) {
      console.error("Error saving images to enhanced storage:", e);
    }
    
    console.log("Images updated:", newImages.length);
    
    // Success toast is handled by the MediaUpload component
  };

  // Handle image deletion
  const handleImageDelete = (image, skipNotifications = false) => {
    if (!image) {
      console.warn("No image to delete");
      return;
    }
    
    // Create a copy without the deleted image
    const updatedImages = uploadedImages.filter(img => img.id !== image.id);
    
    // Update state
    setUploadedImages(updatedImages);
    
    // Update validation
    setValue('mediaValidation', updatedImages.length >= 3);
    
    // Save to enhanced storage
    try {
      enhancedStorage.saveImageMetadata(updatedImages, id || 'default')
        .catch(error => console.error("Error saving images to enhanced storage:", error));
    } catch (e) {
      console.error("Error saving images to enhanced storage:", e);
    }
    
    console.log("Image deleted, remaining:", updatedImages.length);
    
    // Success toast is handled by the MediaUpload component
  };

  // Handle setting featured image
  const handleSetFeatured = (index, skipNotifications = false) => {
    setFeaturedImageIndex(index);
    enhancedStorage.saveFeaturedImageIndex(index, id || 'default')
      .catch(error => console.error("Error saving featured index:", error));
    
    // Success toast is handled by the MediaUpload component
  };

  // Fixed document upload handler with proper typing, error handling, and persistence
  const handleDocumentUpload = async (files) => {
    if (!files || !Array.isArray(files) || files.length === 0) {
      console.warn("No valid files to upload");
      return;
    }

    try {
      // Use document-specific loading state
      setDocumentUploadLoading(true);
      
      // Show loading toast
      ToastManager.loading(
        `Uploading ${files.length} document${files.length > 1 ? 's' : ''}...`,
        TOAST_IDS.DOCUMENT_UPLOAD_SUCCESS
      );
      
      // Process the files to ensure they have the expected format
      const processedFiles = files.map(file => {
        // If it's already a File object with required properties, use it
        if (file instanceof File) {
          // Add type information based on file extension/mimetype for better categorization
          const getDocType = (file) => {
            const filename = file.name.toLowerCase();
            const mimetype = file.type.toLowerCase();
            
            if (mimetype.includes('pdf') || filename.endsWith('.pdf')) {
              return 'pdf';
            } else if (mimetype.includes('word') || filename.endsWith('.doc') || filename.endsWith('.docx')) {
              return 'doc';
            } else if (mimetype.includes('excel') || mimetype.includes('spreadsheet') || 
                     filename.endsWith('.xls') || filename.endsWith('.xlsx')) {
              return 'spreadsheet';
            } else if (mimetype.includes('image')) {
              return 'image';
            } else if (mimetype.includes('text')) {
              return 'text';
            } else {
              return 'document';
            }
          };

          // Intelligently categorize document based on file type and name
          const getCategoryFromFile = (file) => {
            const filename = file.name.toLowerCase();
            const mimetype = file.type.toLowerCase();
            
            // Financial documents
            if (filename.includes('financial') || 
                filename.includes('finance') || 
                filename.includes('statement') || 
                filename.includes('balance') ||
                filename.includes('tax') || 
                filename.includes('revenue') || 
                filename.includes('profit') ||
                filename.includes('loss') ||
                filename.includes('income') ||
                filename.includes('cash flow')) {
              return 'financial';
            }
            
            // Legal documents
            if (filename.includes('legal') || 
                filename.includes('agreement') || 
                filename.includes('contract') || 
                filename.includes('license') ||
                filename.includes('permit') ||
                filename.includes('certificate')) {
              return 'legal';
            }
            
            // Identity documents
            if (filename.includes('id') || 
                filename.includes('identity') || 
                filename.includes('passport') || 
                filename.includes('driver') ||
                filename.includes('identification')) {
              return 'identity';
            }
            
            // Operational documents
            if (filename.includes('operation') || 
                filename.includes('manual') || 
                filename.includes('procedure') || 
                filename.includes('process') ||
                filename.includes('inventory') ||
                filename.includes('equipment')) {
              return 'operational';
            }
            
            // Sale documents
            if (filename.includes('sale') || 
                filename.includes('selling') || 
                filename.includes('asset') || 
                filename.includes('transfer')) {
              return 'sale';
            }
            
            // Franchise documents
            if (filename.includes('franchise') || 
                filename.includes('disclosure') || 
                filename.includes('fdd')) {
              return 'franchise';
            }
            
            // Spreadsheets often contain financial information
            if (mimetype.includes('spreadsheet') || 
                filename.endsWith('.xls') || 
                filename.endsWith('.xlsx') ||
                filename.endsWith('.csv')) {
              return 'financial';
            }
            
            // Default to essential for important documents, other for the rest
            if (mimetype.includes('pdf') || filename.endsWith('.pdf')) {
              return 'essential';
            }
            
            return 'other';
          };
          
          return {
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            file: file,
            name: file.name,
            type: getDocType(file),
            mime: file.type,
            size: file.size,
            uploadDate: new Date(),
            description: file.name,
            isPublic: false, // Default to private
            category: getCategoryFromFile(file) // Assign intelligent category
          };
        }
        
        // If it's an object that appears like a document but not a File instance
        if (file && file.name) {
          return {
            ...file,
            id: file.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            // Ensure we have these standard fields
            description: file.description || file.name,
            isPublic: !!file.isPublic,
            type: file.type || 'document',
            category: file.category || 'other' // Ensure category is set
          };
        }
        
        // Fallback for unknown format
        return {
          id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file: file,
          name: 'Document',
          type: 'document',
          size: 0,
          description: 'Document',
          isPublic: false,
          category: 'other' // Default fallback category
        };
      });
      
      // Add the processed documents to state
      const updatedDocuments = [...uploadedDocuments, ...processedFiles];
      
      // Log document categories for debugging
      console.log("Document categories:", processedFiles.map(doc => ({
        name: doc.name,
        category: doc.category
      })));
      
      setUploadedDocuments(updatedDocuments);
      
      // Save to enhanced storage for persistence
      try {
        const sanitizedDocuments = sanitizeDocumentsForStorage(updatedDocuments);
        enhancedStorage.saveDocumentMetadata(sanitizedDocuments, id || 'default')
          .catch(error => console.error("Error saving documents to enhanced storage:", error));
        
        // Also save to additional key for backup
        enhancedStorage.saveToFirebase({
          documents: sanitizedDocuments,
          formId: id,
          userId: user?.id,
        }).catch(error => {
          console.error("Error saving documents to Firebase:", error);
          // Don't show toast here as it would be too intrusive during normal operation
        });
      } catch (e) {
        console.error("Error saving document data:", e);
      }
    
      // Dismiss loading toast and show success toast
      ToastManager.success(
        `${files.length} document${files.length > 1 ? 's' : ''} uploaded successfully`,
        TOAST_IDS.DOCUMENT_UPLOAD_SUCCESS
      );
      
    } catch (error) {
      console.error("Error in document upload:", error);
      ToastManager.error(
        "An error occurred during document upload", 
        TOAST_IDS.DOCUMENT_UPLOAD_ERROR
      );
    } finally {
      setDocumentUploadLoading(false);
    }
  };

  // Handle document deletion
  const handleDocumentDelete = (docToDelete) => {
    // Add to delete list if it's a server document
    if (docToDelete.url || docToDelete.id) {
      setDocumentsToDelete(prev => [...prev, docToDelete.id]);
    }
    
    // Find the document index to ensure it's correctly removed
    const docIndex = uploadedDocuments.findIndex(doc => {
      if (docToDelete.id && doc.id) return doc.id === docToDelete.id;
      if (docToDelete.path && doc.path) return doc.path === docToDelete.path;
      if (docToDelete.url && doc.url) return doc.url === docToDelete.url;
      return false;
    });
    
    if (docIndex === -1) {
      console.warn("Document not found:", docToDelete);
      return;
    }
    
    // Create new array without the deleted document
    const newDocuments = [...uploadedDocuments];
    newDocuments.splice(docIndex, 1);
    
    // Update state
    setUploadedDocuments(newDocuments);
    
    // Save to enhanced storage for persistence
    try {
      const sanitizedDocuments = sanitizeDocumentsForStorage(newDocuments);
      enhancedStorage.saveDocumentMetadata(sanitizedDocuments, id || 'default')
        .catch(error => console.error("Error saving documents to enhanced storage:", error));
      enhancedStorage.saveToFirebase({
        documents: sanitizedDocuments,
        formId: id,
        userId: user?.id,
      }).catch(error => {
        console.error("Error saving documents to Firebase:", error);
        // Don't show toast here as it would be too intrusive during normal operation
      });
    } catch (e) {
      console.error("Error saving after document deletion:", e);
    }
    
    // Show toast
    ToastManager.success("Document deleted", TOAST_IDS.DOCUMENT_DELETION_SUCCESS);
  };

  // Handle save as draft
  const handleSaveDraft = () => {
    ToastManager.dismiss(); // Dismiss any existing toasts
    setSaveAsDraft(true);
    setValue('status', ListingStatus.DRAFT);
    
    // Clear ALL stored form data when saving as draft
    formPersistenceService.clearFormData();
    formPersistenceService.clearImageMetadata();
    formPersistenceService.clearDocumentMetadata();
    formPersistenceService.clearFeaturedImageIndex();
    formPersistenceService.clearStep();
    
    handleSubmit(onSubmit)();
  };

  // Extract error messages for display
  const getErrorMessages = (errors) => {
    const messages = [];

    const extractErrors = (obj, path = '') => {
      if (!obj) return;

      // Skip any employee-related error paths or business details root errors
      if (path.includes('businessDetails.operations.employees') || path === 'businessDetails') {
        return;
      }

      if (obj.message) {
        messages.push({ path, message: obj.message });
        return;
      }

      if (typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key;
          // Skip if this is an employee-related field or businessDetails root
          if (!newPath.includes('businessDetails.operations.employees') && newPath !== 'businessDetails') {
            extractErrors(value, newPath);
          }
        });
      }
    };

    extractErrors(errors);
    return messages;
  };

  // Replace the handleNext function in ListingForm.jsx with this implementation
const handleNext = async () => {
  // Add this right at the beginning of handleNext() to log detailed error information
  try {
    // Create a safe version of the errors object to log
    const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (key, value) => {
        // Do not include DOM nodes or React elements
        if (value instanceof Element || (value && value._reactInternals)) {
          return '[CircularReference]';
        }
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[CircularReference]';
          }
          seen.add(value);
        }
        return value;
      };
    };
    
    console.log("FULL ERROR OBJECT:", JSON.stringify(errors, getCircularReplacer(), 2));
  } catch(e) {
    console.log("Error logging error object:", e.message);
    console.log("Raw errors object:", Object.keys(errors));
  }
  
  // Always clear any business details validation errors at the top level and any employee-related errors
  clearErrors([
    'businessDetails',
    'businessDetails.operations',
    'businessDetails.operations.employees',
    'businessDetails.operations.employees.count',
    'businessDetails.operations.employees.fullTime',
    'businessDetails.operations.employees.partTime'
  ]);
  
  // Set submitAttempted to true to show all validation errors
  setSubmitAttempted(true);
  setShowErrorSummary(true);
  
  try {
    // Validate current step
    let isStepValid = false;
    let currentStepErrors = [];
    
    switch (safeCurrentStep) {
      case 0: // Basic Info
        const basicInfoFields = ['name', 'type', 'classifications', 'description', 'status', 'plan', 'location', 'contactInfo'];
        
        // Ensure phone validation happens explicitly
        await trigger('contactInfo.phone');
        
        isStepValid = await trigger(basicInfoFields);
        
        if (!isStepValid) {
          currentStepErrors = getErrorMessages(errors).filter(error => {
            return basicInfoFields.some(field => error.path === field || error.path.startsWith(`${field}.`));
          });
          setErrorMessages(currentStepErrors);
          ToastManager.dismiss();
          ToastManager.error('Please fix the errors before proceeding');
          window.scrollTo(0, 0);
          return; // Exit function if validation fails
        }
        break;
        
      case 1: // Media
        if (uploadedImages.length < 3) {
          ToastManager.dismiss();
          ToastManager.error('Please upload at least 3 images to continue');
          return; // Exit function if not enough images
        }
        isStepValid = true;
        break;
        
      case 2: // Details
        // Type-specific validation based on listing type
        if (listingType === ListingType.BUSINESS) {
          // Create a comprehensive list of basic fields to validate
          const basicFields = [
            'businessDetails.businessType',
            'businessDetails.entityType',
            'businessDetails.establishedYear',
            'businessDetails.registrationNumber',
            'businessDetails.operations.locationType',
            'businessDetails.operations.operationDescription',
            'businessDetails.financials.annualRevenue.value',
            'businessDetails.financials.monthlyRevenue.value',
            'businessDetails.financials.profitMargin.percentage',
            'businessDetails.financials.revenueTrend',
            'businessDetails.financials.customerConcentration',
            'businessDetails.sale.askingPrice.value',
            'businessDetails.sale.reasonForSelling',
            'businessDetails.sale.transitionPeriod',
            'businessDetails.sale.trainingIncluded',
            'businessDetails.sale.assetsIncluded'
          ];
          
          // Add conditional fields based on current form state
          const conditionalFields = [];
          
          // Check location type for lease information
          const locationType = getValues('businessDetails.operations.locationType');
          if (locationType === 'leased_commercial') {
            conditionalFields.push(
              'businessDetails.operations.leaseInformation.expiryDate',
              'businessDetails.operations.leaseInformation.monthlyCost.value'
            );
          }
          
          // Check inventory inclusion
          const inventoryIncluded = getValues('businessDetails.financials.inventory.isIncluded');
          if (inventoryIncluded) {
            conditionalFields.push(
              'businessDetails.financials.inventory.value.value',
              'businessDetails.financials.inventory.description'
            );
          }
          
          // Check equipment inclusion
          const equipmentIncluded = getValues('businessDetails.financials.equipment.isIncluded');
          if (equipmentIncluded) {
            conditionalFields.push(
              'businessDetails.financials.equipment.value.value',
              'businessDetails.financials.equipment.description'
            );
          }
          
          // Check seller financing
          const sellerFinancingAvailable = getValues('businessDetails.sale.sellerFinancing.isAvailable');
          if (sellerFinancingAvailable) {
            conditionalFields.push(
              'businessDetails.sale.sellerFinancing.details',
              'businessDetails.sale.sellerFinancing.downPaymentPercentage'
            );
          }
          
          // Combine all fields that should be validated
          const allBusinessFields = [...basicFields, ...conditionalFields];
          
          // Trigger validation for all fields
          await Promise.all(allBusinessFields.map(field => trigger(field)));
          
          // IMPORTANT: Check explicitly for validation errors in business details
          const businessErrors = Object.keys(errors).filter(key => 
            (key === 'businessDetails' || key.startsWith('businessDetails.')) && 
            !key.includes('employees')
          );
          
          // If there are errors, show error message and prevent proceeding
          if (businessErrors.length > 0) {
            // Get error messages for current step
            currentStepErrors = getErrorMessages(errors).filter(error => 
              (error.path === 'businessDetails' || error.path.startsWith('businessDetails.')) &&
              !error.path.includes('employees')
            );
            
            setErrorMessages(currentStepErrors);
            window.scrollTo(0, 0);
            ToastManager.dismiss();
            ToastManager.error('Please complete all required fields before proceeding');
            
            // Show more specific errors if available
            if (currentStepErrors && currentStepErrors.length > 0) {
              // Show a more helpful toast with the first error
              setTimeout(() => {
                ToastManager.error(`Missing field: ${currentStepErrors[0].message}`, TOAST_IDS.FORM_ERROR);
              }, 300);
              
              // Try to find and highlight the first error field
              setTimeout(() => {
                try {
                  const errorPath = currentStepErrors[0].path;
                  const fieldSelector = `[name="${errorPath}"], [name*="${errorPath.split('.').pop()}"]`;
                  const errorField = document.querySelector(fieldSelector);
                  
                  if (errorField) {
                    errorField.focus();
                    errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Add temporary styling to highlight the field
                    errorField.style.border = '2px solid #EF4444';
                    setTimeout(() => {
                      errorField.style.border = '';
                    }, 5000);
                  }
                } catch (e) {
                  console.error("Error highlighting field:", e);
                }
              }, 500);
            }
            return; // Exit function if validation fails
          }
          
          // Set isStepValid to true only if there are no errors
          isStepValid = businessErrors.length === 0;
        } else if (listingType === ListingType.FRANCHISE) {
          // Create an array of all the franchise fields to validate
          const franchiseFields = [
            'franchiseDetails.franchiseBrand',
            'franchiseDetails.franchiseType',
            'franchiseDetails.franchiseSince',
            'franchiseDetails.brandEstablished',
            'franchiseDetails.totalUnits',
            'franchiseDetails.franchiseeCount',
            'franchiseDetails.investment.franchiseFee.value',
            'franchiseDetails.investment.totalInitialInvestment.value',
            'franchiseDetails.investment.royaltyFee',
            'franchiseDetails.investment.marketingFee',
            'franchiseDetails.investment.royaltyStructure',
            'franchiseDetails.investment.recurringFees',
            'franchiseDetails.support.initialTraining',
            'franchiseDetails.support.trainingDuration',
            'franchiseDetails.support.trainingLocation',
            'franchiseDetails.support.ongoingSupport',
            'franchiseDetails.support.fieldSupport',
            'franchiseDetails.support.marketingSupport',
            'franchiseDetails.support.technologySystems',
            'franchiseDetails.performance.averageUnitSales.value',
            'franchiseDetails.performance.salesGrowth',
            'franchiseDetails.performance.averageBreakeven',
            'franchiseDetails.performance.franchiseeRequirements',
            'franchiseDetails.performance.netWorthRequirement.value',
            'franchiseDetails.performance.liquidCapitalRequired.value'
          ];
          
          // Trigger validation for all franchise fields
          await Promise.all(franchiseFields.map(field => trigger(field)));
          
          // Check if there are any errors
          const franchiseErrors = Object.keys(errors).filter(key => 
            key === 'franchiseDetails' || key.startsWith('franchiseDetails.')
          );
          
          if (franchiseErrors.length > 0) {
            currentStepErrors = getErrorMessages(errors).filter(error => 
              error.path === 'franchiseDetails' || error.path.startsWith('franchiseDetails.')
            );
            
            setErrorMessages(currentStepErrors);
            window.scrollTo(0, 0);
            ToastManager.dismiss();
            ToastManager.error('Please complete all required fields before proceeding');
            
            // Show more specific errors if available
            if (currentStepErrors && currentStepErrors.length > 0) {
              // Show a more helpful toast with the first error
              setTimeout(() => {
                ToastManager.error(`Missing field: ${currentStepErrors[0].message}`, TOAST_IDS.FORM_ERROR);
              }, 300);
              
              // Try to find and highlight the first error field
              setTimeout(() => {
                try {
                  const errorPath = currentStepErrors[0].path;
                  const fieldSelector = `[name="${errorPath}"], [name*="${errorPath.split('.').pop()}"]`;
                  const errorField = document.querySelector(fieldSelector);
                  
                  if (errorField) {
                    errorField.focus();
                    errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Add temporary styling to highlight the field
                    errorField.style.border = '2px solid #EF4444';
                    setTimeout(() => {
                      errorField.style.border = '';
                    }, 5000);
                  }
                } catch (e) {
                  console.error("Error highlighting field:", e);
                }
              }, 500);
            }
            return; // Exit function if validation fails
          }
          
          // Extra validation for available territories
          const territories = getValues('franchiseDetails.availableTerritories') || [];
          if (territories.length === 0) {
            ToastManager.dismiss();
            ToastManager.error('Please select at least one territory');
            return; // Exit function if validation fails
          }
          
          // Set isStepValid based on validation results
          isStepValid = franchiseErrors.length === 0;
        } else if (listingType === ListingType.STARTUP) {
          // Create an array of all the startup fields to validate
          const startupFields = [
            'startupDetails.missionStatement',
            'startupDetails.problemStatement',
            'startupDetails.solutionDescription',
            'startupDetails.developmentStage',
            'startupDetails.foundedDate',
            'startupDetails.registeredName',
            'startupDetails.team.teamSize',
            'startupDetails.team.productStage',
            'startupDetails.team.uniqueSellingPoints',
            'startupDetails.market.targetMarket',
            'startupDetails.market.marketSize.value',
            'startupDetails.market.revenueModel',
            'startupDetails.market.competitiveAnalysis',
            'startupDetails.funding.fundingStage',
            'startupDetails.funding.currentRaisingAmount.value',
            'startupDetails.funding.equityOffered',
            'startupDetails.funding.preMoneyValuation.value',
            'startupDetails.funding.useOfFunds'
          ];
          
          // Trigger validation for all startup fields
          await Promise.all(startupFields.map(field => trigger(field)));
          
          // Check if there are any errors
          const startupErrors = Object.keys(errors).filter(key => 
            key === 'startupDetails' || key.startsWith('startupDetails.')
          );
          
          if (startupErrors.length > 0) {
            currentStepErrors = getErrorMessages(errors).filter(error => 
              error.path === 'startupDetails' || error.path.startsWith('startupDetails.')
            );
            
            setErrorMessages(currentStepErrors);
            window.scrollTo(0, 0);
            ToastManager.dismiss();
            ToastManager.error('Please complete all required fields before proceeding');
            
            // Show more specific errors if available
            if (currentStepErrors && currentStepErrors.length > 0) {
              // Show a more helpful toast with the first error
              setTimeout(() => {
                ToastManager.error(`Missing field: ${currentStepErrors[0].message}`, TOAST_IDS.FORM_ERROR);
              }, 300);
              
              // Try to find and highlight the first error field
              setTimeout(() => {
                try {
                  const errorPath = currentStepErrors[0].path;
                  const fieldSelector = `[name="${errorPath}"], [name*="${errorPath.split('.').pop()}"]`;
                  const errorField = document.querySelector(fieldSelector);
                  
                  if (errorField) {
                    errorField.focus();
                    errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Add temporary styling to highlight the field
                    errorField.style.border = '2px solid #EF4444';
                    setTimeout(() => {
                      errorField.style.border = '';
                    }, 5000);
                  }
                } catch (e) {
                  console.error("Error highlighting field:", e);
                }
              }, 500);
            }
            return; // Exit function if validation fails
          }
          
          // Set isStepValid based on validation results
          isStepValid = startupErrors.length === 0;
        } else if (listingType === ListingType.INVESTOR) {
          // Create an array of all the investor fields to validate
          const investorFieldPaths = [
            'investorDetails.investorType',
            'investorDetails.yearsOfExperience',
            'investorDetails.investmentPhilosophy',
            'investorDetails.backgroundSummary',
            'investorDetails.investment.decisionTimeline',
            'investorDetails.investment.preferredRounds',
            'investorDetails.focus.primaryIndustries',
            'investorDetails.focus.businessStagePreference',
            'investorDetails.focus.geographicFocus',
            'investorDetails.focus.investmentCriteria',
            'investorDetails.portfolio.investmentProcess',
            'investorDetails.portfolio.postInvestmentSupport'
          ];
          
          // Check if institutional investor fields are required
          const investorType = getValues('investorDetails.investorType');
          const isInstitutional = investorType && ['venture_capital', 'private_equity', 'family_office', 'corporate'].includes(investorType);
          
          if (isInstitutional) {
            investorFieldPaths.push('investorDetails.investmentTeamSize');
          }
          
          // Trigger validation for all investor fields
          await Promise.all(investorFieldPaths.map(field => trigger(field)));
          
          // Check if there are any errors
          const investorErrors = Object.keys(errors).filter(key => 
            key === 'investorDetails' || key.startsWith('investorDetails.')
          );
          
          if (investorErrors.length > 0) {
            currentStepErrors = getErrorMessages(errors).filter(error => 
              error.path === 'investorDetails' || error.path.startsWith('investorDetails.')
            );
            
            setErrorMessages(currentStepErrors);
            window.scrollTo(0, 0);
            ToastManager.dismiss();
            ToastManager.error('Please complete all required fields before proceeding');
            return; // Exit function if validation fails
          }
          
          // Set isStepValid based on validation results
          isStepValid = investorErrors.length === 0;
        } 
        else if (listingType === ListingType.DIGITAL_ASSET) {
          // Create an array of digital asset fields to validate
          const digitalAssetFields = [
            'digitalAssetDetails.assetType',
            'digitalAssetDetails.technical.platform',
            'digitalAssetDetails.traffic.monthlyVisitors',
            'digitalAssetDetails.traffic.customersBase.totalCustomers',
            'digitalAssetDetails.financials.monthlyRevenue.value',
            'digitalAssetDetails.financials.annualRevenue.value',
            'digitalAssetDetails.financials.profitMargin',
            'digitalAssetDetails.businessModel',
            'digitalAssetDetails.competitiveLandscape',
            'digitalAssetDetails.marketTrends',
            'digitalAssetDetails.sale.askingPrice.value',
            'digitalAssetDetails.sale.reasonForSelling',
            'digitalAssetDetails.sale.includedAssets'
          ];
          
          // Trigger validation for all digital asset fields
          await Promise.all(digitalAssetFields.map(field => trigger(field)));
          
          // Check if there are any errors
          const digitalAssetErrors = Object.keys(errors).filter(key => 
            key === 'digitalAssetDetails' || key.startsWith('digitalAssetDetails.')
          );
          
          if (digitalAssetErrors.length > 0) {
            currentStepErrors = getErrorMessages(errors).filter(error => 
              error.path === 'digitalAssetDetails' || error.path.startsWith('digitalAssetDetails.')
            );
            
            setErrorMessages(currentStepErrors);
            window.scrollTo(0, 0);
            ToastManager.dismiss();
            ToastManager.error('Please complete all required fields before proceeding');
            
            // Show more specific errors if available
            if (currentStepErrors && currentStepErrors.length > 0) {
              // Show a more helpful toast with the first error
              setTimeout(() => {
                ToastManager.error(`Missing field: ${currentStepErrors[0].message}`, TOAST_IDS.FORM_ERROR);
              }, 300);
              
              // Try to find and highlight the first error field
              setTimeout(() => {
                try {
                  const errorPath = currentStepErrors[0].path;
                  const fieldSelector = `[name="${errorPath}"], [name*="${errorPath.split('.').pop()}"]`;
                  const errorField = document.querySelector(fieldSelector);
                  
                  if (errorField) {
                    errorField.focus();
                    errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Add temporary styling to highlight the field
                    errorField.style.border = '2px solid #EF4444';
                    setTimeout(() => {
                      errorField.style.border = '';
                    }, 5000);
                  }
                } catch (e) {
                  console.error("Error highlighting field:", e);
                }
              }, 500);
            }
            return; // Exit function if validation fails
          }
          
          // Set isStepValid based on validation results
          isStepValid = digitalAssetErrors.length === 0;
        }

        // Add new general condition to ensure isStepValid is explicitly true
        if (!isStepValid) {
          ToastManager.dismiss();
          ToastManager.error('Please complete all required fields before proceeding');
          window.scrollTo(0, 0);
          return; // Exit function if validation fails
        }
        break;
        
      case 3: // Documents
        // Document validation is optional
        isStepValid = true;
        break;
        
      case 4: // Review and Submit
        // Final validation of all fields
        if (listingType === ListingType.BUSINESS) {
          // Clear any business details errors that might prevent submission
          clearErrors([
            'businessDetails',
            'businessDetails.operations',
            'businessDetails.operations.employees',
            'businessDetails.operations.employees.count',
            'businessDetails.operations.employees.fullTime',
            'businessDetails.operations.employees.partTime'
          ]);
          
          // Filter out any business details errors from the error messages
          currentStepErrors = getErrorMessages(errors);
        }
        // ... rest of case 4 handling
        break;
        
      default:
        isStepValid = true;
        break;
    }
    
    // Only proceed if step is valid
    if (isStepValid) {
      // If at last step, trigger form submission
      if (safeCurrentStep === steps.length - 1) {
        await handleSubmit(onSubmit)();
        return;
      }
      
      // Autosave and update step
      handleSaveDraft();
      
      // Move to the next step
      setTransitioningStep(true);
      setTimeout(() => {
        setCurrentStep(safeCurrentStep + 1);
        setTransitioningStep(false);
        window.scrollTo(0, 0);
        
        // Update visited steps
        if (!visitedSteps.includes(safeCurrentStep + 1)) {
          setVisitedSteps([...visitedSteps, safeCurrentStep + 1]);
          formPersistenceService.saveVisitedSteps([...visitedSteps, safeCurrentStep + 1], id || '');
        }
        
        // Save the current step to storage
        formPersistenceService.saveStep(id || '', safeCurrentStep + 1);
      }, 300);
    }
  } catch (error) {
    console.error('Error during validation:', error);
    ToastManager.dismiss();
    ToastManager.error('An error occurred while validating your form. Please try again.');
  }
};

  // FIXED: handlePrevious with proper state reset
  const handlePrevious = () => {
    if (safeCurrentStep > 0) {
      setTransitioningStep(true);
      
      const prevStep = safeCurrentStep - 1;
      
      // IMPORTANT: Immediately save the previous step to localStorage
      formPersistenceService.saveStep(id || '', prevStep);
      pendingStep.current = prevStep;
      
      // Reset validation state when changing steps
      setTimeout(() => {
        setSubmitAttempted(false); // Reset submission state when changing steps
        setCurrentStep(prevStep);
        window.scrollTo(0, 0);
        setShowErrorSummary(false);
        setTransitioningStep(false);
      }, 300);
    }
  };

// Enhanced form submission handler
const onSubmit = async (data) => {
  try {
    // Use external loading if available, otherwise manage our own
    if (!externalOnSubmit) {
      startLoading(isEdit ? 'Updating listing...' : 'Creating listing...');
    }
    
    setIsLoading(true);
    console.log("Starting form submission...");

    // Check that we have at least the required number of images
    if (uploadedImages.length < 3) {
      ToastManager.dismiss();
      ToastManager.error('You must upload at least 3 images');
      stopLoading();
      setIsLoading(false);
      return;
    }

    // Prepare listing data
    const listingData = {
      ...data,
      // Set short description if not provided
      shortDescription: data.shortDescription || data.description.substring(0, 150) + '...',
      // Set featured image
      featuredImageIndex
    };
    
    console.log(`Prepared submission with ${uploadedImages.length} images and ${uploadedDocuments.length} documents`);

    // If external onSubmit is provided, use it
    if (externalOnSubmit) {
      try {
        console.log("Using external onSubmit handler");
        
        // Ensure documents are in the expected format for the service
        const formattedDocuments = uploadedDocuments.map(doc => {
          // If this is a document from server with URL, skip it in upload
          if (doc.url) {
            return null;
          }
          
          return {
            file: doc.file || doc, // Handle both object with file property and direct File objects
            type: doc.type || 'document',
            description: doc.description || doc.name || 'Document',
            isPublic: !!doc.isPublic
          };
        }).filter(Boolean); // Remove null items (server documents)
        
        console.log(`Submitting to external handler with ${formattedDocuments.length} new documents`);
        
        // Submit with timeout protection
        const submitPromise = externalOnSubmit(listingData, uploadedImages, formattedDocuments);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Submission timed out")), 120000)
        );
        
        // Race against timeout
        const result = await Promise.race([submitPromise, timeoutPromise]);
        
        if (result === false) {
          // External handler returned false to indicate failure
          console.error("External submission handler returned failure");
          throw new Error("Failed to save listing");
        }
        
        console.log("External submission completed successfully");
      } catch (error) {
        console.error("Error in external submission:", error);
        ToastManager.dismiss();
        ToastManager.error(`Failed to save listing: ${error.message || 'Unknown error'}`);
        throw error; // Rethrow to reach the finally block
      }
    } else {
      // Create or update listing using internal logic
      if (isEdit) {
        await updateListing(
          id,
          listingData,
          uploadedImages.filter(img => !img.url), // New images
          uploadedDocuments.filter(doc => !doc.url), // New documents
          imagesToDelete,
          documentsToDelete
        );

        ToastManager.dismiss();
        ToastManager.success('Listing updated successfully!');
      } else {
        const newListingId = await createListing(
          listingData,
          uploadedImages,
          uploadedDocuments
        );

        // Clear ALL stored form data on success, including images and documents
        formPersistenceService.clearFormData();
        formPersistenceService.clearImageMetadata();
        formPersistenceService.clearDocumentMetadata();
        formPersistenceService.clearFeaturedImageIndex();
        formPersistenceService.clearStep();

        ToastManager.dismiss();
        ToastManager.success('Listing created successfully!');
        navigate(`/listings/${newListingId}`);
      }
    }
  } catch (error) {
    console.error('Error submitting listing:', error);
    ToastManager.dismiss();
    ToastManager.error(`Failed to save listing: ${error.message || 'Unknown error'}`);
  } finally {
    if (!externalOnSubmit) {
      stopLoading();
    }
    setIsLoading(false);
    setSaveAsDraft(false);
  }
};

  // Initialize form state
  useEffect(() => {
    // Get formState from methods
    const { formState, getValues } = methods;
    
    if (!formState.isValid) {
      // If there are validation errors, check if they're for the wrong fields
      const currentFormValues = getValues();
      const currentType = currentFormValues.type;
      
      // If we have validation errors for the wrong listing type fields, clear them
      if (currentType === ListingType.BUSINESS && 
          (errors.startupDetails || errors.investorDetails)) {
        setTimeout(() => {
          clearErrors(['startupDetails', 'investorDetails']);
        }, 100);
      }
      else if (currentType === ListingType.STARTUP && 
               (errors.businessDetails || errors.investorDetails)) {
        setTimeout(() => {
          clearErrors(['businessDetails', 'investorDetails']);
        }, 100);
      }
      else if (currentType === ListingType.INVESTOR && 
               (errors.businessDetails || errors.startupDetails)) {
        setTimeout(() => {
          clearErrors(['businessDetails', 'startupDetails']);
        }, 100);
      }
    }
  }, [methods, errors, listingType]);

  // Special check to load documents and images for review step
  if (steps[safeCurrentStep]?.id === 'review') {
    // Use an IIFE (Immediately Invoked Function Expression) to handle async operations
    (async () => {
      // Check for documents if none in state
      if (uploadedDocuments.length === 0) {
        console.log("[DEBUG] Review step detected with empty documents, checking localStorage directly");
        try {
          // Direct check in localStorage - check all possible keys
          const possibleDocumentKeys = [
            'listing_documents_default',
            'listingFormDocumentsData', 
            STORAGE_KEYS.DOCUMENTS
          ];
          
          let documentsFound = false;
          
          for (const key of possibleDocumentKeys) {
            const rawData = localStorage.getItem(key);
            if (rawData) {
              try {
                const parsedData = JSON.parse(rawData);
                if (Array.isArray(parsedData) && parsedData.length > 0) {
                  console.log(`[DEBUG] Found ${parsedData.length} documents in localStorage key: ${key}`);
                  setUploadedDocuments(parsedData);
                  documentsFound = true;
                  break; // Exit the loop once documents are found
                }
              } catch (parseError) {
                console.error(`Error parsing document data from ${key}:`, parseError);
              }
            }
          }
          
          // If no documents found through direct lookup, try the service
          if (!documentsFound && enhancedStorage && typeof enhancedStorage.getDocumentMetadata === 'function') {
            console.log("Attempting to load documents using service method");
            const firestoreDocs = await enhancedStorage.getDocumentMetadata('default');
            if (firestoreDocs && firestoreDocs.length > 0) {
              console.log(`Found ${firestoreDocs.length} documents from service method`);
              setUploadedDocuments(firestoreDocs);
              documentsFound = true;
            }
          }
          
          if (!documentsFound) {
            console.log("No documents found in any storage location");
          }
        } catch (e) {
          console.error("Error checking localStorage for documents:", e);
        }
      }
      
      // Check for images if none in state
      if (uploadedImages.length === 0) {
        console.log("[DEBUG] Review step detected with empty images, checking localStorage directly");
        try {
          // Try both storage keys for backup
          const possibleImageKeys = [
            'listing_images_default', 
            'listing_form_images_default',
            'listingFormImagesData'
          ];
          
          let imagesFound = false;
          
          for (const key of possibleImageKeys) {
            const rawImageData = localStorage.getItem(key);
            if (rawImageData) {
              try {
                const parsedImageData = JSON.parse(rawImageData);
                if (Array.isArray(parsedImageData) && parsedImageData.length > 0) {
                  console.log(`[DEBUG] Found ${parsedImageData.length} images in localStorage key: ${key}`);
                  setUploadedImages(parsedImageData);
                  
                  // Also ensure there's a valid featured image index
                  if (featuredImageIndex >= parsedImageData.length) {
                    setFeaturedImageIndex(0);
                  }
                  
                  imagesFound = true;
                  break; // Exit the loop once images are found
                }
              } catch (parseError) {
                console.error(`Error parsing image data from ${key}:`, parseError);
              }
            }
          }
          
          // If no images found through direct lookup, try the service
          if (!imagesFound && enhancedStorage && typeof enhancedStorage.getImageMetadata === 'function') {
            console.log("Attempting to load images using service method");
            const firestoreImages = await enhancedStorage.getImageMetadata('default');
            if (firestoreImages && firestoreImages.length > 0) {
              console.log(`Found ${firestoreImages.length} images from service method`);
              setUploadedImages(firestoreImages);
              
              // Also ensure there's a valid featured image index
              if (featuredImageIndex >= firestoreImages.length) {
                setFeaturedImageIndex(0);
              }
              
              imagesFound = true;
            }
          }
        } catch (e) {
          console.error("Error checking localStorage for images:", e);
        }
      }
    })(); // Execute the async function immediately
  }

  // Loading state
  if (isLoading || initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="md" color="primary" text={initialLoading ? "Loading saved form data..." : "Loading listing data..."} />
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* Fixed Steps Navigation */}
      <div className="flex-shrink-0 bg-white pt-2 pb-2 px-4 border-b border-gray-200 shadow-sm z-40">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between overflow-visible hide-scrollbar">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step indicator with proper spacing for error icon */}
                <div className="flex flex-col items-center relative flex-shrink-0 pt-1">
                <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 relative ${
                    index < safeCurrentStep
                      ? 'bg-[#0031ac] text-white border-[#0031ac]'
                      : index === safeCurrentStep
                        ? 'bg-white text-[#0031ac] border-[#0031ac]'
                        : 'bg-white text-gray-400 border-gray-300'
                  }`}
                >
                  {index < safeCurrentStep ? (
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  ) : (
                      <span className="text-[10px] sm:text-xs md:text-sm font-medium">{index + 1}</span>
                  )}
                  
                  {/* Error indicator - positioned correctly */}
                  {hasStepErrors(index) && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px]">
                      !
                    </div>
                  )}
                </div>
                
                <span className={`text-[8px] xs:text-[10px] md:text-xs mt-1 font-medium text-center truncate max-w-[60px] sm:max-w-none ${
                  index <= safeCurrentStep ? 'text-[#0031ac]' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1 md:mx-2 ${
                  index < safeCurrentStep ? 'bg-[#0031ac]' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
          </div>
        </div>
      </div>

      {/* Main content area with fixed sidebars and scrollable form */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main form content - SCROLLABLE AREA */}
        <div className="flex-1 relative flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto px-4 py-4">
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="w-full">
                  <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
                    {/* Step title */}
                    <div className="mb-4 pb-3 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">{steps[safeCurrentStep]?.title || 'Form Step'}</h2>
                      <p className="text-xs text-gray-500 mt-1">
                        {safeCurrentStep === 0 && "Enter the basic information about your listing"}
                        {safeCurrentStep === 1 && "Upload images to showcase your listing"}
                        {safeCurrentStep === 2 && "Provide detailed information about your listing"}
                        {safeCurrentStep === 3 && "Upload relevant documents to support your listing"}
                        {safeCurrentStep === 4 && "Review your listing before submitting"}
                      </p>
                    </div>

                    {/* Error summary if submission attempted */}
                    {submitAttempted && showErrorSummary && errorMessages.length > 0 && (
                      <div className="mb-4 p-3 border border-red-200 bg-red-50 rounded-md">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-medium text-red-800">Please fix the following errors:</h3>
                              <button 
                                type="button"
                                onClick={() => setShowErrorSummary(false)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <ul className="mt-1 text-xs text-red-700 space-y-0.5">
                              {errorMessages.map((error, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-1.5">•</span>
                                  <span>{error.message}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Step Content */}
                    <div className={`${transitioningStep ? 'opacity-25' : 'opacity-100'} transition-opacity duration-300`}>
                      <StepComponent
                        uploadedImages={uploadedImages}
                        onImageUpload={handleImageUpload}
                        onImageDelete={handleImageDelete}
                        onSetFeatured={handleSetFeatured}
                        featuredImageIndex={featuredImageIndex}
                        uploadedDocuments={uploadedDocuments}
                        onDocumentUpload={handleDocumentUpload}
                        onDocumentDelete={handleDocumentDelete}
                        submitAttempted={submitAttempted}
                        shouldShowErrors={submitAttempted || (visitedSteps && visitedSteps.includes(safeCurrentStep))}
                        isLoading={!dataLoaded}
                        listingType={listingType}
                      />
                      {steps[safeCurrentStep]?.id === 'review' && (
                        <div className="hidden">
                          {console.log("ReviewSubmit documents:", uploadedDocuments)}
                          {console.log("ReviewSubmit step rendered with documents length:", uploadedDocuments.length)}
                        </div>
                      )}
                    </div>

                    {/* Loading overlay while transitioning */}
                    {transitioningStep && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
                        <div className="flex flex-col items-center">
                          <Loader className="h-6 w-6 text-[#0031ac] animate-spin" />
                          <p className="mt-2 text-xs text-gray-600">Loading...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </FormProvider>
            </div>
          </div>
          
          {/* Navigation Sidebar - FIXED */}
          <div className="hidden md:block w-64 flex-shrink-0 p-4 bg-white border-l border-gray-200">
            <div className="sticky top-0">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Form Navigation</h3>
              
              {/* Progress indicator */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Progress</span>
                  <span>{Math.round(((safeCurrentStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-[#0031ac] h-3 rounded-full" 
                    style={{ width: `${Math.round(((safeCurrentStep + 1) / steps.length) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1.5 text-right">
                  Step {safeCurrentStep + 1} of {steps.length}
                </div>
              </div>
              
              <div className="flex flex-col space-y-3 mb-5">
                {/* Previous button */}
                {safeCurrentStep > 0 ? (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={transitioningStep}
                    className={`w-full flex items-center justify-center px-4 py-2.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 ${transitioningStep ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Previous Step</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/listings')}
                    disabled={transitioningStep}
                    className={`w-full flex items-center justify-center px-4 py-2.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 ${transitioningStep ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Back to Listings</span>
                  </button>
                )}

                {/* Next button */}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={transitioningStep}
                  className={`w-full flex items-center justify-center px-4 py-2.5 text-sm bg-[#0031ac] text-white border border-[#0031ac] rounded-md hover:bg-[#002588] ${transitioningStep ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>{safeCurrentStep < steps.length - 1 ? "Next Step" : "Submit Listing"}</span>
                  <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0" />
                </button>
              </div>
              
              {/* Save Draft Button for Autosave */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={transitioningStep || !isDirty}
                className={`w-full flex items-center justify-center px-4 py-2.5 text-sm border border-gray-300 rounded-md mb-4 ${
                  transitioningStep || !isDirty ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Save className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Save Draft</span>
                {autosaveStatus === 'saving' && <Loader className="animate-spin h-3 w-3 ml-2" />}
                {autosaveStatus === 'saved' && <CheckCircle className="h-3 w-3 ml-2 text-green-500" />}
              </button>
              
              <div className="mt-4">
                <h4 className="text-xs font-medium text-gray-700 mb-3">Quick Navigation</h4>
                <div className="flex flex-col space-y-2">
                  {steps.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      disabled={index > safeCurrentStep}
                      onClick={() => {
                        if (index <= safeCurrentStep) {
                          setCurrentStep(index);
                          formPersistenceService.saveStep('', index);
                        }
                      }}
                      className={`text-left w-full px-3 py-2 rounded flex items-center text-xs ${
                        index === safeCurrentStep 
                          ? 'bg-blue-50 text-[#0031ac] font-medium'
                          : index < safeCurrentStep
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center rounded-full h-5 w-5 mr-2 text-xs flex-shrink-0 ${
                        index === safeCurrentStep 
                          ? 'bg-[#0031ac] text-white'
                          : index < safeCurrentStep
                            ? 'bg-blue-100 text-[#0031ac]'
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="flex-grow truncate">{step.title}</span>
                      {hasStepErrors(index) && (
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 ml-1 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation - Fixed at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md z-50">
        <div className="mx-auto px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            {safeCurrentStep > 0 ? (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={transitioningStep}
                className={`flex items-center justify-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 ${transitioningStep ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ChevronLeft className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="sm:inline hidden">Previous</span>
                <span className="sm:hidden inline">Prev</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/listings')}
                disabled={transitioningStep}
                className={`flex items-center justify-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 ${transitioningStep ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ArrowLeft className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>Back</span>
              </button>
            )}
            
            <div className="inline-flex items-center text-xs text-gray-600">
              <span className="sm:inline hidden">Step {safeCurrentStep + 1} of {steps.length}</span>
              <span className="sm:hidden inline">{safeCurrentStep + 1}/{steps.length}</span>
              <div className="ml-2 h-1.5 w-16 sm:w-24 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0031ac]"
                  style={{ width: `${Math.round(((safeCurrentStep + 1) / steps.length) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleNext}
              disabled={transitioningStep}
              className={`flex items-center justify-center px-3 py-2 text-sm bg-[#0031ac] text-white rounded-md ${transitioningStep ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{safeCurrentStep < steps.length - 1 ? "Next" : "Submit"}</span>
              <ChevronRight className="h-4 w-4 ml-1.5 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingForm;