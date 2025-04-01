// src/pages/listings/ListingCreate.tsx - Fixed version with robust error handling
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLoading } from '@/context/LoadingContext';
import usePageTitle from '@/hooks/usePageTitle';
import Button from '@/components/ui/Button';
import ListingForm from '@/components/listings/ListingForm';
import ErrorBoundary from '@/components/ErrorBoundary';
import { createListing } from '@/services/listingService';
import { Listing, ListingStatus } from '@/types/listings';

export default function ListingCreate() {
  usePageTitle('Create New Listing');
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  const handleSubmit = async (
    listingData: Partial<Listing>,
    images?: File[],
    documents?: Array<any>
  ) => {
    try {
      setIsSubmitting(true);
      startLoading('Creating listing...');
      
      // Set a timeout to force clear loading state after 2 minutes
      const loadingTimeout = setTimeout(() => {
        console.log('Force clearing loading state due to timeout');
        stopLoading();
        setIsSubmitting(false);
        toast.error('Operation timed out. Please try again.');
      }, 120000); // 2 minute safety timeout
  
      // Validate inputs
      if (!listingData.name || !listingData.type) {
        throw new Error('Listing name and type are required');
      }
      
      if (!images || images.length < 3) {
        throw new Error('At least 3 images are required');
      }
  
      // Set default status to draft if not specified
      if (!listingData.status) {
        listingData.status = ListingStatus.DRAFT;
      }
  
      // Format documents to proper structure expected by service
      const processedDocuments = documents?.map(doc => {
        if (doc instanceof File) {
          return {
            file: doc,
            type: 'document',
            description: doc.name,
            isPublic: false
          };
        } else if (doc && typeof doc === 'object') {
          return {
            file: doc.file || doc,
            type: doc.type || 'document',
            description: doc.description || doc.name || 'Document',
            isPublic: !!doc.isPublic
          };
        }
        return null;
      }).filter(Boolean) || [];
  
      console.log(`Submitting with ${images.length} images and ${processedDocuments.length} documents`);
      
      // Call service with timeout protection
      const createPromise = createListing(listingData, images, processedDocuments);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service call timed out')), 60000)
      );
      
      const listingId = await Promise.race([createPromise, timeoutPromise]);
      
      // Clear timeout since we completed successfully
      clearTimeout(loadingTimeout);
      
      // Clear localStorage on success
      try {
        localStorage.removeItem('listingFormData');
        localStorage.removeItem('listingFormImages');
        localStorage.removeItem('listingFormFeaturedImage');
        localStorage.removeItem('listingFormStep');
        localStorage.removeItem('listingFormImagesData');
      } catch (e) {
        console.warn('Error clearing localStorage:', e);
      }
      
      toast.success(
        listingData.status === ListingStatus.DRAFT 
          ? 'Listing draft saved successfully!' 
          : 'Listing created successfully!'
      );
      
      // Navigate to the listing detail page
      navigate(`/listings/${listingId}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(`Failed to create listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Always clean up loading states
      stopLoading();
      setIsSubmitting(false);
    }
  };
  return (
    <ErrorBoundary>
      <div>
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="flex items-center mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 -ml-2"
                onClick={() => navigate('/listings')}
                disabled={isSubmitting}
              >
                <ArrowLeft size={18} />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Create New Listing</h1>
            </div>
            <p className="text-sm text-gray-500">
              Create a new business listing to make it visible on the platform
            </p>
          </div>
        </div>

        {/* Error display if submission failed */}
        {submissionError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error submitting form
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    {submissionError instanceof Error 
                      ? submissionError.message 
                      : 'An unknown error occurred while creating the listing. Please try again.'}
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      onClick={() => setSubmissionError(null)}
                      className="px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form container */}
        <div className="bg-white rounded-lg border border-gray-100">
          <ListingForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}