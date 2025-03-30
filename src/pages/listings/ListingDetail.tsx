import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
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
  Link,
  MapPin,
  Calendar,
  DollarSign,
  BarChart,
  FileText,
  Image
} from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useLoading } from '@/context/LoadingContext';
import { getListingById, updateListingStatus, toggleListingFeature, verifyListing, deleteListing } from '@/services/listingService';
import { Listing, ListingType, ListingStatus } from '@/types/listings';
import { cn, formatDate, formatCurrency, formatRelativeTime } from '@/lib/utils';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import ImageGallery from '@/components/listings/ImageGallery';
import DocumentList from '@/components/listings/DocumentList';
import StatusHistory from '@/components/listings/StatusHistory';
import ListingAnalytics from '@/components/listings/ListingAnalytics';
import ActivityLog from '@/components/listings/ActivityLog';
import ListingRating from '@/components/listings/ListingRating';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';

// Type-specific detail components
import BusinessDetails from '@/components/listings/details/BusinessDetails';
import FranchiseDetails from '@/components/listings/details/FranchiseDetails';
import StartupDetails from '@/components/listings/details/StartupDetails';
import InvestorDetails from '@/components/listings/details/InvestorDetails';
import DigitalAssetDetails from '@/components/listings/details/DigitalAssetDetails';

const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  
  // State for listing data
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ListingStatus | null>(null);
  const [statusReason, setStatusReason] = useState('');
  
  // Set page title dynamically
  usePageTitle(listing?.name || 'Listing Details');
  
  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        startLoading('Loading listing details...');
        
        const listingData = await getListingById(id);
        setListing(listingData);
        setError(null);
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listing details');
      } finally {
        setIsLoading(false);
        stopLoading();
      }
    };
    
    fetchListing();
  }, [id, startLoading, stopLoading]);
  
  // Handle changing listing status
  const handleStatusChange = async (status: ListingStatus) => {
    setTargetStatus(status);
    setShowStatusConfirm(true);
  };
  
  // Confirm status change
  const confirmStatusChange = async () => {
    if (!id || !targetStatus) return;
    
    try {
      startLoading(`Updating listing status to ${targetStatus}...`);
      
      await updateListingStatus(id, targetStatus, statusReason);
      
      // Update listing in state
      setListing(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          status: targetStatus,
          statusHistory: [
            ...prev.statusHistory,
            {
              status: targetStatus,
              timestamp: new Date(),
              updatedBy: 'current-user-id', // This should be dynamically set
              reason: statusReason
            }
          ]
        };
      });
      
      toast.success(`Listing status updated to ${targetStatus}`);
      setShowStatusConfirm(false);
      setStatusReason('');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(`Failed to update status: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      
      toast.success(listing.isFeatured ? 'Featured status removed' : 'Listing is now featured');
    } catch (err) {
      console.error('Error toggling feature status:', err);
      toast.error(`Failed to update featured status: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
            ...prev.rating,
            ratingComponents: {
              ...prev.rating.ratingComponents,
              verification: 10
            }
          }
        };
      });
      
      toast.success('Listing has been verified');
    } catch (err) {
      console.error('Error verifying listing:', err);
      toast.error(`Failed to verify listing: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      
      toast.success('Listing has been deleted');
      // Navigate back to listings page
      navigate('/listings');
    } catch (err) {
      console.error('Error deleting listing:', err);
      toast.error(`Failed to delete listing: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      stopLoading();
      setShowDeleteConfirm(false);
    }
  };
  
  // Handle editing the listing
  const handleEdit = () => {
    if (!id) return;
    navigate(`/listings/edit/${id}`);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading listing details..." />
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Listing</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/listings')}>
            Return to Listings
          </Button>
          <Button variant="primary" onClick={() => window.location.reload()}>
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
  
  // Get listing type icon
  const getTypeIcon = () => {
    switch (listing.type) {
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
    switch (listing.status) {
      case ListingStatus.PUBLISHED:
        return (
          <span className="badge badge-success flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Published
          </span>
        );
      case ListingStatus.DRAFT:
        return (
          <span className="badge bg-gray-100 text-gray-800 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </span>
        );
      case ListingStatus.PENDING:
        return (
          <span className="badge badge-warning flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case ListingStatus.REJECTED:
        return (
          <span className="badge badge-danger flex items-center">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      case ListingStatus.ARCHIVED:
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
  
  return (
    <ErrorBoundary>
      <div>
        {/* Back button and title */}
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
          
          {/* Action buttons */}
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
            {/* Edit button */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit className="h-4 w-4" />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            
            {/* Feature/Unfeature button */}
            <Button
              variant={listing.isFeatured ? "outline" : "primary"}
              size="sm"
              leftIcon={<Star className="h-4 w-4" />}
              onClick={handleFeatureToggle}
            >
              {listing.isFeatured ? 'Unfeature' : 'Feature'}
            </Button>
            
            {/* Verify button - only if not verified */}
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
            
            {/* Delete button */}
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
        
        {/* Listing overview cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left column - Main info */}
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
                
                {/* Price display */}
                {listing.type !== ListingType.INVESTOR && (
                  <div className="bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="text-sm text-gray-500">
                      {listing.type === ListingType.BUSINESS ? 'Asking Price' : 
                       listing.type === ListingType.FRANCHISE ? 'Investment' : 
                       listing.type === ListingType.STARTUP ? 'Raising' : 
                       'Price'}
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {listing.type === ListingType.BUSINESS && listing.businessDetails?.sale.askingPrice.value && 
                        formatCurrency(listing.businessDetails.sale.askingPrice.value)}
                      
                      {listing.type === ListingType.FRANCHISE && listing.franchiseDetails?.investment.totalInitialInvestment.value && 
                        formatCurrency(listing.franchiseDetails.investment.totalInitialInvestment.value)}
                      
                      {listing.type === ListingType.STARTUP && listing.startupDetails?.funding.currentRaisingAmount.value && 
                        formatCurrency(listing.startupDetails.funding.currentRaisingAmount.value)}
                      
                      {listing.type === ListingType.DIGITAL_ASSET && listing.digitalAssetDetails?.sale.askingPrice.value && 
                        formatCurrency(listing.digitalAssetDetails.sale.askingPrice.value)}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
              </div>
              
              {/* Location */}
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
              
              {/* Contact Info */}
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
                        <Link className="h-4 w-4 text-gray-400 mr-2" />
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
            
            {/* Image Gallery */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Image className="h-5 w-5 text-gray-500 mr-2" />
                Gallery
              </h3>
              
              <ImageGallery images={listing.media.galleryImages} />
            </div>
          </div>
          
          {/* Right column - Sidebar info */}
          <div>
            {/* Owner Info */}
            <div className="card mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Listing Owner</h3>
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium mr-3">
                  {listing.ownerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{listing.ownerName}</div>
                  <div className="text-sm text-gray-500">Owner</div>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="text-sm">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Listed On</span>
                    <span className="text-gray-900">{formatDate(listing.createdAt)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="text-gray-900">{formatDate(listing.updatedAt)}</span>
                  </div>
                  {listing.publishedAt && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Published On</span>
                      <span className="text-gray-900">{formatDate(listing.publishedAt)}</span>
                    </div>
                  )}
                  {listing.expiresAt && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Expires On</span>
                      <span className="text-gray-900">{formatDate(listing.expiresAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* System Rating */}
            <div className="card mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BarChart className="h-5 w-5 text-gray-500 mr-2" />
                System Rating
              </h3>
              
              <ListingRating rating={listing.rating} />
            </div>
            
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                {/* Status change actions */}
                <div className="font-medium text-sm text-gray-700 mb-2">Change Status</div>
                
                {Object.values(ListingStatus).map((status) => (
                  listing.status !== status && (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md flex items-center text-sm transition-colors",
                        status === ListingStatus.PUBLISHED ? "text-green-700 bg-green-50 hover:bg-green-100" :
                        status === ListingStatus.PENDING ? "text-amber-700 bg-amber-50 hover:bg-amber-100" :
                        status === ListingStatus.REJECTED ? "text-red-700 bg-red-50 hover:bg-red-100" :
                        status === ListingStatus.ARCHIVED ? "text-gray-700 bg-gray-50 hover:bg-gray-100" :
                        "text-gray-700 bg-gray-50 hover:bg-gray-100"
                      )}
                    >
                      {status === ListingStatus.PUBLISHED && <CheckCircle className="h-4 w-4 mr-2" />}
                      {status === ListingStatus.PENDING && <Clock className="h-4 w-4 mr-2" />}
                      {status === ListingStatus.DRAFT && <Clock className="h-4 w-4 mr-2" />}
                      {status === ListingStatus.REJECTED && <ShieldAlert className="h-4 w-4 mr-2" />}
                      {status === ListingStatus.ARCHIVED && <FileDown className="h-4 w-4 mr-2" />}
                      
                      Set as {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  )
                ))}
                
                <div className="border-t border-gray-100 my-3"></div>
                
                {/* Other actions */}
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="h-4 w-4" />}
                  className="w-full justify-start"
                  onClick={() => toast.info('Export functionality coming soon')}
                >
                  Export Listing Data
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Activity className="h-4 w-4" />}
                  className="w-full justify-start"
                  onClick={() => toast.info('Analytics export coming soon')}
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
            <Tab className={({ selected }) => cn(
              "px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap",
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            )}>
              Details
            </Tab>
            <Tab className={({ selected }) => cn(
              "px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap",
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            )}>
              Documents
            </Tab>
            <Tab className={({ selected }) => cn(
              "px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap",
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            )}>
              Analytics
            </Tab>
            <Tab className={({ selected }) => cn(
              "px-4 py-2 text-sm font-medium focus:outline-none whitespace-nowrap",
              selected
                ? "text-[#0031ac] border-b-2 border-[#0031ac]"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
            )}>
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
                
                <DocumentList documents={listing.documents} />
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
                
                <ActivityLog statusHistory={listing.statusHistory} />
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
            isDestructive={targetStatus === ListingStatus.REJECTED || targetStatus === ListingStatus.ARCHIVED}
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