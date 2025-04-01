// src/components/listings/ListingFilters.tsx
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';
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
  BadgeCheck,
  MapPin
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
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Track if the filter panel is open
  
  // State for location dropdowns
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  
  // Update localFilters when external filters change
  useEffect(() => {
    setLocalFilters(filters);
    setSearchTerm(filters.search || '');
  }, [filters]);
  
  // Load countries on component mount
  useEffect(() => {
    const countryList = Country.getAllCountries().map(country => ({
      value: country.isoCode,
      label: country.name
    }));
    setCountries(countryList);
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (localFilters.location?.country) {
      const stateList = State.getStatesOfCountry(localFilters.location.country).map(state => ({
        value: state.isoCode,
        label: state.name
      }));
      setStates(stateList);
    } else {
      setStates([]);
    }
  }, [localFilters.location?.country]);

  // Load cities when state changes
  useEffect(() => {
    if (localFilters.location?.country && localFilters.location?.state) {
      const cityList = City.getCitiesOfState(
        localFilters.location.country, 
        localFilters.location.state
      ).map(city => ({
        value: city.name,
        label: city.name
      }));
      setCities(cityList);
    } else {
      setCities([]);
    }
  }, [localFilters.location?.country, localFilters.location?.state]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    setSearchTerm(search);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      ...localFilters,
      search: searchTerm
    });
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
    setIsOpen(false); // Close the filter panel
  };
  
  const handleResetFilters = () => {
    const resetFilters: ListingFilters = { search: searchTerm };
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

  // Custom styles for react-select
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '36px',
      borderRadius: '0.375rem',
      borderColor: '#D1D5DB',
      fontSize: '0.875rem'
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 8px'
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '0.875rem'
    }),
    menu: (base) => ({
      ...base,
      zIndex: 60
    })
  };
  
  return (
    <div className={cn("flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4", className)}>
      {/* Search input */}
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <form onSubmit={handleSearch} className="flex w-full">
          <input
            type="text"
            placeholder="Search listings by name, description, or ID..."
            className="pl-10 pr-4 py-2 w-full form-input rounded-l-lg"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Button
            type="submit"
            className="rounded-l-none"
          >
            Search
          </Button>
        </form>
      </div>
      
      {/* Filter button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
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
        </button>
        
        {/* Fixed overlay when filter is open */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
        )}
        
        {/* Filter panel that slides in from the right */}
        <div 
          className={`fixed top-0 right-0 bottom-0 w-full sm:w-96 md:w-[450px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Location Filters */}
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Location
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Select
                    placeholder="Select Country"
                    options={countries}
                    value={countries.find(c => c.value === localFilters.location?.country) || null}
                    onChange={(option) => {
                      setLocalFilters({
                        ...localFilters,
                        location: { 
                          ...localFilters.location,
                          country: option?.value,
                          state: undefined,
                          city: undefined
                        }
                      });
                    }}
                    isClearable
                    styles={selectStyles}
                  />
                  <Select
                    placeholder="Select State"
                    options={states}
                    value={states.find(s => s.value === localFilters.location?.state) || null}
                    onChange={(option) => {
                      setLocalFilters({
                        ...localFilters,
                        location: { 
                          ...localFilters.location,
                          state: option?.value,
                          city: undefined
                        }
                      });
                    }}
                    isDisabled={!localFilters.location?.country || states.length === 0}
                    isClearable
                    styles={selectStyles}
                  />
                  <Select
                    placeholder="Select City"
                    options={cities}
                    value={cities.find(c => c.value === localFilters.location?.city) || null}
                    onChange={(option) => {
                      setLocalFilters({
                        ...localFilters,
                        location: { 
                          ...localFilters.location,
                          city: option?.value
                        }
                      });
                    }}
                    isDisabled={!localFilters.location?.state || cities.length === 0}
                    isClearable
                    styles={selectStyles}
                  />
                </div>
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
            </div>
            
            <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
              >
                Reset All
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingFiltersComponent;