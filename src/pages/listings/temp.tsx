import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListingById } from '@/services/listingService';
import { Listing, ListingType } from '@/types/listings';
import { useLoading } from '@/context/LoadingContext';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import Spinner from '@/components/common/Spinner';
import { ArrowLeft } from 'lucide-react';
import BusinessDetails from '@/components/listings/details/BusinessDetails';
import DocumentList from '@/components/listings/DocumentList';
import { Tab } from '@headlessui/react';
import ErrorBoundary from '@/components/ErrorBoundary';

/**
 * ListingDetail component with simplified lifecycle management
 */
const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  
  // Core state
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // References to manage component lifecycle
  const isMounted = useRef(true);
  const abortController = useRef(new AbortController());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Effect to load listing data
  useEffect(() => {
    // Create fresh controller for each fetch
    abortController.current = new AbortController();
    
    // Create function to load the data
    const loadListing = async () => {
      if (!id) {
        setError('No listing ID provided');
        setIsLoading(false);
        stopLoading();
        return;
      }
      
      // Set loading state
      setIsLoading(true);
      setError(null);
      startLoading('Loading listing details...');
      
      // Set safety timeout
      timeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          console.warn('Listing fetch timeout reached');
          abortController.current.abort();
          
          // Try to get cached data
          const cachedData = localStorage.getItem(`listing_${id}`);
          if (cachedData) {
            try {
              setListing(JSON.parse(cachedData));
              setError('Request timed out. Showing cached data.');
            } catch (e) {
              setError('Request timed out and cached data could not be loaded.');
            }
          } else {
            setError('Request timed out. Please try again.');
          }
          
          setIsLoading(false);
          stopLoading();
        }
      }, 15000); // 15 second timeout
      
      try {
        // Fetch data with abort signal
        const data = await getListingById(id, abortController.current.signal);
        
        // Only update if component is still mounted and not aborted
        if (isMounted.current && !abortController.current.signal.aborted) {
          setListing(data);
          setError(null);
          
          // Cache listing for offline use
          try {
            localStorage.setItem(`listing_${id}`, JSON.stringify({
              ...data,
              _cacheTimestamp: new Date().toISOString()
            }));
          } catch (e) {
            console.warn('Failed to cache listing:', e);
          }
        }
      } catch (err) {
        // Only update error state if component is still mounted and error is not due to abort
        if (isMounted.current && !(err instanceof Error && err.message === 'Request was aborted')) {
          console.error('Error fetching listing:', err);
          
          const errorMessage = err instanceof Error ? err.message : 'Failed to load listing';
          const isOfflineError = errorMessage.includes('offline') || 
                                errorMessage.includes('network') ||
                                !navigator.onLine;
          
          if (isOfflineError) {
            setIsOffline(true);
            const cachedData = localStorage.getItem(`listing_${id}`);
            if (cachedData) {
              try {
                setListing(JSON.parse(cachedData));
                setError('You are offline. Showing cached version.');
              } catch (e) {
                setError('You are offline and cached data could not be loaded.');
              }
            } else {
              setError('You are offline and no cached data is available.');
            }
          } else {
            setError(errorMessage);
          }
        }
      } finally {
        // Clear timeout and loading state if component is still mounted
        if (isMounted.current) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          setIsLoading(false);
          stopLoading();
        }
      }
    };
    
    // Execute the load
    loadListing();
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      
      if (abortController.current) {
        abortController.current.abort();
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      stopLoading();
    };
  }, [id, startLoading, stopLoading]);
  
  // Simple retry handler
  const handleRetry = () => {
    // Create fresh controller for each retry
    abortController.current = new AbortController();
    
    // Reset states
    setIsLoading(true);
    setError(null);
    startLoading('Retrying...');
    
    // Set safety timeout
    timeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        console.warn('Retry timeout reached');
        abortController.current.abort();
        setError('Retry timed out. Please try again.');
        setIsLoading(false);
        stopLoading();
      }
    }, 15000);
    
    // Fetch data
    getListingById(id as string, abortController.current.signal)
      .then(data => {
        if (isMounted.current && !abortController.current.signal.aborted) {
          setListing(data);
          setError(null);
          
          // Cache listing for offline use
          try {
            localStorage.setItem(`listing_${id as string}`, JSON.stringify({
              ...data,
              _cacheTimestamp: new Date().toISOString()
            }));
          } catch (e) {
            console.warn('Failed to cache listing:', e);
          }
        }
      })
      .catch(err => {
        if (isMounted.current && !(err instanceof Error && err.message === 'Request was aborted')) {
          console.error('Error in retry:', err);
          setError(err instanceof Error ? err.message : 'Failed to load listing');
        }
      })
      .finally(() => {
        if (isMounted.current) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          setIsLoading(false);
          stopLoading();
        }
      });
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Loading listing details...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-4">
          <button
            onClick={() => navigate('/listings')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Listings
          </button>
        </div>
        
        <ErrorDisplay 
          message={error}
          onRetry={handleRetry}
        />
        
        {listing && (
          <div className="mt-4 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Cached Data</h2>
            <p className="text-gray-600 mb-4">
              Showing potentially outdated information from cache:
            </p>
            <h1 className="text-2xl font-bold">{listing.name}</h1>
            {/* Simplified display of cache */}
          </div>
        )}
      </div>
    );
  }
  
  // Render empty state
  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-4">
          <button
            onClick={() => navigate('/listings')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Listings
          </button>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800">Listing Not Found</h2>
          <p className="text-gray-600 mt-2">The listing you're looking for could not be found.</p>
        </div>
      </div>
    );
  }
  
  // Render listing content
  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-4">
          <button
            onClick={() => navigate('/listings')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Listings
          </button>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{listing.name}</h1>
          <p className="text-gray-600 mb-4">{listing.description}</p>
          
          <Tab.Group>
            <Tab.List className="flex border-b">
              <Tab className={({ selected }) => 
                `px-4 py-2 font-medium ${selected ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`
              }>
                Overview
              </Tab>
              <Tab className={({ selected }) => 
                `px-4 py-2 font-medium ${selected ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`
              }>
                Details
              </Tab>
              <Tab className={({ selected }) => 
                `px-4 py-2 font-medium ${selected ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`
              }>
                Documents
              </Tab>
            </Tab.List>
            
            <Tab.Panels className="mt-4">
              <Tab.Panel>
                <div className="prose max-w-none">
                  <h3>Description</h3>
                  <p>{listing.description}</p>
                </div>
              </Tab.Panel>
              
              <Tab.Panel>
                <ErrorBoundary>
                  {listing.type === ListingType.BUSINESS && listing.businessDetails && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-xl font-semibold mb-4">Business Details</h3>
                      <BusinessDetails details={listing.businessDetails as any} />
                    </div>
                  )}
                </ErrorBoundary>
              </Tab.Panel>
              
              <Tab.Panel>
                <ErrorBoundary>
                  <DocumentList 
                    documents={listing.documents || []} 
                    isOffline={isOffline}
                  />
                </ErrorBoundary>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ListingDetail; 