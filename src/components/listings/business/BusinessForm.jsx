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

// Switch component (Toggle)
const Switch = ({ checked, onChange, label }) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-[#0031ac] border-[#0031ac]' : 'bg-gray-200 border-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
};

// Main Business Form Component
export default function BusinessForm({ submitAttempted = false }) {
  // Use parent form context
  const { 
    control, 
    register,
    watch, 
    setValue, 
    getValues, 
    trigger,
    formState: { errors } 
  } = useFormContext();

  // Watch for values that affect conditional rendering
  const locationType = watch("businessDetails.operations.locationType");
  const sellerFinancingAvailable = watch("businessDetails.sale.sellerFinancing.isAvailable");
  const inventoryIncluded = watch("businessDetails.financials.inventory.isIncluded");

  // Effect to update part-time employees based on total and full-time
  useEffect(() => {
    const total = parseInt(getValues("businessDetails.operations.employees.count") || '0');
    const fullTime = parseInt(getValues("businessDetails.operations.employees.fullTime") || '0');
    
    if (!isNaN(total) && !isNaN(fullTime)) {
      const partTime = Math.max(0, total - fullTime);
      setValue("businessDetails.operations.employees.partTime", partTime.toString());
      
      // Validate employees fields if form has been submitted
      if (submitAttempted) {
        trigger("businessDetails.operations.employees");
      }
    }
  }, [
    watch("businessDetails.operations.employees.count"), 
    watch("businessDetails.operations.employees.fullTime"), 
    getValues, 
    setValue, 
    trigger, 
    submitAttempted
  ]);

  // Validate all fields when form submission is attempted
  useEffect(() => {
    if (submitAttempted) {
      trigger("businessDetails");
    }
  }, [submitAttempted, trigger]);

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
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-gray-800">Business Information</h3>

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
                {errors.businessDetails.businessType.message}
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
                {errors.businessDetails.entityType.message}
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
                  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
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
                {errors.businessDetails.establishedYear.message}
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
                {errors.businessDetails.registrationNumber.message}
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
      </div>

      {/* Operations Section */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-gray-800">Operations</h3>

        {/* Employee Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.operations.employees.count" className="block text-sm font-semibold text-gray-800 mr-2">
                Total Employees <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Number of people currently employed by your business">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="businessDetails.operations.employees.count"
              type="number"
              min="0"
              placeholder="e.g. 10"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.businessDetails?.operations?.employees?.count ? "border-red-300" : "border-gray-300"
              )}
              {...register("businessDetails.operations.employees.count", {
                onBlur: () => trigger("businessDetails.operations.employees.count")
              })}
            />

            {errors.businessDetails?.operations?.employees?.count ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.businessDetails.operations.employees.count.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Total number of employees in your business
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.operations.employees.fullTime" className="block text-sm font-semibold text-gray-800 mr-2">
                Full-time Employees <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Number of full-time employees (40+ hours per week)">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="businessDetails.operations.employees.fullTime"
              type="number"
              min="0"
              placeholder="e.g. 8"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.businessDetails?.operations?.employees?.fullTime ? "border-red-300" : "border-gray-300"
              )}
              {...register("businessDetails.operations.employees.fullTime", {
                onBlur: () => trigger("businessDetails.operations.employees.fullTime")
              })}
            />

            {errors.businessDetails?.operations?.employees?.fullTime ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.businessDetails.operations.employees.fullTime.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Number of employees working full-time
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="businessDetails.operations.employees.partTime" className="block text-sm font-semibold text-gray-800 mr-2">
                Part-time Employees
              </label>
              <Tooltip content="This field is calculated automatically (Total - Full-time)">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="businessDetails.operations.employees.partTime"
              type="number"
              readOnly
              className="w-full px-3 py-2 text-sm border bg-gray-50 border-gray-300 rounded-md focus:outline-none"
              {...register("businessDetails.operations.employees.partTime")}
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
              {errors.businessDetails.operations.locationType.message}
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
                    {errors.businessDetails.operations.leaseInformation.expiryDate.message}
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
                    {errors.businessDetails.operations.leaseInformation.monthlyCost.value.message}
                  </p>
                )}
              </div>
            </div>

            {/* Lease Transferable */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label className="text-sm font-semibold text-gray-800 mr-2">
                    Lease Transferable
                  </label>
                  <Tooltip content="Whether the lease can be transferred to the new owner">
                    <HelpCircle className="h-4 w-4 text-gray-500" />
                  </Tooltip>
                </div>

                <Switch
                  checked={watch("businessDetails.operations.leaseInformation.isTransferable") || false}
                  onChange={(value) => setValue("businessDetails.operations.leaseInformation.isTransferable", value)}
                  label={watch("businessDetails.operations.leaseInformation.isTransferable") ? "Yes" : "No"}
                />
              </div>
            </div>
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
              {errors.businessDetails.operations.operationDescription.message}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              100-1000 characters. Include details about daily operations, business processes, and key activities.
            </p>
          )}
        </div>
      </div>

      {/* Financial Section */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-gray-800">Financial Information</h3>

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
                {errors.businessDetails.financials.annualRevenue.value.message}
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
                {errors.businessDetails.financials.monthlyRevenue.value.message}
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
                {errors.businessDetails.financials.profitMargin.percentage.message}
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
                {errors.businessDetails.financials.revenueTrend.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Select the trend that best describes your revenue growth
              </p>
            )}
          </div>
        </div>

        {/* Inventory */}
        <div className="space-y-3 p-4 border border-gray-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h4 className="text-sm font-semibold text-gray-800 mr-2">Inventory</h4>
              <Tooltip content="Stock of goods held by the business">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <Switch
              checked={inventoryIncluded || false}
              onChange={(value) => setValue("businessDetails.financials.inventory.isIncluded", value)}
              label={inventoryIncluded ? "Included in sale" : "Not included"}
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
                      {errors.businessDetails.financials.inventory.value.value.message}
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
                {errors.businessDetails.financials.customerConcentration.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Percentage of revenue from your top 3 customers
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sale Section */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-gray-800">Sale Details</h3>

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
                {errors.businessDetails.sale.askingPrice.value.message}
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
                {errors.businessDetails.sale.askingPrice.priceMultiple.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Multiple of yearly profit (e.g., 3x annual profit)
              </p>
            )}
          </div>
        </div>

        {/* Price Negotiable */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <label className="text-sm font-semibold text-gray-800 mr-2">
                Price Negotiable
              </label>
              <Tooltip content="Whether you're open to negotiating the asking price">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <Switch
              checked={watch("businessDetails.sale.askingPrice.isNegotiable") || false}
              onChange={(value) => setValue("businessDetails.sale.askingPrice.isNegotiable", value)}
              label={watch("businessDetails.sale.askingPrice.isNegotiable") ? "Yes" : "No"}
            />
          </div>
        </div>

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
              onBlur: () => trigger("businessDetails.sale.reasonForSelling")
            })}
          ></textarea>

          {errors.businessDetails?.sale?.reasonForSelling ? (
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {errors.businessDetails.sale.reasonForSelling.message}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              50-500 characters. Be honest about your reasons for selling.
            </p>
          )}
        </div>

        {/* Seller Financing */}
        <div className="space-y-3 p-4 border border-gray-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h4 className="text-sm font-semibold text-gray-800 mr-2">Seller Financing</h4>
              <Tooltip content="Whether you're willing to finance part of the sale price">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <Switch
              checked={sellerFinancingAvailable || false}
              onChange={(value) => setValue("businessDetails.sale.sellerFinancing.isAvailable", value)}
              label={sellerFinancingAvailable ? "Available" : "Not available"}
            />
          </div>

          {sellerFinancingAvailable && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Down Payment Percentage */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label htmlFor="businessDetails.sale.sellerFinancing.downPaymentPercentage" className="block text-sm font-semibold text-gray-800 mr-2">
                      Minimum Down Payment <span className="text-red-500">*</span>
                    </label>
                    <Tooltip content="Minimum percentage required as down payment">
                      <HelpCircle className="h-4 w-4 text-gray-500" />
                    </Tooltip>
                  </div>

                  <div className="relative">
                    <input
                      id="businessDetails.sale.sellerFinancing.downPaymentPercentage"
                      type="number"
                      min="10"
                      max="100"
                      placeholder="e.g. 30"
                      className={cn(
                        "w-full pr-8 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                        errors.businessDetails?.sale?.sellerFinancing?.downPaymentPercentage ? "border-red-300" : "border-gray-300"
                      )}
                      {...register("businessDetails.sale.sellerFinancing.downPaymentPercentage", {
                        onBlur: () => trigger("businessDetails.sale.sellerFinancing.downPaymentPercentage")
                      })}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>

                  {errors.businessDetails?.sale?.sellerFinancing?.downPaymentPercentage ? (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      {errors.businessDetails.sale.sellerFinancing.downPaymentPercentage.message}
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
                    <label htmlFor="businessDetails.sale.sellerFinancing.details" className="block text-sm font-semibold text-gray-800 mr-2">
                      Financing Details <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <input
                    id="businessDetails.sale.sellerFinancing.details"
                    type="text"
                    placeholder="e.g. 5-year term at 8% interest"
                    className={cn(
                      "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                      errors.businessDetails?.sale?.sellerFinancing?.details ? "border-red-300" : "border-gray-300"
                    )}
                    {...register("businessDetails.sale.sellerFinancing.details", {
                      onBlur: () => trigger("businessDetails.sale.sellerFinancing.details")
                    })}
                  />

                  {errors.businessDetails?.sale?.sellerFinancing?.details ? (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      {errors.businessDetails.sale.sellerFinancing.details.message}
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
                {errors.businessDetails.sale.transitionPeriod.message}
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
              onBlur: () => trigger("businessDetails.sale.trainingIncluded")
            })}
          ></textarea>

          {errors.businessDetails?.sale?.trainingIncluded ? (
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {errors.businessDetails.sale.trainingIncluded.message}
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
              onBlur: () => trigger("businessDetails.sale.assetsIncluded")
            })}
          ></textarea>

          {errors.businessDetails?.sale?.assetsIncluded ? (
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {errors.businessDetails.sale.assetsIncluded.message}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              100-1000 characters. List and describe all assets included in the sale.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}