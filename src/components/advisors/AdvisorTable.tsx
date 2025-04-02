// src/components/advisors/AdvisorTable.tsx
import React from 'react';
import { 
  Edit, 
  Trash, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  UserCheck,
  UserX,
  Key,
  Tag,
  MapPin,
  Percent,
  DollarSign
} from 'lucide-react';
import { UserDetails, UserStatus, CommissionTier } from '@/types/firebase';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdvisorTableProps {
  advisors: UserDetails[];
  isLoading: boolean;
  selectedAdvisors: string[];
  onSelectAdvisor: (advisorId: string, isSelected: boolean) => void;
  onSelectAllAdvisors: (isSelected: boolean) => void;
  onEdit: (advisor: UserDetails) => void;
  onDelete: (advisorId: string) => void;
  onStatusChange: (advisorId: string, status: UserStatus) => void;
  onViewCredentials: (advisorId: string) => void;
  onViewVerificationCode?: (advisorId: string) => void;
}

// Tooltip component
const Tooltip = ({ content, children }: { content: string, children: React.ReactNode }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute z-[9999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transform -translate-x-1/2 left-1/2 bottom-full mb-2 transition-all duration-150">
        <div className="relative bg-gray-800 text-white text-xs rounded py-1 px-2 min-w-max whitespace-nowrap">
          {content}
          <div className="border-t border-r border-gray-800 absolute bottom-0 left-1/2 w-2 h-2 bg-gray-800 transform rotate-45 translate-y-1 -translate-x-1/2"></div>
        </div>
      </div>
    </div>
  );
};

const AdvisorTable: React.FC<AdvisorTableProps> = ({
  advisors,
  isLoading,
  selectedAdvisors,
  onSelectAdvisor,
  onSelectAllAdvisors,
  onEdit,
  onDelete,
  onStatusChange,
  onViewCredentials,
  onViewVerificationCode
}) => {
  const allSelected = advisors.length > 0 && selectedAdvisors.length === advisors.length;
  
  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return (
          <span className="badge badge-success flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case UserStatus.INACTIVE:
        return (
          <span className="badge badge-danger flex items-center">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </span>
        );
      case UserStatus.PENDING:
        return (
          <span className="badge badge-warning flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case UserStatus.VERIFICATION_PENDING:
        return (
          <span className="badge badge-warning flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Verification Pending
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };
  
  const getCommissionTierBadge = (tier?: CommissionTier) => {
    if (!tier) return null;
    
    const tierColors = {
      [CommissionTier.BRONZE]: 'bg-amber-100 text-amber-800',
      [CommissionTier.SILVER]: 'bg-gray-100 text-gray-800',
      [CommissionTier.GOLD]: 'bg-yellow-100 text-yellow-800',
      [CommissionTier.PLATINUM]: 'bg-indigo-100 text-indigo-800'
    };
    
    return (
      <span className={`badge flex items-center ${tierColors[tier]}`}>
        <Tag className="h-3 w-3 mr-1" />
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };
  
  const getVerificationBadge = (advisor: UserDetails) => {
    if (advisor.emailVerified) {
      return (
        <span className="badge badge-success flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </span>
      );
    } else {
      return (
        <span className="badge badge-warning flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Not Verified
        </span>
      );
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="lg" text="Loading advisors..." />
      </div>
    );
  }
  
  if (advisors.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
        <h3 className="text-lg font-medium text-gray-500 mb-2">No advisors found</h3>
        <p className="text-gray-400">Try adjusting your filters or add new advisors</p>
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
                  onChange={(e) => onSelectAllAdvisors(e.target.checked)}
                />
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Advisor
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Admin Login Email
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Commission Tier
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Commission Rate
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Login
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {advisors.map((advisor) => (
            <tr key={advisor.id} className="table-row-hover">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={selectedAdvisors.includes(advisor.id)}
                    onChange={(e) => onSelectAdvisor(advisor.id, e.target.checked)}
                  />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {advisor.profileImageUrl ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={advisor.profileImageUrl}
                        alt={advisor.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium">
                        {advisor.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{advisor.name}</div>
                    <div className="text-sm text-gray-500">{advisor.email}</div>
                    {advisor.phone && (
                      <div className="text-xs text-gray-400">{advisor.phone}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-mono text-gray-900">{advisor.loginEmail}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {advisor.city ? (
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                    {advisor.city}, {advisor.state}, {advisor.country}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Not specified</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getCommissionTierBadge(advisor.commissionTier)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {advisor.commissionRate !== undefined ? (
                  <div className="flex items-center">
                    {advisor.currency === 'INR' ? (
                      <span className="text-gray-400 mr-1 font-medium">₹</span>
                    ) : (
                      <DollarSign className="h-3.5 w-3.5 mr-1 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-900">{advisor.commissionRate}%</span>
                    <span className="ml-1 text-xs text-gray-500">({advisor.currency})</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Not set</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(advisor.status as UserStatus)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {advisor.lastLogin ? formatRelativeTime(advisor.lastLogin) : 'Never'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex items-center justify-center space-x-2">
                  {/* Edit Button */}
                  <Tooltip content="Edit Advisor">
                    <button
                      onClick={() => onEdit(advisor)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  
                  {/* View Credentials Button */}
                  <Tooltip content="View Login Credentials">
                    <button
                      onClick={() => onViewCredentials(advisor.id)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  
                  {/* Status Toggle Button */}
                  {advisor.status === UserStatus.ACTIVE ? (
                    <Tooltip content="Deactivate Advisor">
                      <button
                        onClick={() => onStatusChange(advisor.id, UserStatus.INACTIVE)}
                        className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  ) : (
                    <Tooltip content="Activate Advisor">
                      <button
                        onClick={() => onStatusChange(advisor.id, UserStatus.ACTIVE)}
                        className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  )}
                  
                  {/* Verification Code Button - Only shown when applicable */}
                  {advisor.status === UserStatus.VERIFICATION_PENDING && onViewVerificationCode && (
                    <Tooltip content="View Verification Code">
                      <button
                        onClick={() => onViewVerificationCode(advisor.id)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  )}
                  
                  {/* Delete Button */}
                  <Tooltip content="Delete Advisor">
                    <button
                      onClick={() => onDelete(advisor.id)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdvisorTable;