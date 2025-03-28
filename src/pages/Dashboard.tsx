import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Trash as TrashIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for dashboard stats
const stats = [
  {
    title: "Total Users",
    value: "2,845",
    change: "+14.5%",
    increasing: true,
    icon: <Users className="h-5 w-5" />,
    color: "bg-blue-50 text-blue-700",
  },
  {
    title: "Active Listings",
    value: "1,247",
    change: "+5.2%",
    increasing: true,
    icon: <Store className="h-5 w-5" />,
    color: "bg-purple-50 text-purple-700",
  },
  {
    title: "Insta Apply",
    value: "78",
    change: "-2.5%",
    increasing: false,
    icon: <Zap className="h-5 w-5" />,
    color: "bg-amber-50 text-amber-700",
  },
  {
    title: "Total Revenue",
    value: "₹48,395",
    change: "+18.2%",
    increasing: true,
    icon: <DollarSign className="h-5 w-5" />,
    color: "bg-green-50 text-green-700",
  },
];

// Mock data for recent users
const recentUsers = [
  { id: 1, avatar: null, name: 'John Doe', email: 'john.doe@example.com', date: '2 hours ago', status: 'Active' },
  { id: 2, avatar: null, name: 'Jane Smith', email: 'jane.smith@example.com', date: '5 hours ago', status: 'Active' },
  { id: 3, avatar: null, name: 'Robert Johnson', email: 'robert.j@example.com', date: '1 day ago', status: 'Pending' },
];

// Mock data for recent listings
const recentListings = [
  { id: 1, name: 'Coffee Shop in Mumbai', type: 'Business', owner: 'Priya Sharma', date: '3 hours ago', status: 'Pending' },
  { id: 2, name: 'Tech Startup - AI Solutions', type: 'Startup', owner: 'Vikram Singh', date: '1 day ago', status: 'Published' },
  { id: 3, name: 'Food Franchise Opportunity', type: 'Franchise', owner: 'Anand Patel', date: '2 days ago', status: 'Pending' },
];

export default function Dashboard() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Animation on initial load
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`space-y-6 ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome to the Business Options Platform admin panel.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Create New Listing
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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
        ))}
      </div>
      
      {/* Recent Users Table */}
      <div className="card border border-gray-100 animate-slide-in" style={{ animationDelay: '200ms' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Recent User Registrations</h3>
            <p className="text-sm text-gray-500">Latest user sign-ups on the platform</p>
          </div>
          <button className="btn-secondary flex items-center text-sm mt-4 sm:mt-0">
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
              {recentUsers.map((user, index) => (
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
                    {user.date}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "badge",
                      user.status === 'Active' ? "badge-success" : "badge-warning"
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      <button className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-primary-700 hover:text-primary-900 transition-colors duration-200">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
          <button className="btn-secondary flex items-center text-sm mt-4 sm:mt-0">
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
              {recentListings.map((listing, index) => (
                <tr key={listing.id} className="table-row-hover" style={{ animationDelay: `${index * 100 + 500}ms` }}>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                    <div className="text-sm text-gray-500">{listing.owner}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className="badge badge-primary">
                      {listing.type}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "badge",
                      listing.status === 'Published' ? "badge-success" : "badge-warning"
                    )}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      <button className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-primary-700 hover:text-primary-900 transition-colors duration-200">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-500 hover:text-red-700 transition-colors duration-200">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
  );
}