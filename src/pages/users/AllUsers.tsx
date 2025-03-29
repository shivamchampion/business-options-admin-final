import React, { useState, useEffect } from 'react';
import { useLoading } from '@/context/LoadingContext';
import { Tab } from '@headlessui/react';
import { Plus, RefreshCw, AlertTriangle, Info, Key } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import Button from '@/components/ui/Button';
import UserFilters from '@/components/users/UserFilters';
import UserTable from '@/components/users/UserTable';
import UserForm from '@/components/users/UserForm';
import UserBulkActions from '@/components/users/UserBulkActions';
import VerificationCodeModal from '@/components/users/VerificationCodeModal';
import CredentialsModal from '@/components/users/CredentialsModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import { UserDetails, UserStatus, UserFilters as UserFiltersType } from '@/types/firebase';
import { 
  getAdminPanelUsers, 
  getWebsiteUsers, 
  createAdminPanelUser, 
  updateUserStatus, 
  bulkUpdateUserStatus, 
  deleteUser,
  resetUserPassword
} from '@/services/userService';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const pageSize = 10;

export default function AllUsers() {
  usePageTitle('User Management');
  const { startLoading, stopLoading } = useLoading();
  
  // Tab state
  const [selectedTab, setSelectedTab] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Users state
  const [adminUsers, setAdminUsers] = useState<UserDetails[]>([]);
  const [websiteUsers, setWebsiteUsers] = useState<UserDetails[]>([]);
  const [adminLastDoc, setAdminLastDoc] = useState<any>(null);
  const [websiteLastDoc, setWebsiteLastDoc] = useState<any>(null);
  const [hasMoreAdminUsers, setHasMoreAdminUsers] = useState(true);
  const [hasMoreWebsiteUsers, setHasMoreWebsiteUsers] = useState(true);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDetails | undefined>(undefined);
  const [selectedAdminUsers, setSelectedAdminUsers] = useState<string[]>([]);
  const [selectedWebsiteUsers, setSelectedWebsiteUsers] = useState<string[]>([]);
  const [adminFilters, setAdminFilters] = useState<UserFiltersType>({});
  const [websiteFilters, setWebsiteFilters] = useState<UserFiltersType>({});
  
  // Verification code modal
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>(''); // For displaying login email
  
  // Credentials modal
  const [credentialsModalUser, setCredentialsModalUser] = useState<UserDetails | null>(null);
  
  // Track which tabs have been initialized
  const [initializedTabs, setInitializedTabs] = useState<{[key: number]: boolean}>({});
  
  // Tab change handler with smooth transition
  const handleTabChange = (index: number) => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setSelectedTab(index);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    }, 150);
  };
  
  // Load data when switching tabs or when tab is first viewed
  useEffect(() => {
    if (!initializedTabs[selectedTab]) {
      if (selectedTab === 0) {
        loadAdminUsers(true);
      } else {
        loadWebsiteUsers(true);
      }
      
      // Mark this tab as initialized
      setInitializedTabs(prev => ({
        ...prev,
        [selectedTab]: true
      }));
    }
  }, [selectedTab]);
  
  // Handle admin filter changes with transition
  const handleAdminFilterChange = (filters: UserFiltersType) => {
    setIsTransitioning(true);
    setAdminFilters(filters);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };
  
  // Handle website filter changes with transition
  const handleWebsiteFilterChange = (filters: UserFiltersType) => {
    setIsTransitioning(true);
    setWebsiteFilters(filters);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };
  
  // Load filtered data when filters change
  useEffect(() => {
    if (initializedTabs[0]) {
      loadAdminUsers(true);
    }
  }, [adminFilters]);
  
  useEffect(() => {
    if (initializedTabs[1]) {
      loadWebsiteUsers(true);
    }
  }, [websiteFilters]);
  
  // Load admin panel users
  const loadAdminUsers = async (reset = false) => {
    try {
      if (selectedTab === 0) {
        startLoading('Loading admin panel users...');
      }
      setIsLoading(true);
      
      const result = await getAdminPanelUsers(
        pageSize,
        reset ? null : adminLastDoc,
        adminFilters
      );
      
      setAdminUsers(prev => reset ? result.users : [...prev, ...result.users]);
      setAdminLastDoc(result.lastDoc);
      setHasMoreAdminUsers(result.users.length === pageSize);
    } catch (error) {
      console.error('Error loading admin users:', error);
    } finally {
      setIsLoading(false);
      if (selectedTab === 0) {
        stopLoading();
      }
    }
  };
  
  // Load website users
  const loadWebsiteUsers = async (reset = false) => {
    try {
      if (selectedTab === 1) {
        startLoading('Loading website users...');
      }
      setIsLoading(true);
      
      const result = await getWebsiteUsers(
        pageSize,
        reset ? null : websiteLastDoc,
        websiteFilters
      );
      
      setWebsiteUsers(prev => reset ? result.users : [...prev, ...result.users]);
      setWebsiteLastDoc(result.lastDoc);
      setHasMoreWebsiteUsers(result.users.length === pageSize);
    } catch (error) {
      console.error('Error loading website users:', error);
    } finally {
      setIsLoading(false);
      if (selectedTab === 1) {
        stopLoading();
      }
    }
  };
  
  // Load more users based on current tab
  const loadMore = () => {
    if (selectedTab === 0) {
      loadAdminUsers();
    } else {
      loadWebsiteUsers();
    }
  };
  
  // Handle user creation - Updated to return credentials
 const handleCreateUser = async (userData: Partial<UserDetails>, profileImage?: File) => {
  try {
    startLoading('Creating user...');
    
    const result = await createAdminPanelUser(userData, profileImage);
    
    // Show success toast
    toast.success('User created successfully');
    
    // Reload admin users
    await loadAdminUsers(true);
    
    // Return credentials to show in UserForm
    return {
      loginEmail: result.loginEmail,
      password: result.password
    };
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Show error toast with user-friendly message
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('Failed to create user. Please try again later.');
    }
    
    throw error;
  } finally {
    stopLoading();
  }
};
  
  // Handle viewing credentials
  const handleViewCredentials = (userId: string) => {
    const user = adminUsers.find(user => user.id === userId);
    if (user) {
      setCredentialsModalUser(user);
    }
  };
  
  // Handle resetting password
  const handleResetPassword = async () => {
    if (!credentialsModalUser || !credentialsModalUser.loginEmail) return '';
    
    try {
      startLoading('Resetting password...');
      const newPassword = await resetUserPassword(credentialsModalUser.loginEmail);
      return newPassword;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    } finally {
      stopLoading();
    }
  };
  
  // Handle user status change
  const handleStatusChange = async (userId: string, status: UserStatus) => {
    try {
      startLoading(`${status === UserStatus.ACTIVE ? 'Activating' : 'Deactivating'} user...`);
      
      await updateUserStatus(userId, status);
      
      // Show success toast
      toast.success(`User ${status === UserStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`);
      
      // Update local state
      if (selectedTab === 0) {
        setAdminUsers(prev => 
          prev.map(user => user.id === userId ? { ...user, status } : user)
        );
      } else {
        setWebsiteUsers(prev => 
          prev.map(user => user.id === userId ? { ...user, status } : user)
        );
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      
      // Show error toast
      toast.error(error instanceof Error 
        ? error.message 
        : `Failed to update user status. Please try again.`
      );
    } finally {
      stopLoading();
    }
  };
  
  // Handle bulk actions
  const handleBulkActivate = async () => {
    try {
      startLoading('Activating users...');
      
      const userIds = selectedTab === 0 ? selectedAdminUsers : selectedWebsiteUsers;
      await bulkUpdateUserStatus(userIds, UserStatus.ACTIVE);
      
      // Update local state
      if (selectedTab === 0) {
        setAdminUsers(prev => 
          prev.map(user => 
            selectedAdminUsers.includes(user.id) ? { ...user, status: UserStatus.ACTIVE } : user
          )
        );
        setSelectedAdminUsers([]);
      } else {
        setWebsiteUsers(prev => 
          prev.map(user => 
            selectedWebsiteUsers.includes(user.id) ? { ...user, status: UserStatus.ACTIVE } : user
          )
        );
        setSelectedWebsiteUsers([]);
      }
    } catch (error) {
      console.error('Error activating users:', error);
    } finally {
      stopLoading();
    }
  };
  
  const handleBulkDeactivate = async () => {
    try {
      startLoading('Deactivating users...');
      
      const userIds = selectedTab === 0 ? selectedAdminUsers : selectedWebsiteUsers;
      await bulkUpdateUserStatus(userIds, UserStatus.INACTIVE);
      
      // Update local state
      if (selectedTab === 0) {
        setAdminUsers(prev => 
          prev.map(user => 
            selectedAdminUsers.includes(user.id) ? { ...user, status: UserStatus.INACTIVE } : user
          )
        );
        setSelectedAdminUsers([]);
      } else {
        setWebsiteUsers(prev => 
          prev.map(user => 
            selectedWebsiteUsers.includes(user.id) ? { ...user, status: UserStatus.INACTIVE } : user
          )
        );
        setSelectedWebsiteUsers([]);
      }
    } catch (error) {
      console.error('Error deactivating users:', error);
    } finally {
      stopLoading();
    }
  };
  
  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedTab === 0 ? selectedAdminUsers.length : selectedWebsiteUsers.length} users? This action cannot be undone.`)) {
      return;
    }
    
    try {
      startLoading('Deleting users...');
      
      const userIds = selectedTab === 0 ? selectedAdminUsers : selectedWebsiteUsers;
      
      // Delete each user
      for (const userId of userIds) {
        await deleteUser(userId);
      }
      
      // Update local state
      if (selectedTab === 0) {
        setAdminUsers(prev => prev.filter(user => !selectedAdminUsers.includes(user.id)));
        setSelectedAdminUsers([]);
      } else {
        setWebsiteUsers(prev => prev.filter(user => !selectedWebsiteUsers.includes(user.id)));
        setSelectedWebsiteUsers([]);
      }
    } catch (error) {
      console.error('Error deleting users:', error);
    } finally {
      stopLoading();
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      startLoading('Deleting user...');
      
      await deleteUser(userId);
      
      // Update local state
      if (selectedTab === 0) {
        setAdminUsers(prev => prev.filter(user => user.id !== userId));
      } else {
        setWebsiteUsers(prev => prev.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      stopLoading();
    }
  };
  
  // Handle selection changes
  const handleSelectAdminUser = (userId: string, isSelected: boolean) => {
    setSelectedAdminUsers(prev => 
      isSelected 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };
  
  const handleSelectWebsiteUser = (userId: string, isSelected: boolean) => {
    setSelectedWebsiteUsers(prev => 
      isSelected 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };
  
  const handleSelectAllAdminUsers = (isSelected: boolean) => {
    setSelectedAdminUsers(isSelected ? adminUsers.map(user => user.id) : []);
  };
  
  const handleSelectAllWebsiteUsers = (isSelected: boolean) => {
    setSelectedWebsiteUsers(isSelected ? websiteUsers.map(user => user.id) : []);
  };
  
  // View verification code
  const handleViewVerificationCode = (userId: string) => {
    const user = adminUsers.find(user => user.id === userId);
    if (user && user.verificationCode) {
      setVerificationCode(user.verificationCode);
      setVerificationEmail(user.email);
      setLoginEmail(user.loginEmail || ''); // Set the login email if available
    }
  };
  
  return (
    <ErrorBoundary>
      <div>
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your platform users and their permissions</p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditUser(undefined);
                setIsFormOpen(true);
              }}
            >
              Add New User
            </Button>
          </div>
        </div>
        
        {/* Admin Login Info Banner */}
        <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
          <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Admin Panel Login Information</p>
            <p>
              Admin users log in using their <strong>Admin Login Email</strong> (@businessoptions.in) 
              which is different from their regular email address. This separation helps maintain security 
              and prevent conflicts between website accounts and admin accounts.
            </p>
          </div>
        </div>
        
        {/* Tabs */}
        <Tab.Group selectedIndex={selectedTab} onChange={handleTabChange}>
          <Tab.List className="flex border-b border-gray-200 mb-6">
            <Tab
              className={({ selected }) => cn(
                "px-4 py-2 -mb-px text-sm font-medium whitespace-nowrap focus:outline-none",
                selected 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Admin Panel Users
            </Tab>
            <Tab
              className={({ selected }) => cn(
                "px-4 py-2 -mb-px text-sm font-medium whitespace-nowrap focus:outline-none",
                selected 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Website Users
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            {/* Admin Panel Users */}
            <Tab.Panel>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <UserFilters
                    filters={adminFilters}
                    onFilterChange={handleAdminFilterChange}
                    isAdminPanel={true}
                    className="w-full md:w-auto mb-4 md:mb-0"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    onClick={() => loadAdminUsers(true)}
                  >
                    Refresh
                  </Button>
                </div>
                
                {/* Admin Users Table with transition */}
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isTransitioning ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  <UserTable
                    users={adminUsers}
                    isLoading={isLoading && selectedTab === 0}
                    selectedUsers={selectedAdminUsers}
                    onSelectUser={handleSelectAdminUser}
                    onSelectAllUsers={handleSelectAllAdminUsers}
                    onEdit={(user) => {
                      setEditUser(user);
                      setIsFormOpen(true);
                    }}
                    onDelete={handleDeleteUser}
                    onStatusChange={handleStatusChange}
                    onViewVerificationCode={handleViewVerificationCode}
                    onViewCredentials={handleViewCredentials}
                    isAdminPanel={true}
                  />
                </div>
                
                {/* Load more */}
                {hasMoreAdminUsers && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      isLoading={isLoading && selectedTab === 0}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            </Tab.Panel>
            
            {/* Website Users */}
            <Tab.Panel>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <UserFilters
                    filters={websiteFilters}
                    onFilterChange={handleWebsiteFilterChange}
                    isAdminPanel={false}
                    className="w-full md:w-auto mb-4 md:mb-0"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    onClick={() => loadWebsiteUsers(true)}
                  >
                    Refresh
                  </Button>
                </div>
                
                {/* Message about website users with transition */}
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isTransitioning ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-start p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium mb-1">Website Users Section - Coming Soon</p>
                      <p>
                        This section will display users who have registered on the website. Website users cannot be created from the admin panel.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
        
        {/* User form modal */}
        {isFormOpen && (
          <UserForm
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleCreateUser}
            user={editUser}
            isEdit={!!editUser}
          />
        )}
        
        {/* Verification code modal */}
        {verificationCode && (
          <VerificationCodeModal
            code={verificationCode}
            email={verificationEmail}
            loginEmail={loginEmail}
            onClose={() => {
              setVerificationCode(null);
              setLoginEmail('');
            }}
          />
        )}
        
        {/* Credentials modal */}
        {credentialsModalUser && (
          <CredentialsModal
            loginEmail={credentialsModalUser.loginEmail}
            onClose={() => setCredentialsModalUser(null)}
            onResetPassword={handleResetPassword}
          />
        )}
        
        {/* Bulk actions */}
        <UserBulkActions
          selectedCount={selectedTab === 0 ? selectedAdminUsers.length : selectedWebsiteUsers.length}
          onClearSelection={() => 
            selectedTab === 0 ? setSelectedAdminUsers([]) : setSelectedWebsiteUsers([])
          }
          onActivate={handleBulkActivate}
          onDeactivate={handleBulkDeactivate}
          onDelete={handleBulkDelete}
        />
      </div>
    </ErrorBoundary>
  );
}