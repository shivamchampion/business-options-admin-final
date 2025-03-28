import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  Check,
  ChevronDown 
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { UserStatus, UserRole, UserFilters } from '@/types/firebase';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface UserFilterProps {
  filters: UserFilters;
  onFilterChange: (filters: UserFilters) => void;
  isAdminPanel?: boolean;
  className?: string;
}

const UserFiltersComponent: React.FC<UserFilterProps> = ({
  filters,
  onFilterChange,
  isAdminPanel = true,
  className
}) => {
  const [localFilters, setLocalFilters] = useState<UserFilters>(filters);
  
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
  
  const handleRoleToggle = (role: UserRole) => {
    setLocalFilters(prev => {
      const roleArray = prev.role || [];
      const newRoles = roleArray.includes(role)
        ? roleArray.filter(r => r !== role)
        : [...roleArray, role];
      
      return { ...prev, role: newRoles };
    });
  };
  
  const handleVerifiedToggle = (isVerified: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      isVerified: prev.isVerified === isVerified ? undefined : isVerified
    }));
  };
  
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };
  
  const handleResetFilters = () => {
    const resetFilters: UserFilters = { search: localFilters.search };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };
  
  const availableStatuses = [
    UserStatus.ACTIVE,
    UserStatus.INACTIVE,
    UserStatus.PENDING,
    UserStatus.VERIFICATION_PENDING
  ];
  
  const availableRoles = isAdminPanel
    ? [UserRole.ADMIN, UserRole.ADVISOR, UserRole.MODERATOR]
    : [UserRole.USER];
  
  return (
    <div className={cn("flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4", className)}>
      {/* Search input */}
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search users by name or email..."
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
            (filters.status?.length || filters.role?.length || filters.isVerified !== undefined)
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : ''
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {(filters.status?.length || filters.role?.length || filters.isVerified !== undefined) && (
            <span className="ml-2 bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {(filters.status?.length || 0) + (filters.role?.length || 0) + (filters.isVerified !== undefined ? 1 : 0)}
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
              
              {/* Role filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Role</h4>
                <div className="grid grid-cols-2 gap-2">
                  {availableRoles.map(role => (
                    <div 
                      key={role}
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                        localFilters.role?.includes(role)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-gray-100'
                      )}
                      onClick={() => handleRoleToggle(role)}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded mr-2 flex items-center justify-center",
                        localFilters.role?.includes(role) ? 'bg-blue-500' : 'border border-gray-300'
                      )}>
                        {localFilters.role?.includes(role) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm capitalize">
                        {role.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
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

export default UserFiltersComponent;