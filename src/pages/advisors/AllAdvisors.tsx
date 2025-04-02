// src/pages/advisors/AllAdvisors.tsx
import React, { useState, useEffect } from 'react';
import { useLoading } from '@/context/LoadingContext';
import { Plus, RefreshCw, Info, DollarSign } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import Button from '@/components/ui/Button';
import AdvisorFilters from '@/components/advisors/AdvisorFilters';
import AdvisorTable from '@/components/advisors/AdvisorTable';
import AdvisorForm from '@/components/advisors/AdvisorForm';
import CredentialsModal from '@/components/users/CredentialsModal';
import VerificationCodeModal from '@/components/users/VerificationCodeModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import { 
  UserDetails, 
  UserStatus, 
  AdvisorFilters as AdvisorFiltersType,
  CommissionTier
} from '@/types/firebase';
import { 
  getAdvisors, 
  createAdvisor,
  updateAdvisor,
  updateAdvisorStatus,
  deleteAdvisor,
  resetAdvisorPassword
} from '@/services/advisorService';
import { toast } from 'react-hot-toast';

const pageSize = 10;

export default function AllAdvisors() {
  usePageTitle('Advisors Management');
  const { startLoading, stopLoading } = useLoading();
  
  // Advisors state
  const [advisors, setAdvisors] = useState<UserDetails[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMoreAdvisors, setHasMoreAdvisors] = useState(true);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editAdvisor, setEditAdvisor] = useState<UserDetails | undefined>(undefined);
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([]);
  const [advisorFilters, setAdvisorFilters] = useState<AdvisorFiltersType>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Verification code modal
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('');
  
  // Credentials modal
  const [credentialsModalUser, setCredentialsModalUser] = useState<UserDetails | null>(null);
  
  // Load advisors on initial render and when filters change
  useEffect(() => {
    loadAdvisors(true);
  }, [advisorFilters]);
  
  // Load advisors with pagination
  const loadAdvisors = async (reset = false) => {
    try {
      startLoading('Loading advisors...');
      setIsLoading(true);
      
      const result = await getAdvisors(
        pageSize,
        reset ? null : lastDoc,
        advisorFilters
      );
      
      setAdvisors(prev => reset ? result.advisors : [...prev, ...result.advisors]);
      setLastDoc(result.lastDoc);
      setHasMoreAdvisors(result.advisors.length === pageSize);
    } catch (error) {
      console.error('Error loading advisors:', error);
      toast.error('Failed to load advisors. Please try again.');
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };
  
  // Handle filter changes with transition effect
  const handleFilterChange = (filters: AdvisorFiltersType) => {
    setIsTransitioning(true);
    setAdvisorFilters(filters);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };
  
  // Format currency with appropriate symbol
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Handle advisor creation
  const handleCreateAdvisor = async (advisorData: Partial<UserDetails>, profileImage?: File) => {
    try {
      startLoading('Creating advisor...');
      
      // Validate required fields
      if (!advisorData.phone || !advisorData.country || !advisorData.state || !advisorData.city) {
        throw new Error('Phone number and location details are required');
      }
      
      const result = await createAdvisor(advisorData, profileImage);
      
      // Show success toast
      toast.success('Advisor created successfully');
      
      // Reload advisors
      await loadAdvisors(true);
      
      // Return credentials to show in AdvisorForm
      return {
        loginEmail: result.loginEmail,
        password: result.password
      };
    } catch (error) {
      console.error('Error creating advisor:', error);
      
      // Show error toast with user-friendly message
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create advisor. Please try again later.');
      }
      
      throw error;
    } finally {
      stopLoading();
    }
  };
  
  // Handle advisor editing
  const handleEditAdvisor = async (advisorData: Partial<UserDetails>, profileImage?: File) => {
    if (!advisorData.id) return;
    
    try {
      startLoading('Updating advisor...');
      
      // Validate required fields
      if (!advisorData.phone || !advisorData.country || !advisorData.state || !advisorData.city) {
        throw new Error('Phone number and location details are required');
      }
      
      await updateAdvisor(advisorData.id, advisorData, profileImage);
      
      // Show success toast
      toast.success('Advisor updated successfully');
      
      // Reload advisors
      await loadAdvisors(true);
      
      // Close form
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error updating advisor:', error);
      
      // Show error toast
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update advisor. Please try again later.');
      }
      
      throw error;
    } finally {
      stopLoading();
    }
  };
  
  // Handle viewing credentials
  const handleViewCredentials = (advisorId: string) => {
    const advisor = advisors.find(advisor => advisor.id === advisorId);
    if (advisor) {
      setCredentialsModalUser(advisor);
    }
  };
  
  // Handle resetting password
  const handleResetPassword = async () => {
    if (!credentialsModalUser || !credentialsModalUser.loginEmail) return '';
    
    try {
      startLoading('Resetting password...');
      const newPassword = await resetAdvisorPassword(credentialsModalUser.loginEmail);
      return newPassword;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    } finally {
      stopLoading();
    }
  };
  
  // Handle status change
  const handleStatusChange = async (advisorId: string, status: UserStatus) => {
    try {
      startLoading(`${status === UserStatus.ACTIVE ? 'Activating' : 'Deactivating'} advisor...`);
      
      await updateAdvisorStatus(advisorId, status);
      
      // Show success toast
      toast.success(`Advisor ${status === UserStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`);
      
      // Update local state
      setAdvisors(prev => 
        prev.map(advisor => advisor.id === advisorId ? { ...advisor, status } : advisor)
      );
    } catch (error) {
      console.error('Error updating advisor status:', error);
      
      // Show error toast
      toast.error(error instanceof Error 
        ? error.message 
        : `Failed to update advisor status. Please try again.`
      );
    } finally {
      stopLoading();
    }
  };
  
  // Handle advisor deletion
  const handleDeleteAdvisor = async (advisorId: string) => {
    if (!window.confirm('Are you sure you want to delete this advisor? This action cannot be undone.')) {
      return;
    }
    
    try {
      startLoading('Deleting advisor...');
      
      await deleteAdvisor(advisorId);
      
      // Show success toast
      toast.success('Advisor deleted successfully');
      
      // Update local state
      setAdvisors(prev => prev.filter(advisor => advisor.id !== advisorId));
    } catch (error) {
      console.error('Error deleting advisor:', error);
      
      // Show error toast
      toast.error(error instanceof Error 
        ? error.message 
        : `Failed to delete advisor. Please try again.`
      );
    } finally {
      stopLoading();
    }
  };
  
  // Handle selection changes
  const handleSelectAdvisor = (advisorId: string, isSelected: boolean) => {
    setSelectedAdvisors(prev => 
      isSelected 
        ? [...prev, advisorId]
        : prev.filter(id => id !== advisorId)
    );
  };
  
  const handleSelectAllAdvisors = (isSelected: boolean) => {
    setSelectedAdvisors(isSelected ? advisors.map(advisor => advisor.id) : []);
  };
  
  // View verification code
  const handleViewVerificationCode = (advisorId: string) => {
    const advisor = advisors.find(advisor => advisor.id === advisorId);
    if (advisor && advisor.verificationCode) {
      setVerificationCode(advisor.verificationCode);
      setVerificationEmail(advisor.email);
      setLoginEmail(advisor.loginEmail || '');
    }
  };
  
  // Handle form submission
  const handleSubmitForm = async (advisorData: Partial<UserDetails>, profileImage?: File) => {
    if (editAdvisor) {
      return handleEditAdvisor(advisorData, profileImage);
    } else {
      return handleCreateAdvisor(advisorData, profileImage);
    }
  };
  
  return (
    <ErrorBoundary>
      <div>
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advisors Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage advisors, commission structures, and lead assignments</p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditAdvisor(undefined);
                setIsFormOpen(true);
              }}
            >
              Add New Advisor
            </Button>
          </div>
        </div>
        
        {/* Info banner */}
        <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
          <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Advisor Login Information</p>
            <p>
              Advisors can log in to the platform using their Admin Login Email (@businessoptions.in). 
              They have limited access to manage their assigned leads and view their commission information.
            </p>
          </div>
        </div>
        
        {/* Filters and controls */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <AdvisorFilters
              filters={advisorFilters}
              onFilterChange={handleFilterChange}
              className="w-full md:w-auto mb-4 md:mb-0"
            />
            
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => loadAdvisors(true)}
              isLoading={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Advisors table with transition */}
        <div 
          className={`transition-all duration-300 ease-in-out ${
            isTransitioning ? 'opacity-50' : 'opacity-100'
          }`}
        >
          <AdvisorTable
            advisors={advisors}
            isLoading={isLoading}
            selectedAdvisors={selectedAdvisors}
            onSelectAdvisor={handleSelectAdvisor}
            onSelectAllAdvisors={handleSelectAllAdvisors}
            onEdit={(advisor) => {
              setEditAdvisor(advisor);
              setIsFormOpen(true);
            }}
            onDelete={handleDeleteAdvisor}
            onStatusChange={handleStatusChange}
            onViewCredentials={handleViewCredentials}
            onViewVerificationCode={handleViewVerificationCode}
          />
        </div>
        
        {/* Load more */}
        {hasMoreAdvisors && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => loadAdvisors()}
              isLoading={isLoading}
            >
              Load More
            </Button>
          </div>
        )}
        
        {/* Advisor form modal */}
        {isFormOpen && (
          <AdvisorForm
            onClose={() => {
              setIsFormOpen(false);
              setEditAdvisor(undefined);
            }}
            onSubmit={handleSubmitForm}
            advisor={editAdvisor}
            isEdit={!!editAdvisor}
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
      </div>
    </ErrorBoundary>
  );
}