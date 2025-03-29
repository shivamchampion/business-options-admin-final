import React from 'react';
import { 
  Edit, 
  Trash, 
  Eye, 
  Star, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  XCircle,
  FileArchive,
  Store,
  Briefcase,
  FlaskConical,
  Users,
  Globe,
  MoreVertical,
  BadgeCheck
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Listing, ListingStatus, ListingType } from '@/types/listings';
import { formatDate, formatCurrency, formatListingId } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';

interface ListingTableProps {
  listings: Listing[];
  isLoading: boolean;
  selectedListings: string[];
  onSelectListing: (listingId: string, isSelected: boolean) => void;
  onSelectAllListings: (isSelected: boolean) => void;
  onEdit: (listing: Listing) => void;
  onDelete: (listingId: string) => void;
  onStatusChange: (listingId: string, status: ListingStatus) => void;
  onVerify?: (listingId: string) => void;
  onFeature?: (listingId: string, isFeatured: boolean) => void;
  showOwner?: boolean;
}

const ListingTable: React.FC<ListingTableProps> = ({
  listings,
  isLoading,
  selectedListings,
  onSelectListing,
  onSelectAllListings,
  onEdit,
  onDelete,
  onStatusChange,
  onVerify,
  onFeature,
  showOwner = true
}) => {
  const allSelected = listings.length > 0 && selectedListings.length === listings.length;
  
  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
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
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      case ListingStatus.ARCHIVED:
        return (
          <span className="badge bg-gray-100 text-gray-600 flex items-center">
            <FileArchive className="h-3 w-3 mr-1" />
            Archived
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };
  
  const getTypeIcon = (type: ListingType) => {
    switch (type) {
      case ListingType.BUSINESS:
        return <Store className="h-4 w-4 text-blue-600" />;
      case ListingType.FRANCHISE:
        return <Briefcase className="h-4 w-4 text-purple-600" />;
      case ListingType.STARTUP:
        return <FlaskConical className="h-4 w-4 text-green-600" />;
      case ListingType.INVESTOR:
        return <Users className="h-4 w-4 text-amber-600" />;
      case ListingType.DIGITAL_ASSET:
        return <Globe className="h-4 w-4 text-indigo-600" />;
      default:
        return <Store className="h-4 w-4 text-gray-600" />;
    }
  };
  
  const getTypeBadge = (type: ListingType) => {
    switch (type) {
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
        return <span className="badge">{type}</span>;
    }
  };
  
  const getListingPrice = (listing: Listing): string => {
    try {
      switch (listing.type) {
        case ListingType.BUSINESS:
          if (listing.businessDetails?.sale.askingPrice.value) {
            return formatCurrency(listing.businessDetails.sale.askingPrice.value);
          }
          break;
        case ListingType.FRANCHISE:
          if (listing.franchiseDetails?.investment.totalInitialInvestment.value) {
            return formatCurrency(listing.franchiseDetails.investment.totalInitialInvestment.value);
          }
          break;
        case ListingType.STARTUP:
          if (listing.startupDetails?.funding.currentRaisingAmount.value) {
            return formatCurrency(listing.startupDetails.funding.currentRaisingAmount.value);
          }
          break;
        case ListingType.INVESTOR:
          return "N/A"; // Investors don't have a price
        case ListingType.DIGITAL_ASSET:
          if (listing.digitalAssetDetails?.sale.askingPrice.value) {
            return formatCurrency(listing.digitalAssetDetails.sale.askingPrice.value);
          }
          break;
      }
      return "N/A";
    } catch (error) {
      return "N/A";
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="lg" text="Loading listings..." />
      </div>
    );
  }
  
  if (listings.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
        <h3 className="text-lg font-medium text-gray-500 mb-2">No listings found</h3>
        <p className="text-gray-400">Try adjusting your filters or add new listings</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto -mx-6 sm:mx-0 relative">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={allSelected}
                  onChange={(e) => onSelectAllListings(e.target.checked)}
                />
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Listing
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            {showOwner && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
            )}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {listings.map((listing) => (
            <tr key={listing.id} className="table-row-hover">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={selectedListings.includes(listing.id)}
                    onChange={(e) => onSelectListing(listing.id, e.target.checked)}
                  />
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 relative">
                    {listing.media.featuredImage ? (
                      <img
                        className="h-10 w-10 rounded-md object-cover"
                        src={listing.media.featuredImage.url}
                        alt={listing.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                        {getTypeIcon(listing.type as ListingType)}
                      </div>
                    )}
                    {listing.isFeatured && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-400 rounded-full flex items-center justify-center">
                        <Star className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {listing.isVerified && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                        <BadgeCheck className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                    <div className="text-xs text-gray-500">{formatListingId(listing.type, listing.id)}</div>
                    {listing.location && (
                      <div className="text-xs text-gray-500 mt-1">
                        {[listing.location.city, listing.location.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getTypeBadge(listing.type as ListingType)}
              </td>
              {showOwner && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{listing.ownerName}</div>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{getListingPrice(listing)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(listing.status as ListingStatus)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(listing.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex items-center justify-center space-x-1">
                  {/* View button */}
                  <Link
                    to={`/listings/${listing.id}`}
                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  
                  {/* Edit button */}
                  <button
                    onClick={() => onEdit(listing)}
                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit listing"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  {/* More actions dropdown */}
                  <Menu as="div" className="relative inline-block text-left">
                    <div>
                      <Menu.Button className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                        <span className="sr-only">Open actions menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          {/* Status change options */}
                          <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                            Change Status
                          </div>
                          {Object.values(ListingStatus).map((status) => (
                            <Menu.Item key={status}>
                              {({ active }) => (
                                <button
                                  onClick={() => onStatusChange(listing.id, status as ListingStatus)}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm ${
                                    listing.status === status ? 'font-medium text-blue-600' : ''
                                  }`}
                                  disabled={listing.status === status}
                                >
                                  {status === ListingStatus.PUBLISHED && (
                                    <CheckCircle className="mr-3 h-4 w-4 text-green-500" />
                                  )}
                                  {status === ListingStatus.PENDING && (
                                    <Clock className="mr-3 h-4 w-4 text-amber-500" />
                                  )}
                                  {status === ListingStatus.DRAFT && (
                                    <Clock className="mr-3 h-4 w-4 text-gray-500" />
                                  )}
                                  {status === ListingStatus.REJECTED && (
                                    <XCircle className="mr-3 h-4 w-4 text-red-500" />
                                  )}
                                  {status === ListingStatus.ARCHIVED && (
                                    <FileArchive className="mr-3 h-4 w-4 text-gray-500" />
                                  )}
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                              )}
                            </Menu.Item>
                          ))}
                          
                          <div className="border-t border-gray-100 my-1"></div>
                          
                          {/* Verification action */}
                          {onVerify && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onVerify(listing.id)}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm ${
                                    listing.isVerified ? 'font-medium text-green-600' : ''
                                  }`}
                                  disabled={listing.isVerified}
                                >
                                  <BadgeCheck className="mr-3 h-4 w-4 text-green-500" />
                                  {listing.isVerified ? 'Verified' : 'Mark as Verified'}
                                </button>
                              )}
                            </Menu.Item>
                          )}
                          
                          {/* Feature/Unfeature action */}
                          {onFeature && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onFeature(listing.id, !listing.isFeatured)}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full items-center px-4 py-2 text-sm`}
                                >
                                  <Star className={`mr-3 h-4 w-4 ${listing.isFeatured ? 'text-amber-500' : 'text-gray-400'}`} />
                                  {listing.isFeatured ? 'Remove Featured' : 'Mark as Featured'}
                                </button>
                              )}
                            </Menu.Item>
                          )}
                          
                          <div className="border-t border-gray-100 my-1"></div>
                          
                          {/* Delete action */}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => onDelete(listing.id)}
                                className={`${
                                  active ? 'bg-red-50 text-red-700' : 'text-red-600'
                                } flex w-full items-center px-4 py-2 text-sm`}
                              >
                                <Trash className="mr-3 h-4 w-4 text-red-500" />
                                Delete Listing
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListingTable;