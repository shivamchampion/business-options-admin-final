// src/components/advisors/AdvisorFilters.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Check,
  ChevronDown,
  MapPin,
  Tag,
  Percent,
  DollarSign,
  Flag
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { UserStatus, AdvisorFilters, CommissionTier } from '@/types/firebase';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Country, State, City } from 'country-state-city';

interface AdvisorFilterProps {
  filters: AdvisorFilters;
  onFilterChange: (filters: AdvisorFilters) => void;
  className?: string;
}

const AdvisorFiltersComponent: React.FC<AdvisorFilterProps> = ({
  filters,
  onFilterChange,
  className
}) => {
  const [localFilters, setLocalFilters] = useState<AdvisorFilters>(filters);
  const [countries, setCountries] = useState<any[]>([]);
  
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    setLocalFilters(prev => ({ ...prev, search }));
    onFilterChange({ ...filters, search });
  };
  
  const handleStatusToggle = (status: UserStatus) => {
    setLocalFilters(prev => {
      const statusArray = prev.status || [];
      const newStatus = statusArray.includes(status)
        ? statusArray.filter(s => s !== status)
        : [...statusArray, status];
      
      return { ...prev, status: newStatus };
    });
  };
  
  const handleCommissionTierToggle = (tier: CommissionTier) => {
    setLocalFilters(prev => {
      const tierArray = prev.commissionTier || [];
      const newTiers = tierArray.includes(tier)
        ? tierArray.filter(t => t !== tier)
        : [...tierArray, tier];
      
      return { ...prev, commissionTier: newTiers };
    });
  };
  
  const handleVerifiedToggle = (isVerified: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      isVerified: prev.isVerified === isVerified ? undefined : isVerified
    }));
  };
  
  const handleCountryToggle = (countryCode: string) => {
    setLocalFilters(prev => {
      const countryArray = prev.country || [];
      const newCountries = countryArray.includes(countryCode)
        ? countryArray.filter(c => c !== countryCode)
        : [...countryArray, countryCode];
      
      return { ...prev, country: newCountries };
    });
  };

  const handleCurrencyToggle = (currency: string) => {
    setLocalFilters(prev => ({
      ...prev,
      currency: prev.currency === currency ? undefined : currency
    }));
  };

  const handleCommissionRateChange = (min?: number, max?: number) => {
    setLocalFilters(prev => ({
      ...prev,
      minCommissionRate: min !== undefined ? min : prev.minCommissionRate,
      maxCommissionRate: max !== undefined ? max : prev.maxCommissionRate
    }));
  };
  
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };
  
  const handleResetFilters = () => {
    const resetFilters: AdvisorFilters = { search: localFilters.search };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };
  
  const availableStatuses = [
    UserStatus.ACTIVE,
    UserStatus.INACTIVE,
    UserStatus.PENDING,
    UserStatus.VERIFICATION_PENDING
  ];
  
  const availableTiers = [
    CommissionTier.BRONZE,
    CommissionTier.SILVER,
    CommissionTier.GOLD,
    CommissionTier.PLATINUM
  ];
  
  // Popular countries
  const popularCountries = [
    'US', 'IN', 'GB', 'CA', 'AU', 'SG', 'AE', 'JP'
  ];
  
  const getSelectedFiltersCount = () => {
    let count = 0;
    if (localFilters.status?.length) count += localFilters.status.length;
    if (localFilters.commissionTier?.length) count += localFilters.commissionTier.length;
    if (localFilters.country?.length) count += localFilters.country.length;
    if (localFilters.isVerified !== undefined) count += 1;
    if (localFilters.currency !== undefined) count += 1;
    if (localFilters.minCommissionRate !== undefined || localFilters.maxCommissionRate !== undefined) count += 1;
    return count;
  };
  
  return (
    <div className={cn("flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4", className)}>
      {/* Search input */}
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search advisors by name, email, or location..."
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
            getSelectedFiltersCount() > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : ''
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {getSelectedFiltersCount() > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {getSelectedFiltersCount()}
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
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Commission Tier filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Tag className="h-4 w-4 mr-1 text-gray-500" />
                  Commission Tier
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {availableTiers.map(tier => (
                    <div 
                      key={tier}
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                        localFilters.commissionTier?.includes(tier)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-gray-100'
                      )}
                      onClick={() => handleCommissionTierToggle(tier)}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded mr-2 flex items-center justify-center",
                        localFilters.commissionTier?.includes(tier) ? 'bg-blue-500' : 'border border-gray-300'
                      )}>
                        {localFilters.commissionTier?.includes(tier) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm capitalize">
                        {tier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Country filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Flag className="h-4 w-4 mr-1 text-gray-500" />
                  Country
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {popularCountries.map(countryCode => {
                    const countryObj = Country.getCountryByCode(countryCode);
                    if (!countryObj) return null;
                    
                    return (
                      <div 
                        key={countryCode}
                        className={cn(
                          "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                          localFilters.country?.includes(countryCode)
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-gray-100'
                        )}
                        onClick={() => handleCountryToggle(countryCode)}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded mr-2 flex items-center justify-center",
                          localFilters.country?.includes(countryCode) ? 'bg-blue-500' : 'border border-gray-300'
                        )}>
                          {localFilters.country?.includes(countryCode) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-sm">
                          {countryObj.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Currency filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                  Currency
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    className={cn(
                      "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                      localFilters.currency === 'USD'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-gray-100'
                    )}
                    onClick={() => handleCurrencyToggle('USD')}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded mr-2 flex items-center justify-center",
                      localFilters.currency === 'USD' ? 'bg-blue-500' : 'border border-gray-300'
                    )}>
                      {localFilters.currency === 'USD' && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" /> USD
                    </span>
                  </div>
                  <div 
                    className={cn(
                      "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                      localFilters.currency === 'INR'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-gray-100'
                    )}
                    onClick={() => handleCurrencyToggle('INR')}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded mr-2 flex items-center justify-center",
                      localFilters.currency === 'INR' ? 'bg-blue-500' : 'border border-gray-300'
                    )}>
                      {localFilters.currency === 'INR' && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm flex items-center">
                      <span className="mr-1">₹</span> INR
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Commission Rate Range */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Percent className="h-4 w-4 mr-1 text-gray-500" />
                  Commission Rate (%)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Minimum</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Min %"
                      className="w-full form-input py-1 px-2 text-sm"
                      value={localFilters.minCommissionRate || ''}
                      onChange={(e) => handleCommissionRateChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                        localFilters.maxCommissionRate
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Maximum</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Max %"
                      className="w-full form-input py-1 px-2 text-sm"
                      value={localFilters.maxCommissionRate || ''}
                      onChange={(e) => handleCommissionRateChange(
                        localFilters.minCommissionRate,
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {/* Verification status */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Email Verification</h4>
                <div className="grid grid-cols-2 gap-2">
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
                    <span className="text-sm">Verified</span>
                  </div>
                  <div 
                    className={cn(
                      "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                      localFilters.isVerified === false
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-gray-100'
                    )}
                    onClick={() => handleVerifiedToggle(false)}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded mr-2 flex items-center justify-center",
                      localFilters.isVerified === false ? 'bg-blue-500' : 'border border-gray-300'
                    )}>
                      {localFilters.isVerified === false && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm">Not Verified</span>
                  </div>
                </div>
              </div>
              
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

export default AdvisorFiltersComponent;