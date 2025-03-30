import React, { useState, Fragment } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Transition, Listbox, Disclosure, Popover } from '@headlessui/react';
import { Info, HelpCircle, Plus, X, Check, ChevronDown } from 'lucide-react';
import { FranchiseType } from '@/types/listings';
import { cn } from '@/lib/utils';

// Create a tooltip component with Headless UI
const Tooltip = ({ content, children }) => {
  return (
    <Popover className="relative inline-block">
      <Popover.Button className="focus:outline-none">
        {children}
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Popover.Panel className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2">
          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {content}
            <div className="border-t border-r border-gray-800 absolute bottom-0 left-1/2 w-2 h-2 bg-gray-800 transform rotate-45 translate-y-1 -translate-x-1/2"></div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

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
 * Includes all sections as specified in the documentation
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
    formState: { errors }, 
    register 
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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-xl font-semibold flex items-center">
              Franchise Information
              <Tooltip content="Basic information about the franchise system">
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </Tooltip>
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Franchise Brand */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Franchise Brand <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("franchiseBrand")}
                    placeholder="Enter franchise brand name"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Official name of the franchise system
                </p>
                {errors.franchiseBrand && (
                  <p className="text-sm text-red-600 mt-1">{errors.franchiseBrand.message}</p>
                )}
              </div>

              {/* Franchise Type */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Franchise Type <span className="text-red-500">*</span>
                </label>
                <Listbox
                  value={watch("franchiseType")}
                  onChange={(value) => setValue("franchiseType", value)}
                >
                  <div className="mt-1 relative">
                    <Listbox.Button className="relative w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                      <span className="block truncate">
                        {franchiseTypeOptions.find(option => option.value === watch("franchiseType"))?.label || "Select franchise type"}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {franchiseTypeOptions.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active }) =>
                              cn(
                                "relative cursor-default select-none py-2 pl-10 pr-4",
                                active ? "bg-blue-600 text-white" : "text-gray-900"
                              )
                            }
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={cn("block truncate", selected ? "font-medium" : "font-normal")}>
                                  {option.label}
                                </span>
                                {selected && (
                                  <span className={cn(
                                    "absolute inset-y-0 left-0 flex items-center pl-3",
                                    active ? "text-white" : "text-blue-600"
                                  )}>
                                    <Check className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
                <p className="text-xs text-gray-500">
                  The category or industry of the franchise
                </p>
                {errors.franchiseType && (
                  <p className="text-sm text-red-600 mt-1">{errors.franchiseType.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Franchise Since */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Franchising Since <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("franchiseSince")}
                    type="number" 
                    placeholder="YYYY" 
                    min={1900} 
                    max={new Date().getFullYear()}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Year when franchising operations began
                </p>
                {errors.franchiseSince && (
                  <p className="text-sm text-red-600 mt-1">{errors.franchiseSince.message}</p>
                )}
              </div>

              {/* Brand Established */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Brand Established <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("brandEstablished")}
                    type="number" 
                    placeholder="YYYY" 
                    min={1900} 
                    max={new Date().getFullYear()}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Year when the brand was first established
                </p>
                {errors.brandEstablished && (
                  <p className="text-sm text-red-600 mt-1">{errors.brandEstablished.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Total Units */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Total Units <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("totalUnits")}
                    type="number" 
                    min="0"
                    placeholder="Number of units"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Total operating locations
                </p>
                {errors.totalUnits && (
                  <p className="text-sm text-red-600 mt-1">{errors.totalUnits.message}</p>
                )}
              </div>

              {/* Franchisee Count */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Franchisee Count <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("franchiseeCount")}
                    type="number" 
                    min="0"
                    placeholder="Number of franchisees"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Total number of franchisees
                </p>
                {errors.franchiseeCount && (
                  <p className="text-sm text-red-600 mt-1">{errors.franchiseeCount.message}</p>
                )}
              </div>

              {/* Company-Owned Units */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Company-Owned Units <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("companyOwnedUnits")}
                    type="number" 
                    min="0"
                    placeholder="Number of corporate units"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Units owned by the franchisor
                </p>
                {errors.companyOwnedUnits && (
                  <p className="text-sm text-red-600 mt-1">{errors.companyOwnedUnits.message}</p>
                )}
              </div>
            </div>

            {/* Available Territories */}
            <div className="space-y-4">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Available Territories <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-500">
                    {availableTerritories.length} selected
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Geographic regions where franchises are available
                </p>

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
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {territory.label}
                      </div>
                    ))}
                  </div>

                  {/* Custom territory input */}
                  <div className="flex items-center mt-2">
                    <input
                      placeholder="Add another territory"
                      value={territoryInput}
                      onChange={(e) => setTerritoryInput(e.target.value)}
                      className="flex-grow mr-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <button 
                      type="button"
                      onClick={addCustomTerritory}
                      className="shrink-0 px-3 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1 inline-block" />
                      Add
                    </button>
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
                            <span key={territory} className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                              {label}
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer"
                                onClick={() => removeTerritory(territory)}
                              />
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {errors.availableTerritories && (
                  <p className="text-sm text-red-600 mt-1">{errors.availableTerritories.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Investment Details Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-xl font-semibold flex items-center">
              Investment Details
              <Tooltip content="Financial information about the franchise opportunity">
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </Tooltip>
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Franchise Fee */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Franchise Fee <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("investment.franchiseFee.value")}
                    type="number" 
                    min="0"
                    step="10000"
                    placeholder="Initial franchise fee"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  One-time initial fee for the franchise license
                </p>
                {errors.investment?.franchiseFee?.value && (
                  <p className="text-sm text-red-600 mt-1">{errors.investment.franchiseFee.value.message}</p>
                )}
              </div>

              {/* Total Initial Investment */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Total Initial Investment <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("investment.totalInitialInvestment.value")}
                    type="number" 
                    min="0"
                    step="10000"
                    placeholder="Total startup investment required"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  All-inclusive total investment to start
                </p>
                {errors.investment?.totalInitialInvestment?.value && (
                  <p className="text-sm text-red-600 mt-1">{errors.investment.totalInitialInvestment.value.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Royalty Fee */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Royalty Fee <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    {...register("investment.royaltyFee")}
                    type="number" 
                    min="0"
                    max="50"
                    step="0.1"
                    placeholder="Ongoing royalty percentage"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pr-7"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Ongoing percentage of revenue paid to franchisor
                </p>
                {errors.investment?.royaltyFee && (
                  <p className="text-sm text-red-600 mt-1">{errors.investment.royaltyFee.message}</p>
                )}
              </div>

              {/* Marketing Fee */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Marketing Fee <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    {...register("investment.marketingFee")}
                    type="number" 
                    min="0"
                    max="20"
                    step="0.1"
                    placeholder="Marketing contribution percentage"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pr-7"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Ongoing contribution to marketing fund
                </p>
                {errors.investment?.marketingFee && (
                  <p className="text-sm text-red-600 mt-1">{errors.investment.marketingFee.message}</p>
                )}
              </div>
            </div>

            {/* Royalty Structure */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Royalty Structure <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  {...register("investment.royaltyStructure")}
                  placeholder="Explain how royalties are calculated and collected"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-24 resize-y"
                />
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">
                  Explain the basis and frequency of royalty payments
                </p>
                <div className="text-xs text-gray-500">
                  {watch("investment.royaltyStructure")?.length || 0}/300 characters
                </div>
              </div>
              {errors.investment?.royaltyStructure && (
                <p className="text-sm text-red-600 mt-1">{errors.investment.royaltyStructure.message}</p>
              )}
            </div>

            {/* Recurring Fees */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Recurring Fees <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  {...register("investment.recurringFees")}
                  placeholder="Detail all ongoing fees beyond royalty and marketing"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-24 resize-y"
                />
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">
                  List all regular payments required from franchisees
                </p>
                <div className="text-xs text-gray-500">
                  {watch("investment.recurringFees")?.length || 0}/300 characters
                </div>
              </div>
              {errors.investment?.recurringFees && (
                <p className="text-sm text-red-600 mt-1">{errors.investment.recurringFees.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Support & Training Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-xl font-semibold flex items-center">
              Support & Training
              <Tooltip content="Information about training and ongoing support provided">
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </Tooltip>
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Initial Training */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Initial Training <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  {...register("support.initialTraining")}
                  placeholder="Describe the initial training program for franchisees"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-24 resize-y"
                />
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">
                  Detail the content and approach of initial training
                </p>
                <div className="text-xs text-gray-500">
                  {watch("support.initialTraining")?.length || 0}/500 characters
                </div>
              </div>
              {errors.support?.initialTraining && (
                <p className="text-sm text-red-600 mt-1">{errors.support.initialTraining.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Training Duration */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Training Duration <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("support.trainingDuration")}
                    placeholder="e.g., 2 weeks, 10 days, etc."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Length of initial training period
                </p>
                {errors.support?.trainingDuration && (
                  <p className="text-sm text-red-600 mt-1">{errors.support.trainingDuration.message}</p>
                )}
              </div>

              {/* Training Location */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Training Location <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("support.trainingLocation")}
                    placeholder="e.g., Headquarters, Online, Regional centers"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Where training is conducted
                </p>
                {errors.support?.trainingLocation && (
                  <p className="text-sm text-red-600 mt-1">{errors.support.trainingLocation.message}</p>
                )}
              </div>
            </div>

            {/* Ongoing Support */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Ongoing Support <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  {...register("support.ongoingSupport")}
                  placeholder="Describe the continuing support offered after opening"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-24 resize-y"
                />
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">
                  Detail the types and frequency of ongoing support
                </p>
                <div className="text-xs text-gray-500">
                  {watch("support.ongoingSupport")?.length || 0}/500 characters
                </div>
              </div>
              {errors.support?.ongoingSupport && (
                <p className="text-sm text-red-600 mt-1">{errors.support.ongoingSupport.message}</p>
              )}
            </div>

            {/* Field Support */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Field Support <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  {...register("support.fieldSupport")}
                  placeholder="e.g., Monthly visits, Quarterly reviews"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <p className="text-xs text-gray-500">
                Frequency and type of in-person support visits
              </p>
              {errors.support?.fieldSupport && (
                <p className="text-sm text-red-600 mt-1">{errors.support.fieldSupport.message}</p>
              )}
            </div>

            {/* Marketing Support */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Marketing Support <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  {...register("support.marketingSupport")}
                  placeholder="Describe the marketing assistance provided"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-24 resize-y"
                />
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">
                  Detail marketing tools and programs provided
                </p>
                <div className="text-xs text-gray-500">
                  {watch("support.marketingSupport")?.length || 0}/500 characters
                </div>
              </div>
              {errors.support?.marketingSupport && (
                <p className="text-sm text-red-600 mt-1">{errors.support.marketingSupport.message}</p>
              )}
            </div>

            {/* Technology Systems */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Technology Systems <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  {...register("support.technologySystems")}
                  placeholder="Describe the technological infrastructure provided"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-y"
                />
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">
                  Detail key systems provided (POS, inventory, etc.)
                </p>
                <div className="text-xs text-gray-500">
                  {watch("support.technologySystems")?.length || 0}/300 characters
                </div>
              </div>
              {errors.support?.technologySystems && (
                <p className="text-sm text-red-600 mt-1">{errors.support.technologySystems.message}</p>
              )}
            </div>

            {/* Site Selection - Using Headless UI Checkbox */}
            <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-gray-700">Site Selection Assistance</label>
                <p className="text-xs text-gray-500">
                  Franchisor provides help with location selection
                </p>
              </div>
              <div>
                <input
                  type="checkbox"
                  id="site-selection"
                  {...register("support.siteSelection")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-xl font-semibold flex items-center">
              Performance Metrics
              <Tooltip content="Data about franchise performance and requirements">
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </Tooltip>
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Average Unit Sales */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Average Unit Sales <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("performance.averageUnitSales.value")}
                    type="number" 
                    min="0"
                    step="10000"
                    placeholder="Average annual revenue per location"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Typical revenue per franchise location
                </p>
                {errors.performance?.averageUnitSales?.value && (
                  <p className="text-sm text-red-600 mt-1">{errors.performance.averageUnitSales.value.message}</p>
                )}
              </div>

              {/* Success Rate (Optional) */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Success Rate
                </label>
                <div className="relative mt-1">
                  <input
                    {...register("performance.successRate")}
                    type="number" 
                    min="0"
                    max="100"
                    step="1"
                    placeholder="Unit survival rate (optional)"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pr-7"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Percentage of units still operating after 5 years
                </p>
                {errors.performance?.successRate && (
                  <p className="text-sm text-red-600 mt-1">{errors.performance.successRate.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Sales Growth */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Sales Growth <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("performance.salesGrowth")}
                    placeholder="e.g., 5-10% annually"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Revenue growth trend with timeframe
                </p>
                {errors.performance?.salesGrowth && (
                  <p className="text-sm text-red-600 mt-1">{errors.performance.salesGrowth.message}</p>
                )}
              </div>

              {/* Average Breakeven */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Average Breakeven <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("performance.averageBreakeven")}
                    placeholder="e.g., 12-18 months"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Typical time to reach profitability
                </p>
                {errors.performance?.averageBreakeven && (
                  <p className="text-sm text-red-600 mt-1">{errors.performance.averageBreakeven.message}</p>
                )}
              </div>
            </div>

            {/* Franchisee Requirements */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Franchisee Requirements <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  {...register("performance.franchiseeRequirements")}
                  placeholder="Describe qualification criteria for potential franchisees"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-24 resize-y"
                />
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">
                  Outline financial, experience, and personal requirements
                </p>
                <div className="text-xs text-gray-500">
                  {watch("performance.franchiseeRequirements")?.length || 0}/500 characters
                </div>
              </div>
              {errors.performance?.franchiseeRequirements && (
                <p className="text-sm text-red-600 mt-1">{errors.performance.franchiseeRequirements.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Net Worth Requirement */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Net Worth Requirement <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("performance.netWorthRequirement.value")}
                    type="number" 
                    min="0"
                    step="100000"
                    placeholder="Minimum net worth required"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Minimum financial position required
                </p>
                {errors.performance?.netWorthRequirement?.value && (
                  <p className="text-sm text-red-600 mt-1">{errors.performance.netWorthRequirement.value.message}</p>
                )}
              </div>

              {/* Liquid Capital Required */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Liquid Capital Required <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    {...register("performance.liquidCapitalRequired.value")}
                    type="number" 
                    min="0"
                    step="100000"
                    placeholder="Immediately available cash needed"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Cash required for initial investment
                </p>
                {errors.performance?.liquidCapitalRequired?.value && (
                  <p className="text-sm text-red-600 mt-1">{errors.performance.liquidCapitalRequired.value.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Submission */}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
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