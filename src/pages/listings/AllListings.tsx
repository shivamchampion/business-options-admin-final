import React, { useState, useEffect } from 'react';
import { useLoading } from '@/context/LoadingContext';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { Tab } from '@headlessui/react';
import {
    Plus,
    RefreshCw,
    AlertTriangle,
    Info,
    Store,
    Briefcase,
    FlaskConical,
    Users,
    Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import Button from '@/components/ui/Button';
import ListingFilters from '@/components/listings/ListingFilters';
import ListingTable from '@/components/listings/ListingTable';
import ListingBulkActions from '@/components/listings/ListingBulkActions';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Listing, ListingType, ListingStatus, ListingFilters as ListingFiltersType } from '@/types/listings';
import { Industry, getAllIndustries } from '@/services/industryService';
import {
    getListings,
    getListingsByStatus,
    updateListingStatus,
    toggleListingFeature,
    verifyListing,
    deleteListing,
    getListingCountsByType,
    getListingCountsByStatus
} from '@/services/listingService';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AllListings() {
    usePageTitle('Listings Management');
    const { startLoading, stopLoading } = useLoading();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    // Tab state
    const [selectedTab, setSelectedTab] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Listings state
    const [listings, setListings] = useState<Listing[]>([]);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMoreListings, setHasMoreListings] = useState(true);
    const [industries, setIndustries] = useState<Industry[]>([]);

    // Counts for dashboard
    const [typeCounts, setTypeCounts] = useState<{ [key in ListingType]?: number }>({});
    const [statusCounts, setStatusCounts] = useState<{ [key in ListingStatus]?: number }>({});

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [selectedListings, setSelectedListings] = useState<string[]>([]);
    const [filters, setFilters] = useState<ListingFiltersType>({});

    // Track which tabs have been initialized
    const [initializedTabs, setInitializedTabs] = useState<{ [key: number]: boolean }>({});

    // Tab labels, including counts
    const tabLabels = [
        { name: "All Listings", count: statusCounts[ListingStatus.PUBLISHED] || 0 },
        { name: "Pending", count: statusCounts[ListingStatus.PENDING] || 0 },
        { name: "Featured", count: 0 }, // Will be calculated separately
        { name: "Drafts", count: statusCounts[ListingStatus.DRAFT] || 0 }
    ];

    // Type filters for quick filtering
    const typeFilters = [
        { name: "Business", type: ListingType.BUSINESS, icon: <Store className="h-4 w-4" /> },
        { name: "Franchise", type: ListingType.FRANCHISE, icon: <Briefcase className="h-4 w-4" /> },
        { name: "Startup", type: ListingType.STARTUP, icon: <FlaskConical className="h-4 w-4" /> },
        { name: "Investor", type: ListingType.INVESTOR, icon: <Users className="h-4 w-4" /> },
        { name: "Digital Asset", type: ListingType.DIGITAL_ASSET, icon: <Globe className="h-4 w-4" /> }
    ];
    const navigate = useNavigate();

    // Tab change handler with smooth transition
    const handleTabChange = (index: number) => {
        setIsTransitioning(true);
        setSelectedListings([]); // Clear selected listings when changing tabs

        setTimeout(() => {
            setSelectedTab(index);

            setTimeout(() => {
                setIsTransitioning(false);
            }, 150);
        }, 150);
    };

    // Load data when switching tabs or when tab is first viewed
    useEffect(() => {
        if (isAuthenticated && !authLoading && auth.currentUser && !initializedTabs[selectedTab]) {
            loadListingsByTab(true);

            // Mark this tab as initialized
            setInitializedTabs(prev => ({
                ...prev,
                [selectedTab]: true
            }));
        }
    }, [selectedTab, isAuthenticated, authLoading, user]);

    // Load counts and industries when auth is established
    useEffect(() => {
        if (isAuthenticated && !authLoading && auth.currentUser) {
            loadCounts();
            loadIndustries();
        }
    }, [isAuthenticated, authLoading, user]);

    // Load counts data
    const loadCounts = async () => {
        try {
            const [typeCountsData, statusCountsData] = await Promise.all([
                getListingCountsByType(user?.id),
                getListingCountsByStatus(user?.id)
            ]);

            setTypeCounts(typeCountsData);
            setStatusCounts(statusCountsData);
        } catch (error) {
            console.error('Error loading counts:', error);
            toast.error('Failed to load listing count data');
        }
    };

    // Load industries for filter
    const loadIndustries = async () => {
        try {
            const industriesData = await getAllIndustries(user?.id);
            setIndustries(industriesData);
        } catch (error) {
            console.error('Error loading industries:', error);
        }
    };

    // Handle filter changes with transition
    const handleFilterChange = (newFilters: ListingFiltersType) => {
        setIsTransitioning(true);
        setSelectedListings([]); // Clear selections when filters change
        setFilters(newFilters);

        // Reset pagination
        setLastDoc(null);
        setHasMoreListings(true);

        setTimeout(() => {
            setIsTransitioning(false);
        }, 300);
    };

    // Load listings based on current tab
    const loadListingsByTab = async (reset = true) => {
        try {
            startLoading('Loading listings...');
            setIsLoading(true);

            let result;

            // Apply tab-specific filters
            const tabFilters = { ...filters };

            if (selectedTab === 1) {
                // Pending tab
                result = await getListingsByStatus(
                    ListingStatus.PENDING,
                    10,
                    reset ? null : lastDoc,
                    user?.id
                );
            } else if (selectedTab === 2) {
                // Featured tab
                tabFilters.isFeatured = true;
                result = await getListings(
                    10,
                    reset ? null : lastDoc,
                    tabFilters,
                    user?.id
                );
            } else if (selectedTab === 3) {
                // Drafts tab
                result = await getListingsByStatus(
                    ListingStatus.DRAFT,
                    10,
                    reset ? null : lastDoc,
                    user?.id
                );
            } else {
                // All listings tab (default)
                result = await getListings(
                    10,
                    reset ? null : lastDoc,
                    tabFilters,
                    user?.id
                );
            }

            setListings(prev => reset ? result.listings : [...prev, ...result.listings]);
            setLastDoc(result.lastDoc);
            setHasMoreListings(result.listings.length === 10);
        } catch (error) {
            console.error('Error loading listings:', error);
            toast.error('Failed to load listings');

            // Initialize with empty array on error to prevent undefined errors
            if (reset) {
                setListings([]);
                setLastDoc(null);
                setHasMoreListings(false);
            }
        } finally {
            setIsLoading(false);
            stopLoading();
        }
    };

    // Effect to reload when filters change
    useEffect(() => {
        if (isAuthenticated && !authLoading && auth.currentUser && initializedTabs[selectedTab]) {
            loadListingsByTab(true);
        }
    }, [filters, isAuthenticated, authLoading]);

    // Load more listings
    const loadMore = () => {
        loadListingsByTab(false);
    };

    // Refresh listings
    const handleRefresh = () => {
        loadListingsByTab(true);
        loadCounts(); // Refresh counts as well
    };

    // Handle listing selection
    const handleSelectListing = (listingId: string, isSelected: boolean) => {
        setSelectedListings(prev =>
            isSelected
                ? [...prev, listingId]
                : prev.filter(id => id !== listingId)
        );
    };

    // Handle select all listings
    const handleSelectAllListings = (isSelected: boolean) => {
        setSelectedListings(isSelected ? listings.map(listing => listing.id) : []);
    };

    // Handle status change
    const handleStatusChange = async (listingId: string, status: ListingStatus) => {
        try {
            startLoading(`Updating listing status to ${status}...`);

            await updateListingStatus(listingId, status);

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    listing.id === listingId ? { ...listing, status } : listing
                )
            );

            toast.success(`Listing status updated to ${status}`);

            // Refresh counts
            loadCounts();
        } catch (error) {
            console.error('Error updating listing status:', error);
            toast.error(`Failed to update listing status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            stopLoading();
        }
    };

    // Handle editing (will be implemented later)
    const handleEdit = (listing: Listing) => {
        // Navigate to edit page or open edit modal
        console.log('Edit listing:', listing);
        toast.info('Listing edit functionality coming soon');
    };

    // Handle feature toggle
    const handleFeatureToggle = async (listingId: string, isFeatured: boolean) => {
        try {
            startLoading(isFeatured ? 'Featuring listing...' : 'Unfeaturing listing...');

            await toggleListingFeature(listingId, isFeatured);

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    listing.id === listingId ? { ...listing, isFeatured } : listing
                )
            );

            toast.success(isFeatured ? 'Listing is now featured' : 'Listing is no longer featured');
        } catch (error) {
            console.error('Error toggling feature status:', error);
            toast.error(`Failed to ${isFeatured ? 'feature' : 'unfeature'} listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            stopLoading();
        }
    };

    // Handle verification
    const handleVerify = async (listingId: string) => {
        try {
            startLoading('Verifying listing...');

            await verifyListing(listingId);

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    listing.id === listingId ? { ...listing, isVerified: true } : listing
                )
            );

            toast.success('Listing has been verified');
        } catch (error) {
            console.error('Error verifying listing:', error);
            toast.error(`Failed to verify listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            stopLoading();
        }
    };

    // Handle deletion
    const handleDelete = async (listingId: string) => {
        if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }

        try {
            startLoading('Deleting listing...');

            await deleteListing(listingId);

            // Update local state
            setListings(prev => prev.filter(listing => listing.id !== listingId));

            toast.success('Listing has been deleted');

            // Refresh counts
            loadCounts();
        } catch (error) {
            console.error('Error deleting listing:', error);
            toast.error(`Failed to delete listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            stopLoading();
        }
    };

    // Bulk actions
    const handleBulkStatusChange = async (status: ListingStatus) => {
        try {
            if (!window.confirm(`Are you sure you want to change the status of ${selectedListings.length} listings to ${status}?`)) {
                return;
            }

            startLoading(`Updating ${selectedListings.length} listings to ${status}...`);

            // Process each listing one by one
            for (const listingId of selectedListings) {
                await updateListingStatus(listingId, status);
            }

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    selectedListings.includes(listing.id) ? { ...listing, status } : listing
                )
            );

            // Clear selection
            setSelectedListings([]);

            toast.success(`${selectedListings.length} listings updated to ${status}`);

            // Refresh counts
            loadCounts();
        } catch (error) {
            console.error('Error bulk updating listings:', error);
            toast.error(`Failed to update listings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            stopLoading();
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedListings.length} listings? This action cannot be undone.`)) {
            return;
        }

        try {
            startLoading(`Deleting ${selectedListings.length} listings...`);

            // Process each listing one by one
            for (const listingId of selectedListings) {
                await deleteListing(listingId);
            }

            // Update local state
            setListings(prev => prev.filter(listing => !selectedListings.includes(listing.id)));

            // Clear selection
            setSelectedListings([]);

            toast.success(`${selectedListings.length} listings deleted`);

            // Refresh counts
            loadCounts();
        } catch (error) {
            console.error('Error bulk deleting listings:', error);
            toast.error(`Failed to delete listings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            stopLoading();
        }
    };

    const handleBulkFeature = async () => {
        try {
            startLoading(`Featuring ${selectedListings.length} listings...`);

            // Process each listing one by one
            for (const listingId of selectedListings) {
                await toggleListingFeature(listingId, true);
            }

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    selectedListings.includes(listing.id) ? { ...listing, isFeatured: true } : listing
                )
            );

            // Clear selection
            setSelectedListings([]);

            toast.success(`${selectedListings.length} listings featured`);
        } catch (error) {
            console.error('Error bulk featuring listings:', error);
            toast.error(`Failed to feature listings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            stopLoading();
        }
    };

    const handleBulkUnfeature = async () => {
        try {
            startLoading(`Unfeaturing ${selectedListings.length} listings...`);

            // Process each listing one by one
            for (const listingId of selectedListings) {
                await toggleListingFeature(listingId, false);
            }

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    selectedListings.includes(listing.id) ? { ...listing, isFeatured: false } : listing
                )
            );

            // Clear selection
            setSelectedListings([]);

            toast.success(`${selectedListings.length} listings unfeatured`);
        } catch (error) {
            console.error('Error bulk unfeaturing listings:', error);
            toast.error(`Failed to unfeature listings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            stopLoading();
        }
    };

    const handleBulkVerify = async () => {
        try {
            startLoading(`Verifying ${selectedListings.length} listings...`);

            // Process each listing one by one
            for (const listingId of selectedListings) {
                await verifyListing(listingId);
            }

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    selectedListings.includes(listing.id) ? { ...listing, isVerified: true } : listing
                )
            );

            // Clear selection
            setSelectedListings([]);

            toast.success(`${selectedListings.length} listings verified`);
        } catch (error) {
            console.error('Error bulk verifying listings:', error);
            toast.error(`Failed to verify listings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            stopLoading();
        }
    };

    

    // Display loading state during auth
    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" color="primary" />
                <p className="mt-4 text-sm text-gray-500">
                    Establishing secure connection...
                </p>
            </div>
        );
    }

    // Add check for auth.currentUser to display waiting state
    if (isAuthenticated && !auth.currentUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" color="primary" />
                <p className="mt-4 text-sm text-gray-500">
                    Initializing authentication...
                </p>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div>
                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Listings Management</h1>
                        <p className="mt-1 text-sm text-gray-500">Manage all business listings on the platform</p>
                    </div>

                    <div className="mt-4 sm:mt-0">
                        <Button
                            variant="primary"
                            leftIcon={<Plus className="h-4 w-4" />}
                            onClick={() => navigate('/listings/create')}
                        >
                            Add New Listing
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tab.Group selectedIndex={selectedTab} onChange={handleTabChange}>
                    <div className="border-b border-gray-200 mb-6">
                        <div className="flex overflow-x-auto scrollbar-hide max-w-full">
                            <Tab.List className="flex space-x-1 min-w-max">
                                {tabLabels.map((tab, idx) => (
                                    <Tab
                                        key={idx}
                                        className={({ selected }) => cn(
                                            "px-6 py-3 text-sm font-medium whitespace-nowrap focus:outline-none transition-colors",
                                            selected
                                                ? 'text-blue-600 relative'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        )}
                                    >
                                        {({ selected }) => (
                                            <div className="relative">
                                                <span className="flex items-center">
                                                    {tab.name}
                                                    {tab.count > 0 && (
                                                        <span className="ml-2 bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs font-normal">
                                                            {tab.count}
                                                        </span>
                                                    )}
                                                </span>
                                                {selected && (
                                                    <span className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-blue-500"></span>
                                                )}
                                            </div>
                                        )}
                                    </Tab>
                                ))}
                            </Tab.List>
                        </div>
                    </div>

                    {/* Listing type quick filters with improved styling and fixed borders */}
<div className="mb-6">
  <div className="overflow-x-auto pb-2 hide-scrollbar pl-1.5 pr-4">
    <div className="flex gap-3 min-w-max py-1 ml-0.5">
      {typeFilters.map((filter, idx) => (
        <Button
          key={idx}
          variant={filters.type?.includes(filter.type) ? "primary" : "outline"}
          size="sm"
          leftIcon={filter.icon}
          onClick={() => {
            // Toggle type filter
            const currentTypes = filters.type || [];
            const newTypes = currentTypes.includes(filter.type)
              ? currentTypes.filter(t => t !== filter.type)
              : [...currentTypes, filter.type];

            handleFilterChange({
              ...filters,
              type: newTypes.length > 0 ? newTypes : undefined
            });
          }}
          className={cn(
            "whitespace-nowrap px-4 py-1.5 min-w-[120px] transition-all",
            filters.type?.includes(filter.type) 
              ? "border border-blue-600 bg-blue-600 text-white" 
              : "border border-gray-300 text-gray-700 hover:border-gray-400 bg-white"
          )}
        >
          {filter.name}
        </Button>
      ))}
    </div>
  </div>
</div>

                    <Tab.Panels>
                        {/* All listings panel */}
                        <Tab.Panel>
                            <div className="space-y-6 px-2">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <ListingFilters
                                        filters={filters}
                                        onFilterChange={handleFilterChange}
                                        industries={industries.map(i => ({ id: i.id, name: i.name }))}
                                        className="w-full md:w-auto mb-4 md:mb-0"
                                    />

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<RefreshCw className="h-4 w-4" />}
                                        onClick={handleRefresh}
                                    >
                                        Refresh
                                    </Button>
                                </div>

                                {/* Listings Table with transition */}
                                <div
                                    className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-50' : 'opacity-100'
                                        }`}
                                >
                                    <ListingTable
                                        listings={listings}
                                        isLoading={isLoading}
                                        selectedListings={selectedListings}
                                        onSelectListing={handleSelectListing}
                                        onSelectAllListings={handleSelectAllListings}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onStatusChange={handleStatusChange}
                                        onVerify={handleVerify}
                                        onFeature={handleFeatureToggle}
                                    />
                                </div>

                                {/* Load more */}
                                {hasMoreListings && (
                                    <div className="flex justify-center mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={loadMore}
                                            isLoading={isLoading}
                                        >
                                            Load More
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Tab.Panel>

                        {/* Pending listings panel (similar to All but with status filter) */}
                        <Tab.Panel>
                            <div className="space-y-6 px-2">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <ListingFilters
                                        filters={filters}
                                        onFilterChange={handleFilterChange}
                                        industries={industries.map(i => ({ id: i.id, name: i.name }))}
                                        className="w-full md:w-auto mb-4 md:mb-0"
                                    />

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<RefreshCw className="h-4 w-4" />}
                                        onClick={handleRefresh}
                                    >
                                        Refresh
                                    </Button>
                                </div>

                                {/* Info message about pending listings */}
                                <div className="flex items-start p-4 border border-amber-200 bg-amber-50 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-amber-700">
                                        <p className="font-medium mb-1">Pending Listings</p>
                                        <p>These listings are awaiting review and approval. Review each listing carefully before publishing.</p>
                                    </div>
                                </div>

                                {/* Listings Table with transition */}
                                <div
                                    className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-50' : 'opacity-100'
                                        }`}
                                >
                                    <ListingTable
                                        listings={listings}
                                        isLoading={isLoading}
                                        selectedListings={selectedListings}
                                        onSelectListing={handleSelectListing}
                                        onSelectAllListings={handleSelectAllListings}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onStatusChange={handleStatusChange}
                                        onVerify={handleVerify}
                                        onFeature={handleFeatureToggle}
                                    />
                                </div>

                                {/* Load more */}
                                {hasMoreListings && (
                                    <div className="flex justify-center mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={loadMore}
                                            isLoading={isLoading}
                                        >
                                            Load More
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Tab.Panel>

                        {/* Featured listings panel */}
                        <Tab.Panel>
                            <div className="space-y-6 px-2">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <ListingFilters
                                        filters={filters}
                                        onFilterChange={handleFilterChange}
                                        industries={industries.map(i => ({ id: i.id, name: i.name }))}
                                        className="w-full md:w-auto mb-4 md:mb-0"
                                    />

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<RefreshCw className="h-4 w-4" />}
                                        onClick={handleRefresh}
                                    >
                                        Refresh
                                    </Button>
                                </div>

                                {/* Info message about featured listings */}
                                <div className="flex items-start p-4 border border-blue-200 bg-blue-50 rounded-lg">
                                    <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-blue-700">
                                        <p className="font-medium mb-1">Featured Listings</p>
                                        <p>These listings appear prominently across the platform. Featured status expires after 30 days unless extended.</p>
                                    </div>
                                </div>

                                {/* Listings Table with transition */}
                                <div
                                    className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-50' : 'opacity-100'
                                        }`}
                                >
                                    <ListingTable
                                        listings={listings}
                                        isLoading={isLoading}
                                        selectedListings={selectedListings}
                                        onSelectListing={handleSelectListing}
                                        onSelectAllListings={handleSelectAllListings}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onStatusChange={handleStatusChange}
                                        onVerify={handleVerify}
                                        onFeature={handleFeatureToggle}
                                    />
                                </div>

                                {/* Load more */}
                                {hasMoreListings && (
                                    <div className="flex justify-center mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={loadMore}
                                            isLoading={isLoading}
                                        >
                                            Load More
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Tab.Panel>

                        {/* Drafts panel */}
                        <Tab.Panel>
                            <div className="space-y-6 px-2">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <ListingFilters
                                        filters={filters}
                                        onFilterChange={handleFilterChange}
                                        industries={industries.map(i => ({ id: i.id, name: i.name }))}
                                        className="w-full md:w-auto mb-4 md:mb-0"
                                    />

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<RefreshCw className="h-4 w-4" />}
                                        onClick={handleRefresh}
                                    >
                                        Refresh
                                    </Button>
                                </div>

                                {/* Info message about draft listings */}
                                <div className="flex items-start p-4 border border-gray-200 bg-gray-50 rounded-lg">
                                    <Info className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-gray-700">
                                        <p className="font-medium mb-1">Draft Listings</p>
                                        <p>These listings are saved but not yet submitted for review. Users can continue editing these listings.</p>
                                    </div>
                                </div>

                                {/* Listings Table with transition */}
                                <div
                                    className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-50' : 'opacity-100'
                                        }`}
                                >
                                    <ListingTable
                                        listings={listings}
                                        isLoading={isLoading}
                                        selectedListings={selectedListings}
                                        onSelectListing={handleSelectListing}
                                        onSelectAllListings={handleSelectAllListings}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onStatusChange={handleStatusChange}
                                        onVerify={handleVerify}
                                        onFeature={handleFeatureToggle}
                                    />
                                </div>

                                {/* Load more */}
                                {hasMoreListings && (
                                    <div className="flex justify-center mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={loadMore}
                                            isLoading={isLoading}
                                        >
                                            Load More
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>

                {/* Bulk actions */}
                <ListingBulkActions
                    selectedCount={selectedListings.length}
                    onClearSelection={() => setSelectedListings([])}
                    onStatusChange={handleBulkStatusChange}
                    onDelete={handleBulkDelete}
                    onFeature={handleBulkFeature}
                    onUnfeature={handleBulkUnfeature}
                    onVerify={handleBulkVerify}
                />
            </div>
        </ErrorBoundary>
    );
}