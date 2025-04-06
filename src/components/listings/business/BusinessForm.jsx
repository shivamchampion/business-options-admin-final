import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import Select from 'react-select';
import { 
  Info, 
  AlertCircle, 
  HelpCircle, 
  CheckIcon,
  Calendar
} from 'lucide-react';
import { BusinessType, EntityType, LocationType, RevenueTrend } from '@/types/listings';
import { cn } from '@/lib/utils';
import { FormSection, Switch } from '@/components/ui/FormField';
import { toast } from 'react-hot-toast';

// Options for dropdowns
const businessTypeOptions = [
  { value: BusinessType.RETAIL, label: "Retail" },
  { value: BusinessType.MANUFACTURING, label: "Manufacturing" },
  { value: BusinessType.SERVICE, label: "Service" },
  { value: BusinessType.DISTRIBUTION, label: "Distribution" },
  { value: BusinessType.F_AND_B, label: "Food & Beverage" },
  { value: BusinessType.IT, label: "Information Technology" },
  { value: BusinessType.HEALTHCARE, label: "Healthcare" },
  { value: BusinessType.OTHER, label: "Other" },
];

const entityTypeOptions = [
  { value: EntityType.SOLE_PROPRIETORSHIP, label: "Sole Proprietorship" },
  { value: EntityType.PARTNERSHIP, label: "Partnership" },
  { value: EntityType.LLC, label: "LLC" },
  { value: EntityType.PRIVATE_LIMITED, label: "Private Limited" },
  { value: EntityType.LLP, label: "LLP" },
  { value: EntityType.CORPORATION, label: "Corporation" },
];

const locationTypeOptions = [
  { value: LocationType.LEASED_COMMERCIAL, label: "Leased Commercial" },
  { value: LocationType.OWNED_PROPERTY, label: "Owned Property" },
  { value: LocationType.HOME_BASED, label: "Home-based" },
  { value: LocationType.VIRTUAL, label: "Virtual" },
  { value: LocationType.MOBILE, label: "Mobile" },
];

const revenueTrendOptions = [
  { value: RevenueTrend.GROWING, label: "Growing (>10%)" },
  { value: RevenueTrend.STABLE, label: "Stable (±10%)" },
  { value: RevenueTrend.DECLINING, label: "Declining (<-10%)" },
];

// Tooltip component - exact match with BasicInfo
const Tooltip = ({ content, children }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute z-50 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible 
        transform -translate-x-1/2 left-1/2 bottom-full mb-2 transition-all duration-200 ease-in-out pointer-events-none">
        <div className="relative bg-gray-800 text-white text-xs rounded-md p-2 text-center shadow-lg">
          {content}
          <div className="absolute w-2.5 h-2.5 bg-gray-800 transform rotate-45 -bottom-[5px] left-1/2 -translate-x-1/2"></div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format error messages for better user experience
const getImprovedErrorMessage = (errors, fieldPath) => {
  if (!errors || !fieldPath) return null;
  
  // Navigate through the error object to find the field
  const parts = fieldPath.split('.');
  let current = errors;
  
  for (const part of parts) {
    if (!current || !current[part]) return null;
    current = current[part];
  }
  
  if (!current || !current.message) return null;
  
  // Format the field name for display
  const getFieldDisplayName = (path) => {
    const lastPart = path.split('.').pop();
    // Convert camelCase to spaces and capitalize first letter
    const formatted = lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    // Replace common fields with more user-friendly names
    const replacements = {
      'Business Type': 'Business type',
      'Entity Type': 'Entity type',
      'Established Year': 'Year business was established',
      'Registration Number': 'Business registration number',
      'Operations Location Type': 'Business location type',
      'Operations Employees Count': 'Total number of employees',
      'Operations Employees Full Time': 'Number of full-time employees',
      'Operations Operation Description': 'Business operations description',
      'Financials Annual Revenue Value': 'Annual revenue',
      'Financials Monthly Revenue Value': 'Monthly revenue',
      'Financials Profit Margin Percentage': 'Profit margin percentage',
      'Financials Revenue Trend': 'Revenue trend',
      'Financials Customer Concentration': 'Customer concentration',
      'Sale Asking Price Value': 'Asking price',
      'Sale Reason For Selling': 'Reason for selling',
      'Sale Transition Period': 'Transition period',
      'Sale Training Included': 'Training details',
      'Sale Assets Included': 'Assets included in sale'
    };
    
    return replacements[formatted] || formatted;
  };
  
  // Make "required" messages more descriptive
  if (current.message === "Required" || current.message === "required") {
    return `Please provide ${getFieldDisplayName(fieldPath)}`;
  }
  
  return current.message;
};

// Main Business Form Component
export default function BusinessForm({ submitAttempted = false, shouldShowErrors = false }) {
  // Use parent form context
  const { 
    control, 
    register,
    watch, 
    setValue, 
    getValues, 
    trigger,
    formState: { errors },
    setError: setCustomError,
    clearErrors
  } = useFormContext();

  // Watch for values that affect conditional rendering
  const locationType = watch("businessDetails.operations.locationType");
  const sellerFinancingAvailable = watch("businessDetails.sale.sellerFinancing.isAvailable");
  const inventoryIncluded = watch("businessDetails.financials.inventory.isIncluded");
  const equipmentIncluded = watch("businessDetails.financials.equipment.isIncluded");

  // Validate all fields when form submission is attempted or shouldShowErrors is true
  useEffect(() => {
    if (submitAttempted || shouldShowErrors) {
      // Create a comprehensive list of fields to validate
      const basicFields = [
        'businessDetails.businessType',
        'businessDetails.entityType',
        'businessDetails.establishedYear',
        'businessDetails.registrationNumber',
        'businessDetails.operations.locationType',
        'businessDetails.operations.operationDescription',
        'businessDetails.financials.annualRevenue.value',
        'businessDetails.financials.monthlyRevenue.value',
        'businessDetails.financials.profitMargin.percentage',
        'businessDetails.financials.revenueTrend',
        'businessDetails.financials.customerConcentration',
        'businessDetails.sale.askingPrice.value',
        'businessDetails.sale.reasonForSelling',
        'businessDetails.sale.transitionPeriod',
        'businessDetails.sale.trainingIncluded',
        'businessDetails.sale.assetsIncluded'
      ];
      
      // Add conditional fields based on current form state
      const conditionalFields = [];
      
      // 1. Lease information (when location type is leased_commercial)
      if (locationType === 'leased_commercial') {
        conditionalFields.push(
          'businessDetails.operations.leaseInformation.expiryDate',
          'businessDetails.operations.leaseInformation.monthlyCost.value'
        );
      }
      
      // 2. Inventory fields (when inventory is included)
      if (inventoryIncluded) {
        conditionalFields.push(
          'businessDetails.financials.inventory.value.value',
          'businessDetails.financials.inventory.description'
        );
      }
      
      // 3. Equipment fields (when equipment is included)
      if (equipmentIncluded) {
        conditionalFields.push(
          'businessDetails.financials.equipment.value.value',
          'businessDetails.financials.equipment.description'
        );
      }
      
      // 4. Seller financing fields (when financing is available)
      if (sellerFinancingAvailable) {
        conditionalFields.push(
          'businessDetails.sale.sellerFinancing.details',
          'businessDetails.sale.sellerFinancing.downPaymentPercentage'
        );
      }
      
      // Combine all fields and trigger validation
      const allFields = [...basicFields, ...conditionalFields];
      console.log("Validating business fields:", allFields);
      
      // Trigger validation for each field to gather all errors
      Promise.all(allFields.map(field => trigger(field)))
        .then(() => {
          // Log business form validation errors for debugging
          const businessErrors = Object.keys(errors).filter(key => 
            key.startsWith('businessDetails')
          );
          
          if (businessErrors.length > 0) {
            console.log("Business form validation errors:", businessErrors);
            
            // Create a human-readable message mapping for each field
            const errorFieldMap = businessErrors.map(field => {
              const displayName = getImprovedErrorMessage(errors, field) || `Error in ${field.split('.').pop()}`;
              return { field, displayName };
            });
            
            console.log("Validation errors with display names:", errorFieldMap);
            
            // Find the first error field element in the DOM
            for (const fieldError of errorFieldMap) {
              // Try to find by exact match first
              let errorField = document.querySelector(`[name="${fieldError.field}"]`);
              
              // If not found, try partial match (for nested fields)
              if (!errorField) {
                errorField = document.querySelector(`[name$="${fieldError.field.split('.').pop()}"]`);
              }
              
              // Try select components which might have different naming
              if (!errorField) {
                const fieldId = fieldError.field.split('.').pop();
                errorField = document.getElementById(fieldId) || document.getElementById(fieldError.field);
              }
              
              if (errorField) {
                // Highlight the error field
                errorField.classList.add('error-highlight');
                
                // Scroll to the error field with some context
                errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                errorField.focus();
                
                // Add a visual effect to draw attention
                errorField.style.border = '2px solid #EF4444';
                setTimeout(() => {
                  errorField.style.border = '';
                }, 5000);
                
                // Show a specific error toast for this field
                toast.error(`Please fix: ${fieldError.displayName}`, {
                  duration: 5000,
                  position: 'bottom-center'
                });
                
                break; // Only handle the first error
              }
            }
          }
          
          // Ensure employee fields are never validated
          setTimeout(() => {
            // Remove any validation errors from employee fields
            clearErrors([
              "businessDetails.operations.employees.count",
              "businessDetails.operations.employees.fullTime",
              "businessDetails.operations.employees.partTime",
              "businessDetails.operations.employees"
            ]);
          }, 100);
        })
        .catch(error => {
          console.error("Error during validation:", error);
        });
    }
  }, [
    submitAttempted, 
    shouldShowErrors, 
    trigger, 
    clearErrors, 
    locationType, 
    inventoryIncluded, 
    equipmentIncluded, 
    sellerFinancingAvailable,
    errors
  ]);

  // Custom styles for react-select - match exactly with BasicInfo form
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      fontSize: '0.875rem',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#0031ac' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 1px #0031ac' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#0031ac' : '#9CA3AF'
      },
      "&:focus": {
        borderColor: '#0031ac',
        boxShadow: '0 0 0 1px #0031ac'
      }
    }),
    option: (base, state) => ({
      ...base,
      padding: '8px 12px',
      fontSize: '0.875rem',
      backgroundColor: state.isSelected ? '#0031ac' : state.isFocused ? '#E6EEFF' : null,
      color: state.isSelected ? 'white' : '#333333'
    }),
    placeholder: base => ({
      ...base,
      fontSize: '0.875rem'
    }),
    singleValue: base => ({
      ...base,
      fontSize: '0.875rem'
    }),
    valueContainer: base => ({
      ...base,
      padding: '0 12px'
    }),
    input: base => ({
      ...base,
      margin: '0',
      padding: '0'
    })
  };

  return (
    <div className="space-y-6">
      {/* Info Message */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Business Details</p>
          <p>
            Provide comprehensive information about your business operations, financials, and sale terms.
            All fields marked with an asterisk (*) are required.
          </p>
        </div>
      </div>

      {/* Business Information Section */}
      <FormSection 
        title="Business Information" 
        description="Basic details about your business entity and structure"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Type */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Business Type <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Select the primary category that best describes your business operations">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <Select
              inputId="businessDetails.businessType"
              options={businessTypeOptions}
              value={businessTypeOptions.find(option => option.value === watch("businessDetails.businessType"))}
              onChange={(option) => {
                setValue("businessDetails.businessType", option.value);
                trigger("businessDetails.businessType");
              }}
              onBlur={() => trigger("businessDetails.businessType")}
              placeholder="Select business type"
              styles={selectStyles}
              className={cn(
                errors.businessDetails?.businessType ? "select-error" : ""
              )}
            />

            {errors.businessDetails?.businessType && (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.businessType")}
              </p>
            )}
          </div>

          {/* Entity Type */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Entity Type <span className="text-red-500">*</span>
              </label>
              <Tooltip content="The legal structure under which your business operates">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <Select
              inputId="businessDetails.entityType"
              options={entityTypeOptions}
              value={entityTypeOptions.find(option => option.value === watch("businessDetails.entityType"))}
              onChange={(option) => {
                setValue("businessDetails.entityType", option.value);
                trigger("businessDetails.entityType");
              }}
              onBlur={() => trigger("businessDetails.entityType")}
              placeholder="Select entity type"
              styles={selectStyles}
              className={cn(
                errors.businessDetails?.entityType ? "select-error" : ""
              )}
            />

            {errors.businessDetails?.entityType && (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.entityType")}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Established Year */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.establishedYear" className="block text-sm font-semibold text-gray-800 mr-2">
                Established Year <span className="text-red-500">*</span>
              </label>
              <Tooltip content="The year your business was founded or incorporated">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <input
                id="businessDetails.establishedYear"
                type="number"
                placeholder={`1900-${new Date().getFullYear()}`}
                className={cn(
                  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors pr-10",
                  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  errors.businessDetails?.establishedYear ? "border-red-300" : "border-gray-300"
                )}
                {...register("businessDetails.establishedYear", {
                  onBlur: () => trigger("businessDetails.establishedYear")
                })}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {errors.businessDetails?.establishedYear ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.establishedYear")}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Enter the year when your business was founded
              </p>
            )}
          </div>

          {/* Registration Number */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.registrationNumber" className="block text-sm font-semibold text-gray-800 mr-2">
                Registration Number <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Official business registration or CIN number">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="businessDetails.registrationNumber"
              type="text"
              placeholder="e.g. U72200MH2019PTC123456"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.businessDetails?.registrationNumber ? "border-red-300" : "border-gray-300"
              )}
              {...register("businessDetails.registrationNumber", {
                onBlur: () => trigger("businessDetails.registrationNumber")
              })}
            />

            {errors.businessDetails?.registrationNumber ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.registrationNumber")}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Enter your business registration or CIN number
              </p>
            )}
          </div>

          {/* GST Number */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.gstNumber" className="block text-sm font-semibold text-gray-800 mr-2">
                GST Number (Optional)
              </label>
              <Tooltip content="Goods and Services Tax identification number">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="businessDetails.gstNumber"
              type="text"
              placeholder="e.g. 27AAPFU0939F1ZV"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("businessDetails.gstNumber")}
            />

            <p className="text-xs text-gray-500 mt-1">
              Enter your GST number if applicable
            </p>
          </div>
        </div>

        {/* PAN Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.panNumber" className="block text-sm font-semibold text-gray-800 mr-2">
                PAN Number (Optional)
              </label>
              <Tooltip content="Permanent Account Number issued by the Income Tax Department">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="businessDetails.panNumber"
              type="text"
              placeholder="e.g. ABCDE1234F"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("businessDetails.panNumber")}
            />

            <p className="text-xs text-gray-500 mt-1">
              Enter your PAN number if applicable
            </p>
          </div>
        </div>
      </FormSection>

      {/* Operations Section */}
      <FormSection 
        title="Operations" 
        description="Details about how your business operates day-to-day"
      >
        {/* Employee Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="total-employees" className="block text-sm font-semibold text-gray-800 mr-2">
                Total Employees <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Number of people currently employed by your business">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="total-employees"
              type="number"
              min="0"
              placeholder="e.g. 10"
              defaultValue={getValues("businessDetails.operations.employees.count") || ""}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              onChange={(e) => {
                const value = e.target.value;
                
                // Update React Hook Form value (but don't trigger validation)
                setValue("businessDetails.operations.employees.count", value, { 
                  shouldValidate: false,
                  shouldDirty: true,
                  shouldTouch: true
                });
                
                // Clear any existing errors
                clearErrors("businessDetails.operations.employees.count");
                
                // Get the current fullTime value
                const fullTimeInput = document.getElementById("full-time-employees");
                const fullTime = parseInt(fullTimeInput?.value || "0");
                const total = parseInt(value || "0");
                
                // Calculate partTime
                const partTime = Math.max(0, total - fullTime);
                const partTimeInput = document.getElementById("part-time-employees");
                if (partTimeInput) partTimeInput.value = partTime;
                
                // Update React Hook Form (silently)
                setValue("businessDetails.operations.employees.partTime", partTime.toString(), { 
                  shouldValidate: false 
                });
                
                // If fullTime > total, adjust fullTime
                if (fullTime > total && !isNaN(total)) {
                  if (fullTimeInput) fullTimeInput.value = total;
                  setValue("businessDetails.operations.employees.fullTime", total.toString(), { 
                    shouldValidate: false 
                  });
                  
                  toast("Full-time employees adjusted to match total employee count", {
                    icon: 'ℹ️',
                    style: { background: '#E3F2FD', color: '#0D47A1' }
                  });
                }
              }}
            />

              <p className="text-xs text-gray-500 mt-1">
                Total number of employees in your business
              </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="full-time-employees" className="block text-sm font-semibold text-gray-800 mr-2">
                Full-time Employees <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Number of full-time employees (40+ hours per week)">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="full-time-employees"
              type="number"
              min="0"
              placeholder="e.g. 8"
              defaultValue={getValues("businessDetails.operations.employees.fullTime") || ""}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              onChange={(e) => {
                const value = e.target.value;
                
                // Update React Hook Form value (but don't trigger validation)
                setValue("businessDetails.operations.employees.fullTime", value, { 
                  shouldValidate: false,
                  shouldDirty: true,
                  shouldTouch: true
                });
                
                // Clear any existing errors
                clearErrors("businessDetails.operations.employees.fullTime");
                
                // Get the current total value
                const totalInput = document.getElementById("total-employees");
                const total = parseInt(totalInput?.value || "0");
                const fullTime = parseInt(value || "0");
                
                // If fullTime > total, show warning
                if (fullTime > total && !isNaN(total) && !isNaN(fullTime)) {
                  e.target.value = total;
                  setValue("businessDetails.operations.employees.fullTime", total.toString(), { 
                    shouldValidate: false 
                  });
                  
                  toast("Full-time employees cannot exceed total employees", {
                    icon: '⚠️',
                    style: { background: '#FFF9C4', color: '#5D4037' }
                  });
                  
                  // Set part-time to 0
                  const partTimeInput = document.getElementById("part-time-employees");
                  if (partTimeInput) partTimeInput.value = "0";
                  setValue("businessDetails.operations.employees.partTime", "0", { 
                    shouldValidate: false 
                  });
                } else {
                  // Calculate partTime
                  const partTime = Math.max(0, total - fullTime);
                  const partTimeInput = document.getElementById("part-time-employees");
                  if (partTimeInput) partTimeInput.value = partTime;
                  setValue("businessDetails.operations.employees.partTime", partTime.toString(), { 
                    shouldValidate: false 
                  });
                }
              }}
            />

              <p className="text-xs text-gray-500 mt-1">
                Number of employees working full-time
              </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="part-time-employees" className="block text-sm font-semibold text-gray-800 mr-2">
                Part-time Employees
              </label>
              <Tooltip content="This field is calculated automatically (Total - Full-time)">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="part-time-employees"
              type="number"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors bg-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled
              defaultValue={getValues("businessDetails.operations.employees.partTime") || "0"}
            />

            <p className="text-xs text-gray-500 mt-1">
              Automatically calculated (Total - Full-time)
            </p>
          </div>
        </div>

        {/* Location Type */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label className="block text-sm font-semibold text-gray-800 mr-2">
              Location Type <span className="text-red-500">*</span>
            </label>
            <Tooltip content="The type of location or property where your business operates">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <Select
            inputId="businessDetails.operations.locationType"
            options={locationTypeOptions}
            value={locationTypeOptions.find(option => option.value === locationType)}
            onChange={(option) => {
              setValue("businessDetails.operations.locationType", option.value);
              trigger("businessDetails.operations.locationType");
            }}
            onBlur={() => trigger("businessDetails.operations.locationType")}
            placeholder="Select location type"
            styles={selectStyles}
            className={cn(
              errors.businessDetails?.operations?.locationType ? "select-error" : ""
            )}
          />

          {errors.businessDetails?.operations?.locationType ? (
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {getImprovedErrorMessage(errors, "businessDetails.operations.locationType")}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Select the type of location where your business operates
            </p>
          )}
        </div>

        {/* Lease information (conditionally shown) */}
        {locationType === LocationType.LEASED_COMMERCIAL && (
          <div className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-800">Lease Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lease Expiry Date */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <label htmlFor="businessDetails.operations.leaseInformation.expiryDate" className="block text-sm font-semibold text-gray-800 mr-2">
                    Lease Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <Tooltip content="When the current lease agreement expires">
                    <HelpCircle className="h-4 w-4 text-gray-500" />
                  </Tooltip>
                </div>

                <input
                  type="date"
                  className={cn(
                    "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                    errors.businessDetails?.operations?.leaseInformation?.expiryDate ? "border-red-300" : "border-gray-300"
                  )}
                  {...register("businessDetails.operations.leaseInformation.expiryDate", {
                    onBlur: () => trigger("businessDetails.operations.leaseInformation.expiryDate")
                  })}
                />

                {errors.businessDetails?.operations?.leaseInformation?.expiryDate && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    {getImprovedErrorMessage(errors, "businessDetails.operations.leaseInformation.expiryDate")}
                  </p>
                )}
              </div>

              {/* Monthly Lease Cost */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <label htmlFor="businessDetails.operations.leaseInformation.monthlyCost.value" className="block text-sm font-semibold text-gray-800 mr-2">
                    Monthly Lease Cost <span className="text-red-500">*</span>
                  </label>
                  <Tooltip content="Monthly amount paid for leasing the property">
                    <HelpCircle className="h-4 w-4 text-gray-500" />
                  </Tooltip>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">₹</span>
                  </div>
                  <input
                    id="businessDetails.operations.leaseInformation.monthlyCost.value"
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    className={cn(
                      "w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                      errors.businessDetails?.operations?.leaseInformation?.monthlyCost?.value ? "border-red-300" : "border-gray-300"
                    )}
                    {...register("businessDetails.operations.leaseInformation.monthlyCost.value", {
                      onBlur: () => trigger("businessDetails.operations.leaseInformation.monthlyCost.value")
                    })}
                  />
                </div>

                {errors.businessDetails?.operations?.leaseInformation?.monthlyCost?.value && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    {getImprovedErrorMessage(errors, "businessDetails.operations.leaseInformation.monthlyCost.value")}
                  </p>
                )}
              </div>
            </div>

            {/* Lease Transferable */}
            <Switch
              name="businessDetails.operations.leaseInformation.isTransferable"
              label="Lease Transferable"
              description="Whether the lease can be transferred to the new owner"
            />
          </div>
        )}

        {/* Operation Description */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="businessDetails.operations.operationDescription" className="block text-sm font-semibold text-gray-800 mr-2">
              Operation Description <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Describe how your business operates on a day-to-day basis">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <textarea
            id="businessDetails.operations.operationDescription"
            rows="5"
            placeholder="Describe your business operations in detail..."
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.businessDetails?.operations?.operationDescription ? "border-red-300" : "border-gray-300"
            )}
            {...register("businessDetails.operations.operationDescription", {
              onBlur: () => trigger("businessDetails.operations.operationDescription")
            })}
          ></textarea>

          {errors.businessDetails?.operations?.operationDescription ? (
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {getImprovedErrorMessage(errors, "businessDetails.operations.operationDescription")}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              100-1000 characters. Include details about daily operations, business processes, and key activities.
            </p>
          )}
        </div>
      </FormSection>

      {/* Financial Section */}
      <FormSection 
        title="Financial Information" 
        description="Revenue, profits, and other financial metrics"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Annual Revenue */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.financials.annualRevenue.value" className="block text-sm font-semibold text-gray-800 mr-2">
                Annual Revenue <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Total revenue generated in the last financial year">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 text-sm">₹</span>
              </div>
              <input
                id="businessDetails.financials.annualRevenue.value"
                type="number"
                min="0"
                placeholder="e.g. 5000000"
                className={cn(
                  "w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.businessDetails?.financials?.annualRevenue?.value ? "border-red-300" : "border-gray-300"
                )}
                {...register("businessDetails.financials.annualRevenue.value", {
                  onBlur: () => trigger("businessDetails.financials.annualRevenue.value")
                })}
              />
            </div>

            {errors.businessDetails?.financials?.annualRevenue?.value ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.financials.annualRevenue.value")}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Total revenue for the last complete financial year
              </p>
            )}
          </div>

          {/* Monthly Revenue */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.financials.monthlyRevenue.value" className="block text-sm font-semibold text-gray-800 mr-2">
                Average Monthly Revenue <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Average monthly revenue in the last 12 months">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 text-sm">₹</span>
              </div>
              <input
                id="businessDetails.financials.monthlyRevenue.value"
                type="number"
                min="0"
                placeholder="e.g. 400000"
                className={cn(
                  "w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.businessDetails?.financials?.monthlyRevenue?.value ? "border-red-300" : "border-gray-300"
                )}
                {...register("businessDetails.financials.monthlyRevenue.value", {
                  onBlur: () => trigger("businessDetails.financials.monthlyRevenue.value")
                })}
              />
            </div>

            {errors.businessDetails?.financials?.monthlyRevenue?.value ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.financials.monthlyRevenue.value")}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Average monthly revenue over the past 12 months
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profit Margin */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.financials.profitMargin.percentage" className="block text-sm font-semibold text-gray-800 mr-2">
                Profit Margin <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Net profit as a percentage of revenue">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <input
                id="businessDetails.financials.profitMargin.percentage"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 25"
                className={cn(
                  "w-full pr-8 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.businessDetails?.financials?.profitMargin?.percentage ? "border-red-300" : "border-gray-300"
                )}
                {...register("businessDetails.financials.profitMargin.percentage", {
                  onBlur: () => trigger("businessDetails.financials.profitMargin.percentage")
                })}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>

            {errors.businessDetails?.financials?.profitMargin?.percentage ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.financials.profitMargin.percentage")}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Net profit as a percentage of total revenue (0-100%)
              </p>
            )}
          </div>

          {/* Revenue Trend */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Revenue Trend <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Overall trend in revenue over the past 12-24 months">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <Select
              inputId="businessDetails.financials.revenueTrend"
              options={revenueTrendOptions}
              value={revenueTrendOptions.find(option => option.value === watch("businessDetails.financials.revenueTrend"))}
              onChange={(option) => {
                setValue("businessDetails.financials.revenueTrend", option.value);
                trigger("businessDetails.financials.revenueTrend");
              }}
              onBlur={() => trigger("businessDetails.financials.revenueTrend")}
              placeholder="Select revenue trend"
              styles={selectStyles}
              className={cn(
                errors.businessDetails?.financials?.revenueTrend ? "select-error" : ""
              )}
            />

            {errors.businessDetails?.financials?.revenueTrend ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.financials.revenueTrend")}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Select the trend that best describes your revenue growth
              </p>
            )}
          </div>
        </div>

        {/* Inventory */}
        <div className="space-y-3 p-4 border border-gray-200 rounded-md mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h4 className="text-sm font-semibold text-gray-800 mr-2">Inventory</h4>
              <Tooltip content="Stock of goods held by the business">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <Switch
              name="businessDetails.financials.inventory.isIncluded"
              label="Inventory Included in Sale"
              description="Whether current inventory is included in the asking price"
            />
          </div>

          {inventoryIncluded && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inventory Value */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label htmlFor="businessDetails.financials.inventory.value.value" className="block text-sm font-semibold text-gray-800 mr-2">
                      Inventory Value <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">₹</span>
                    </div>
                    <input
                      id="businessDetails.financials.inventory.value.value"
                      type="number"
                      min="0"
                      placeholder="e.g. 500000"
                      className={cn(
                        "w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                        errors.businessDetails?.financials?.inventory?.value?.value ? "border-red-300" : "border-gray-300"
                      )}
                      {...register("businessDetails.financials.inventory.value.value", {
                        onBlur: () => trigger("businessDetails.financials.inventory.value.value")
                      })}
                    />
                  </div>

                  {errors.businessDetails?.financials?.inventory?.value?.value && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      {getImprovedErrorMessage(errors, "businessDetails.financials.inventory.value.value")}
                    </p>
                  )}
                </div>

                {/* Inventory Description */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label htmlFor="businessDetails.financials.inventory.description" className="block text-sm font-semibold text-gray-800 mr-2">
                      Inventory Description
                    </label>
                  </div>

                  <input
                    id="businessDetails.financials.inventory.description"
                    type="text"
                    placeholder="Brief description of inventory included"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                    {...register("businessDetails.financials.inventory.description")}
                  />

                  <p className="text-xs text-gray-500 mt-1">
                    Brief description of the inventory included in the sale
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional financial fields... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Concentration */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.financials.customerConcentration" className="block text-sm font-semibold text-gray-800 mr-2">
                Customer Concentration <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Percentage of revenue from your top 3 customers">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <input
                id="businessDetails.financials.customerConcentration"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 30"
                className={cn(
                  "w-full pr-8 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.businessDetails?.financials?.customerConcentration ? "border-red-300" : "border-gray-300"
                )}
                {...register("businessDetails.financials.customerConcentration", {
                  onBlur: () => trigger("businessDetails.financials.customerConcentration")
                })}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>

            {errors.businessDetails?.financials?.customerConcentration ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.financials.customerConcentration")}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Percentage of revenue from your top 3 customers
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Sale Details Section */}
      <FormSection 
        title="Sale Information" 
        description="Asking price, terms of sale, and transition details"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asking Price */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.sale.askingPrice.value" className="block text-sm font-semibold text-gray-800 mr-2">
                Asking Price <span className="text-red-500">*</span>
              </label>
              <Tooltip content="The amount you're asking for your business">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 text-sm">₹</span>
              </div>
              <input
                id="businessDetails.sale.askingPrice.value"
                type="number"
                min="0"
                placeholder="e.g. 10000000"
                className={cn(
                  "w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.businessDetails?.sale?.askingPrice?.value ? "border-red-300" : "border-gray-300"
                )}
                {...register("businessDetails.sale.askingPrice.value", {
                  onBlur: () => trigger("businessDetails.sale.askingPrice.value")
                })}
              />
            </div>

            {errors.businessDetails?.sale?.askingPrice?.value ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.sale.askingPrice.value")}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                The price you're asking for your business
              </p>
            )}
          </div>

          {/* Price Multiple */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.sale.askingPrice.priceMultiple" className="block text-sm font-semibold text-gray-800 mr-2">
                Price Multiple (Optional)
              </label>
              <Tooltip content="Multiple of annual profit used to determine asking price">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="businessDetails.sale.askingPrice.priceMultiple"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 3.5"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("businessDetails.sale.askingPrice.priceMultiple")}
            />

            {errors.businessDetails?.sale?.askingPrice?.priceMultiple ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.sale.askingPrice.priceMultiple")}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Multiple of yearly profit (e.g., 3x annual profit)
              </p>
            )}
          </div>
        </div>

        {/* Price Negotiable */}
        <Switch
          name="businessDetails.sale.askingPrice.isNegotiable"
          label="Price Negotiable"
          description="Whether you're open to negotiating the asking price"
        />

        {/* Reason for Selling */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="businessDetails.sale.reasonForSelling" className="block text-sm font-semibold text-gray-800 mr-2">
              Reason for Selling <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Explain why you're selling your business">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <textarea
            id="businessDetails.sale.reasonForSelling"
            rows="3"
            placeholder="Explain why you are selling the business..."
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.businessDetails?.sale?.reasonForSelling ? "border-red-300" : "border-gray-300"
            )}
            {...register("businessDetails.sale.reasonForSelling", {
              required: "Reason for selling is required",
              minLength: { value: 50, message: "Reason must be at least 50 characters" },
              maxLength: { value: 500, message: "Reason cannot exceed 500 characters" },
              onBlur: () => trigger("businessDetails.sale.reasonForSelling")
            })}
          ></textarea>

          {errors.businessDetails?.sale?.reasonForSelling ? (
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {getImprovedErrorMessage(errors, "businessDetails.sale.reasonForSelling")}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              50-500 characters. Be honest about your reasons for selling.
            </p>
          )}
        </div>

        {/* Seller Financing */}
        <div className="space-y-3 p-4 border border-gray-200 rounded-md mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h4 className="text-sm font-semibold text-gray-800 mr-2">Seller Financing</h4>
              <Tooltip content="Whether you're willing to finance part of the sale price">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <Switch
              name="businessDetails.sale.sellerFinancing.isAvailable"
              label="Seller Financing Available"
              description="Whether you're willing to finance part of the sale price"
            />
          </div>

          {sellerFinancingAvailable && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Down Payment Percentage */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label htmlFor="businessDetails.sale.sellerFinancing.percentage" className="block text-sm font-semibold text-gray-800 mr-2">
                      Minimum Down Payment <span className="text-red-500">*</span>
                    </label>
                    <Tooltip content="Minimum percentage required as down payment">
                      <HelpCircle className="h-4 w-4 text-gray-500" />
                    </Tooltip>
                  </div>

                  <div className="relative">
                    <input
                      id="businessDetails.sale.sellerFinancing.percentage"
                      type="number"
                      min="10"
                      max="100"
                      placeholder="e.g. 30"
                      className={cn(
                        "w-full pr-8 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                        errors.businessDetails?.sale?.sellerFinancing?.percentage ? "border-red-300" : "border-gray-300"
                      )}
                      {...register("businessDetails.sale.sellerFinancing.percentage", {
                        onBlur: () => trigger("businessDetails.sale.sellerFinancing.percentage")
                      })}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>

                  {errors.businessDetails?.sale?.sellerFinancing?.percentage ? (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      {getImprovedErrorMessage(errors, "businessDetails.sale.sellerFinancing.percentage")}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum down payment required (10%-100%)
                    </p>
                  )}
                </div>

                {/* Financing Details */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label htmlFor="businessDetails.sale.sellerFinancing.terms" className="block text-sm font-semibold text-gray-800 mr-2">
                      Financing Details <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <input
                    id="businessDetails.sale.sellerFinancing.terms"
                    type="text"
                    placeholder="e.g. 5-year term at 8% interest"
                    className={cn(
                      "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                      errors.businessDetails?.sale?.sellerFinancing?.terms ? "border-red-300" : "border-gray-300"
                    )}
                    {...register("businessDetails.sale.sellerFinancing.terms", {
                      onBlur: () => trigger("businessDetails.sale.sellerFinancing.terms")
                    })}
                  />

                  {errors.businessDetails?.sale?.sellerFinancing?.terms ? (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      {getImprovedErrorMessage(errors, "businessDetails.sale.sellerFinancing.terms")}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Terms of financing (interest rate, time period, etc.)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transition and Training */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transition Period */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.sale.transitionPeriod" className="block text-sm font-semibold text-gray-800 mr-2">
                Transition Period (Months) <span className="text-red-500">*</span>
              </label>
              <Tooltip content="How long you'll stay to help the new owner transition">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="businessDetails.sale.transitionPeriod"
              type="number"
              min="0"
              max="12"
              placeholder="e.g. 3"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.businessDetails?.sale?.transitionPeriod ? "border-red-300" : "border-gray-300"
              )}
              {...register("businessDetails.sale.transitionPeriod", {
                onBlur: () => trigger("businessDetails.sale.transitionPeriod")
              })}
            />

            {errors.businessDetails?.sale?.transitionPeriod ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {getImprovedErrorMessage(errors, "businessDetails.sale.transitionPeriod")}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Number of months you'll help with transition (0-12)
              </p>
            )}
          </div>
        </div>

        {/* Training Details */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="businessDetails.sale.trainingIncluded" className="block text-sm font-semibold text-gray-800 mr-2">
              Training Details <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Training and support you'll provide to the new owner">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <textarea
            id="businessDetails.sale.trainingIncluded"
            rows="3"
            placeholder="Describe the training you will provide to the new owner..."
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.businessDetails?.sale?.trainingIncluded ? "border-red-300" : "border-gray-300"
            )}
            {...register("businessDetails.sale.trainingIncluded", {
              required: "Training details are required",
              minLength: { value: 50, message: "Training details must be at least 50 characters" },
              maxLength: { value: 500, message: "Training details cannot exceed 500 characters" },
              onBlur: () => trigger("businessDetails.sale.trainingIncluded")
            })}
          ></textarea>

          {errors.businessDetails?.sale?.trainingIncluded ? (
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {getImprovedErrorMessage(errors, "businessDetails.sale.trainingIncluded")}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              50-500 characters. Describe the training and support you'll provide.
            </p>
          )}
        </div>

        {/* Assets Included */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="businessDetails.sale.assetsIncluded" className="block text-sm font-semibold text-gray-800 mr-2">
              Assets Included <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Description of physical and intangible assets included in the sale">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <textarea
            id="businessDetails.sale.assetsIncluded"
            rows="4"
            placeholder="List all assets included in the sale (equipment, inventory, intellectual property, etc.)..."
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.businessDetails?.sale?.assetsIncluded ? "border-red-300" : "border-gray-300"
            )}
            {...register("businessDetails.sale.assetsIncluded", {
              required: "Assets included description is required",
              minLength: { value: 100, message: "Assets description must be at least 100 characters" },
              maxLength: { value: 1000, message: "Assets description cannot exceed 1000 characters" },
              onBlur: () => trigger("businessDetails.sale.assetsIncluded")
            })}
          ></textarea>

          {errors.businessDetails?.sale?.assetsIncluded ? (
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {getImprovedErrorMessage(errors, "businessDetails.sale.assetsIncluded")}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              100-1000 characters. List and describe all assets included in the sale.
            </p>
          )}
        </div>
      </FormSection>
    </div>
  );
}