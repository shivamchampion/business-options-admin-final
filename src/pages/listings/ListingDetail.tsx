import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getListingById } from '@/services/listingService';
import { Listing, ListingType, ListingStatus } from '@/types/listings';
import { useLoading } from '@/context/LoadingContext';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import Spinner from '@/components/common/Spinner';
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Star, 
  CheckCircle, 
  BadgeCheck, 
  Download, 
  ShieldAlert,
  Clock,
  Store,
  Briefcase,
  FlaskConical,
  Users,
  Globe,
  FileDown,
  Activity,
  Mail,
  Phone,
  Link as LinkIcon,
  MapPin,
  Calendar,
  DollarSign,
  BarChart,
  FileText,
  Image
} from 'lucide-react';
import BusinessDetails from '@/components/listings/details/BusinessDetails';
import DocumentList from '@/components/listings/DocumentList';
import { Tab } from '@headlessui/react';
import ErrorBoundary from '@/components/ErrorBoundary';
import usePageTitle from '@/hooks/usePageTitle';
import { toast } from 'react-hot-toast';
import { updateListingStatus, toggleListingFeature, verifyListing, deleteListing } from '@/services/listingService';
import Button from '@/components/ui/Button';
import { cn, formatDate, formatCurrency, formatRelativeTime } from '@/lib/utils';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Define a ListingStatus enum for local use
type ListingStatus = 'published' | 'draft' | 'pending' | 'rejected' | 'archived';

// Placeholder for ImageGallery component
const ImageGallery = ({ images }: { images: any[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    {images && images.length > 0 ? (
      images.map((image: any, index: number) => (
        <div key={index} className="relative h-48 rounded-lg overflow-hidden bg-gray-100">
          <img src={image.url} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover" />
        </div>
      ))
    ) : (
      <div className="col-span-full p-12 bg-gray-50 rounded-lg text-center">
        <Image className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500">No images available</p>
      </div>
    )}
  </div>
);

// Placeholder for detail components
const FranchiseDetails = ({ details }: { details: any }) => (
  <div className="p-4 bg-gray-50 rounded text-center">
    <p className="text-gray-600">Franchise details view is under development</p>
  </div>
);

const StartupDetails = ({ details }: { details: any }) => (
  <div className="p-4 bg-gray-50 rounded text-center">
    <p className="text-gray-600">Startup details view is under development</p>
  </div>
);

const InvestorDetails = ({ details }: { details: any }) => (
  <div className="p-4 bg-gray-50 rounded text-center">
    <p className="text-gray-600">Investor details view is under development</p>
  </div>
);

const DigitalAssetDetails = ({ details }: { details: any }) => (
  <div className="p-4 bg-gray-50 rounded text-center">
    <p className="text-gray-600">Digital asset details view is under development</p>
  </div>
);

// Placeholder for rating component
const ListingRating = ({ rating }: { rating: any }) => (
  <div>
    {rating ? (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Overall Rating</span>
          <div className="flex items-center">
            {Array.from({length: 5}).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.round(rating.average || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
            <span className="ml-1 text-sm font-medium">{(rating.average || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>
    ) : (
      <p className="text-gray-500 text-center py-4">No rating data available</p>
    )}
  </div>
);

// Placeholder for analytics component
const ListingAnalytics = ({ analytics }: { analytics: any }) => (
  <div className="p-4 bg-gray-50 rounded text-center">
    <p className="text-gray-600">Analytics view is under development</p>
  </div>
);

// Placeholder for activity log component
const ActivityLog = ({ statusHistory }: { statusHistory: any[] }) => (
  <div className="space-y-4">
    {statusHistory && statusHistory.length > 0 ? (
      statusHistory.map((entry: any, index: number) => (
        <div key={index} className="flex">
          <div className="mr-4 relative">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              {entry.status === 'published' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {entry.status === 'pending' && <Clock className="h-5 w-5 text-amber-600" />}
              {entry.status === 'rejected' && <ShieldAlert className="h-5 w-5 text-red-600" />}
              {entry.status === 'draft' && <Clock className="h-5 w-5 text-gray-600" />}
              {entry.status === 'archived' && <FileDown className="h-5 w-5 text-gray-600" />}
            </div>
            {index < statusHistory.length - 1 && (
              <div className="absolute top-10 bottom-0 left-1/2 w-0.5 -ml-px bg-gray-200"></div>
            )}
          </div>
          <div className="pb-8">
            <div className="text-sm font-medium">Status changed to {entry.status}</div>
            <div className="text-sm text-gray-500">{formatDate?.(entry.timestamp) || new Date(entry.timestamp).toLocaleDateString()}</div>
            {entry.reason && <div className="mt-1 text-sm text-gray-700">{entry.reason}</div>}
          </div>
        </div>
      ))
    ) : (
      <p className="text-gray-500 text-center py-4">No activity recorded</p>
    )}
  </div>
);

// Declare types for window global properties
declare global {
  interface Window {
    __LISTING_FETCH_CACHE?: Record<string, boolean>;
  }
}

// Safely access and initialize the fetch cache
const getFetchCache = (): Record<string, boolean> => {
  if (typeof window === 'undefined') return {};
  if (!window.__LISTING_FETCH_CACHE) {
    window.__LISTING_FETCH_CACHE = {};
  }
  return window.__LISTING_FETCH_CACHE;
};

// Check if a fetch is in progress
const isFetchInProgress = (id: string): boolean => {
  const cache = getFetchCache();
  return !!cache[id];
};

// Mark a fetch as in progress
const markFetchInProgress = (id: string, inProgress: boolean): void => {
  const cache = getFetchCache();
  cache[id] = inProgress;
};

// Helper function for formatting dates if not available from utils
const formatDate = (date: Date | string) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * ListingDetail - Displays a detailed view of a listing with gallery, tabs, and business details
 */
const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  
  // State for listing data
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false); // For our component-level loading state
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // State for confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ListingStatus | null>(null);
  const [statusReason, setStatusReason] = useState('');
  
  // Set page title dynamically
  useEffect(() => {
    document.title = listing?.name ? `${listing.name} | Business Options` : 'Listing Details | Business Options';
  }, [listing?.name]);

  // Data fetching effect that works correctly with LoadingContext
  useEffect(() => {
    let isMounted = true;
    let dataFetched = false; // Track if data has been fetched 
    const controller = new AbortController();
    
    console.log('[ListingDetail] Setting up data fetch');
    
    // Cleanup function
    const cleanup = () => {
      isMounted = false;
      controller.abort();
      // Safety check - ensure loading is cleared when component unmounts
      stopLoading();
    };
    
    const handleData = (data: Listing) => {
      if (!isMounted) return;
      dataFetched = true;
      setListing(data);
      setIsLocalLoading(false);
      
      // Cache the data
      try {
        localStorage.setItem(`listing_${id}`, JSON.stringify(data));
      } catch (e) {
        console.error('Error caching data:', e);
      }
    };
    
    // THIS IS KEY: First check cache BEFORE showing any loading UI
    let hasCachedData = false;
    
    try {
      // Synchronously check for cached data
      const cachedData = localStorage.getItem(`listing_${id}`);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        console.log('[ListingDetail] Found cached data, showing immediately');
        setListing(parsedData);
        hasCachedData = true;
      }
    } catch (e) {
      console.error('Error loading cached data:', e);
    }
    
    // Only start loading if we don't have cached data
    if (!hasCachedData && id) {
      console.log('[ListingDetail] No cached data, starting loading state');
      setIsLocalLoading(true);
      startLoading('Loading listing details...');
    }
    
    // Always fetch fresh data if we have an ID
    if (id) {
      getListingById(id, controller.signal)
        .then(data => {
          console.log('[ListingDetail] Fresh data received');
          
          if (!isMounted) return;
          
          // Update with fresh data
          handleData(data);
          setError(null);
          
          // IF we showed loading (no cached data), stop it now
          if (!hasCachedData) {
            stopLoading();
          }
        })
        .catch(err => {
          if (!isMounted) return;
          console.error('Error fetching data:', err);
          
          // Don't handle aborted requests
          if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
            console.log('[ListingDetail] Request aborted');
            return;
          }
          
          // Only show error if we don't have cached data to display
          if (!hasCachedData) {
            setError(err instanceof Error ? err.message : 'Failed to load listing details');
            stopLoading();
          }
          
          setIsLocalLoading(false);
        });
    } else {
      // No ID provided
      setError('No listing ID provided');
      setIsLocalLoading(false);
    }
    
    return cleanup;
  }, [id, startLoading, stopLoading]);
  
  // Function to retry loading fresh data
  const handleRetry = () => {
    // Remove cached data to force a fresh fetch
    if (id) {
    try {
        localStorage.removeItem(`listing_${id}`);
      } catch (e) {
        console.error('Error removing cached data:', e);
      }
    }
    
    // Reload the page
    window.location.reload();
  };
  
  // Handle status operations with improved loading context integration
  const handleStatusChange = async (status: ListingStatus) => {
    setTargetStatus(status);
    setShowStatusConfirm(true);
  };
  
  // Confirm status change
  const confirmStatusChange = async () => {
    if (!id || !targetStatus) return;
    
    try {
      // Start global loading - this will respect minimum time
      startLoading(`Updating listing status to ${targetStatus}...`);
      
      await updateListingStatus(id, targetStatus as any, statusReason);
      
      // Update listing in state
      setListing(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          status: targetStatus as any,
          statusHistory: [
            ...(prev.statusHistory || []),
            {
              status: targetStatus,
              timestamp: new Date(),
              updatedBy: 'current-user-id', // This should be dynamically set
              reason: statusReason
            }
          ]
        };
      });
      
      toast?.success?.(`Listing status updated to ${targetStatus}`) || alert(`Listing status updated to ${targetStatus}`);
      setShowStatusConfirm(false);
      setStatusReason('');
    } catch (err) {
      console.error('Error updating status:', err);
      toast?.error?.(`Failed to update status: ${err instanceof Error ? err.message : 'Unknown error'}`) || 
        alert(`Failed to update status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      stopLoading();
    }
  };
  
  // Handle featuring/unfeaturing a listing
  const handleFeatureToggle = async () => {
    if (!id || !listing) return;
    
    try {
      startLoading(listing.isFeatured ? 'Removing featured status...' : 'Setting as featured...');
      
      await toggleListingFeature(id, !listing.isFeatured);
      
      // Update listing in state
      setListing(prev => {
        if (!prev) return null;
        
        const featuredUntil = !prev.isFeatured ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined;
        
        return {
          ...prev,
          isFeatured: !prev.isFeatured,
          featuredUntil
        };
      });
      
      toast?.success?.(listing.isFeatured ? 'Featured status removed' : 'Listing is now featured') || 
        alert(listing.isFeatured ? 'Featured status removed' : 'Listing is now featured');
    } catch (err) {
      console.error('Error toggling feature status:', err);
      toast?.error?.(`Failed to update featured status: ${err instanceof Error ? err.message : 'Unknown error'}`) || 
        alert(`Failed to update featured status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      stopLoading();
    }
  };
  
  // Handle verifying a listing
  const handleVerify = async () => {
    if (!id || !listing) return;
    
    try {
      startLoading('Verifying listing...');
      
      await verifyListing(id);
      
      // Update listing in state
      setListing(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          isVerified: true,
          rating: {
            ...(prev.rating || {}),
            ratingComponents: {
              ...(prev.rating?.ratingComponents || {}),
              verification: 10
            }
          }
        } as Listing; // Cast as Listing to avoid TypeScript errors
      });
      
      toast?.success?.('Listing has been verified') || alert('Listing has been verified');
    } catch (err) {
      console.error('Error verifying listing:', err);
      toast?.error?.(`Failed to verify listing: ${err instanceof Error ? err.message : 'Unknown error'}`) || 
        alert(`Failed to verify listing: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      stopLoading();
    }
  };
  
  // Handle listing deletion
  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };
  
  // Confirm listing deletion
  const confirmDelete = async () => {
    if (!id) return;
    
    try {
      startLoading('Deleting listing...');
      
      await deleteListing(id);
      
      toast?.success?.('Listing has been deleted') || alert('Listing has been deleted');
      // Navigate back to listings page
      navigate('/listings');
    } catch (err) {
      console.error('Error deleting listing:', err);
      toast?.error?.(`Failed to delete listing: ${err instanceof Error ? err.message : 'Unknown error'}`) || 
        alert(`Failed to delete listing: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      stopLoading();
      setShowDeleteConfirm(false);
    }
  };
  
  // Handle editing the listing
  const handleEdit = () => {
    if (!id) return;
    navigate(`/listings/${id}/edit`);
  };
  
  // Get listing type icon
  const getTypeIcon = () => {
    switch (listing?.type) {
      case ListingType.BUSINESS:
        return <Store className="h-5 w-5 text-blue-600" />;
      case ListingType.FRANCHISE:
        return <Briefcase className="h-5 w-5 text-purple-600" />;
      case ListingType.STARTUP:
        return <FlaskConical className="h-5 w-5 text-green-600" />;
      case ListingType.INVESTOR:
        return <Users className="h-5 w-5 text-amber-600" />;
      case ListingType.DIGITAL_ASSET:
        return <Globe className="h-5 w-5 text-indigo-600" />;
      default:
        return <Store className="h-5 w-5 text-gray-600" />;
    }
  };
  
  // Get status badge
  const getStatusBadge = () => {
    if (!listing) return null;
    
    switch (listing.status) {
      case 'published':
        return (
          <span className="badge badge-success flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="badge bg-gray-100 text-gray-800 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="badge badge-danger flex items-center">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      case 'archived':
        return (
          <span className="badge bg-gray-100 text-gray-600 flex items-center">
            <FileDown className="h-3 w-3 mr-1" />
            Archived
          </span>
        );
      default:
        return <span className="badge">{listing.status}</span>;
    }
  };
  
  // Get type label
  const getTypeLabel = () => {
    if (!listing) return null;
    
    switch (listing.type) {
      case ListingType.BUSINESS:
        return <span className="badge bg-blue-100 text-blue-800">Business</span>;
      case ListingType.FRANCHISE:
        return <span className="badge bg-purple-100 text-purple-800">Franchise</span>;
      case ListingType.STARTUP:
        return <span className="badge bg-green-100 text-green-800">Startup</span>;
      case ListingType.INVESTOR:
        return <span className="badge bg-amber-100 text-amber-800">Investor</span>;
      case ListingType.DIGITAL_ASSET:
        return <span className="badge bg-indigo-100 text-indigo-800">Digital Asset</span>;
      default:
        return <span className="badge">{listing.type}</span>;
    }
  };
  
  // -------------- UI HELPER FUNCTIONS --------------
  
  // Render star ratings
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-4 h-4 text-yellow-500 fill-yellow-500" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  // -------------- RENDER STATES --------------
  
  // Render loading state - using our local state
  if (isLocalLoading && !listing) {
    console.log('[ListingDetail] Rendering loading spinner');
    return (
      <div className="flex justify-center items-center min-h-[300px]">
          <Spinner size="large" />
      </div>
    );
  }
  
  // Render error state
  if (error && !listing) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Listing</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/listings')}>
            Return to Listings
          </Button>
          <Button variant="primary" onClick={handleRetry}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Render empty state if no listing
  if (!listing) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-4">
          <FileText className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Listing Not Found</h3>
        <p className="text-gray-600 mb-4">The requested listing could not be found or may have been deleted.</p>
        <Button variant="primary" onClick={() => navigate('/listings')}>
          Return to Listings
        </Button>
      </div>
    );
  }
  
  // Show warning if we're showing cached data with an error
  const showCachedWarning = error && listing;
  
  // Success state - render listing content with gallery, details and tabs
  const featuredImage = listing.media?.featuredImage || 
    (listing.media?.galleryImages && listing.media.galleryImages.length > 0 
      ? listing.media.galleryImages[0] 
      : null);
      
  const galleryImages = listing.media?.galleryImages || [];
  const currentImage = selectedImageIndex < galleryImages.length ? 
    galleryImages[selectedImageIndex] : featuredImage;
  
  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto p-4">
        {showCachedWarning && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {error} (Showing cached data)
                  <button 
                    onClick={handleRetry}
                    className="ml-2 text-yellow-700 underline"
                  >
                    Retry
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
          <button
            onClick={() => navigate('/listings')}
              className="text-gray-500 hover:text-gray-700 flex items-center mb-2"
          >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-sm">Back to Listings</span>
          </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              {listing.name}
              {listing.isFeatured && (
                <span className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </span>
              )}
              {listing.isVerified && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Verified
                </span>
              )}
            </h1>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit className="h-4 w-4" />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            
            <Button
              variant={listing.isFeatured ? "outline" : "primary"}
              size="sm"
              leftIcon={<Star className="h-4 w-4" />}
              onClick={handleFeatureToggle}
            >
              {listing.isFeatured ? 'Unfeature' : 'Feature'}
            </Button>
            
            {!listing.isVerified && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<BadgeCheck className="h-4 w-4" />}
                onClick={handleVerify}
              >
                Verify
              </Button>
            )}
            
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash className="h-4 w-4" />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="card mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="mr-3">
                    {getTypeIcon()}
                  </div>
              <div>
                    <div className="flex items-center">
                      {getTypeLabel()}
                      <span className="mx-2 text-gray-300">•</span>
                      {getStatusBadge()}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      Listed on {formatDate(listing.createdAt)}
                      {listing.publishedAt && ` • Published on ${formatDate(listing.publishedAt)}`}
                    </p>
                  </div>
                </div>
                
                {listing.type !== ListingType.INVESTOR && (
                  <div className="bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="text-sm text-gray-500">
                      {listing.type === ListingType.BUSINESS ? 'Asking Price' : 
                       listing.type === ListingType.FRANCHISE ? 'Investment' : 
                       listing.type === ListingType.STARTUP ? 'Raising' : 
                       'Price'}
                </div>
                    <div className="text-xl font-bold text-gray-900">
                      {listing.type === ListingType.BUSINESS && listing.businessDetails?.sale?.askingPrice?.value && 
                        formatCurrency(listing.businessDetails.sale.askingPrice.value)}
                      
                      {listing.type === ListingType.FRANCHISE && listing.franchiseDetails?.investment?.totalInitialInvestment?.value && 
                        formatCurrency(listing.franchiseDetails.investment.totalInitialInvestment.value)}
                      
                      {listing.type === ListingType.STARTUP && listing.startupDetails?.funding?.currentRaisingAmount?.value && 
                        formatCurrency(listing.startupDetails.funding.currentRaisingAmount.value)}
                      
                      {listing.type === ListingType.DIGITAL_ASSET && listing.digitalAssetDetails?.sale?.askingPrice?.value && 
                        formatCurrency(listing.digitalAssetDetails.sale.askingPrice.value)}
          </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
              </div>
              
              {listing.location && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Location</h3>
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span>
                      {[
                        listing.location.address,
                        listing.location.city,
                        listing.location.state,
                        listing.location.country !== 'India' ? listing.location.country : null
                      ].filter(Boolean).join(', ')}
                    </span>
                  </div>
            </div>
          )}
          
              {listing.contactInfo && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
                  <div className="space-y-2">
                        {listing.contactInfo.email && (
                      <div className="flex items-center text-gray-700">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            <a href={`mailto:${listing.contactInfo.email}`} className="text-blue-600 hover:underline">
                              {listing.contactInfo.email}
                            </a>
                          </div>
                        )}
                        
                        {listing.contactInfo.phone && (
                      <div className="flex items-center text-gray-700">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            <a href={`tel:${listing.contactInfo.phone}`} className="text-blue-600 hover:underline">
                              {listing.contactInfo.phone}
                            </a>
                          </div>
                        )}
                        
                        {listing.contactInfo.website && (
                      <div className="flex items-center text-gray-700">
                        <LinkIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <a href={listing.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {listing.contactInfo.website.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </div>
                        )}
                    
                    {listing.contactInfo.contactName && (
                      <div className="flex items-center text-gray-700">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{listing.contactInfo.contactName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
            </div>
            
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Image className="h-5 w-5 text-gray-500 mr-2" />
                Gallery
              </h3>
              
              <ImageGallery images={listing.media?.galleryImages || []} />
            </div>
          </div>
          
          <div>
            <div className="card mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BarChart className="h-5 w-5 text-gray-500 mr-2" />
                System Rating
              </h3>
              
              <ListingRating rating={listing.rating} />
            </div>
            
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <div className="font-medium text-sm text-gray-700 mb-2">Change Status</div>
                
                {Object.values(['published', 'pending', 'draft', 'rejected', 'archived']).map((status) => (
                  listing.status !== status && (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status as ListingStatus)}
                      className={cn?.(
                        "w-full text-left px-3 py-2 rounded-md flex items-center text-sm transition-colors",
                        status === 'published' ? "text-green-700 bg-green-50 hover:bg-green-100" :
                        status === 'pending' ? "text-amber-700 bg-amber-50 hover:bg-amber-100" :
                        status === 'rejected' ? "text-red-700 bg-red-50 hover:bg-red-100" :
                        status === 'archived' ? "text-gray-700 bg-gray-50 hover:bg-gray-100" :
                        "text-gray-700 bg-gray-50 hover:bg-gray-100"
                      ) || 
                      `w-full text-left px-3 py-2 rounded-md flex items-center text-sm transition-colors ${
                        status === 'published' ? "text-green-700 bg-green-50 hover:bg-green-100" :
                        status === 'pending' ? "text-amber-700 bg-amber-50 hover:bg-amber-100" :
                        status === 'rejected' ? "text-red-700 bg-red-50 hover:bg-red-100" :
                        status === 'archived' ? "text-gray-700 bg-gray-50 hover:bg-gray-100" :
                        "text-gray-700 bg-gray-50 hover:bg-gray-100"
                      }`
                    }
                    >
                      {status === 'published' && <CheckCircle className="h-4 w-4 mr-2" />}
                      {status === 'pending' && <Clock className="h-4 w-4 mr-2" />}
                      {status === 'draft' && <Clock className="h-4 w-4 mr-2" />}
                      {status === 'rejected' && <ShieldAlert className="h-4 w-4 mr-2" />}
                      {status === 'archived' && <FileDown className="h-4 w-4 mr-2" />}
                      
                      Set as {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  )
                ))}
                
                <div className="border-t border-gray-100 my-3"></div>
                
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="h-4 w-4" />}
                  className="w-full justify-start"
                  onClick={() => toast?.success?.('Export functionality coming soon') || alert('Export functionality coming soon')}
                >
                  Export Listing Data
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Activity className="h-4 w-4" />}
                  className="w-full justify-start"
                  onClick={() => toast?.success?.('Analytics export coming soon') || alert('Analytics export coming soon')}
                >
                  Export Analytics
                </Button>
              </div>
            </div>
                      </div>
                    </div>
        
        {/* Tabbed sections */}
        <Tab.Group>
          <Tab.List className="flex border-b border-gray-200 mb-6">
            <Tab className={({ selected }) => cn?.(
              "px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap",
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            ) || 
            `px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap ${
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            }`}>
              Details
            </Tab>
            <Tab className={({ selected }) => cn?.(
              "px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap",
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            ) || 
            `px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap ${
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            }`}>
              Documents
            </Tab>
            <Tab className={({ selected }) => cn?.(
              "px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap",
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            ) || 
            `px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap ${
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            }`}>
              Analytics
            </Tab>
            <Tab className={({ selected }) => cn?.(
              "px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap",
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            ) || 
            `px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap ${
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            }`}>
              Activity Log
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            {/* Details Panel */}
            <Tab.Panel>
              <div className="card">
                {/* Render different details based on listing type */}
                {listing.type === ListingType.BUSINESS && listing.businessDetails && (
                  <BusinessDetails details={listing.businessDetails} />
                )}
                
                {listing.type === ListingType.FRANCHISE && listing.franchiseDetails && (
                  <FranchiseDetails details={listing.franchiseDetails} />
                )}
                
                {listing.type === ListingType.STARTUP && listing.startupDetails && (
                  <StartupDetails details={listing.startupDetails} />
                )}
                
                {listing.type === ListingType.INVESTOR && listing.investorDetails && (
                  <InvestorDetails details={listing.investorDetails} />
                )}
                
                {listing.type === ListingType.DIGITAL_ASSET && listing.digitalAssetDetails && (
                  <DigitalAssetDetails details={listing.digitalAssetDetails} />
                  )}
                </div>
              </Tab.Panel>
              
            {/* Documents Panel */}
              <Tab.Panel>
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  Documents
                </h3>
                
                <DocumentList documents={listing.documents || []} />
                    </div>
            </Tab.Panel>
            
            {/* Analytics Panel */}
            <Tab.Panel>
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <BarChart className="h-5 w-5 text-gray-500 mr-2" />
                  Analytics
                </h3>
                
                <ListingAnalytics analytics={listing.analytics} />
                    </div>
              </Tab.Panel>
              
            {/* Activity Log Panel */}
              <Tab.Panel>
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 text-gray-500 mr-2" />
                  Activity Log
                </h3>
                
                <ActivityLog statusHistory={listing.statusHistory || []} />
              </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        
        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <ConfirmationDialog
            title="Delete Listing"
            message="Are you sure you want to delete this listing? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            isDestructive={true}
          />
        )}
        
        {/* Status Change Confirmation Dialog */}
        {showStatusConfirm && targetStatus && (
          <ConfirmationDialog
            title={`Change Status to ${targetStatus.charAt(0).toUpperCase() + targetStatus.slice(1)}`}
            message={`Are you sure you want to change the status of this listing to "${targetStatus}"?`}
            confirmText="Change Status"
            cancelText="Cancel"
            onConfirm={confirmStatusChange}
            onCancel={() => {
              setShowStatusConfirm(false);
              setTargetStatus(null);
              setStatusReason('');
            }}
            isDestructive={targetStatus === 'rejected' || targetStatus === 'archived'}
            extraContent={
              <div className="mt-4">
                <label htmlFor="statusReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for status change (optional)
                </label>
                <textarea
                  id="statusReason"
                  rows={3}
                  className="form-input w-full"
                  placeholder="Enter a reason for this status change..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                ></textarea>
        </div>
            }
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ListingDetail; 