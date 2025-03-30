import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Info, HelpCircle, ChevronDownIcon, CheckIcon } from 'lucide-react';
import  Tooltip  from '@/components/ui/Tooltip';
import { Listbox, Transition, Disclosure, Switch as HeadlessSwitch, RadioGroup, Combobox } from '@headlessui/react';

import { Fragment } from 'react';
import { BusinessType, EntityType, LocationType, RevenueTrend } from '@/types/listings';

import { cn } from '@/lib/utils';

// Validation schema for the Business form
const businessFormSchema = z.object({
  // Business Information section
  businessType: z.enum(Object.values(BusinessType), {
    required_error: "Business type is required",
  }),
  entityType: z.enum(Object.values(EntityType), {
    required_error: "Entity type is required",
  }),
  establishedYear: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Year must be a number")
    .refine((val) => {
      const year = parseInt(val);
      return year >= 1900 && year <= new Date().getFullYear();
    }, `Year must be between 1900 and ${new Date().getFullYear()}`),
  registrationNumber: z.string().min(1, "Registration number is required"),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),

  // Operations section
  operations: z.object({
    employees: z.object({
      count: z.string()
        .refine((val) => !isNaN(parseInt(val)), "Employee count must be a number")
        .refine((val) => parseInt(val) >= 0, "Employee count must be a positive number"),
      fullTime: z.string()
        .refine((val) => !isNaN(parseInt(val)), "Full-time employee count must be a number")
        .refine((val) => parseInt(val) >= 0, "Full-time count must be a positive number"),
      partTime: z.string()
        .refine((val) => !isNaN(parseInt(val)), "Part-time employee count must be a number")
        .refine((val) => parseInt(val) >= 0, "Part-time count must be a positive number")
        .optional(),
    }).refine((data) => {
      const total = parseInt(data.count);
      const fullTime = parseInt(data.fullTime);
      const partTime = parseInt(data.partTime || '0');
      return fullTime + partTime === total;
    }, {
      message: "Full-time and part-time employees must add up to total employees",
      path: ["count"],
    }),
    locationType: z.enum(Object.values(LocationType), {
      required_error: "Location type is required",
    }),
    leaseInformation: z.object({
      expiryDate: z.date({
        required_error: "Lease expiry date is required",
      }),
      monthlyCost: z.object({
        value: z.string()
          .refine((val) => !isNaN(parseFloat(val)), "Lease cost must be a number")
          .refine((val) => parseFloat(val) >= 0, "Lease cost must be a positive number"),
        currency: z.string().default("INR"),
      }),
      isTransferable: z.boolean(),
    }).optional(),
    operationDescription: z.string()
      .min(100, "Description must be at least 100 characters")
      .max(1000, "Description cannot exceed 1000 characters"),
  }),

  // Financial section
  financials: z.object({
    annualRevenue: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Annual revenue must be a number")
        .refine((val) => parseFloat(val) >= 0, "Annual revenue must be a positive number"),
      currency: z.string().default("INR"),
    }),
    monthlyRevenue: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Monthly revenue must be a number")
        .refine((val) => parseFloat(val) >= 0, "Monthly revenue must be a positive number"),
      currency: z.string().default("INR"),
    }),
    profitMargin: z.object({
      percentage: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Profit margin must be a number")
        .refine((val) => parseFloat(val) >= 0 && parseFloat(val) <= 100, "Profit margin must be between 0 and 100%"),
      trend: z.string().default("stable"),
    }),
    revenueTrend: z.enum(Object.values(RevenueTrend), {
      required_error: "Revenue trend is required",
    }),
    inventory: z.object({
      isIncluded: z.boolean(),
      value: z.object({
        value: z.string()
          .refine((val) => !isNaN(parseFloat(val)), "Inventory value must be a number")
          .refine((val) => parseFloat(val) >= 0, "Inventory value must be a positive number"),
        currency: z.string().default("INR"),
      }),
      description: z.string().optional(),
    }).optional(),
    equipment: z.object({
      isIncluded: z.boolean(),
      value: z.object({
        value: z.string()
          .refine((val) => !isNaN(parseFloat(val)), "Equipment value must be a number")
          .refine((val) => parseFloat(val) >= 0, "Equipment value must be a positive number"),
        currency: z.string().default("INR"),
      }),
      description: z.string().min(1, "Equipment description is required"),
    }),
    customerConcentration: z.string()
      .refine((val) => !isNaN(parseFloat(val)), "Customer concentration must be a number")
      .refine((val) => parseFloat(val) >= 0 && parseFloat(val) <= 100, "Customer concentration must be between 0 and 100%"),
  }),

  // Sale section
  sale: z.object({
    askingPrice: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Asking price must be a number")
        .refine((val) => parseFloat(val) >= 0, "Asking price must be a positive number"),
      currency: z.string().default("INR"),
      priceMultiple: z.string()
        .refine((val) => val === '' || !isNaN(parseFloat(val)), "Price multiple must be a number if provided")
        .refine((val) => val === '' || (parseFloat(val) >= 0), "Price multiple must be a positive number")
        .optional(),
      isNegotiable: z.boolean(),
    }),
    reasonForSelling: z.string()
      .min(50, "Reason must be at least 50 characters")
      .max(500, "Reason cannot exceed 500 characters"),
    sellerFinancing: z.object({
      isAvailable: z.boolean(),
      details: z.string().optional(),
      downPaymentPercentage: z.string()
        .refine((val) => val === '' || !isNaN(parseFloat(val)), "Down payment must be a number if provided")
        .refine((val) => val === '' || (parseFloat(val) >= 10 && parseFloat(val) <= 100), "Down payment must be between 10% and 100%")
        .optional(),
    }),
    transitionPeriod: z.string()
      .refine((val) => !isNaN(parseInt(val)), "Transition period must be a number")
      .refine((val) => parseInt(val) >= 0 && parseInt(val) <= 12, "Transition period must be between 0 and 12 months"),
    trainingIncluded: z.string()
      .min(50, "Training details must be at least 50 characters")
      .max(500, "Training details cannot exceed 500 characters"),
    assetsIncluded: z.string()
      .min(100, "Assets description must be at least 100 characters")
      .max(1000, "Assets description cannot exceed 1000 characters"),
  }),
});

// Default values for the form
const defaultBusinessFormValues = {
  businessType: BusinessType.RETAIL,
  entityType: EntityType.PRIVATE_LIMITED,
  establishedYear: new Date().getFullYear().toString(),
  registrationNumber: "",
  gstNumber: "",
  panNumber: "",
  operations: {
    employees: {
      count: "0",
      fullTime: "0",
      partTime: "0",
    },
    locationType: LocationType.LEASED_COMMERCIAL,
    operationDescription: "",
  },
  financials: {
    annualRevenue: {
      value: "0",
      currency: "INR",
    },
    monthlyRevenue: {
      value: "0",
      currency: "INR",
    },
    profitMargin: {
      percentage: "0",
      trend: "stable",
    },
    revenueTrend: RevenueTrend.STABLE,
    equipment: {
      isIncluded: true,
      value: {
        value: "0",
        currency: "INR",
      },
      description: "",
    },
    inventory: {
      isIncluded: false,
      value: {
        value: "0",
        currency: "INR",
      },
      description: "",
    },
    customerConcentration: "0",
  },
  sale: {
    askingPrice: {
      value: "0",
      currency: "INR",
      priceMultiple: "",
      isNegotiable: true,
    },
    reasonForSelling: "",
    sellerFinancing: {
      isAvailable: false,
      details: "",
      downPaymentPercentage: "",
    },
    transitionPeriod: "1",
    trainingIncluded: "",
    assetsIncluded: "",
  },
};

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

// Custom form components using Headless UI
const Card = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className }) => {
  return <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>{children}</div>;
};

const CardTitle = ({ children, className }) => {
  return <h3 className={`text-xl font-semibold text-gray-900 ${className}`}>{children}</h3>;
};

const CardContent = ({ children, className }) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

const Input = React.forwardRef(({ type = "text", className, ...props }, ref) => {
  return (
    <input
      type={type}
      className={`w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={`w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

const FormItem = ({ children, className }) => {
  return <div className={`space-y-1 ${className}`}>{children}</div>;
};

const FormLabel = ({ children, className }) => {
  return (
    <label className={`block text-sm font-medium text-gray-700 ${className}`}>
      {children}
    </label>
  );
};

const FormDescription = ({ children, className }) => {
  return (
    <p className={`text-sm text-gray-500 ${className}`}>
      {children}
    </p>
  );
};

const FormMessage = ({ children, className }) => {
  if (!children) return null;
  
  return (
    <p className={`mt-1 text-sm text-red-600 ${className}`}>
      {children}
    </p>
  );
};

// Custom Headless UI Select component
const SelectWrapper = ({ value, onChange, options, placeholder, error }) => {
  const selectedOption = options.find(option => option.value === value) || null;
  
  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="relative">
          <Listbox.Button
            className={`relative w-full rounded-md border ${error ? 'border-red-300' : 'border-gray-300'} bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm`}
          >
            <span className="block truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                    }`
                  }
                  value={option.value}
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {option.label}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? 'text-blue-600' : 'text-blue-600'
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
};

// Custom checkbox component
const CheckboxComponent = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex h-5 items-center">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
      {(label || description) && (
        <div className="leading-none">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      )}
    </div>
  );
};

/**
 * Business Form Component - Step 3 of listing creation
 * Includes all sections as specified in the documentation:
 * - Business Information
 * - Operations
 * - Financial
 * - Sale Information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.defaultValues - Default values for the form 
 * @param {Function} props.onSubmit - Callback for form submission
 * @param {boolean} props.isSubmitting - Whether the form is currently submitting
 * @param {boolean} props.isEdit - Whether we're editing an existing listing
 */
export default function BusinessForm({ 
  defaultValues = {}, 
  onSubmit, 
  isSubmitting = false, 
  isEdit = false 
}) {
  // Set up form with schema validation
  const form = useForm({
    resolver: zodResolver(businessFormSchema),
    defaultValues: { ...defaultBusinessFormValues, ...defaultValues },
    mode: "onChange",
  });

  const { 
    control, 
    watch, 
    setValue, 
    getValues, 
    handleSubmit, 
    formState: { errors } 
  } = form;

  // Watch for values that affect conditional rendering
  const locationType = watch("operations.locationType");
  const businessType = watch("businessType");
  const sellerFinancingAvailable = watch("sale.sellerFinancing.isAvailable");
  const inventoryIncluded = watch("financials.inventory.isIncluded");

  // Effect to update part-time employees based on total and full-time
  useEffect(() => {
    const total = parseInt(getValues("operations.employees.count") || '0');
    const fullTime = parseInt(getValues("operations.employees.fullTime") || '0');
    
    if (!isNaN(total) && !isNaN(fullTime)) {
      const partTime = Math.max(0, total - fullTime);
      setValue("operations.employees.partTime", partTime.toString());
    }
  }, [watch("operations.employees.count"), watch("operations.employees.fullTime")]);


  // Handler for form submission
  const onFormSubmit = (data) => {
    // Process the data here before sending it to the parent component
    // For example, convert string numbers to actual number types
    const processedData = {
      ...data,
      establishedYear: parseInt(data.establishedYear),
      operations: {
        ...data.operations,
        employees: {
          count: parseInt(data.operations.employees.count),
          fullTime: parseInt(data.operations.employees.fullTime),
          partTime: data.operations.employees.partTime ? parseInt(data.operations.employees.partTime) : 0,
        },
      },
      financials: {
        ...data.financials,
        annualRevenue: {
          ...data.financials.annualRevenue,
          value: parseFloat(data.financials.annualRevenue.value),
        },
        monthlyRevenue: {
          ...data.financials.monthlyRevenue,
          value: parseFloat(data.financials.monthlyRevenue.value),
        },
        profitMargin: {
          ...data.financials.profitMargin,
          percentage: parseFloat(data.financials.profitMargin.percentage),
        },
        equipment: {
          ...data.financials.equipment,
          value: {
            ...data.financials.equipment.value,
            value: parseFloat(data.financials.equipment.value.value),
          },
        },
        customerConcentration: parseFloat(data.financials.customerConcentration),
      },
      sale: {
        ...data.sale,
        askingPrice: {
          ...data.sale.askingPrice,
          value: parseFloat(data.sale.askingPrice.value),
          priceMultiple: data.sale.askingPrice.priceMultiple 
            ? parseFloat(data.sale.askingPrice.priceMultiple) 
            : undefined,
        },
        transitionPeriod: parseInt(data.sale.transitionPeriod),
      },
    };

    // Handle inventory conditionally
    if (data.financials.inventory && data.financials.inventory.isIncluded) {
      processedData.financials.inventory = {
        ...data.financials.inventory,
        value: {
          ...data.financials.inventory.value,
          value: parseFloat(data.financials.inventory.value.value),
        },
      };
    }

    // Handle seller financing conditionally
    if (data.sale.sellerFinancing && data.sale.sellerFinancing.isAvailable && data.sale.sellerFinancing.downPaymentPercentage) {
      processedData.sale.sellerFinancing.downPaymentPercentage = parseFloat(data.sale.sellerFinancing.downPaymentPercentage);
    }

    onSubmit(processedData);
  };

  // Check if retail or manufacturing to show inventory conditional field
  const shouldShowInventory = () => {
    return [BusinessType.RETAIL, BusinessType.MANUFACTURING, BusinessType.DISTRIBUTION].includes(businessType);
  };

  // Render warning for high customer concentration
  const renderCustomerConcentrationWarning = () => {
    const concentration = parseFloat(watch("financials.customerConcentration") || '0');
    if (concentration > 50) {
      return (
        <div className="text-amber-600 text-sm flex items-center mt-1">
          <Info className="h-4 w-4 mr-1" />
          <span>High customer concentration may be seen as a risk by potential buyers.</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {/* Business Information Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              Business Information
              <Tooltip content="Basic information about the business entity">
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Business Type */}
              <FormItem>
                <FormLabel>Business Type <span className="text-red-500">*</span></FormLabel>
                <Controller
                  control={control}
                  name="businessType"
                  render={({ field }) => (
                    <SelectWrapper
                      value={field.value}
                      onChange={field.onChange}
                      options={businessTypeOptions}
                      placeholder="Select business type"
                      error={errors.businessType}
                    />
                  )}
                />
                <FormDescription>
                  The primary business category or industry
                </FormDescription>
                <FormMessage>{errors.businessType?.message}</FormMessage>
              </FormItem>

              {/* Entity Type */}
              <FormItem>
                <FormLabel>Entity Type <span className="text-red-500">*</span></FormLabel>
                <Controller
                  control={control}
                  name="entityType"
                  render={({ field }) => (
                    <SelectWrapper
                      value={field.value}
                      onChange={field.onChange}
                      options={entityTypeOptions}
                      placeholder="Select entity type"
                      error={errors.entityType}
                    />
                  )}
                />
                <FormDescription>
                  The legal structure of the business
                </FormDescription>
                <FormMessage>{errors.entityType?.message}</FormMessage>
              </FormItem>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Year Established */}
              <FormItem>
                <FormLabel>Year Established <span className="text-red-500">*</span></FormLabel>
                <Controller
                  control={control}
                  name="establishedYear"
                  render={({ field }) => (
                    <Input 
                      type="number" 
                      placeholder="YYYY" 
                      min={1900} 
                      max={new Date().getFullYear()} 
                      {...field} 
                      className={errors.establishedYear ? "border-red-300" : ""}
                    />
                  )}
                />
                <FormDescription>
                  The year when the business was founded
                </FormDescription>
                <FormMessage>{errors.establishedYear?.message}</FormMessage>
              </FormItem>

              {/* Registration Number */}
              <FormItem>
                <FormLabel>Registration Number <span className="text-red-500">*</span></FormLabel>
                <Controller
                  control={control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <Input 
                      placeholder="Enter business registration number" 
                      {...field} 
                      className={errors.registrationNumber ? "border-red-300" : ""}
                    />
                  )}
                />
                <FormDescription>
                  The official business registration ID
                </FormDescription>
                <FormMessage>{errors.registrationNumber?.message}</FormMessage>
              </FormItem>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* GST Number */}
              <FormItem>
                <FormLabel>GST Number</FormLabel>
                <Controller
                  control={control}
                  name="gstNumber"
                  render={({ field }) => (
                    <Input 
                      placeholder="Enter GST registration number (if applicable)" 
                      {...field} 
                      className={errors.gstNumber ? "border-red-300" : ""}
                    />
                  )}
                />
                <FormDescription>
                  The tax registration number (optional)
                </FormDescription>
                <FormMessage>{errors.gstNumber?.message}</FormMessage>
              </FormItem>

              {/* PAN Number */}
              <FormItem>
                <FormLabel>PAN Number</FormLabel>
                <Controller
                  control={control}
                  name="panNumber"
                  render={({ field }) => (
                    <Input 
                      placeholder="Enter business PAN number (if applicable)" 
                      {...field} 
                      className={errors.panNumber ? "border-red-300" : ""}
                    />
                  )}
                />
                <FormDescription>
                  The business tax ID (optional)
                </FormDescription>
                <FormMessage>{errors.panNumber?.message}</FormMessage>
              </FormItem>
            </div>
          </CardContent>
        </Card>

        {/* Operations Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              Operations
              <Tooltip content="Information about how the business operates">
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employees */}
            <div className="space-y-4">
              <h3 className="text-base font-medium">Employee Information</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                {/* Total Employees */}
                <FormItem>
                  <FormLabel>Total Employees <span className="text-red-500">*</span></FormLabel>
                  <Controller
                    control={control}
                    name="operations.employees.count"
                    render={({ field }) => (
                      <Input 
                        type="number" 
                        min="0" 
                        {...field} 
                        className={errors.operations?.employees?.count ? "border-red-300" : ""}
                      />
                    )}
                  />
                  <FormDescription>
                    Total number of employees
                  </FormDescription>
                  <FormMessage>{errors.operations?.employees?.count?.message}</FormMessage>
                </FormItem>

                {/* Full-Time Employees */}
                <FormItem>
                  <FormLabel>Full-time <span className="text-red-500">*</span></FormLabel>
                  <Controller
                    control={control}
                    name="operations.employees.fullTime"
                    render={({ field }) => (
                      <Input 
                        type="number" 
                        min="0" 
                        {...field} 
                        className={errors.operations?.employees?.fullTime ? "border-red-300" : ""}/>
                      )}
                    />
                    <FormDescription>
                      Number of full-time employees
                    </FormDescription>
                    <FormMessage>{errors.operations?.employees?.fullTime?.message}</FormMessage>
                  </FormItem>
  
                  {/* Part-Time Employees */}
                  <FormItem>
                    <FormLabel>Part-time (calculated)</FormLabel>
                    <Controller
                      control={control}
                      name="operations.employees.partTime"
                      render={({ field }) => (
                        <Input 
                          type="number" 
                          disabled 
                          {...field} 
                        />
                      )}
                    />
                    <FormDescription>
                      Auto-calculated from total and full-time
                    </FormDescription>
                    <FormMessage>{errors.operations?.employees?.partTime?.message}</FormMessage>
                  </FormItem>
                </div>
              </div>
  
              {/* Location Type */}
              <FormItem>
                <FormLabel>Location Type <span className="text-red-500">*</span></FormLabel>
                <Controller
                  control={control}
                  name="operations.locationType"
                  render={({ field }) => (
                    <SelectWrapper
                      value={field.value}
                      onChange={field.onChange}
                      options={locationTypeOptions}
                      placeholder="Select location type"
                      error={errors.operations?.locationType}
                    />
                  )}
                />
                <FormDescription>
                  The type of business location
                </FormDescription>
                <FormMessage>{errors.operations?.locationType?.message}</FormMessage>
              </FormItem>
  
              {/* Lease Information - Conditional on Location Type */}
              {locationType === LocationType.LEASED_COMMERCIAL && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                  <h3 className="text-base font-medium">Lease Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Lease Expiry */}
                    <FormItem>
                      <FormLabel>Lease Expiry Date <span className="text-red-500">*</span></FormLabel>
                      <Controller
                        control={control}
                        name="operations.leaseInformation.expiryDate"
                        render={({ field }) => (
                          <Input 
                            type="date" 
                            min={new Date().toISOString().split('T')[0]} 
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            className={errors.operations?.leaseInformation?.expiryDate ? "border-red-300" : ""}
                          />
                        )}
                      />
                      <FormDescription>
                        When the current lease expires
                      </FormDescription>
                      <FormMessage>{errors.operations?.leaseInformation?.expiryDate?.message}</FormMessage>
                    </FormItem>
  
                    {/* Monthly Lease Cost */}
                    <FormItem>
                      <FormLabel>Monthly Lease Cost <span className="text-red-500">*</span></FormLabel>
                      <Controller
                        control={control}
                        name="operations.leaseInformation.monthlyCost.value"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="Monthly rent amount"
                            {...field} 
                            className={errors.operations?.leaseInformation?.monthlyCost?.value ? "border-red-300" : ""}
                          />
                        )}
                      />
                      <FormDescription>
                        Monthly rent for the property
                      </FormDescription>
                      <FormMessage>{errors.operations?.leaseInformation?.monthlyCost?.value?.message}</FormMessage>
                    </FormItem>
                  </div>
  
                  {/* Is Lease Transferable */}
                  <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Is Lease Transferable?</FormLabel>
                      <FormDescription>
                        Can the lease be transferred to a new owner?
                      </FormDescription>
                    </div>
                    <Controller
                      control={control}
                      name="operations.leaseInformation.isTransferable"
                      render={({ field }) => (
                        <HeadlessSwitch
                          checked={field.value}
                          onChange={field.onChange}
                          className={`${
                            field.value ? 'bg-blue-600' : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 items-center rounded-full`}
                        >
                          <span
                            className={`${
                              field.value ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                          />
                        </HeadlessSwitch>
                      )}
                    />
                  </div>
                </div>
              )}
  
              {/* Operation Description */}
              <FormItem>
                <FormLabel>Operation Description <span className="text-red-500">*</span></FormLabel>
                <Controller
                  control={control}
                  name="operations.operationDescription"
                  render={({ field }) => (
                    <Textarea
                      placeholder="Describe the day-to-day operations of the business"
                      className={`min-h-32 resize-y ${errors.operations?.operationDescription ? "border-red-300" : ""}`}
                      {...field}
                    />
                  )}
                />
                <div className="flex justify-between">
                  <FormDescription>
                    Explain how the business operates on a daily basis
                  </FormDescription>
                  <div className="text-xs text-gray-500">
                    {watch("operations.operationDescription")?.length || 0}/1000 characters
                  </div>
                </div>
                <FormMessage>{errors.operations?.operationDescription?.message}</FormMessage>
              </FormItem>
            </CardContent>
          </Card>
  
          {/* Financial Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                Financial Information
                <Tooltip content="Details about the business's financial performance">
                  <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Annual Revenue */}
                <FormItem>
                  <FormLabel>Annual Revenue <span className="text-red-500">*</span></FormLabel>
                  <Controller
                    control={control}
                    name="financials.annualRevenue.value"
                    render={({ field }) => (
                      <Input 
                        type="number" 
                        min="0"
                        step="1000"
                        placeholder="Annual revenue amount" 
                        {...field} 
                        className={errors.financials?.annualRevenue?.value ? "border-red-300" : ""}
                      />
                    )}
                  />
                  <FormDescription>
                    Total revenue for the past 12 months
                  </FormDescription>
                  <FormMessage>{errors.financials?.annualRevenue?.value?.message}</FormMessage>
                </FormItem>
  
                {/* Monthly Revenue */}
                <FormItem>
                  <FormLabel>Monthly Revenue <span className="text-red-500">*</span></FormLabel>
                  <Controller
                    control={control}
                    name="financials.monthlyRevenue.value"
                    render={({ field }) => (
                      <Input 
                        type="number" 
                        min="0"
                        step="1000"
                        placeholder="Average monthly revenue" 
                        {...field} 
                        className={errors.financials?.monthlyRevenue?.value ? "border-red-300" : ""}
                      />
                    )}
                  />
                  <FormDescription>
                    Average monthly revenue (consistent with annual)
                  </FormDescription>
                  <FormMessage>{errors.financials?.monthlyRevenue?.value?.message}</FormMessage>
                </FormItem>
              </div>
  
              <div className="grid md:grid-cols-2 gap-6">
                {/* Profit Margin */}
                <FormItem>
                  <FormLabel>Profit Margin <span className="text-red-500">*</span></FormLabel>
                  <div className="relative">
                    <Controller
                      control={control}
                      name="financials.profitMargin.percentage"
                      render={({ field }) => (
                        <Input 
                          type="number" 
                          min="0" 
                          max="100"
                          step="0.1"
                          placeholder="Enter profit margin percentage" 
                          {...field} 
                          className={errors.financials?.profitMargin?.percentage ? "border-red-300" : ""}
                        />
                      )}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                  <FormDescription>
                    Net profit as a percentage of revenue
                  </FormDescription>
                  <FormMessage>{errors.financials?.profitMargin?.percentage?.message}</FormMessage>
                </FormItem>
  
                {/* Revenue Trend */}
                <FormItem>
                  <FormLabel>Revenue Trend <span className="text-red-500">*</span></FormLabel>
                  <Controller
                    control={control}
                    name="financials.revenueTrend"
                    render={({ field }) => (
                      <SelectWrapper
                        value={field.value}
                        onChange={field.onChange}
                        options={revenueTrendOptions}
                        placeholder="Select revenue trend"
                        error={errors.financials?.revenueTrend}
                      />
                    )}
                  />
                  <FormDescription>
                    The direction of revenue over the past year
                  </FormDescription>
                  <FormMessage>{errors.financials?.revenueTrend?.message}</FormMessage>
                </FormItem>
              </div>
  
              {/* Inventory - Conditional based on business type */}
              {shouldShowInventory() && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="mb-4">
                    <Controller
                      control={control}
                      name="financials.inventory.isIncluded"
                      render={({ field }) => (
                        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <div className="space-y-1 leading-none">
                            <FormLabel>Inventory Included in Sale</FormLabel>
                            <FormDescription>
                              Check if inventory is included in the asking price
                            </FormDescription>
                          </div>
                        </div>
                      )}
                    />
                  </div>
  
                  {inventoryIncluded && (
                    <div className="space-y-4">
                      <FormItem>
                        <FormLabel>Inventory Value <span className="text-red-500">*</span></FormLabel>
                        <Controller
                          control={control}
                          name="financials.inventory.value.value"
                          render={({ field }) => (
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="Current inventory value" 
                              {...field} 
                              className={errors.financials?.inventory?.value?.value ? "border-red-300" : ""}
                            />
                          )}
                        />
                        <FormDescription>
                          The current value of inventory included
                        </FormDescription>
                        <FormMessage>{errors.financials?.inventory?.value?.value?.message}</FormMessage>
                      </FormItem>
  
                      <FormItem>
                        <FormLabel>Inventory Description</FormLabel>
                        <Controller
                          control={control}
                          name="financials.inventory.description"
                          render={({ field }) => (
                            <Textarea
                              placeholder="Describe the inventory included in the sale"
                              className={`resize-y ${errors.financials?.inventory?.description ? "border-red-300" : ""}`}
                              {...field}
                            />
                          )}
                        />
                        <FormDescription>
                          Brief description of the inventory included
                        </FormDescription>
                        <FormMessage>{errors.financials?.inventory?.description?.message}</FormMessage>
                      </FormItem>
                    </div>
                  )}
                </div>
              )}
  
              {/* Equipment */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="mb-4">
                  <Controller
                    control={control}
                    name="financials.equipment.isIncluded"
                    render={({ field }) => (
                      <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <div className="space-y-1 leading-none">
                          <FormLabel>Equipment Included in Sale</FormLabel>
                          <FormDescription>
                            Check if equipment is included in the asking price
                          </FormDescription>
                        </div>
                      </div>
                    )}
                  />
                </div>
  
                <div className="space-y-4">
                  <FormItem>
                    <FormLabel>Equipment Value <span className="text-red-500">*</span></FormLabel>
                    <Controller
                      control={control}
                      name="financials.equipment.value.value"
                      render={({ field }) => (
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Value of equipment" 
                          {...field} 
                          className={errors.financials?.equipment?.value?.value ? "border-red-300" : ""}
                        />
                      )}
                    />
                    <FormDescription>
                      The value of equipment included in the sale
                    </FormDescription>
                    <FormMessage>{errors.financials?.equipment?.value?.value?.message}</FormMessage>
                  </FormItem>
  
                  <FormItem>
                    <FormLabel>Equipment Description <span className="text-red-500">*</span></FormLabel>
                    <Controller
                      control={control}
                      name="financials.equipment.description"
                      render={({ field }) => (
                        <Textarea
                          placeholder="Describe the equipment included in the sale"
                          className={`resize-y ${errors.financials?.equipment?.description ? "border-red-300" : ""}`}
                          {...field}
                        />
                      )}
                    />
                    <FormDescription>
                      List major equipment items included
                    </FormDescription>
                    <FormMessage>{errors.financials?.equipment?.description?.message}</FormMessage>
                  </FormItem>
                </div>
              </div>
  
              {/* Customer Concentration */}
              <FormItem>
                <FormLabel>Customer Concentration <span className="text-red-500">*</span></FormLabel>
                <div className="space-y-4">
                  <div className="relative">
                    <Controller
                      control={control}
                      name="financials.customerConcentration"
                      render={({ field }) => (
                        <Input 
                          type="number" 
                          min="0" 
                          max="100"
                          step="1"
                          placeholder="Percentage of revenue from top 3 clients" 
                          {...field} 
                          className={errors.financials?.customerConcentration ? "border-red-300" : ""}
                        />
                      )}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                  {renderCustomerConcentrationWarning()}
                </div>
                <FormDescription>
                  Percentage of revenue from top 3 clients
                </FormDescription>
                <FormMessage>{errors.financials?.customerConcentration?.message}</FormMessage>
              </FormItem>
            </CardContent>
          </Card>
  
          {/* Sale Information Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                Sale Information
                <Tooltip content="Details about the sale terms and conditions">
                  <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Asking Price */}
                <div className="space-y-6">
                  <FormItem>
                    <FormLabel>Asking Price <span className="text-red-500">*</span></FormLabel>
                    <Controller
                      control={control}
                      name="sale.askingPrice.value"
                      render={({ field }) => (
                        <Input 
                          type="number" 
                          min="0" 
                          step="10000"
                          placeholder="Enter asking price" 
                          {...field} 
                          className={errors.sale?.askingPrice?.value ? "border-red-300" : ""}
                        />
                      )}
                    />
                    <FormDescription>
                      The requested selling price for the business
                    </FormDescription>
                    <FormMessage>{errors.sale?.askingPrice?.value?.message}</FormMessage>
                  </FormItem>
  
                  <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 border border-gray-200">
                    <Controller
                      control={control}
                      name="sale.askingPrice.isNegotiable"
                      render={({ field }) => (
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <div className="space-y-1 leading-none">
                            <FormLabel>Price is Negotiable</FormLabel>
                            <FormDescription>
                              Check if the asking price is open to negotiation
                            </FormDescription>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </div>
  
                {/* Price Multiple (Optional) */}
                <FormItem>
                  <FormLabel>Price Multiple</FormLabel>
                  <Controller
                    control={control}
                    name="sale.askingPrice.priceMultiple"
                    render={({ field }) => (
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.1"
                        placeholder="e.g., 3.5x annual profit" 
                        {...field} 
                        className={errors.sale?.askingPrice?.priceMultiple ? "border-red-300" : ""}
                      />
                    )}
                  />
                  <FormDescription>
                    Valuation metric (e.g., 2.5x annual revenue)
                  </FormDescription>
                  <FormMessage>{errors.sale?.askingPrice?.priceMultiple?.message}</FormMessage>
                </FormItem>
              </div>
  
              {/* Reason for Selling */}
              <FormItem>
                <FormLabel>Reason for Selling <span className="text-red-500">*</span></FormLabel>
                <Controller
                  control={control}
                  name="sale.reasonForSelling"
                  render={({ field }) => (
                    <Textarea
                      placeholder="Explain why you're selling the business"
                      className={`min-h-24 resize-y ${errors.sale?.reasonForSelling ? "border-red-300" : ""}`}
                      {...field}
                    />
                  )}
                />
                <div className="flex justify-between">
                  <FormDescription>
                    Be specific about your motivation for selling
                  </FormDescription>
                  <div className="text-xs text-gray-500">
                    {watch("sale.reasonForSelling")?.length || 0}/500 characters
                  </div>
                </div>
                <FormMessage>{errors.sale?.reasonForSelling?.message}</FormMessage>
              </FormItem>
  
              {/* Seller Financing */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <Controller
                  control={control}
                  name="sale.sellerFinancing.isAvailable"
                  render={({ field }) => (
                    <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <div className="space-y-1 leading-none">
                        <FormLabel>Seller Financing Available</FormLabel>
                        <FormDescription>
                          Indicate if you're willing to provide financing to the buyer
                        </FormDescription>
                      </div>
                    </div>
                  )}
                />
  
                {sellerFinancingAvailable && (
                  <div className="mt-4 space-y-4 pl-8">
                    <FormItem>
                      <FormLabel>Financing Details</FormLabel>
                      <Controller
                        control={control}
                        name="sale.sellerFinancing.details"
                        render={({ field }) => (
                          <Textarea
                            placeholder="Describe your financing terms"
                            className={`resize-y ${errors.sale?.sellerFinancing?.details ? "border-red-300" : ""}`}
                            {...field}
                          />
                        )}
                      />
                      <FormDescription>
                        Explain your terms and conditions for financing
                      </FormDescription>
                      <FormMessage>{errors.sale?.sellerFinancing?.details?.message}</FormMessage>
                    </FormItem>
  
                    <FormItem>
                      <FormLabel>Down Payment Required <span className="text-red-500">*</span></FormLabel>
                      <div className="relative">
                        <Controller
                          control={control}
                          name="sale.sellerFinancing.downPaymentPercentage"
                          render={({ field }) => (
                            <Input 
                              type="number" 
                              min="10" 
                              max="100"
                              placeholder="Minimum down payment percentage" 
                              {...field} 
                              className={errors.sale?.sellerFinancing?.downPaymentPercentage ? "border-red-300" : ""}
                            />
                          )}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500">%</span>
                        </div>
                      </div>
                      <FormDescription>
                        Minimum down payment required (10-100%)
                      </FormDescription>
                      <FormMessage>{errors.sale?.sellerFinancing?.downPaymentPercentage?.message}</FormMessage>
                    </FormItem>
                  </div>
                )}
              </div>
  
              <div className="grid md:grid-cols-2 gap-6">
                {/* Transition Period */}
                <FormItem>
                  <FormLabel>Transition Period <span className="text-red-500">*</span></FormLabel>
                  <Controller
                    control={control}
                    name="sale.transitionPeriod"
                    render={({ field }) => (
                      <Input 
                        type="number" 
                        min="0" 
                        max="12"
                        placeholder="Number of months" 
                        {...field} 
                        className={errors.sale?.transitionPeriod ? "border-red-300" : ""}
                      />
                    )}
                  />
                  <FormDescription>
                    Months you'll help with the transition (0-12)
                  </FormDescription>
                  <FormMessage>{errors.sale?.transitionPeriod?.message}</FormMessage>
                </FormItem>
              </div>
  
              {/* Training Included */}
              <FormItem>
                <FormLabel>Training Included <span className="text-red-500">*</span></FormLabel>
                <Controller
                  control={control}
                  name="sale.trainingIncluded"
                  render={({ field }) => (
                    <Textarea
                      placeholder="Describe the training you will provide to the buyer"
                      className={`min-h-24 resize-y ${errors.sale?.trainingIncluded ? "border-red-300" : ""}`}
                      {...field}
                    />
                  )}
                />
                <div className="flex justify-between">
                  <FormDescription>
                    Detail the training and support you'll provide
                  </FormDescription>
                  <div className="text-xs text-gray-500">
                    {watch("sale.trainingIncluded")?.length || 0}/500 characters
                  </div>
                </div>
                <FormMessage>{errors.sale?.trainingIncluded?.message}</FormMessage>
              </FormItem>
  
              {/* Assets Included */}
              <FormItem>
                <FormLabel>Assets Included <span className="text-red-500">*</span></FormLabel>
                <Controller
                  control={control}
                  name="sale.assetsIncluded"
                  render={({ field }) => (
                    <Textarea
                      placeholder="List all assets included in the sale"
                      className={`min-h-32 resize-y ${errors.sale?.assetsIncluded ? "border-red-300" : ""}`}
                      {...field}
                    />
                  )}
                />
                <div className="flex justify-between">
                  <FormDescription>
                    Provide a comprehensive list of all assets included
                  </FormDescription>
                  <div className="text-xs text-gray-500">
                    {watch("sale.assetsIncluded")?.length || 0}/1000 characters
                  </div>
                </div>
                <FormMessage>{errors.sale?.assetsIncluded?.message}</FormMessage>
              </FormItem>
            </CardContent>
          </Card>
  
          {/* Form Submission */}
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              className="bg-primary-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Saving...
                </>
              ) : isEdit ? 'Update Business Details' : 'Save Business Details'}
            </button>
          </div>
        </form>
      </div>
    );
  }