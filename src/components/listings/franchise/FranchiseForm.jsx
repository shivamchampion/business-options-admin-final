import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Info, HelpCircle, Plus, X } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FranchiseType } from '@/types/listings';
import { currencyFormatter, percentageFormatter } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Validation schema for the Franchise form
const franchiseFormSchema = z.object({
  // Franchise Information section
  franchiseBrand: z.string()
    .min(3, "Brand name must be at least 3 characters")
    .max(100, "Brand name cannot exceed 100 characters"),
  franchiseType: z.enum(Object.values(FranchiseType), {
    required_error: "Franchise type is required",
  }),
  franchiseSince: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Year must be a number")
    .refine((val) => {
      const year = parseInt(val);
      return year >= 1900 && year <= new Date().getFullYear();
    }, `Year must be between 1900 and ${new Date().getFullYear()}`),
  brandEstablished: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Year must be a number")
    .refine((val) => {
      const year = parseInt(val);
      return year >= 1900 && year <= new Date().getFullYear();
    }, `Year must be between 1900 and ${new Date().getFullYear()}`),
  totalUnits: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Units must be a number")
    .refine((val) => parseInt(val) >= 0, "Units must be a positive number"),
  franchiseeCount: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Count must be a number")
    .refine((val) => parseInt(val) >= 0, "Count must be a positive number"),
  companyOwnedUnits: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Units must be a number")
    .refine((val) => parseInt(val) >= 0, "Units must be a positive number"),
  availableTerritories: z.array(z.string())
    .min(1, "At least one territory must be selected"),

  // Investment Details section
  investment: z.object({
    franchiseFee: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Fee must be a number")
        .refine((val) => parseFloat(val) >= 0, "Fee must be a positive number"),
      currency: z.string().default("INR"),
    }),
    royaltyFee: z.string()
      .refine((val) => !isNaN(parseFloat(val)), "Royalty must be a number")
      .refine((val) => parseFloat(val) >= 0 && parseFloat(val) <= 50, "Royalty must be between 0 and 50%"),
    royaltyStructure: z.string()
      .min(50, "Structure must be at least 50 characters")
      .max(300, "Structure cannot exceed 300 characters"),
    marketingFee: z.string()
      .refine((val) => !isNaN(parseFloat(val)), "Fee must be a number")
      .refine((val) => parseFloat(val) >= 0 && parseFloat(val) <= 20, "Marketing fee must be between 0 and 20%"),
    totalInitialInvestment: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Investment must be a number")
        .refine((val) => parseFloat(val) >= 0, "Investment must be a positive number"),
      currency: z.string().default("INR"),
    }),
    recurringFees: z.string()
      .min(50, "Fee description must be at least 50 characters")
      .max(300, "Fee description cannot exceed 300 characters"),
  }),

  // Support & Training section
  support: z.object({
    initialTraining: z.string()
      .min(100, "Training details must be at least 100 characters")
      .max(500, "Training details cannot exceed 500 characters"),
    trainingDuration: z.string()
      .min(1, "Duration is required")
      .max(100, "Duration cannot exceed 100 characters"),
    trainingLocation: z.string()
      .min(1, "Location is required")
      .max(100, "Location cannot exceed 100 characters"),
    ongoingSupport: z.string()
      .min(100, "Support details must be at least 100 characters")
      .max(500, "Support details cannot exceed 500 characters"),
    fieldSupport: z.string()
      .min(1, "Field support details are required")
      .max(100, "Field support cannot exceed 100 characters"),
    marketingSupport: z.string()
      .min(100, "Marketing support must be at least 100 characters")
      .max(500, "Marketing support cannot exceed 500 characters"),
    technologySystems: z.string()
      .min(50, "Technology details must be at least 50 characters")
      .max(300, "Technology details cannot exceed 300 characters"),
    siteSelection: z.boolean(),
  }),

  // Performance Metrics section
  performance: z.object({
    averageUnitSales: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Sales must be a number")
        .refine((val) => parseFloat(val) >= 0, "Sales must be a positive number"),
      currency: z.string().default("INR"),
    }),
    salesGrowth: z.string()
      .min(1, "Growth information is required")
      .max(100, "Growth information cannot exceed 100 characters"),
    averageBreakeven: z.string()
      .min(1, "Breakeven information is required")
      .max(100, "Breakeven information cannot exceed 100 characters"),
    successRate: z.string()
      .refine((val) => val === '' || !isNaN(parseFloat(val)), "Rate must be a number if provided")
      .refine((val) => val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100), "Rate must be between 0 and 100%")
      .optional(),
    franchiseeRequirements: z.string()
      .min(100, "Requirements must be at least 100 characters")
      .max(500, "Requirements cannot exceed 500 characters"),
    netWorthRequirement: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Net worth must be a number")
        .refine((val) => parseFloat(val) >= 0, "Net worth must be a positive number"),
      currency: z.string().default("INR"),
    }),
    liquidCapitalRequired: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Capital must be a number")
        .refine((val) => parseFloat(val) >= 0, "Capital must be a positive number"),
      currency: z.string().default("INR"),
    }),
  }),
});

// Default values for the form
const defaultFranchiseFormValues = {
  franchiseBrand: "",
  franchiseType: FranchiseType.FOOD_AND_BEVERAGE,
  franchiseSince: new Date().getFullYear().toString(),
  brandEstablished: new Date().getFullYear().toString(),
  totalUnits: "0",
  franchiseeCount: "0",
  companyOwnedUnits: "0",
  availableTerritories: [],
  investment: {
    franchiseFee: {
      value: "0",
      currency: "INR",
    },
    royaltyFee: "0",
    royaltyStructure: "",
    marketingFee: "0",
    totalInitialInvestment: {
      value: "0",
      currency: "INR",
    },
    recurringFees: "",
  },
  support: {
    initialTraining: "",
    trainingDuration: "",
    trainingLocation: "",
    ongoingSupport: "",
    fieldSupport: "",
    marketingSupport: "",
    technologySystems: "",
    siteSelection: false,
  },
  performance: {
    averageUnitSales: {
      value: "0",
      currency: "INR",
    },
    salesGrowth: "",
    averageBreakeven: "",
    successRate: "",
    franchiseeRequirements: "",
    netWorthRequirement: {
      value: "0",
      currency: "INR",
    },
    liquidCapitalRequired: {
      value: "0",
      currency: "INR",
    },
  },
};

const franchiseTypeOptions = [
  { value: FranchiseType.FOOD_AND_BEVERAGE, label: "Food & Beverage" },
  { value: FranchiseType.RETAIL, label: "Retail" },
  { value: FranchiseType.SERVICE, label: "Service" },
  { value: FranchiseType.EDUCATION, label: "Education" },
  { value: FranchiseType.WELLNESS, label: "Health & Wellness" },
  { value: FranchiseType.OTHER, label: "Other" },
];

// Common Indian territories for available territories multi-select
const availableTerritoryOptions = [
  { value: "north_india", label: "North India" },
  { value: "south_india", label: "South India" },
  { value: "east_india", label: "East India" },
  { value: "west_india", label: "West India" },
  { value: "central_india", label: "Central India" },
  { value: "metro_cities", label: "Metro Cities Only" },
  { value: "tier_2_cities", label: "Tier 2 Cities" },
  { value: "tier_3_cities", label: "Tier 3 Cities & Rural Areas" },
  { value: "pan_india", label: "Pan India" },
  { value: "international", label: "International" },
];

/**
 * Franchise Form Component - Step 3 of listing creation
 * Includes all sections as specified in the documentation:
 * - Franchise Information
 * - Investment Details
 * - Support & Training
 * - Performance Metrics
 * 
 * @param {Object} props - Component props
 * @param {Object} props.defaultValues - Default values for the form 
 * @param {Function} props.onSubmit - Callback for form submission
 * @param {boolean} props.isSubmitting - Whether the form is currently submitting
 * @param {boolean} props.isEdit - Whether we're editing an existing listing
 */
export default function FranchiseForm({ 
  defaultValues = {}, 
  onSubmit, 
  isSubmitting = false, 
  isEdit = false 
}) {
  // State for managing the territory input
  const [territoryInput, setTerritoryInput] = useState("");
  const [customTerritories, setCustomTerritories] = useState([]);
  
  // Set up form with schema validation
  const form = useForm({
    resolver: zodResolver(franchiseFormSchema),
    defaultValues: { ...defaultFranchiseFormValues, ...defaultValues },
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

  // Watch for values that affect conditional rendering or calculations
  const siteSelection = watch("support.siteSelection");
  const availableTerritories = watch("availableTerritories") || [];
  
  // Add a custom territory
  const addCustomTerritory = () => {
    if (territoryInput.trim() && !customTerritories.includes(territoryInput.trim())) {
      const newTerritory = territoryInput.trim();
      setCustomTerritories([...customTerritories, newTerritory]);
      
      // Add to form values
      const currentTerritories = getValues("availableTerritories") || [];
      setValue("availableTerritories", [...currentTerritories, newTerritory]);
      
      // Clear input
      setTerritoryInput("");
    }
  };

  // Remove a territory from the selection
  const removeTerritory = (territory) => {
    const currentTerritories = getValues("availableTerritories") || [];
    setValue(
      "availableTerritories", 
      currentTerritories.filter(t => t !== territory)
    );
    
    // If it's a custom territory, also remove from that list
    if (customTerritories.includes(territory)) {
      setCustomTerritories(customTerritories.filter(t => t !== territory));
    }
  };

  // Toggle a predefined territory
  const toggleTerritory = (territory) => {
    const currentTerritories = getValues("availableTerritories") || [];
    const territoryExists = currentTerritories.includes(territory);
    
    if (territoryExists) {
      setValue(
        "availableTerritories", 
        currentTerritories.filter(t => t !== territory)
      );
    } else {
      setValue("availableTerritories", [...currentTerritories, territory]);
    }
  };

  // Format currency inputs for display
  const formatCurrency = (value) => {
    if (!value) return "₹0";
    return currencyFormatter(parseFloat(value), "INR");
  };

  // Handler for form submission
  const onFormSubmit = (data) => {
    // Process the data - convert string number values to actual numbers
    const processedData = {
      ...data,
      franchiseSince: parseInt(data.franchiseSince),
      brandEstablished: parseInt(data.brandEstablished),
      totalUnits: parseInt(data.totalUnits),
      franchiseeCount: parseInt(data.franchiseeCount),
      companyOwnedUnits: parseInt(data.companyOwnedUnits),
      investment: {
        ...data.investment,
        franchiseFee: {
          ...data.investment.franchiseFee,
          value: parseFloat(data.investment.franchiseFee.value),
        },
        royaltyFee: parseFloat(data.investment.royaltyFee),
        marketingFee: parseFloat(data.investment.marketingFee),
        totalInitialInvestment: {
          ...data.investment.totalInitialInvestment,
          value: parseFloat(data.investment.totalInitialInvestment.value),
        },
      },
      performance: {
        ...data.performance,
        averageUnitSales: {
          ...data.performance.averageUnitSales,
          value: parseFloat(data.performance.averageUnitSales.value),
        },
        successRate: data.performance.successRate 
          ? parseFloat(data.performance.successRate) 
          : undefined,
        netWorthRequirement: {
          ...data.performance.netWorthRequirement,
          value: parseFloat(data.performance.netWorthRequirement.value),
        },
        liquidCapitalRequired: {
          ...data.performance.liquidCapitalRequired,
          value: parseFloat(data.performance.liquidCapitalRequired.value),
        },
      },
    };

    onSubmit(processedData);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {/* Franchise Information Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              Franchise Information
              <Tooltip content="Basic information about the franchise system">
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Franchise Brand */}
              <FormField
                control={control}
                name="franchiseBrand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Franchise Brand <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter franchise brand name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Official name of the franchise system
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Franchise Type */}
              <FormField
                control={control}
                name="franchiseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Franchise Type <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select franchise type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {franchiseTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The category or industry of the franchise
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Franchise Since */}
              <FormField
                control={control}
                name="franchiseSince"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Franchising Since <span className="text-red-500">*</span></FormLabel>
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
                      Year when franchising operations began
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Brand Established */}
              <FormField
                control={control}
                name="brandEstablished"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Established <span className="text-red-500">*</span></FormLabel>
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
                      Year when the brand was first established
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Total Units */}
              <FormField
                control={control}
                name="totalUnits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Units <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Number of units"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Total operating locations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Franchisee Count */}
              <FormField
                control={control}
                name="franchiseeCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Franchisee Count <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Number of franchisees"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Total number of franchisees
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company-Owned Units */}
              <FormField
                control={control}
                name="companyOwnedUnits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company-Owned Units <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Number of corporate units"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Units owned by the franchisor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Available Territories */}
            <div className="space-y-4">
              <FormField
                control={control}
                name="availableTerritories"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Available Territories <span className="text-red-500">*</span></FormLabel>
                      <span className="text-xs text-gray-500">
                        {availableTerritories.length} selected
                      </span>
                    </div>
                    <FormDescription className="mb-2">
                      Geographic regions where franchises are available
                    </FormDescription>

                    {/* Territory selection UI */}
                    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                      {/* Predefined territory options */}
                      <div className="flex flex-wrap gap-2">
                        {availableTerritoryOptions.map(territory => (
                          <div 
                            key={territory.value}
                            onClick={() => toggleTerritory(territory.value)}
                            className={cn(
                              "px-3 py-1.5 text-sm rounded-full cursor-pointer transition-colors",
                              availableTerritories.includes(territory.value)
                                ? "bg-primary-700 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            {territory.label}
                          </div>
                        ))}
                      </div>

                      {/* Custom territory input */}
                      <div className="flex items-center mt-2">
                        <Input
                          placeholder="Add another territory"
                          value={territoryInput}
                          onChange={(e) => setTerritoryInput(e.target.value)}
                          className="flex-grow mr-2"
                        />
                        <Button 
                          type="button"
                          onClick={addCustomTerritory}
                          className="shrink-0"
                          variant="secondary"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>

                      {/* Selected territories */}
                      {availableTerritories.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm font-medium mb-2">Selected Territories:</div>
                          <div className="flex flex-wrap gap-2">
                            {availableTerritories.map(territory => {
                              // Find label for predefined territories
                              const option = availableTerritoryOptions.find(t => t.value === territory);
                              const label = option ? option.label : territory;
                              
                              return (
                                <Badge key={territory} variant="secondary" className="px-2 py-1">
                                  {label}
                                  <X
                                    className="h-3 w-3 ml-1 cursor-pointer"
                                    onClick={() => removeTerritory(territory)}
                                  />
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Investment Details Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              Investment Details
              <Tooltip content="Financial information about the franchise opportunity">
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Franchise Fee */}
              <FormField
                control={control}
                name="investment.franchiseFee.value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Franchise Fee <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="10000"
                        placeholder="Initial franchise fee"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      One-time initial fee for the franchise license
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total Initial Investment */}
              <FormField
                control={control}
                name="investment.totalInitialInvestment.value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Initial Investment <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="10000"
                        placeholder="Total startup investment required"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      All-inclusive total investment to start
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Royalty Fee */}
              <FormField
                control={control}
                name="investment.royaltyFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Royalty Fee <span className="text-red-500">*</span></FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          max="50"
                          step="0.1"
                          placeholder="Ongoing royalty percentage"
                          {...field} 
                        />
                      </FormControl>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                    <FormDescription>
                      Ongoing percentage of revenue paid to franchisor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Marketing Fee */}
              <FormField
                control={control}
                name="investment.marketingFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marketing Fee <span className="text-red-500">*</span></FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          max="20"
                          step="0.1"
                          placeholder="Marketing contribution percentage"
                          {...field} 
                        />
                      </FormControl>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                    <FormDescription>
                      Ongoing contribution to marketing fund
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Royalty Structure */}
            <FormField
              control={control}
              name="investment.royaltyStructure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Royalty Structure <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain how royalties are calculated and collected"
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Explain the basis and frequency of royalty payments
                    </FormDescription>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/300 characters
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurring Fees */}
            <FormField
              control={control}
              name="investment.recurringFees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurring Fees <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detail all ongoing fees beyond royalty and marketing"
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      List all regular payments required from franchisees
                    </FormDescription>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/300 characters
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Support & Training Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              Support & Training
              <Tooltip content="Information about training and ongoing support provided">
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Initial Training */}
            <FormField
              control={control}
              name="support.initialTraining"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Training <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the initial training program for franchisees"
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Detail the content and approach of initial training
                    </FormDescription>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/500 characters
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-6">
              {/* Training Duration */}
              <FormField
                control={control}
                name="support.trainingDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Duration <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 2 weeks, 10 days, etc."
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Length of initial training period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Training Location */}
              <FormField
                control={control}
                name="support.trainingLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Location <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Headquarters, Online, Regional centers"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Where training is conducted
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ongoing Support */}
            <FormField
              control={control}
              name="support.ongoingSupport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ongoing Support <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the continuing support offered after opening"
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Detail the types and frequency of ongoing support
                    </FormDescription>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/500 characters
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Support */}
            <FormField
              control={control}
              name="support.fieldSupport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Support <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Monthly visits, Quarterly reviews"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Frequency and type of in-person support visits
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Marketing Support */}
            <FormField
              control={control}
              name="support.marketingSupport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marketing Support <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the marketing assistance provided"
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Detail marketing tools and programs provided
                    </FormDescription>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/500 characters
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Technology Systems */}
            <FormField
              control={control}
              name="support.technologySystems"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technology Systems <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the technological infrastructure provided"
                      className="resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Detail key systems provided (POS, inventory, etc.)
                    </FormDescription>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/300 characters
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Site Selection */}
            <FormField
              control={control}
              name="support.siteSelection"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Site Selection Assistance</FormLabel>
                    <FormDescription>
                      Franchisor provides help with location selection
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Performance Metrics Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              Performance Metrics
              <Tooltip content="Data about franchise performance and requirements">
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Average Unit Sales */}
              <FormField
                control={control}
                name="performance.averageUnitSales.value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Unit Sales <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="10000"
                        placeholder="Average annual revenue per location"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Typical revenue per franchise location
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Success Rate (Optional) */}
              <FormField
                control={control}
                name="performance.successRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Success Rate</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          max="100"
                          step="1"
                          placeholder="Unit survival rate (optional)"
                          {...field} 
                        />
                      </FormControl>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                    <FormDescription>
                      Percentage of units still operating after 5 years
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Sales Growth */}
              <FormField
                control={control}
                name="performance.salesGrowth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Growth <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 5-10% annually"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Revenue growth trend with timeframe
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Average Breakeven */}
              <FormField
                control={control}
                name="performance.averageBreakeven"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Breakeven <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 12-18 months"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Typical time to reach profitability
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Franchisee Requirements */}
            <FormField
              control={control}
              name="performance.franchiseeRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Franchisee Requirements <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe qualification criteria for potential franchisees"
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Outline financial, experience, and personal requirements
                    </FormDescription>
                    <div className="text-xs text-gray-500">
                      {field.value?.length || 0}/500 characters
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-6">
              {/* Net Worth Requirement */}
              <FormField
                control={control}
                name="performance.netWorthRequirement.value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Net Worth Requirement <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="100000"
                        placeholder="Minimum net worth required"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum financial position required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Liquid Capital Required */}
              <FormField
                control={control}
                name="performance.liquidCapitalRequired.value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liquid Capital Required <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="100000"
                        placeholder="Immediately available cash needed"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Cash required for initial investment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            ) : isEdit ? 'Update Franchise Details' : 'Save Franchise Details'}
          </button>
        </div>
      </form>
    </div>
  );
}