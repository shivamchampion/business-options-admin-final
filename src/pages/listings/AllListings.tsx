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
        { name: "All Listings", count: listings.length },
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
        if (isAuthenticated && !authLoading && auth.currentUser && !isLoading) {
            // Only load if this tab hasn't been initialized yet
            if (!initializedTabs[selectedTab]) {
                loadListingsByTab(true);
                
                // Mark this tab as initialized
                setInitializedTabs(prev => ({
                    ...prev,
                    [selectedTab]: true
                }));
            }
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

    const loadListingsByTab = async (reset = true) => {
        try {
            // Use local loading state only, not the global one
            setIsLoading(true);
    
            let result;
    
            // Apply tab-specific filters
            const tabFilters = { ...filters };
    
            console.log('Loading listings for tab:', selectedTab);
            console.log('Current user ID:', user?.id);
    
            if (selectedTab === 1) {
                // Pending tab
                console.log('Loading PENDING listings');
                result = await getListingsByStatus(
                    ListingStatus.PENDING,
                    10,
                    reset ? null : lastDoc,
                    user?.id
                );
            } else if (selectedTab === 2) {
                // Featured tab
                console.log('Loading FEATURED listings');
                tabFilters.isFeatured = true;
                result = await getListings(
                    10,
                    reset ? null : lastDoc,
                    tabFilters,
                    user?.id
                );
            } else if (selectedTab === 3) {
                // Drafts tab
                console.log('Loading DRAFT listings');
                result = await getListingsByStatus(
                    ListingStatus.DRAFT,
                    10,
                    reset ? null : lastDoc,
                    user?.id
                );
            } else {
                // All listings tab (default)
                console.log('Loading ALL listings');
                // Add all status types to ensure we get everything
                tabFilters.status = [
                    ListingStatus.PUBLISHED,
                    ListingStatus.PENDING,
                    ListingStatus.DRAFT
                ];
                
                // Add ownerId filter to get only the user's listings
                tabFilters.ownerId = user?.id;
                
                console.log('All tab filters:', tabFilters);
                
                result = await getListings(
                    10,
                    reset ? null : lastDoc,
                    tabFilters,
                    user?.id
                );
            }
    
            console.log('Listings loaded:', result.listings.length);
            
            setListings(prev => reset ? result.listings : [...prev, ...result.listings]);
            setLastDoc(result.lastDoc);
            setHasMoreListings(result.listings.length === 10);
            
            // Update tab counts after loading listings
            if (reset) {
                // Update the "All" tab count with the total number of listings
                tabLabels[0].count = result.listings.length;
            }
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
        }
    };

    // Effect to reload when filters change
    useEffect(() => {
        if (isAuthenticated && !authLoading && auth.currentUser && initializedTabs[selectedTab] && !isLoading) {
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
            // Use local loading state only
            setIsLoading(true);

            await updateListingStatus(listingId, status);

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    listing.id === listingId ? { ...listing, status } : listing
                )
            );

            toast.success(`Listing status updated to ${status}`);
        } catch (error) {
            console.error('Error updating listing status:', error);
            toast.error('Failed to update listing status');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle editing (will be implemented later)
    const handleEdit = (listing: Listing) => {
        // Navigate to edit page or open edit modal
        console.log('Edit listing:', listing);
        toast.success('Listing edit functionality coming soon');
    };

    // Handle feature toggle
    const handleFeatureToggle = async (listingId: string, isFeatured: boolean) => {
        try {
            // Use local loading state only
            setIsLoading(true);

            await toggleListingFeature(listingId, isFeatured);

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    listing.id === listingId ? { ...listing, isFeatured } : listing
                )
            );

            toast.success(`Listing ${isFeatured ? 'featured' : 'unfeatured'} successfully`);
        } catch (error) {
            console.error('Error toggling listing feature:', error);
            toast.error('Failed to update listing feature status');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle verify
    const handleVerify = async (listingId: string) => {
        try {
            // Use local loading state only
            setIsLoading(true);

            await verifyListing(listingId);

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    listing.id === listingId ? { ...listing, isVerified: true } : listing
                )
            );

            toast.success('Listing verified successfully');
        } catch (error) {
            console.error('Error verifying listing:', error);
            toast.error('Failed to verify listing');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (listingId: string) => {
        try {
            // Use local loading state only
            setIsLoading(true);

            await deleteListing(listingId);

            // Update local state
            setListings(prev => prev.filter(listing => listing.id !== listingId));

            toast.success('Listing deleted successfully');
        } catch (error) {
            console.error('Error deleting listing:', error);
            toast.error('Failed to delete listing');
        } finally {
            setIsLoading(false);
        }
    };

    // Bulk actions
    const handleBulkStatusChange = async (status: ListingStatus) => {
        if (selectedListings.length === 0) {
            toast.error('No listings selected');
            return;
        }

        try {
            // Use local loading state only
            setIsLoading(true);

            // Update each listing status
            const updatePromises = selectedListings.map(listingId =>
                updateListingStatus(listingId, status)
            );

            await Promise.all(updatePromises);

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    selectedListings.includes(listing.id) ? { ...listing, status } : listing
                )
            );

            // Clear selection
            setSelectedListings([]);

            toast.success(`Updated ${selectedListings.length} listings to ${status}`);
        } catch (error) {
            console.error('Error updating bulk listing status:', error);
            toast.error('Failed to update some listings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedListings.length === 0) {
            toast.error('No listings selected');
            return;
        }

        try {
            // Use local loading state only
            setIsLoading(true);

            // Delete each listing
            const deletePromises = selectedListings.map(listingId =>
                deleteListing(listingId)
            );

            await Promise.all(deletePromises);

            // Update local state
            setListings(prev => prev.filter(listing => !selectedListings.includes(listing.id)));

            // Clear selection
            setSelectedListings([]);

            toast.success(`Deleted ${selectedListings.length} listings`);
        } catch (error) {
            console.error('Error deleting bulk listings:', error);
            toast.error('Failed to delete some listings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkFeature = async () => {
        if (selectedListings.length === 0) {
            toast.error('No listings selected');
            return;
        }

        try {
            // Use local loading state only
            setIsLoading(true);

            // Feature each listing
            const featurePromises = selectedListings.map(listingId =>
                toggleListingFeature(listingId, true)
            );

            await Promise.all(featurePromises);

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    selectedListings.includes(listing.id) ? { ...listing, isFeatured: true } : listing
                )
            );

            // Clear selection
            setSelectedListings([]);

            toast.success(`Featured ${selectedListings.length} listings`);
        } catch (error) {
            console.error('Error featuring bulk listings:', error);
            toast.error('Failed to feature some listings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkUnfeature = async () => {
        if (selectedListings.length === 0) {
            toast.error('No listings selected');
            return;
        }

        try {
            // Use local loading state only
            setIsLoading(true);

            // Unfeature each listing
            const unfeaturePromises = selectedListings.map(listingId =>
                toggleListingFeature(listingId, false)
            );

            await Promise.all(unfeaturePromises);

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    selectedListings.includes(listing.id) ? { ...listing, isFeatured: false } : listing
                )
            );

            // Clear selection
            setSelectedListings([]);

            toast.success(`Unfeatured ${selectedListings.length} listings`);
        } catch (error) {
            console.error('Error unfeaturing bulk listings:', error);
            toast.error('Failed to unfeature some listings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkVerify = async () => {
        if (selectedListings.length === 0) {
            toast.error('No listings selected');
            return;
        }

        try {
            // Use local loading state only
            setIsLoading(true);

            // Verify each listing
            const verifyPromises = selectedListings.map(listingId =>
                verifyListing(listingId)
            );

            await Promise.all(verifyPromises);

            // Update local state
            setListings(prev =>
                prev.map(listing =>
                    selectedListings.includes(listing.id) ? { ...listing, isVerified: true } : listing
                )
            );

            // Clear selection
            setSelectedListings([]);

            toast.success(`Verified ${selectedListings.length} listings`);
        } catch (error) {
            console.error('Error verifying bulk listings:', error);
            toast.error('Failed to verify some listings');
        } finally {
            setIsLoading(false);
        }
    };

    // Display loading state during auth
    if (authLoading) {
        return null; // Let the root component handle loading
    }

    // Add check for auth.currentUser to display waiting state
    if (isAuthenticated && !auth.currentUser) {
        return null; // Let the root component handle loading
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