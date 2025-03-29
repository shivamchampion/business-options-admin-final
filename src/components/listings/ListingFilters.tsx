import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X,
  Calendar,
  Check,
  ChevronDown, 
  Store,
  Briefcase, 
  FlaskConical, 
  Users, 
  Globe,
  Star,
  BadgeCheck
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ListingType, ListingStatus, ListingPlan, ListingFilters } from '@/types/listings';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ListingFiltersProps {
  filters: ListingFilters;
  onFilterChange: (filters: ListingFilters) => void;
  className?: string;
  industries?: Array<{id: string, name: string}>;
}

const ListingFiltersComponent: React.FC<ListingFiltersProps> = ({
  filters,
  onFilterChange,
  className,
  industries = []
}) => {
  const [localFilters, setLocalFilters] = useState<ListingFilters>(filters);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    setLocalFilters(prev => ({ ...prev, search }));
    onFilterChange({ ...filters, search });
  };
  
  const handleTypeToggle = (type: ListingType) => {
    setLocalFilters(prev => {
      const typeArray = prev.type || [];
      const newTypes = typeArray.includes(type)
        ? typeArray.filter(t => t !== type)
        : [...typeArray, type];
      
      return { ...prev, type: newTypes };
    });
  };
  
  const handleStatusToggle = (status: ListingStatus) => {
    setLocalFilters(prev => {
      const statusArray = prev.status || [];
      const newStatus = statusArray.includes(status)
        ? statusArray.filter(s => s !== status)
        : [...statusArray, status];
      
      return { ...prev, status: newStatus };
    });
  };
  
  const handleIndustryToggle = (industryId: string) => {
    setLocalFilters(prev => {
      const industriesArray = prev.industries || [];
      const newIndustries = industriesArray.includes(industryId)
        ? industriesArray.filter(i => i !== industryId)
        : [...industriesArray, industryId];
      
      return { ...prev, industries: newIndustries };
    });
  };
  
  const handleFeaturedToggle = (isFeatured: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      isFeatured: prev.isFeatured === isFeatured ? undefined : isFeatured
    }));
  };
  
  const handleVerifiedToggle = (isVerified: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      isVerified: prev.isVerified === isVerified ? undefined : isVerified
    }));
  };
  
  const handlePlanToggle = (plan: ListingPlan) => {
    setLocalFilters(prev => {
      const planArray = prev.plan || [];
      const newPlans = planArray.includes(plan)
        ? planArray.filter(p => p !== plan)
        : [...planArray, plan];
      
      return { ...prev, plan: newPlans };
    });
  };
  
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };
  
  const handleResetFilters = () => {
    const resetFilters: ListingFilters = { search: localFilters.search };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };
  
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (localFilters.type && localFilters.type.length > 0) count++;
    if (localFilters.status && localFilters.status.length > 0) count++;
    if (localFilters.industries && localFilters.industries.length > 0) count++;
    if (localFilters.plan && localFilters.plan.length > 0) count++;
    if (localFilters.isFeatured !== undefined) count++;
    if (localFilters.isVerified !== undefined) count++;
    if (localFilters.priceRange?.min || localFilters.priceRange?.max) count++;
    if (localFilters.dateRange?.from || localFilters.dateRange?.to) count++;
    if (localFilters.location?.country || localFilters.location?.state || localFilters.location?.city) count++;
    return count;
  };
  
  const availableTypes = [
    ListingType.BUSINESS,
    ListingType.FRANCHISE,
    ListingType.STARTUP,
    ListingType.INVESTOR,
    ListingType.DIGITAL_ASSET
  ];
  
  const availableStatuses = [
    ListingStatus.DRAFT,
    ListingStatus.PENDING,
    ListingStatus.PUBLISHED,
    ListingStatus.REJECTED,
    ListingStatus.ARCHIVED
  ];
  
  const availablePlans = [
    ListingPlan.FREE,
    ListingPlan.BASIC,
    ListingPlan.ADVANCED,
    ListingPlan.PREMIUM,
    ListingPlan.PLATINUM
  ];
  
  return (
    <div className={cn("flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4", className)}>
      {/* Search input */}
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search listings by name, description, or ID..."
          className="pl-10 pr-4 py-2 w-full form-input"
          value={filters.search || ''}
          onChange={handleSearchChange}
        />
      </div>
      
      {/* Filter dropdown */}
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button
          className={cn(
            "btn-outline flex items-center whitespace-nowrap",
            getActiveFilterCount() > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : ''
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {getActiveFilterCount() > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {getActiveFilterCount()}
            </span>
          )}
        </Menu.Button>
        
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-72 sm:w-96 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 origin-top-right">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Filters</h3>
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Reset all
                </button>
              </div>
              
              {/* Listing Type filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Listing Type</h4>
                <div className="grid grid-cols-2 gap-2">
                  {availableTypes.map(type => (
                    <div 
                      key={type}
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                        localFilters.type?.includes(type)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-gray-100'
                      )}
                      onClick={() => handleTypeToggle(type)}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded mr-2 flex items-center justify-center",
                        localFilters.type?.includes(type) ? 'bg-blue-500' : 'border border-gray-300'
                      )}>
                        {localFilters.type?.includes(type) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm flex items-center">
                        {type === ListingType.BUSINESS && (
                          <>
                            <Store className="h-3.5 w-3.5 text-blue-600 mr-1" />
                            Business
                          </>
                        )}
                        {type === ListingType.FRANCHISE && (
                          <>
                            <Briefcase className="h-3.5 w-3.5 text-purple-600 mr-1" />
                            Franchise
                          </>
                        )}
                        {type === ListingType.STARTUP && (
                          <>
                            <FlaskConical className="h-3.5 w-3.5 text-green-600 mr-1" />
                            Startup
                          </>
                        )}
                        {type === ListingType.INVESTOR && (
                          <>
                            <Users className="h-3.5 w-3.5 text-amber-600 mr-1" />
                            Investor
                          </>
                        )}
                        {type === ListingType.DIGITAL_ASSET && (
                          <>
                            <Globe className="h-3.5 w-3.5 text-indigo-600 mr-1" />
                            Digital Asset
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Status filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {availableStatuses.map(status => (
                    <div 
                      key={status}
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                        localFilters.status?.includes(status)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-gray-100'
                      )}
                      onClick={() => handleStatusToggle(status)}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded mr-2 flex items-center justify-center",
                        localFilters.status?.includes(status) ? 'bg-blue-500' : 'border border-gray-300'
                      )}>
                        {localFilters.status?.includes(status) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm capitalize">
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Feature & Verification filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Listing Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    className={cn(
                      "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                      localFilters.isFeatured === true
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-gray-100'
                    )}
                    onClick={() => handleFeaturedToggle(true)}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded mr-2 flex items-center justify-center",
                      localFilters.isFeatured === true ? 'bg-blue-500' : 'border border-gray-300'
                    )}>
                      {localFilters.isFeatured === true && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm flex items-center">
                      <Star className="h-3.5 w-3.5 text-amber-500 mr-1" />
                      Featured
                    </span>
                  </div>
                  <div 
                    className={cn(
                      "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                      localFilters.isVerified === true
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-gray-100'
                    )}
                    onClick={() => handleVerifiedToggle(true)}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded mr-2 flex items-center justify-center",
                      localFilters.isVerified === true ? 'bg-blue-500' : 'border border-gray-300'
                    )}>
                      {localFilters.isVerified === true && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm flex items-center">
                      <BadgeCheck className="h-3.5 w-3.5 text-green-500 mr-1" />
                      Verified
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Plan filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Subscription Plan</h4>
                <div className="grid grid-cols-2 gap-2">
                  {availablePlans.map(plan => (
                    <div 
                      key={plan}
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                        localFilters.plan?.includes(plan)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-gray-100'
                      )}
                      onClick={() => handlePlanToggle(plan)}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded mr-2 flex items-center justify-center",
                        localFilters.plan?.includes(plan) ? 'bg-blue-500' : 'border border-gray-300'
                      )}>
                        {localFilters.plan?.includes(plan) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm capitalize">
                        {plan}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Industries filter */}
              {industries.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Industries</h4>
                  <div className="max-h-40 overflow-y-auto pr-2">
                    {industries.map(industry => (
                      <div 
                        key={industry.id}
                        className={cn(
                          "flex items-center p-2 rounded-md cursor-pointer transition-colors mb-1",
                          localFilters.industries?.includes(industry.id)
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-gray-100'
                        )}
                        onClick={() => handleIndustryToggle(industry.id)}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded mr-2 flex items-center justify-center",
                          localFilters.industries?.includes(industry.id) ? 'bg-blue-500' : 'border border-gray-300'
                        )}>
                          {localFilters.industries?.includes(industry.id) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-sm">
                          {industry.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

export default ListingFiltersComponent;