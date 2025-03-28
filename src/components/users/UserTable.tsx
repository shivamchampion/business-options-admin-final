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
  UserX
} from 'lucide-react';
import { UserDetails, UserStatus, UserRole } from '@/types/firebase';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface UserTableProps {
  users: UserDetails[];
  isLoading: boolean;
  selectedUsers: string[];
  onSelectUser: (userId: string, isSelected: boolean) => void;
  onSelectAllUsers: (isSelected: boolean) => void;
  onEdit: (user: UserDetails) => void;
  onDelete: (userId: string) => void;
  onStatusChange: (userId: string, status: UserStatus) => void;
  onViewVerificationCode?: (userId: string) => void;
  isAdminPanel?: boolean;
}

// Fixed tooltip component
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

const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  selectedUsers,
  onSelectUser,
  onSelectAllUsers,
  onEdit,
  onDelete,
  onStatusChange,
  onViewVerificationCode,
  isAdminPanel = true
}) => {
  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  
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
  
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <span className="badge bg-purple-100 text-purple-800">Super Admin</span>;
      case UserRole.ADMIN:
        return <span className="badge bg-blue-100 text-blue-800">Admin</span>;
      case UserRole.MODERATOR:
        return <span className="badge bg-teal-100 text-teal-800">Moderator</span>;
      case UserRole.ADVISOR:
        return <span className="badge bg-indigo-100 text-indigo-800">Advisor</span>;
      case UserRole.USER:
        return <span className="badge bg-gray-100 text-gray-800">Website User</span>;
      default:
        return <span className="badge">{role}</span>;
    }
  };
  
  const getVerificationBadge = (user: UserDetails) => {
    if (user.emailVerified) {
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
        <LoadingSpinner size="lg" text="Loading users..." />
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
        <h3 className="text-lg font-medium text-gray-500 mb-2">No users found</h3>
        <p className="text-gray-400">Try adjusting your filters or add new users</p>
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
                  onChange={(e) => onSelectAllUsers(e.target.checked)}
                />
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Admin Login Email
</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email Verification
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
          {users.map((user) => (
            <tr key={user.id} className="table-row-hover">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => onSelectUser(user.id, e.target.checked)}
                  />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {user.profileImageUrl ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={user.profileImageUrl}
                        alt={user.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
  <div className="text-sm text-gray-900 font-mono">{user.loginEmail}</div>
</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getRoleBadge(user.role as UserRole)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(user.status as UserStatus)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getVerificationBadge(user)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.lastLogin ? formatRelativeTime(user.lastLogin) : 'Never'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex items-center justify-center space-x-2">
                  {/* Edit Button */}
                  <Tooltip content="Edit User">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  
                  {/* Status Toggle Button */}
                  {user.status === UserStatus.ACTIVE ? (
                    <Tooltip content="Deactivate User">
                      <button
                        onClick={() => onStatusChange(user.id, UserStatus.INACTIVE)}
                        className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  ) : (
                    <Tooltip content="Activate User">
                      <button
                        onClick={() => onStatusChange(user.id, UserStatus.ACTIVE)}
                        className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  )}
                  
                  {/* Verification Code Button - Only shown when applicable */}
                  {user.status === UserStatus.VERIFICATION_PENDING && onViewVerificationCode && (
                    <Tooltip content="View Verification Code">
                      <button
                        onClick={() => onViewVerificationCode(user.id)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  )}
                  
                  {/* Delete Button */}
                  <Tooltip content="Delete User">
                    <button
                      onClick={() => onDelete(user.id)}
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

export default UserTable;