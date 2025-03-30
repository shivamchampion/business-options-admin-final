// src/pages/listings/ListingCreate.tsx
import React, { useState } from 'react';
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

  const handleSubmit = async (
    listingData: Partial<Listing>,
    images?: File[],
    documents?: Array<{file: File, type: string, description?: string, isPublic?: boolean}>
  ) => {
    try {
      setIsSubmitting(true);
      startLoading('Creating listing...');

      // Set default status to draft if not specified
      if (!listingData.status) {
        listingData.status = ListingStatus.DRAFT;
      }

      const listingId = await createListing(listingData, images, documents);
      
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
      setIsSubmitting(false);
      stopLoading();
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