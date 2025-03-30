import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Save,
  AlertCircle,
  ArrowLeft,
  X
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

// Classification schema for industry-category-subcategory
const classificationSchema = z.object({
  industry: z.string().min(1, "Please select an industry"),
  industryName: z.string(),
  category: z.string().min(1, "Please select a category"),
  categoryName: z.string(),
  subCategories: z.array(z.string()).min(1, "Select at least one subcategory").max(3, "Maximum 3 subcategories allowed"),
  subCategoryNames: z.array(z.string())
});

// Main listing schema
const listingSchema = z.object({
  // Core Fields (common across all types)
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  type: z.nativeEnum(ListingType, { errorMap: () => ({ message: "Please select a listing type" }) }),

  // Classification fields - now as an array (1-3 items)
  classifications: z.array(classificationSchema)
    .min(1, "Please add at least one industry classification")
    .max(3, "You can add up to 3 industry classifications"),

  // Legacy fields for backward compatibility
  industry: z.string().optional(),
  industryName: z.string().optional(),
  category: z.string().optional(),
  categoryName: z.string().optional(),
  subCategories: z.array(z.string()).optional(),
  subCategoryNames: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),

  description: z.string().min(100, "Description must be at least 100 characters").max(5000, "Description cannot exceed 5000 characters"),
  shortDescription: z.string().optional(),
  status: z.nativeEnum(ListingStatus, { errorMap: () => ({ message: "Please select a status" }) }),
  plan: z.nativeEnum(ListingPlan, { errorMap: () => ({ message: "Please select a plan" }) }),

  // Location Information (required)
  location: z.object({
    country: z.string().min(1, "Country is required"),
    countryName: z.string().optional(),
    state: z.string().min(1, "State is required"),
    stateName: z.string().optional(),
    city: z.string().min(1, "City is required"),
    cityName: z.string().optional(),
    address: z.string().optional(),
    pincode: z.string().optional(),
    displayLocation: z.string().optional(),
  }),

  // Contact Information
  contactInfo: z.object({
    email: z.string().email("Please enter a valid email"),
    phone: z.string().optional(),
    alternatePhone: z.string().optional(),
    website: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
    contactName: z.string().optional(),
    preferredContactMethod: z.string().optional(),
  }),

  // Media validation
  mediaValidation: z.any().optional(),
  
  // Media and type-specific fields are handled separately
}).catchall(z.any());

// Migration helper to convert old schema to new schema
const migrateListingData = (data) => {
  // If data already has classifications array, just return it
  if (data.classifications && Array.isArray(data.classifications) && data.classifications.length > 0) {
    return data;
  }

  // Create new data object with all existing properties
  const newData = { ...data };

  // Check if we have legacy fields to migrate
  if (data.industry || data.industries) {
    // Create classifications array
    newData.classifications = [];
    
    // If we have single industry data
    if (data.industry) {
      newData.classifications.push({
        industry: data.industry,
        industryName: data.industryName || '',
        category: data.category || '',
        categoryName: data.categoryName || '',
        subCategories: Array.isArray(data.subCategories) ? data.subCategories : [],
        subCategoryNames: Array.isArray(data.subCategoryNames) ? data.subCategoryNames : []
      });
    }
    
    // If we have multiple industries data (legacy)
    else if (Array.isArray(data.industries)) {
      data.industries.forEach((industry, index) => {
        newData.classifications.push({
          industry,
          industryName: data.industryNames?.[index] || '',
          category: '',
          categoryName: '',
          subCategories: [],
          subCategoryNames: []
        });
      });
    }
  }
  
  // If we still don't have classifications (no legacy data), add an empty one
  if (!newData.classifications || newData.classifications.length === 0) {
    newData.classifications = [{
      industry: '',
      industryName: '',
      category: '',
      categoryName: '',
      subCategories: [],
      subCategoryNames: []
    }];
  }
  
  return newData;
};

const steps = [
  { id: 'basic-info', title: 'Basic Info', component: BasicInfo },
  { id: 'media', title: 'Media', component: MediaUpload },
  { id: 'details', title: 'Details', component: ListingDetails },
  { id: 'documents', title: 'Documents', component: Documents },
  { id: 'review', title: 'Review & Submit', component: ReviewSubmit },
];

// Storage keys
const STORAGE_KEYS = {
  FORM_DATA: 'listingFormData',
  IMAGES: 'listingFormImages',
  FEATURED_IMAGE: 'listingFormFeaturedImage',
  STEP: 'listingFormStep'
};

// Helper function for safe localStorage operations
const safeStorage = {
  get: (key, defaultValue = null) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage:`, error);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  },
  clear: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error(`Error clearing localStorage:`, error);
      return false;
    }
  }
};

// Helper function to sanitize images for storage
const sanitizeImagesForStorage = (images) => {
  if (!images || !Array.isArray(images)) return [];
  
  return images.map(image => {
    if (!image) return null;
    
    // Create a new clean object
    return {
      id: image.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: image.name || 'image',
      size: image.size || 0,
      url: image.url || image.preview || '',
      preview: image.preview || image.url || '',
      path: image.path || '',
      type: image.type || 'image/jpeg'
    };
  }).filter(Boolean); // Remove any nulls
};

function ListingForm({ isEdit = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { startLoading, stopLoading } = useLoading();

  // Synchronously load the stored step from localStorage first
  const initialStep = (() => {
    try {
      const savedStep = localStorage.getItem(STORAGE_KEYS.STEP);
      if (savedStep !== null) {
        const stepIndex = parseInt(savedStep, 10);
        if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < steps.length) {
          return stepIndex;
        }
      }
    } catch (e) {
      console.error("Error loading initial step:", e);
    }
    return 0;
  })();

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [documentsToDelete, setDocumentsToDelete] = useState([]);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [stepErrors, setStepErrors] = useState({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initialize react-hook-form
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
      mediaValidation: false
    },
    shouldUnregister: false
  });

  const { handleSubmit, reset, trigger, formState: { errors }, watch, setValue } = methods;

  // Watch listing type to update type-specific forms
  const listingType = watch('type');

  // INITIAL DATA LOAD - Load data from localStorage first, then from server if in edit mode
  useEffect(() => {
    const initForm = async () => {
      setInitialLoading(true); // Start loading spinner
      
      // Immediately load from localStorage (already loaded step in useState initialization)
      // If in non-edit mode, load the rest from localStorage
      if (!isEdit) {
        const savedFormData = safeStorage.get(STORAGE_KEYS.FORM_DATA);
        const savedImages = safeStorage.get(STORAGE_KEYS.IMAGES, []);
        const savedFeatured = safeStorage.get(STORAGE_KEYS.FEATURED_IMAGE, 0);

        if (savedFormData) {
          reset(savedFormData);
        }

        if (savedImages && savedImages.length > 0) {
          // Make sure images have all required properties
          const processedImages = savedImages.map((img, idx) => ({
            ...img,
            id: img.id || `local-img-${idx}`,
            url: img.url || img.preview || '',
            preview: img.preview || img.url || '',
            type: img.type || 'image/jpeg'
          }));
          
          setUploadedImages(processedImages);
          setValue('mediaValidation', processedImages.length >= 3);
        }

        if (savedFeatured !== null) {
          setFeaturedImageIndex(parseInt(savedFeatured, 10));
        }
        
        setDataLoaded(true);
        setInitialLoading(false); // End loading spinner for localStorage load
      }

      try {
        // Seed industry data (can happen in background)
        await seedIndustriesData();
        
        // If in edit mode, load from server
        if (isEdit && id) {
          setIsLoading(true);
          startLoading('Loading listing data...');
          
          try {
            const listingData = await getListingById(id);
            setListing(listingData);
            
            // Migrate and reset form data
            const migratedData = migrateListingData(listingData);
            reset(migratedData);
            
            // Process images
            if (listingData.media?.galleryImages) {
              const processedImages = listingData.media.galleryImages.map((img, idx) => ({
                ...img,
                id: img.id || `server-img-${idx}`,
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
            toast.error('Failed to load listing data. Please try again.');
            navigate('/listings');
          } finally {
            setIsLoading(false);
            stopLoading();
            setInitialLoading(false); // End loading spinner after server load
          }
        } else {
          setInitialLoading(false); // Make sure loading ends if not in edit mode
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        setDataLoaded(true); // Continue despite errors
        setInitialLoading(false); // End loading spinner if there's an error
      }
    };

    initForm();
  }, [id, isEdit, navigate, reset, startLoading, stopLoading, setValue]);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    if (!isEdit) {
      safeStorage.set(STORAGE_KEYS.STEP, currentStep);
    }
  }, [currentStep, isEdit]);
  
  // Save featured image index
  useEffect(() => {
    if (!isEdit) {
      safeStorage.set(STORAGE_KEYS.FEATURED_IMAGE, featuredImageIndex);
    }
  }, [featuredImageIndex, isEdit]);
  
  // Save form data with debounce
  useEffect(() => {
    if (isEdit) return;
    
    let timeout = null;
    
    const saveFormData = () => {
      const formData = methods.getValues();
      
      // Create a clean copy
      const cleanData = { ...formData };
      delete cleanData.mediaUploads;
      
      safeStorage.set(STORAGE_KEYS.FORM_DATA, cleanData);
    };
    
    const debouncedSave = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(saveFormData, 300);
    };
    
    // Watch form changes
    const subscription = methods.watch(debouncedSave);
    
    return () => {
      if (timeout) clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [methods, isEdit]);
  
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
    const detailsPrefix = listingType ? `${listingType}Details` : '';
    const hasDetailsErrors = Object.keys(errors).some(key => key.startsWith(detailsPrefix));
    
    if (hasDetailsErrors) {
      newErrors[2] = true;
    }
    
    setStepErrors(newErrors);
  }, [errors, listingType, uploadedImages.length]);

  // Handle image upload - Direct implementation
  const handleImageUpload = (files) => {
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
      setFeaturedImageIndex(0);
      safeStorage.set(STORAGE_KEYS.FEATURED_IMAGE, 0);
    }
    
    // Update validation
    setValue('mediaValidation', newImages.length >= 3);
    
    // Save to localStorage
    safeStorage.set(STORAGE_KEYS.IMAGES, sanitizeImagesForStorage(newImages));
    
    console.log("Images updated:", newImages.length);
  };

  // Handle image deletion
  const handleImageDelete = (imageToDelete) => {
    // Add to delete list if it's a server image
    if (imageToDelete.url || imageToDelete.path) {
      setImagesToDelete(prev => [...prev, imageToDelete.path || imageToDelete.url]);
    }
    
    // Find the image index
    const imageIndex = uploadedImages.findIndex(img => {
      if (imageToDelete.id && img.id) return img.id === imageToDelete.id;
      if (imageToDelete.path && img.path) return img.path === imageToDelete.path;
      if (imageToDelete.url && img.url) return img.url === imageToDelete.url;
      return img === imageToDelete;
    });
    
    // If image not found, exit
    if (imageIndex === -1) {
      console.warn("Image not found:", imageToDelete);
      return;
    }
    
    // Create new array without the deleted image
    const newImages = [...uploadedImages];
    newImages.splice(imageIndex, 1);
    
    // Update state
    setUploadedImages(newImages);
    
    // Handle featured image adjustment
    if (imageIndex === featuredImageIndex) {
      // If deleting the featured image, set the first remaining as featured
      if (newImages.length > 0) {
        setFeaturedImageIndex(0);
        safeStorage.set(STORAGE_KEYS.FEATURED_IMAGE, 0);
      } else {
        setFeaturedImageIndex(-1);
        safeStorage.set(STORAGE_KEYS.FEATURED_IMAGE, -1);
      }
    } else if (imageIndex < featuredImageIndex) {
      // If deleting before the featured image, decrement index
      const newIndex = featuredImageIndex - 1;
      setFeaturedImageIndex(newIndex);
      safeStorage.set(STORAGE_KEYS.FEATURED_IMAGE, newIndex);
    }
    
    // Update validation
    setValue('mediaValidation', newImages.length >= 3);
    
    // Save to localStorage
    safeStorage.set(STORAGE_KEYS.IMAGES, sanitizeImagesForStorage(newImages));
    
    console.log("Image deleted, remaining:", newImages.length);
  };

  // Handle setting featured image
  const handleSetFeatured = (index) => {
    setFeaturedImageIndex(index);
    safeStorage.set(STORAGE_KEYS.FEATURED_IMAGE, index);
  };

  // Handle document upload
  const handleDocumentUpload = (files) => {
    setUploadedDocuments(prev => [...prev, ...files]);
  };

  // Handle document deletion
  const handleDocumentDelete = (docToDelete) => {
    if (docToDelete.url || docToDelete.id) {
      setDocumentsToDelete(prev => [...prev, docToDelete.id]);
    }
    
    setUploadedDocuments(prev => {
      if (docToDelete.id) {
        return prev.filter(doc => doc.id !== docToDelete.id);
      }
      return prev.filter(doc => doc !== docToDelete);
    });
  };

  // Handle save as draft
  const handleSaveAsDraft = () => {
    setSaveAsDraft(true);
    setValue('status', ListingStatus.DRAFT);
    handleSubmit(onSubmit)();
  };

  // Extract error messages for display
  const getErrorMessages = (errors) => {
    const messages = [];

    const extractErrors = (obj, path = '') => {
      if (!obj) return;

      if (obj.message) {
        messages.push({ path, message: obj.message });
        return;
      }

      if (typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key;
          extractErrors(value, newPath);
        });
      }
    };

    extractErrors(errors);
    return messages;
  };

  // Handle next step
  const handleNext = async () => {
    // Set submitAttempted to true to show all validation errors
    setSubmitAttempted(true);
    
    // Validate current step
    const fieldsToValidate = [];

    switch (currentStep) {
      case 0: // Basic Info
        fieldsToValidate.push('name', 'type', 'classifications', 'description', 'status', 'plan', 'location', 'contactInfo');
        break;
      case 1: // Media
        fieldsToValidate.push('mediaValidation');
        
        // Check if we have enough images
        if (uploadedImages.length < 3) {
          toast.error('Please upload at least 3 images to continue');
          return;
        }
        break;
      case 2: // Details
        // Type-specific validation
        if (listingType === ListingType.BUSINESS) {
          fieldsToValidate.push('businessDetails');
        } else if (listingType === ListingType.FRANCHISE) {
          fieldsToValidate.push('franchiseDetails');
        } else if (listingType === ListingType.STARTUP) {
          fieldsToValidate.push('startupDetails');
        } else if (listingType === ListingType.INVESTOR) {
          fieldsToValidate.push('investorDetails');
        } else if (listingType === ListingType.DIGITAL_ASSET) {
          fieldsToValidate.push('digitalAssetDetails');
        }
        break;
      case 3: // Documents
        // Document validation is handled in the component
        break;
      case 4: // Review & Submit
        // No additional validation needed, review only
        break;
      default:
        break;
    }

    // Validate the fields for the current step
    if (fieldsToValidate.length > 0) {
      const isStepValid = await trigger(fieldsToValidate);

      if (!isStepValid) {
        // Highlight errors
        setShowErrorSummary(true);
        toast.error('Please fix the errors before proceeding');
        return;
      }
    }

    // If validation passes, move to next step or submit
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
      setShowErrorSummary(false);
    } else {
      // Submit form on final step
      handleSubmit(onSubmit)();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
      setShowErrorSummary(false);
    }
  };

  // Form submission
  const onSubmit = async (data) => {
    try {
      startLoading(isEdit ? 'Updating listing...' : 'Creating listing...');

      // Check that we have at least the required number of images
      if (uploadedImages.length < 3) {
        toast.error('You must upload at least 3 images');
        stopLoading();
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

      // Create or update listing
      if (isEdit) {
        await updateListing(
          id,
          listingData,
          uploadedImages.filter(img => !img.url), // New images
          uploadedDocuments.filter(doc => !doc.url), // New documents
          imagesToDelete,
          documentsToDelete
        );

        toast.success('Listing updated successfully!');
      } else {
        const newListingId = await createListing(
          listingData,
          uploadedImages,
          uploadedDocuments
        );

        // Clear stored form data on success
        safeStorage.clear();

        toast.success('Listing created successfully!');
        navigate(`/listings/${newListingId}`);
      }
    } catch (error) {
      console.error('Error submitting listing:', error);
      toast.error('Failed to save listing. Please try again.');
    } finally {
      stopLoading();
      setSaveAsDraft(false);
    }
  };

  // Loading state
  if (isLoading || initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" color="primary" text={initialLoading ? "Loading saved form data..." : "Loading listing data..."} />
      </div>
    );
  }

  // Get current step component
  const StepComponent = steps[currentStep].component;
  
  // Get error summary for current step
  const currentStepErrorMessages = getErrorMessages(errors).filter(error => {
    switch (currentStep) {
      case 0: // Basic Info
        return ['name', 'type', 'classifications', 'description', 'status', 'plan', 'location', 'contactInfo'].some(field => 
          error.path === field || error.path.startsWith(`${field}.`)
        );
      case 2: // Details
        const detailsPrefix = listingType ? `${listingType}Details` : '';
        return error.path.startsWith(detailsPrefix);
      default:
        return false;
    }
  });

  return (
    <div className="w-full px-4 md:px-6 mx-auto">
      {/* Progress Stepper */}
      <div className="mb-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step indicator */}
              <div className="flex flex-col items-center relative">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${
                    index < currentStep
                      ? 'bg-[#0031ac] text-white border-[#0031ac]'
                      : index === currentStep
                        ? 'bg-white text-[#0031ac] border-[#0031ac]'
                        : 'bg-white text-gray-400 border-gray-300'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6" />
                  ) : (
                    <span className="text-sm md:text-base font-medium">{index + 1}</span>
                  )}
                </div>
                
                {/* Error indicator */}
                {stepErrors[index] && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs z-10">
                    !
                  </span>
                )}
                
                <span className={`text-xs md:text-sm mt-2 font-medium text-center ${
                  index <= currentStep ? 'text-[#0031ac]' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1 md:mx-3 ${
                  index < currentStep ? 'bg-[#0031ac]' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow border border-gray-100 p-4 md:p-6">
            {/* Step title */}
            <div className="mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{steps[currentStep].title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {currentStep === 0 && "Enter the basic information about your listing"}
                {currentStep === 1 && "Upload images to showcase your listing"}
                {currentStep === 2 && "Provide detailed information about your listing"}
                {currentStep === 3 && "Upload relevant documents to support your listing"}
                {currentStep === 4 && "Review your listing before submitting"}
              </p>
            </div>

            {/* Error summary if submission attempted */}
            {submitAttempted && showErrorSummary && currentStepErrorMessages.length > 0 && (
              <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                      <button 
                        type="button"
                        onClick={() => setShowErrorSummary(false)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <ul className="mt-2 text-sm text-red-700 space-y-1">
                      {currentStepErrorMessages.map((error, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{error.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step Content */}
            <div className="mb-8">
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
                isLoading={!dataLoaded}
                listingType={listingType}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-200">
              <div>
                {currentStep > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                  >
                    Previous
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/listings')}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Back to Listings
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveAsDraft}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save as Draft
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  rightIcon={currentStep < steps.length - 1 ? <ChevronRight className="h-4 w-4" /> : undefined}
                >
                  {currentStep < steps.length - 1 ? 'Next' : 'Submit Listing'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

export default ListingForm;