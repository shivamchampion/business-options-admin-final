// src/pages/advisors/CommissionStructure.tsx
import React, { useState, useEffect } from 'react';
import { useLoading } from '@/context/LoadingContext';
import { Plus, RefreshCw, Info, Edit, Trash, Tag, Percent, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/ErrorBoundary';
import { CommissionTier, CommissionStructure, CommissionThreshold } from '@/types/firebase';
import { getCommissionStructures, saveCommissionStructure, deleteCommissionStructure } from '@/services/advisorService';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const CommissionTiers: React.FC = () => {
  usePageTitle('Commission Structure');
  const { startLoading, stopLoading } = useLoading();
  
  const [commissionStructures, setCommissionStructures] = useState<CommissionStructure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCommission, setEditCommission] = useState<CommissionStructure | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<{[key: string]: boolean}>({});
  
  // Load commission structures on mount
  useEffect(() => {
    loadCommissionStructures();
  }, []);
  
  // Load commission structures from Firestore
  const loadCommissionStructures = async () => {
    try {
      startLoading('Loading commission structures...');
      setIsLoading(true);
      
      const structures = await getCommissionStructures();
      setCommissionStructures(structures);
      
      // Expand the first tier by default if there are any
      if (structures.length > 0) {
        setExpandedTiers({ [structures[0].id]: true });
      }
    } catch (error) {
      console.error('Error loading commission structures:', error);
      toast.error('Failed to load commission structures. Please try again.');
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };
  
  // Toggle expanded state for a tier
  const toggleExpanded = (id: string) => {
    setExpandedTiers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Get a color for the commission tier
  const getTierColor = (tier: CommissionTier) => {
    switch(tier) {
      case CommissionTier.BRONZE:
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case CommissionTier.SILVER:
        return 'bg-gray-50 border-gray-200 text-gray-800';
      case CommissionTier.GOLD:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case CommissionTier.PLATINUM:
        return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <ErrorBoundary>
      <div>
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commission Structure</h1>
            <p className="mt-1 text-sm text-gray-500">Manage commission tiers and rates for advisors</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={loadCommissionStructures}
              isLoading={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditCommission(null);
                setIsFormOpen(true);
              }}
            >
              Add Commission Tier
            </Button>
          </div>
        </div>
        
        {/* Info banner */}
        <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
          <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">About Commission Structures</p>
            <p>
              Commission structures define the percentage commission advisors earn based on their tier and the 
              value of deals they close. Higher tiers and higher value deals typically earn higher commission rates.
            </p>
          </div>
        </div>
        
        {/* Commission Structures */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <RefreshCw className="h-8 w-8 text-gray-400" />
              </div>
              <p className="mt-4 text-gray-500">Loading commission structures...</p>
            </div>
          ) : commissionStructures.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
              <h3 className="text-lg font-medium text-gray-500 mb-2">No commission structures found</h3>
              <p className="text-gray-400 mb-6">Set up commission tiers to manage advisor earnings</p>
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setEditCommission(null);
                  setIsFormOpen(true);
                }}
              >
                Add Commission Tier
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {commissionStructures.map((commission) => (
                <div 
                  key={commission.id}
                  className={cn(
                    "border rounded-lg overflow-hidden",
                    getTierColor(commission.tier)
                  )}
                >
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpanded(commission.id)}
                  >
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 mr-2" />
                      <h3 className="text-lg font-semibold capitalize">{commission.name}</h3>
                      <span className="ml-2 text-sm bg-white/80 px-2 py-0.5 rounded-full">
                        {commission.baseRate}% base rate
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="flex space-x-2 mr-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditCommission(commission);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-current hover:bg-white/30 rounded-full"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete the ${commission.name} tier?`)) {
                              deleteCommissionStructure(commission.id)
                                .then(() => {
                                  toast.success(`${commission.name} tier deleted successfully`);
                                  loadCommissionStructures();
                                })
                                .catch((error) => {
                                  console.error('Error deleting commission tier:', error);
                                  toast.error('Failed to delete commission tier');
                                });
                            }
                          }}
                          className="p-1.5 text-current hover:bg-white/30 rounded-full"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                      {expandedTiers[commission.id] ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  
                  {expandedTiers[commission.id] && (
                    <div className="px-4 pb-4">
                      <div className="bg-white/60 rounded-lg p-4">
                        <p className="text-sm mb-4">{commission.description}</p>
                        
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <Percent className="h-4 w-4 mr-1" />
                          Commission Thresholds
                        </h4>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Range
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Commission Rate
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Description
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {commission.thresholds.map((threshold, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                                    {formatCurrency(threshold.minAmount)} - {threshold.maxAmount ? formatCurrency(threshold.maxAmount) : 'No limit'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap font-medium flex items-center">
                                    <Percent className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                    {threshold.rate}%
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500">
                                    {threshold.description}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-4 text-xs text-gray-500 flex items-center">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Last updated: {commission.updatedAt?.toLocaleDateString() || 'Never'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Commission Form Modal */}
        {isFormOpen && (
          <CommissionForm
            onClose={() => setIsFormOpen(false)}
            commission={editCommission}
            onSave={(savedCommission) => {
              loadCommissionStructures();
              setIsFormOpen(false);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

// Commission Form Component
interface CommissionFormProps {
  onClose: () => void;
  commission: CommissionStructure | null;
  onSave: (commission: CommissionStructure) => void;
}

const CommissionForm: React.FC<CommissionFormProps> = ({ onClose, commission, onSave }) => {
  const { startLoading, stopLoading } = useLoading();
  const isEdit = !!commission;
  
  const [name, setName] = useState(commission?.name || '');
  const [tier, setTier] = useState<CommissionTier>(commission?.tier || CommissionTier.BRONZE);
  const [baseRate, setBaseRate] = useState(commission?.baseRate || 5);
  const [description, setDescription] = useState(commission?.description || '');
  const [thresholds, setThresholds] = useState<CommissionThreshold[]>(
    commission?.thresholds || [
      { minAmount: 0, maxAmount: 50000, rate: 5, description: 'Standard commission for small deals' },
      { minAmount: 50000, maxAmount: 250000, rate: 7.5, description: 'Increased rate for medium-sized deals' },
      { minAmount: 250000, maxAmount: null, rate: 10, description: 'Premium rate for large deals' }
    ]
  );
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add threshold
  const addThreshold = () => {
    const lastThreshold = thresholds[thresholds.length - 1];
    const newMinAmount = lastThreshold.maxAmount || lastThreshold.minAmount + 100000;
    
    setThresholds([
      ...thresholds,
      {
        minAmount: newMinAmount,
        maxAmount: null,
        rate: lastThreshold.rate + 2.5,
        description: 'New threshold tier'
      }
    ]);
  };
  
  // Remove threshold
  const removeThreshold = (index: number) => {
    setThresholds(thresholds.filter((_, i) => i !== index));
  };
  
  // Update threshold
  const updateThreshold = (index: number, field: keyof CommissionThreshold, value: any) => {
    setThresholds(thresholds.map((threshold, i) => {
      if (i === index) {
        return {
          ...threshold,
          [field]: field === 'maxAmount' && (value === '' || value === 0) ? null : value
        };
      }
      return threshold;
    }));
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (baseRate < 0 || baseRate > 100) {
      newErrors.baseRate = 'Base rate must be between 0 and 100';
    }
    
    // Validate thresholds
    let hasThresholdErrors = false;
    thresholds.forEach((threshold, index) => {
      if (threshold.minAmount < 0) {
        newErrors[`threshold_${index}_min`] = 'Minimum amount cannot be negative';
        hasThresholdErrors = true;
      }
      
      if (threshold.maxAmount !== null && threshold.maxAmount <= threshold.minAmount) {
        newErrors[`threshold_${index}_max`] = 'Maximum amount must be greater than minimum';
        hasThresholdErrors = true;
      }
      
      if (threshold.rate < 0 || threshold.rate > 100) {
        newErrors[`threshold_${index}_rate`] = 'Rate must be between 0 and 100';
        hasThresholdErrors = true;
      }
      
      if (!threshold.description.trim()) {
        newErrors[`threshold_${index}_desc`] = 'Description is required';
        hasThresholdErrors = true;
      }
    });
    
    if (hasThresholdErrors) {
      newErrors.thresholds = 'Please fix the errors in your thresholds';
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
    startLoading(isEdit ? 'Updating commission structure...' : 'Creating commission structure...');
    
    try {
      const commissionData: Partial<CommissionStructure> & { tier: CommissionTier } = {
        id: commission?.id,
        name,
        tier,
        baseRate,
        description,
        thresholds,
        isActive: true
      };
      
      const savedCommission = await saveCommissionStructure(commissionData);
      toast.success(`Commission structure ${isEdit ? 'updated' : 'created'} successfully`);
      onSave(savedCommission);
    } catch (error) {
      console.error('Error saving commission structure:', error);
      toast.error(error instanceof Error 
        ? error.message 
        : 'Failed to save commission structure'
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
            {isEdit ? 'Edit Commission Structure' : 'Add Commission Structure'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <Trash className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div>
              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier Name *
                </label>
                <input
                  type="text"
                  className={cn(
                    "block w-full px-3 py-2 form-input",
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="e.g. Bronze Tier"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              {/* Tier */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Tier *
                </label>
                <select
                  className={cn(
                    "block w-full px-3 py-2 form-input",
                    errors.tier ? 'border-red-300' : 'border-gray-300'
                  )}
                  value={tier}
                  onChange={(e) => setTier(e.target.value as CommissionTier)}
                >
                  <option value={CommissionTier.BRONZE}>Bronze</option>
                  <option value={CommissionTier.SILVER}>Silver</option>
                  <option value={CommissionTier.GOLD}>Gold</option>
                  <option value={CommissionTier.PLATINUM}>Platinum</option>
                </select>
                {errors.tier && (
                  <p className="mt-1 text-sm text-red-600">{errors.tier}</p>
                )}
              </div>
              
              {/* Base Rate */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Commission Rate (%) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  className={cn(
                    "block w-full px-3 py-2 form-input",
                    errors.baseRate ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="e.g. 5"
                  value={baseRate}
                  onChange={(e) => setBaseRate(parseFloat(e.target.value))}
                />
                {errors.baseRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.baseRate}</p>
                )}
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className={cn(
                    "block w-full px-3 py-2 form-input",
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="Describe this commission tier"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>
            
            {/* Right column - Thresholds */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Deal Value Thresholds</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="h-3 w-3" />}
                  onClick={addThreshold}
                >
                  Add Threshold
                </Button>
              </div>
              
              {errors.thresholds && (
                <p className="mt-1 mb-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                  {errors.thresholds}
                </p>
              )}
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {thresholds.map((threshold, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Threshold #{index + 1}</h4>
                      {thresholds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeThreshold(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Min Amount ($) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          className={cn(
                            "block w-full px-3 py-1 form-input text-sm",
                            errors[`threshold_${index}_min`] ? 'border-red-300' : 'border-gray-300'
                          )}
                          value={threshold.minAmount}
                          onChange={(e) => updateThreshold(index, 'minAmount', parseFloat(e.target.value))}
                        />
                        {errors[`threshold_${index}_min`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`threshold_${index}_min`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Max Amount ($) 
                          <span className="ml-1 text-gray-400">(Empty for no limit)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          className={cn(
                            "block w-full px-3 py-1 form-input text-sm",
                            errors[`threshold_${index}_max`] ? 'border-red-300' : 'border-gray-300'
                          )}
                          value={threshold.maxAmount === null ? '' : threshold.maxAmount}
                          onChange={(e) => updateThreshold(
                            index, 
                            'maxAmount', 
                            e.target.value === '' ? null : parseFloat(e.target.value)
                          )}
                        />
                        {errors[`threshold_${index}_max`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`threshold_${index}_max`]}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500 mb-1">
                        Commission Rate (%) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        className={cn(
                          "block w-full px-3 py-1 form-input text-sm",
                          errors[`threshold_${index}_rate`] ? 'border-red-300' : 'border-gray-300'
                        )}
                        value={threshold.rate}
                        onChange={(e) => updateThreshold(index, 'rate', parseFloat(e.target.value))}
                      />
                      {errors[`threshold_${index}_rate`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`threshold_${index}_rate`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        className={cn(
                          "block w-full px-3 py-1 form-input text-sm",
                          errors[`threshold_${index}_desc`] ? 'border-red-300' : 'border-gray-300'
                        )}
                        value={threshold.description}
                        onChange={(e) => updateThreshold(index, 'description', e.target.value)}
                      />
                      {errors[`threshold_${index}_desc`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`threshold_${index}_desc`]}</p>
                      )}
                    </div>
                  </div>
                ))}
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
              {isEdit ? 'Update Commission Structure' : 'Create Commission Structure'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommissionTiers;