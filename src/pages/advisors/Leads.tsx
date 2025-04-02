// src/pages/advisors/Leads.tsx
import React, { useState, useEffect } from 'react';
import { useLoading } from '@/context/LoadingContext';
import { 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Briefcase,
  DollarSign,
  Edit,
  Trash,
  PhoneCall,
  Building,
  Tag,
  UserCheck
} from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/ErrorBoundary';
import { 
  Lead, 
  LeadStatus, 
  UserDetails, 
  UserRole,
  LeadFilters
} from '@/types/firebase';
import { 
  getLeads, 
  createLead, 
  updateLead, 
  deleteLead 
} from '@/services/advisorService';
import { 
  getAdvisors 
} from '@/services/advisorService';
import { formatDate, formatRelativeTime, cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const Leads: React.FC = () => {
  usePageTitle('Advisor Leads');
  const { startLoading, stopLoading } = useLoading();
  
  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMoreLeads, setHasMoreLeads] = useState(true);
  
  // Advisors state
  const [advisors, setAdvisors] = useState<UserDetails[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [localFilters, setLocalFilters] = useState<LeadFilters>({});
  
  // Load leads on initial render and when filters change
  useEffect(() => {
    loadLeads(true);
  }, [filters]);
  
  // Load advisors on initial render
  useEffect(() => {
    loadAdvisors();
  }, []);
  
  // Load leads with pagination
  const loadLeads = async (reset = false) => {
    try {
      startLoading('Loading leads...');
      setIsLoading(true);
      
      const result = await getLeads(
        10,
        reset ? null : lastDoc,
        filters
      );
      
      setLeads(prev => reset ? result.leads : [...prev, ...result.leads]);
      setLastDoc(result.lastDoc);
      setHasMoreLeads(result.leads.length === 10);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load leads. Please try again.');
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };
  
  // Load advisors for assignment
  const loadAdvisors = async () => {
    try {
      const result = await getAdvisors(100, null, { status: ['active'] });
      setAdvisors(result.advisors);
    } catch (error) {
      console.error('Error loading advisors:', error);
      toast.error('Failed to load advisors');
    }
  };
  
  // Handle filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters(prev => ({ ...prev, search: e.target.value }));
  };
  
  const handleStatusToggle = (status: LeadStatus) => {
    setLocalFilters(prev => {
      const statusArray = prev.status || [];
      return {
        ...prev,
        status: statusArray.includes(status)
          ? statusArray.filter(s => s !== status)
          : [...statusArray, status]
      };
    });
  };
  
  const handleApplyFilters = () => {
    setFilters(localFilters);
  };
  
  const handleResetFilters = () => {
    setLocalFilters({});
    setFilters({});
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Get status badge
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return (
          <span className="badge bg-blue-100 text-blue-800 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            New
          </span>
        );
      case LeadStatus.CONTACTED:
        return (
          <span className="badge bg-purple-100 text-purple-800 flex items-center">
            <PhoneCall className="h-3 w-3 mr-1" />
            Contacted
          </span>
        );
      case LeadStatus.QUALIFIED:
        return (
          <span className="badge bg-indigo-100 text-indigo-800 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Qualified
          </span>
        );
      case LeadStatus.PROPOSAL:
        return (
          <span className="badge bg-yellow-100 text-yellow-800 flex items-center">
            <Briefcase className="h-3 w-3 mr-1" />
            Proposal
          </span>
        );
      case LeadStatus.CLOSED_WON:
        return (
          <span className="badge bg-green-100 text-green-800 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Closed Won
          </span>
        );
      case LeadStatus.CLOSED_LOST:
        return (
          <span className="badge bg-red-100 text-red-800 flex items-center">
            <XCircle className="h-3 w-3 mr-1" />
            Closed Lost
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };
  
  // Find advisor name by ID
  const getAdvisorName = (advisorId: string | null) => {
    if (!advisorId) return 'Unassigned';
    const advisor = advisors.find(a => a.id === advisorId);
    return advisor ? advisor.name : 'Unknown';
  };
  
  return (
    <ErrorBoundary>
      <div>
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advisor Leads</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and assign leads to advisors</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => loadLeads(true)}
              isLoading={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditLead(null);
                setIsFormOpen(true);
              }}
            >
              Add New Lead
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
          {/* Search */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search leads by name, business, or email..."
              className="pl-10 pr-4 py-2 w-full form-input rounded-lg"
              value={localFilters.search || ''}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* Status Filter Dropdown */}
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button
              className={cn(
                "btn-outline flex items-center whitespace-nowrap",
                (localFilters.status?.length)
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : ''
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              Status
              {localFilters.status?.length ? (
                <span className="ml-2 bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {localFilters.status.length}
                </span>
              ) : null}
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
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="p-3 space-y-1">
                  {Object.values(LeadStatus).map((status) => (
                    <div
                      key={status}
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer transition-colors",
                        localFilters.status?.includes(status)
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      )}
                      onClick={() => handleStatusToggle(status)}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                        checked={localFilters.status?.includes(status) || false}
                        onChange={() => {}}
                      />
                      <span className="flex items-center">
                        {getStatusBadge(status)}
                      </span>
                    </div>
                  ))}
                  
                  <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between">
                    <button
                      type="button"
                      className="text-sm text-gray-500 hover:text-gray-700"
                      onClick={handleResetFilters}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      onClick={handleApplyFilters}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
          
          {/* Apply Filters Button - For mobile */}
          <div className="md:hidden">
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </div>
        
        {/* Leads Table */}
        {isLoading && leads.length === 0 ? (
          <div className="flex justify-center items-center p-12">
            <LoadingSpinner size="lg" text="Loading leads..." />
          </div>
        ) : leads.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
            <h3 className="text-lg font-medium text-gray-500 mb-2">No leads found</h3>
            <p className="text-gray-400 mb-6">Add new leads or adjust your filters</p>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditLead(null);
                setIsFormOpen(true);
              }}
            >
              Add New Lead
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client/Business
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
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
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-start">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <Building className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.clientName}</div>
                          <div className="text-sm text-gray-500">{lead.businessDetails?.name}</div>
                          <div className="text-xs text-gray-400">{lead.clientEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Tag className="h-3 w-3 mr-1" />
                        {lead.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                        {formatCurrency(lead.value)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.advisorId ? (
                        <div className="flex items-center">
                          <UserCheck className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-sm text-gray-900">{getAdvisorName(lead.advisorId)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-amber-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatRelativeTime(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditLead(lead);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this lead?')) {
                              startLoading('Deleting lead...');
                              deleteLead(lead.id)
                                .then(() => {
                                  toast.success('Lead deleted successfully');
                                  loadLeads(true);
                                })
                                .catch((error) => {
                                  console.error('Error deleting lead:', error);
                                  toast.error('Failed to delete lead');
                                })
                                .finally(() => {
                                  stopLoading();
                                });
                            }
                          }}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Load More */}
        {!isLoading && hasMoreLeads && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => loadLeads()}
            >
              Load More
            </Button>
          </div>
        )}
        
        {/* Lead Form Modal */}
        {isFormOpen && (
          <LeadForm
            onClose={() => setIsFormOpen(false)}
            lead={editLead}
            advisors={advisors}
            onSave={() => {
              loadLeads(true);
              setIsFormOpen(false);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

// Lead Form Component
interface LeadFormProps {
  onClose: () => void;
  lead: Lead | null;
  advisors: UserDetails[];
  onSave: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ onClose, lead, advisors, onSave }) => {
  const { startLoading, stopLoading } = useLoading();
  const isEdit = !!lead;
  
  // Lead details state
  const [clientName, setClientName] = useState(lead?.clientName || '');
  const [clientEmail, setClientEmail] = useState(lead?.clientEmail || '');
  const [clientPhone, setClientPhone] = useState(lead?.clientPhone || '');
  const [type, setType] = useState(lead?.type || 'Business Sale');
  const [value, setValue] = useState(lead?.value || 0);
  const [status, setStatus] = useState<LeadStatus>(lead?.status || LeadStatus.NEW);
  const [advisorId, setAdvisorId] = useState<string | null>(lead?.advisorId || null);
  const [notes, setNotes] = useState(lead?.notes || '');
  
  // Business details state
  const [businessName, setBusinessName] = useState(lead?.businessDetails?.name || '');
  const [businessIndustry, setBusinessIndustry] = useState(lead?.businessDetails?.industry || '');
  const [businessDescription, setBusinessDescription] = useState(lead?.businessDetails?.description || '');
  const [businessLocation, setBusinessLocation] = useState(lead?.businessDetails?.location || '');
  const [businessRevenue, setBusinessRevenue] = useState(lead?.businessDetails?.revenue || 0);
  const [businessEmployees, setBusinessEmployees] = useState(lead?.businessDetails?.employees || 0);
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Lead types
  const leadTypes = [
    'Business Sale',
    'Business Purchase',
    'Franchise Opportunity',
    'Startup Investment',
    'Partnership',
    'Digital Asset',
    'Merger & Acquisition'
  ];
  
  // Industry types
  const industryTypes = [
    'Retail',
    'Food & Beverage',
    'Technology',
    'Healthcare',
    'Manufacturing',
    'Real Estate',
    'Professional Services',
    'Hospitality',
    'E-commerce',
    'Construction',
    'Education',
    'Other'
  ];
  
  // Validate form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    
    if (!clientEmail.trim()) {
      newErrors.clientEmail = 'Client email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(clientEmail)) {
      newErrors.clientEmail = 'Invalid email format';
    }
    
    if (value <= 0) {
      newErrors.value = 'Value must be greater than 0';
    }
    
    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (!businessIndustry.trim()) {
      newErrors.businessIndustry = 'Industry is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    startLoading(isEdit ? 'Updating lead...' : 'Creating lead...');
    
    try {
      const leadData: Partial<Lead> = {
        id: lead?.id,
        clientName,
        clientEmail,
        clientPhone,
        type,
        value,
        status,
        advisorId,
        notes,
        businessDetails: {
          name: businessName,
          industry: businessIndustry,
          description: businessDescription,
          location: businessLocation,
          revenue: businessRevenue,
          employees: businessEmployees
        }
      };
      
      if (isEdit && lead) {
        await updateLead(lead.id, leadData);
        toast.success('Lead updated successfully');
      } else {
        await createLead(leadData);
        toast.success('Lead created successfully');
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error(error instanceof Error 
        ? error.message 
        : 'Failed to save lead'
      );
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">
            {isEdit ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-1 border-b">
                Client Information
              </h3>
              
              {/* Client Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  className={cn(
                    "block w-full px-3 py-2 form-input",
                    errors.clientName ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="Full name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
                {errors.clientName && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
                )}
              </div>
              
              {/* Client Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Email *
                </label>
                <input
                  type="email"
                  className={cn(
                    "block w-full px-3 py-2 form-input",
                    errors.clientEmail ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="Email address"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
                {errors.clientEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientEmail}</p>
                )}
              </div>
              
              {/* Client Phone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Phone
                </label>
                <input
                  type="tel"
                  className="block w-full px-3 py-2 form-input border-gray-300"
                  placeholder="Phone number"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
              
              <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-1 border-b">
                Lead Details
              </h3>
              
              {/* Lead Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Type *
                </label>
                <select
                  className="block w-full px-3 py-2 form-input border-gray-300"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {leadTypes.map((leadType) => (
                    <option key={leadType} value={leadType}>
                      {leadType}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Lead Value */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deal Value ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className={cn(
                    "block w-full px-3 py-2 form-input",
                    errors.value ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="Estimated value"
                  value={value}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                />
                {errors.value && (
                  <p className="mt-1 text-sm text-red-600">{errors.value}</p>
                )}
              </div>
              
              {/* Lead Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Status *
                </label>
                <select
                  className="block w-full px-3 py-2 form-input border-gray-300"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                >
                  {Object.values(LeadStatus).map((leadStatus) => (
                    <option key={leadStatus} value={leadStatus}>
                      {leadStatus.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Assigned Advisor */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  className="block w-full px-3 py-2 form-input border-gray-300"
                  value={advisorId || ''}
                  onChange={(e) => setAdvisorId(e.target.value || null)}
                >
                  <option value="">Unassigned</option>
                  {advisors.map((advisor) => (
                    <option key={advisor.id} value={advisor.id}>
                      {advisor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Right column - Business Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-1 border-b">
                Business Details
              </h3>
              
              {/* Business Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  className={cn(
                    "block w-full px-3 py-2 form-input",
                    errors.businessName ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="Business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
                )}
              </div>
              
              {/* Business Industry */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry *
                </label>
                <select
                  className={cn(
                    "block w-full px-3 py-2 form-input",
                    errors.businessIndustry ? 'border-red-300' : 'border-gray-300'
                  )}
                  value={businessIndustry}
                  onChange={(e) => setBusinessIndustry(e.target.value)}
                >
                  <option value="">Select industry</option>
                  {industryTypes.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
                {errors.businessIndustry && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessIndustry}</p>
                )}
              </div>
              
              {/* Business Location */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className="block w-full px-3 py-2 form-input border-gray-300"
                  placeholder="City, State/Province, Country"
                  value={businessLocation}
                  onChange={(e) => setBusinessLocation(e.target.value)}
                />
              </div>
              
              {/* Business Details - Revenue & Employees */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Revenue ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    className="block w-full px-3 py-2 form-input border-gray-300"
                    placeholder="Annual revenue"
                    value={businessRevenue}
                    onChange={(e) => setBusinessRevenue(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employees
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="block w-full px-3 py-2 form-input border-gray-300"
                    placeholder="Number of employees"
                    value={businessEmployees}
                    onChange={(e) => setBusinessEmployees(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              {/* Business Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Description
                </label>
                <textarea
                  className="block w-full px-3 py-2 form-input border-gray-300"
                  placeholder="Brief description of the business"
                  rows={3}
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                />
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="block w-full px-3 py-2 form-input border-gray-300"
                  placeholder="Additional notes about this lead"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isEdit ? 'Update Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Leads;