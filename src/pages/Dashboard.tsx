import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowUp, 
  ArrowDown, 
  Users, 
  Store, 
  Zap, 
  DollarSign, 
  Plus, 
  Eye as EyeIcon,
  Pencil as PencilIcon,
  Trash as TrashIcon,
  Loader
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ToastManager, { TOAST_IDS } from '@/utils/ToastManager';
import ToastTest from '@/components/ToastTest';

// Import Firebase services
import { getRecentListings, updateListingStatus, deleteListing } from '@/services/listingService';
import { getAdminPanelUsers, getWebsiteUsers } from '@/services/userService';
import { Listing, ListingStatus } from '@/types/listings';
import { UserDetails } from '@/types/firebase';

// Dashboard stats interface
interface DashboardStat {
  title: string;
  value: string;
  change: string;
  increasing: boolean;
  icon: JSX.Element;
  color: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  
  // State for animations
  const [isLoaded, setIsLoaded] = useState(false);
  
  // State for actual data
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserDetails[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  
  // Loading states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  
  // Animation on initial load
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Fetch dashboard stats data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        
        // Fetch total user counts - focus on website users
        const { users: adminUsers } = await getAdminPanelUsers(100); // Get up to 100 admin users
        const { users: websiteUsers } = await getWebsiteUsers(1000); // Get up to 1000 website users
        
        const totalUsers = websiteUsers.length; // Only count website users
        
        // Calculate basic stats for now - these would be replaced with actual API calls
        // that compute true stats from the database in a production environment
        const statsData: DashboardStat[] = [
          {
            title: "Total Users",
            value: totalUsers.toLocaleString(),
            change: "+14.5%", // In the future, this would be calculated
            increasing: true,
            icon: <Users className="h-5 w-5" />,
            color: "bg-blue-50 text-blue-700",
          },
          {
            title: "Active Listings",
            value: "1,247", // This would come from an API that counts active listings
            change: "+5.2%",
            increasing: true,
            icon: <Store className="h-5 w-5" />,
            color: "bg-purple-50 text-purple-700",
          },
          {
            title: "Insta Apply",
            value: "78", // This would come from a specific service call
            change: "-2.5%",
            increasing: false,
            icon: <Zap className="h-5 w-5" />,
            color: "bg-amber-50 text-amber-700",
          },
          {
            title: "Total Revenue",
            value: "₹48,395", // This would come from a revenue service
            change: "+18.2%",
            increasing: true,
            icon: <DollarSign className="h-5 w-5" />,
            color: "bg-green-50 text-green-700",
          },
        ];
        
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching stats:", error);
        ToastManager.error("Failed to load dashboard statistics", TOAST_IDS.GENERIC_ERROR);
      } finally {
        setLoadingStats(false);
      }
    };
    
    fetchStats();
  }, []);

  // Fetch recent users
  useEffect(() => {
    const fetchRecentUsers = async () => {
      try {
        setLoadingUsers(true);
        
        // Get most recent website users (role: 'user')
        const { users } = await getWebsiteUsers(3, null, { 
          // Sort by most recent
        });
        
        setRecentUsers(users);
      } catch (error) {
        console.error("Error fetching recent users:", error);
        ToastManager.error("Failed to load recent users", TOAST_IDS.GENERIC_ERROR);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchRecentUsers();
  }, []);

  // Fetch recent listings
  useEffect(() => {
    const fetchRecentListings = async () => {
      try {
        setLoadingListings(true);
        
        // Get most recent listings
        const listings = await getRecentListings(3);
        
        setRecentListings(listings);
      } catch (error) {
        console.error("Error fetching recent listings:", error);
        ToastManager.error("Failed to load recent listings", TOAST_IDS.GENERIC_ERROR);
      } finally {
        setLoadingListings(false);
      }
    };
    
    fetchRecentListings();
  }, []);

  // Format date string from timestamp
  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'N/A';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60); // diff in minutes
    
    if (diff < 60) return `${diff} min${diff !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diff / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  // Handle creating a new listing
  const handleCreateListing = () => {
    navigate('/listings/create');
  };

  // Handle adding a new user
  const handleAddUser = () => {
    // Navigate to users page with a query parameter to trigger the form
    navigate('/users?action=create');
  };

  // Handle view user details
  const handleViewUser = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  // Handle edit user
  const handleEditUser = (userId: string) => {
    navigate(`/users/${userId}/edit`);
  };

  // Handle view listing details
  const handleViewListing = (listingId: string) => {
    navigate(`/listings/${listingId}`);
  };

  // Handle edit listing
  const handleEditListing = (listingId: string) => {
    navigate(`/listings/${listingId}/edit`);
  };

  // Handle delete listing
  const handleDeleteListing = async (listingId: string) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        await deleteListing(listingId);
        ToastManager.success('Listing deleted successfully');
        
        // Remove the deleted listing from state
        setRecentListings(prev => prev.filter(listing => listing.id !== listingId));
      } catch (error) {
        console.error('Error deleting listing:', error);
        ToastManager.error('Failed to delete listing');
      }
    }
  };

  return (
    <div className={cn(
      "p-2 md:p-8 transition-opacity duration-500",
      isLoaded ? "opacity-100" : "opacity-0"
    )}>
      {/* Add ToastTest component at the top for testing */}
      <div className="mb-8 border rounded-lg bg-white shadow-sm">
        <ToastTest />
      </div>
      
      {/* Regular dashboard content */}
      <div className={`space-y-6 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Welcome to the Business Options Platform admin panel.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button 
              className="btn-primary flex items-center"
              onClick={handleCreateListing}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Listing
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {loadingStats ? (
            // Show skeleton loaders when loading
            Array(4).fill(0).map((_, index) => (
              <div 
                key={`skeleton-${index}`} 
                className="card border border-gray-100 animate-pulse"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex items-center mt-2">
                  <div className="rounded-md p-3 mr-4 bg-gray-200 h-10 w-10"></div>
                  <div>
                    <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    <div className="h-3 w-32 bg-gray-200 rounded mt-1"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            stats.map((stat, index) => (
              <div 
                key={stat.title} 
                className="card border border-gray-100 hover:border-gray-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500 uppercase">{stat.title}</h3>
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    stat.increasing ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}>
                    {stat.increasing ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                    {stat.change}
                  </span>
                </div>
                <div className="flex items-center mt-2">
                  <div className={`rounded-md p-3 mr-4 ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1">Compared to previous month</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Recent Users Table */}
        <div className="card border border-gray-100 animate-slide-in" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Recent User Registrations</h3>
              <p className="text-sm text-gray-500">Latest user sign-ups on the platform</p>
            </div>
            <button 
              className="btn-secondary flex items-center text-sm mt-4 sm:mt-0"
              onClick={handleAddUser}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>
          
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingUsers ? (
                  // Show skeleton loaders for users
                  Array(3).fill(0).map((_, index) => (
                    <tr key={`user-skeleton-${index}`} className="animate-pulse">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div className="ml-4">
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            <div className="h-3 w-40 bg-gray-200 rounded mt-1"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : recentUsers.length > 0 ? (
                  recentUsers.map((user, index) => (
                    <tr key={user.id} className="table-row-hover" style={{ animationDelay: `${index * 100 + 300}ms` }}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-700 text-white flex items-center justify-center rounded-full">
                            {user.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "badge",
                          user.status === 'active' ? "badge-success" : "badge-warning"
                        )}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button 
                            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                            onClick={() => handleViewUser(user.id)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-primary-700 hover:text-primary-900 transition-colors duration-200"
                            onClick={() => handleEditUser(user.id)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 sm:px-6 py-4 text-center text-sm text-gray-500">
                      No recent users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <Link 
              to="/users"
              className="text-sm font-medium text-primary-700 hover:text-primary-600 transition-colors duration-200 flex items-center"
            >
              View All Users 
              <svg className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
        
        {/* Recent Listings Table */}
        <div className="card border border-gray-100 animate-slide-in" style={{ animationDelay: '400ms' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Recent Listings</h3>
              <p className="text-sm text-gray-500">Latest business listings added to the platform</p>
            </div>
            <button 
              className="btn-secondary flex items-center text-sm mt-4 sm:mt-0"
              onClick={handleCreateListing}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Listing
            </button>
          </div>
          
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingListings ? (
                  // Show skeleton loaders for listings
                  Array(3).fill(0).map((_, index) => (
                    <tr key={`listing-skeleton-${index}`} className="animate-pulse">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-40 bg-gray-200 rounded"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded mt-1"></div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : recentListings.length > 0 ? (
                  recentListings.map((listing, index) => (
                    <tr key={listing.id} className="table-row-hover" style={{ animationDelay: `${index * 100 + 500}ms` }}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                        <div className="text-sm text-gray-500">{listing.ownerName}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="badge badge-primary">
                          {listing.type.charAt(0).toUpperCase() + listing.type.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "badge",
                          listing.status === ListingStatus.PUBLISHED ? "badge-success" : "badge-warning"
                        )}>
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button 
                            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                            onClick={() => handleViewListing(listing.id)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-primary-700 hover:text-primary-900 transition-colors duration-200"
                            onClick={() => handleEditListing(listing.id)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-red-500 hover:text-red-700 transition-colors duration-200"
                            onClick={() => handleDeleteListing(listing.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 sm:px-6 py-4 text-center text-sm text-gray-500">
                      No recent listings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <Link 
              to="/listings" 
              className="text-sm font-medium text-primary-700 hover:text-primary-600 transition-colors duration-200 flex items-center group"
            >
              View All Listings
              <svg className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}