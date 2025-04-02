// src/pages/advisors/Payments.tsx
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
  DollarSign,
  Edit,
  Trash,
  Calendar,
  ArrowRight,
  UserCheck,
  CreditCard
} from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/ErrorBoundary';
import { 
  Payment, 
  PaymentStatus,
  UserDetails,
  PaymentFilters,
  Lead
} from '@/types/firebase';
import { 
  getPayments, 
  createPayment, 
  updatePayment, 
  deletePayment, 
  getAdvisors,
  getLeads
} from '@/services/advisorService';
import { formatDate, formatRelativeTime, cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const Payments: React.FC = () => {
  usePageTitle('Advisor Payments');
  const { startLoading, stopLoading } = useLoading();
  
  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMorePayments, setHasMorePayments] = useState(true);
  
  // Advisors state
  const [advisors, setAdvisors] = useState<UserDetails[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [localFilters, setLocalFilters] = useState<PaymentFilters>({});
  
  // Load payments on initial render and when filters change
  useEffect(() => {
    loadPayments(true);
  }, [filters]);
  
  // Load advisors on initial render
  useEffect(() => {
    loadAdvisors();
  }, []);
  
  // Load payments with pagination
  const loadPayments = async (reset = false) => {
    try {
      startLoading('Loading payments...');
      setIsLoading(true);
      
      const result = await getPayments(
        10,
        reset ? null : lastDoc,
        filters
      );
      
      setPayments(prev => reset ? result.payments : [...prev, ...result.payments]);
      setLastDoc(result.lastDoc);
      setHasMorePayments(result.payments.length === 10);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments. Please try again.');
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };
  
  // Load advisors
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
  
  const handleStatusToggle = (status: PaymentStatus) => {
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
  
// Format currency with currency support
const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Get status badge
  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return (
          <span className="badge bg-yellow-100 text-yellow-800 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case PaymentStatus.PROCESSING:
        return (
          <span className="badge bg-blue-100 text-blue-800 flex items-center">
            <CreditCard className="h-3 w-3 mr-1" />
            Processing
          </span>
        );
      case PaymentStatus.COMPLETED:
        return (
          <span className="badge bg-green-100 text-green-800 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case PaymentStatus.FAILED:
        return (
          <span className="badge bg-red-100 text-red-800 flex items-center">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </span>
        );
      case PaymentStatus.CANCELLED:
        return (
          <span className="badge bg-gray-100 text-gray-800 flex items-center">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };
  
  // Find advisor name by ID
  const getAdvisorName = (advisorId: string) => {
    const advisor = advisors.find(a => a.id === advisorId);
    return advisor ? advisor.name : 'Unknown Advisor';
  };
  
  return (
    <ErrorBoundary>
      <div>
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advisor Payments</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and process commission payments to advisors</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => loadPayments(true)}
              isLoading={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditPayment(null);
                setIsFormOpen(true);
              }}
            >
              Add Payment
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
              placeholder="Search payments by description or reference..."
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
                  {Object.values(PaymentStatus).map((status) => (
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
        
        {/* Payments Table */}
        {isLoading && payments.length === 0 ? (
          <div className="flex justify-center items-center p-12">
            <LoadingSpinner size="lg" text="Loading payments..." />
          </div>
        ) : payments.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
            <h3 className="text-lg font-medium text-gray-500 mb-2">No payments found</h3>
            <p className="text-gray-400 mb-6">Add new payments or adjust your filters</p>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditPayment(null);
                setIsFormOpen(true);
              }}
            >
              Add Payment
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advisor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserCheck className="h-5 w-5 text-indigo-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getAdvisorName(payment.advisorId)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {advisor.currency === 'INR' ? 
                          <span className="text-gray-400 mr-1 font-medium">₹</span> :
                          <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                        }
                        {formatCurrency(payment.amount, advisor.currency || 'USD')}
                      </div>
                      {payment.commissionDetails && (
                        <div className="text-xs text-gray-500 mt-1">
                          Rate: {payment.commissionDetails.commissionRate}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(payment.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(payment.dueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.description}</div>
                      {payment.referenceNumber && (
                        <div className="text-xs text-gray-500 mt-1">
                          Ref: {payment.referenceNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditPayment(payment);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this payment?')) {
                              startLoading('Deleting payment...');
                              deletePayment(payment.id)
                                .then(() => {
                                  toast.success('Payment deleted successfully');
                                  loadPayments(true);
                                })
                                .catch((error) => {
                                  console.error('Error deleting payment:', error);
                                  toast.error('Failed to delete payment');
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
        {!isLoading && hasMorePayments && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => loadPayments()}
            >
              Load More
            </Button>
          </div>
        )}
        
        {/* Payment Form Modal */}
        {isFormOpen && (
          <PaymentForm
            onClose={() => setIsFormOpen(false)}
            payment={editPayment}
            advisors={advisors}
            onSave={() => {
              loadPayments(true);
              setIsFormOpen(false);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

// Payment Form Component
interface PaymentFormProps {
  onClose: () => void;
  payment: Payment | null;
  advisors: UserDetails[];
  onSave: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onClose, payment, advisors, onSave }) => {
  const { startLoading, stopLoading } = useLoading();
  const isEdit = !!payment;
  
  // Payment details state
  const [advisorId, setAdvisorId] = useState(payment?.advisorId || '');
  const [amount, setAmount] = useState(payment?.amount || 0);
  const [status, setStatus] = useState<PaymentStatus>(payment?.status || PaymentStatus.PENDING);
  const [paymentDate, setPaymentDate] = useState(
    payment?.date ? formatDateForInput(payment.date) : formatDateForInput(new Date())
  );
  const [dueDate, setDueDate] = useState(
    payment?.dueDate ? formatDateForInput(payment.dueDate) : formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );
  const [paymentMethod, setPaymentMethod] = useState(payment?.paymentMethod || 'Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState(payment?.referenceNumber || '');
  const [description, setDescription] = useState(payment?.description || '');
  
  // Commission details state
  const [baseAmount, setBaseAmount] = useState(payment?.commissionDetails?.baseAmount || 0);
  const [commissionRate, setCommissionRate] = useState(payment?.commissionDetails?.commissionRate || 0);
  const [bonusAmount, setBonusAmount] = useState(payment?.commissionDetails?.bonusAmount || 0);
  
  // Related leads
  const [relatedLeads, setRelatedLeads] = useState<string[]>(payment?.relatedLeads || []);
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  
  // Format date for input
  function formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Get advisor's leads when advisor changes
  useEffect(() => {
    if (advisorId) {
      loadAdvisorLeads(advisorId);
    }
  }, [advisorId]);
  
  // Load advisor's leads
  const loadAdvisorLeads = async (advisorId: string) => {
    try {
      setLeadsLoading(true);
      const result = await getLeads(100, null, { advisorId, status: ['closed_won'] });
      setLeads(result.leads);
      
      // If this is a new payment, calculate commission rate from the advisor
      if (!isEdit) {
        const advisor = advisors.find(a => a.id === advisorId);
        if (advisor && advisor.commissionRate) {
          setCommissionRate(advisor.commissionRate);
        }
      }
    } catch (error) {
      console.error('Error loading advisor leads:', error);
    } finally {
      setLeadsLoading(false);
    }
  };
  
  // Calculate total amount based on base amount, commission rate, and bonus
  useEffect(() => {
    const calculatedAmount = (baseAmount * (commissionRate / 100)) + bonusAmount;
    setAmount(parseFloat(calculatedAmount.toFixed(2)));
  }, [baseAmount, commissionRate, bonusAmount]);
  
  // Payment methods
  const paymentMethods = [
    'Bank Transfer',
    'PayPal',
    'Check',
    'Direct Deposit',
    'Wire Transfer',
    'Credit Card',
    'Other'
  ];
  
  // Toggle lead selection
  const toggleLead = (leadId: string) => {
    setRelatedLeads(prev => 
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!advisorId) {
      newErrors.advisorId = 'Advisor is required';
    }
    
    if (amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }
    
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
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
    startLoading(isEdit ? 'Updating payment...' : 'Creating payment...');
    
    try {
      const paymentData: Partial<Payment> = {
        id: payment?.id,
        advisorId,
        amount,
        status,
        date: new Date(paymentDate),
        dueDate: new Date(dueDate),
        paymentMethod,
        referenceNumber,
        description,
        relatedLeads,
        commissionDetails: {
          baseAmount,
          commissionRate,
          bonusAmount
        }
      };
      
      if (isEdit && payment) {
        await updatePayment(payment.id, paymentData);
        toast.success('Payment updated successfully');
      } else {
        await createPayment(paymentData);
        toast.success('Payment created successfully');
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error(error instanceof Error 
        ? error.message 
        : 'Failed to save payment'
      );
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">
            {isEdit ? 'Edit Payment' : 'Add Payment'}
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
            {/* Left column - Payment Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-1 border-b">
                Payment Details
              </h3>
              
              {/* Advisor */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advisor *
                </label>
                <select
                  className={cn(
                    "block w-full px-3 py-2 form-input",
                    errors.advisorId ? 'border-red-300' : 'border-gray-300'
                  )}
                  value={advisorId}
                  onChange={(e) => setAdvisorId(e.target.value)}
                  disabled={isEdit} // Can't change advisor for existing payment
                >
                  <option value="">Select an advisor</option>
                  {advisors.map((advisor) => (
                    <option key={advisor.id} value={advisor.id}>
                      {advisor.name}
                    </option>
                  ))}
                </select>
                {errors.advisorId && (
                  <p className="mt-1 text-sm text-red-600">{errors.advisorId}</p>
                )}
              </div>
              
              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status *
                </label>
                <select
                  className="block w-full px-3 py-2 form-input border-gray-300"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                >
                  {Object.values(PaymentStatus).map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    className={cn(
                      "block w-full px-3 py-2 form-input",
                      errors.paymentDate ? 'border-red-300' : 'border-gray-300'
                    )}
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                  {errors.paymentDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    className={cn(
                      "block w-full px-3 py-2 form-input",
                      errors.dueDate ? 'border-red-300' : 'border-gray-300'
                    )}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                  )}
                </div>
              </div>
              
              {/* Payment Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  className="block w-full px-3 py-2 form-input border-gray-300"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Reference Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  className="block w-full px-3 py-2 form-input border-gray-300"
                  placeholder="Transaction reference"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  className={cn(
                    "block w-full px-3 py-2 form-input",
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="Payment description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>
            
            {/* Right column - Commission Details & Leads */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-1 border-b">
                Commission Details
              </h3>
              
              {/* Commission Calculation */}
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="block w-full px-3 py-2 form-input border-gray-300"
                    placeholder="Total deal value"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="block w-full px-3 py-2 form-input border-gray-300"
                    placeholder="Commission percentage"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bonus Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="block w-full px-3 py-2 form-input border-gray-300"
                    placeholder="Additional bonus"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded">
                  <span className="text-sm font-medium text-gray-500">Total Payment:</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(amount)}</span>
                </div>
              </div>
              
              <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-1 border-b">
                Related Leads
              </h3>
              
              {/* Related Leads */}
              <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg">
                {!advisorId ? (
                  <div className="p-4 text-center text-gray-500">
                    Select an advisor to see their closed leads
                  </div>
                ) : leadsLoading ? (
                  <div className="p-4 text-center">
                    <div className="inline-block animate-spin mr-2">
                      <RefreshCw className="h-5 w-5 text-gray-400" />
                    </div>
                    Loading leads...
                  </div>
                ) : leads.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No closed leads found for this advisor
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        className={cn(
                          "p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50",
                          relatedLeads.includes(lead.id) ? 'bg-blue-50' : ''
                        )}
                        onClick={() => toggleLead(lead.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={relatedLeads.includes(lead.id)}
                              onChange={() => {}}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{lead.businessDetails.name}</div>
                              <div className="text-xs text-gray-500">{lead.clientName}</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(lead.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              {isEdit ? 'Update Payment' : 'Create Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Payments;