// src/pages/listings/ListingEdit.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLoading } from '@/context/LoadingContext';
import usePageTitle from '@/hooks/usePageTitle';
import Button from '@/components/ui/Button';
import ListingForm from '@/components/listings/ListingForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getListingById, updateListing } from '@/services/listingService';
import { Listing } from '@/types/listings';

export default function ListingEdit() {
  usePageTitle('Edit Listing');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        startLoading('Loading listing data...');
        
        const listingData = await getListingById(id);
        setListing(listingData);
      } catch (error) {
        console.error('Error fetching listing:', error);
        setError(error instanceof Error ? error.message : 'Failed to load listing');
        toast.error('Failed to load listing data');
      } finally {
        setIsLoading(false);
        stopLoading();
      }
    };

    fetchListing();
  }, [id, startLoading, stopLoading]);

  const handleSubmit = async (
    listingData: Partial<Listing>,
    newImages?: File[],
    newDocuments?: Array<{file: File, type: string, description?: string, isPublic?: boolean}>,
    imagesToDelete?: string[],
    documentsToDelete?: string[]
  ) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      startLoading('Updating listing...');

      await updateListing(
        id,
        listingData,
        newImages,
        newDocuments,
        imagesToDelete,
        documentsToDelete
      );
      
      toast.success('Listing updated successfully!');
      
      // Navigate to the listing detail page
      navigate(`/listings/${id}`);
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error(`Failed to update listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner size="lg" text="Loading listing data..." />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load listing</h3>
        <p className="text-red-700 mb-4">{error || 'Listing not found'}</p>
        <Button
          variant="outline"
          onClick={() => navigate('/listings')}
        >
          Back to Listings
        </Button>
      </div>
    );
  }

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
                onClick={() => navigate(`/listings/${id}`)}
              >
                <ArrowLeft size={18} />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
            </div>
            <p className="text-sm text-gray-500">
              {listing?.name}
            </p>
          </div>
        </div>

        {/* Form container */}
        <div className="bg-white rounded-lg border border-gray-100">
          <ListingForm 
            listing={listing}
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            isEdit={true}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}