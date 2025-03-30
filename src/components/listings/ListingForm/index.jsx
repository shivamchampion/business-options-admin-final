// src/components/listings/ListingForm/index.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { CheckCircle, AlertTriangle, Loader, ChevronLeft, ChevronRight, Save } from 'lucide-react';
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
import { ListingType, ListingStatus, ListingPlan } from '@/types/listings';

// Listing form validation schema
const listingSchema = z.object({
  // Core Fields (common across all types)
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  type: z.nativeEnum(ListingType, { errorMap: () => ({ message: "Please select a listing type" }) }),
  industries: z.array(z.string()).min(1, "Select at least one industry").max(3, "You can select up to 3 industries"),
  description: z.string().min(100, "Description must be at least 100 characters").max(5000, "Description cannot exceed 5000 characters"),
  shortDescription: z.string().optional(),
  status: z.nativeEnum(ListingStatus, { errorMap: () => ({ message: "Please select a status" }) }),
  plan: z.nativeEnum(ListingPlan, { errorMap: () => ({ message: "Please select a plan" }) }),
  
  // Location Information (required)
  location: z.object({
    country: z.string().default("India"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
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
  
  // Media is handled separately
  // Type-specific details will be validated in each step
}).catchall(z.any());

const steps = [
  { id: 'basic-info', title: 'Basic Info', component: BasicInfo },
  { id: 'media', title: 'Media', component: MediaUpload },
  { id: 'details', title: 'Details', component: ListingDetails },
  { id: 'documents', title: 'Documents', component: Documents },
  { id: 'review', title: 'Review & Submit', component: ReviewSubmit },
];

export default function ListingForm({ isEdit = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { startLoading, stopLoading } = useLoading();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [documentsToDelete, setDocumentsToDelete] = useState([]);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  
  // Initialize react-hook-form
  const methods = useForm({
    resolver: zodResolver(listingSchema),
    mode: 'onChange',
    defaultValues: {
      type: undefined,
      name: '',
      industries: [],
      description: '',
      status: ListingStatus.DRAFT,
      plan: ListingPlan.FREE,
      location: {
        country: 'India',
        state: '',
        city: '',
      },
      contactInfo: {
        email: '',
        phone: '',
      },
    }
  });
  
  const { handleSubmit, reset, trigger, formState: { errors, isValid, isDirty }, watch, setValue } = methods;
  
  // Watch listing type to update type-specific forms
  const listingType = watch('type');
  
  // Load existing listing data if in edit mode
  useEffect(() => {
    if (isEdit && id) {
      const fetchListing = async () => {
        try {
          setIsLoading(true);
          startLoading('Loading listing data...');
          
          const listingData = await getListingById(id);
          setListing(listingData);
          
          // Initialize form with listing data
          reset({
            ...listingData,
            // Add any special transformations needed for form fields
          });
          
          // Initialize media state
          if (listingData.media?.galleryImages) {
            setUploadedImages(listingData.media.galleryImages);
          }
          
          // Initialize documents state
          if (listingData.documents) {
            setUploadedDocuments(listingData.documents);
          }
          
        } catch (error) {
          console.error('Error loading listing:', error);
          toast.error('Failed to load listing data. Please try again.');
          navigate('/listings');
        } finally {
          setIsLoading(false);
          stopLoading();
        }
      };
      
      fetchListing();
    }
  }, [isEdit, id, reset]);
  
  // Handle next step
  const handleNext = async () => {
    // Validate current step
    const fieldsToValidate = [];
    
    switch (currentStep) {
      case 0: // Basic Info
        fieldsToValidate.push('name', 'type', 'industries', 'description', 'status', 'plan', 'location', 'contactInfo');
        break;
      case 1: // Media
        // Media validation is handled in the component
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
    }
    
    // Validate the fields for the current step
    if (fieldsToValidate.length > 0) {
      const isStepValid = await trigger(fieldsToValidate);
      
      if (!isStepValid) {
        // Highlight errors
        setSubmitAttempted(true);
        toast.error('Please fix the errors before proceeding.');
        return;
      }
    }
    
    // If validation passes, move to next step or submit
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
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
    }
  };
  
  // Handle image upload
  const handleImageUpload = (files) => {
    setUploadedImages(prev => [...prev, ...files]);
  };
  
  // Handle image deletion
  const handleImageDelete = (imageToDelete) => {
    if (imageToDelete.url) {
      // Existing image
      setImagesToDelete(prev => [...prev, imageToDelete.path]);
      setUploadedImages(prev => prev.filter(img => img.path !== imageToDelete.path));
    } else {
      // New image not yet uploaded
      setUploadedImages(prev => prev.filter(img => img !== imageToDelete));
    }
  };
  
  // Handle document upload
  const handleDocumentUpload = (files) => {
    setUploadedDocuments(prev => [...prev, ...files]);
  };
  
  // Handle document deletion
  const handleDocumentDelete = (docToDelete) => {
    if (docToDelete.url) {
      // Existing document
      setDocumentsToDelete(prev => [...prev, docToDelete.id]);
      setUploadedDocuments(prev => prev.filter(doc => doc.id !== docToDelete.id));
    } else {
      // New document not yet uploaded
      setUploadedDocuments(prev => prev.filter(doc => doc !== docToDelete));
    }
  };
  
  // Handle save as draft
  const handleSaveAsDraft = () => {
    setSaveAsDraft(true);
    setValue('status', ListingStatus.DRAFT);
    handleSubmit(onSubmit)();
  };
  
  // Form submission
  const onSubmit = async (data) => {
    try {
      startLoading(isEdit ? 'Updating listing...' : 'Creating listing...');
      
      // Prepare listing data
      const listingData = {
        ...data,
        // Set short description if not provided
        shortDescription: data.shortDescription || data.description.substring(0, 150) + '...',
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
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" color="primary" text="Loading listing data..." />
      </div>
    );
  }
  
  // Get current step component
  const StepComponent = steps[currentStep].component;
  
  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${
                    index < currentStep 
                      ? 'bg-[#0031ac] text-white border-[#0031ac]' 
                      : index === currentStep 
                        ? 'bg-white text-[#0031ac] border-[#0031ac]' 
                        : 'bg-white text-gray-400 border-gray-300'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  index <= currentStep ? 'text-[#0031ac]' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-2 ${
                  index < currentStep ? 'bg-[#0031ac]' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
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
            {submitAttempted && Object.keys(errors).length > 0 && (
              <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                    <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                      {Object.entries(errors).map(([key, error]) => (
                        <li key={key}>{error.message}</li>
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
                uploadedDocuments={uploadedDocuments}
                onDocumentUpload={handleDocumentUpload}
                onDocumentDelete={handleDocumentDelete}
                submitAttempted={submitAttempted}
              />
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div>
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                  >
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
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