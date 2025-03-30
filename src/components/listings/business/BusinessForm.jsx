import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Info, HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessType, EntityType, LocationType, RevenueTrend } from '@/types/listings';
import { currencyFormatter, percentageFormatter } from '@/lib/utils';
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

  // Format currency inputs for display
  const formatCurrency = (value) => {
    if (!value) return "₹0";
    return currencyFormatter(parseFloat(value), "INR");
  };

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
              <FormField
                control={control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businessTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The primary business category or industry
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Entity Type */}
              <FormField
                control={control}
                name="entityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity Type <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select entity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {entityTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The legal structure of the business
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Year Established */}
              <FormField
                control={control}
                name="establishedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Established <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="YYYY" 
                        min={1900} 
                        max={new Date().getFullYear()} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The year when the business was founded
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Registration Number */}
              <FormField
                control={control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter business registration number" {...field} />
                    </FormControl>
                    <FormDescription>
                      The official business registration ID
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* GST Number */}
              <FormField
                control={control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter GST registration number (if applicable)" {...field} />
                    </FormControl>
                    <FormDescription>
                      The tax registration number (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PAN Number */}
              <FormField
                control={control}
                name="panNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter business PAN number (if applicable)" {...field} />
                    </FormControl>
                    <FormDescription>
                      The business tax ID (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                <FormField
                  control={control}
                  name="operations.employees.count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Employees <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Total number of employees
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Full-Time Employees */}
                <FormField
                  control={control}
                  name="operations.employees.fullTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full-time <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Number of full-time employees
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Part-Time Employees */}
                <FormField
                  control={control}
                  name="operations.employees.partTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part-time (calculated)</FormLabel>
                      <FormControl>
                        <Input type="number" disabled {...field} />
                      </FormControl>
                      <FormDescription>
                        Auto-calculated from total and full-time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Location Type */}
            <FormField
              control={control}
              name="operations.locationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Type <span className="text-red-500">*</span></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locationTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of business location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lease Information - Conditional on Location Type */}
            {locationType === LocationType.LEASED_COMMERCIAL && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                <h3 className="text-base font-medium">Lease Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Lease Expiry */}
                  <FormField
                    control={control}
                    name="operations.leaseInformation.expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lease Expiry Date <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            min={new Date().toISOString().split('T')[0]} 
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          />
                        </FormControl>
                        <FormDescription>
                          When the current lease expires
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Monthly Lease Cost */}
                  <FormField
                    control={control}
                    name="operations.leaseInformation.monthlyCost.value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Lease Cost <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="Monthly rent amount"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Monthly rent for the property
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Is Lease Transferable */}
                <FormField
                  control={control}
                  name="operations.leaseInformation.isTransferable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Is Lease Transferable?</FormLabel>
                        <FormDescription>
                          Can the lease be transferred to a new owner?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Operation Description */}
            <FormField
              control={control}
              name="operations.operationDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation Description <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the day-to-day operations of the business"
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Explain how the business operates on a daily basis
                    </FormDescription>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/1000 characters
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              <FormField
                control={control}
                name="financials.annualRevenue.value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Revenue <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="1000"
                        placeholder="Annual revenue amount" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Total revenue for the past 12 months
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Monthly Revenue */}
              <FormField
                control={control}
                name="financials.monthlyRevenue.value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Revenue <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="1000"
                        placeholder="Average monthly revenue" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Average monthly revenue (consistent with annual)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Profit Margin */}
              <FormField
                control={control}
                name="financials.profitMargin.percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profit Margin <span className="text-red-500">*</span></FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100"
                          step="0.1"
                          placeholder="Enter profit margin percentage" 
                          {...field} 
                        />
                      </FormControl>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                    <FormDescription>
                      Net profit as a percentage of revenue
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Revenue Trend */}
              <FormField
                control={control}
                name="financials.revenueTrend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revenue Trend <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select revenue trend" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {revenueTrendOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The direction of revenue over the past year
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Inventory - Conditional based on business type */}
            {shouldShowInventory() && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="mb-4">
                  <FormField
                    control={control}
                    name="financials.inventory.isIncluded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Inventory Included in Sale</FormLabel>
                          <FormDescription>
                            Check if inventory is included in the asking price
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {inventoryIncluded && (
                  <div className="space-y-4">
                    <FormField
                      control={control}
                      name="financials.inventory.value.value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inventory Value <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="Current inventory value" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            The current value of inventory included
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="financials.inventory.description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inventory Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the inventory included in the sale"
                              className="resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description of the inventory included
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Equipment */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="mb-4">
                <FormField
                  control={control}
                  name="financials.equipment.isIncluded"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Equipment Included in Sale</FormLabel>
                        <FormDescription>
                          Check if equipment is included in the asking price
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={control}
                  name="financials.equipment.value.value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Value <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Value of equipment" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The value of equipment included in the sale
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="financials.equipment.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Description <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the equipment included in the sale"
                          className="resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        List major equipment items included
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Customer Concentration */}
            <FormField
              control={control}
              name="financials.customerConcentration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Concentration <span className="text-red-500">*</span></FormLabel>
                  <div className="space-y-4">
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100"
                          step="1"
                          placeholder="Percentage of revenue from top 3 clients" 
                          {...field} 
                        />
                      </FormControl>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                    {renderCustomerConcentrationWarning()}
                  </div>
                  <FormDescription>
                    Percentage of revenue from top 3 clients
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                <FormField
                  control={control}
                  name="sale.askingPrice.value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asking Price <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="10000"
                          placeholder="Enter asking price" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The requested selling price for the business
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="sale.askingPrice.isNegotiable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 border border-gray-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Price is Negotiable</FormLabel>
                        <FormDescription>
                          Check if the asking price is open to negotiation
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Price Multiple (Optional) */}
              <FormField
                control={control}
                name="sale.askingPrice.priceMultiple"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Multiple</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.1"
                        placeholder="e.g., 3.5x annual profit" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Valuation metric (e.g., 2.5x annual revenue)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reason for Selling */}
            <FormField
              control={control}
              name="sale.reasonForSelling"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Selling <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why you're selling the business"
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Be specific about your motivation for selling
                    </FormDescription>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/500 characters
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seller Financing */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <FormField
                control={control}
                name="sale.sellerFinancing.isAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Seller Financing Available</FormLabel>
                      <FormDescription>
                        Indicate if you're willing to provide financing to the buyer
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {sellerFinancingAvailable && (
                <div className="mt-4 space-y-4 pl-8">
                  <FormField
                    control={control}
                    name="sale.sellerFinancing.details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financing Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your financing terms"
                            className="resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Explain your terms and conditions for financing
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="sale.sellerFinancing.downPaymentPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Down Payment Required <span className="text-red-500">*</span></FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type="number" 
                              min="10" 
                              max="100"
                              placeholder="Minimum down payment percentage" 
                              {...field} 
                            />
                          </FormControl>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-500">%</span>
                          </div>
                        </div>
                        <FormDescription>
                          Minimum down payment required (10-100%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Transition Period */}
              <FormField
                control={control}
                name="sale.transitionPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transition Period <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="12"
                        placeholder="Number of months" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Months you'll help with the transition (0-12)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Training Included */}
            <FormField
              control={control}
              name="sale.trainingIncluded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Included <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the training you will provide to the buyer"
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Detail the training and support you'll provide
                    </FormDescription>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/500 characters
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assets Included */}
            <FormField
              control={control}
              name="sale.assetsIncluded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assets Included <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List all assets included in the sale"
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Provide a comprehensive list of all assets included
                    </FormDescription>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/1000 characters
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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