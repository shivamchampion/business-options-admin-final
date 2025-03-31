import React, { useState, Fragment, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Transition, Listbox, Disclosure } from '@headlessui/react';
import { Info, HelpCircle, X, Check, ChevronDown, AlertCircle } from 'lucide-react';
import { FranchiseType } from '@/types/listings';
import { cn } from '@/lib/utils';

// Create a tooltip component
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

// Options for franchise type dropdown
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
export default function FranchiseForm({ submitAttempted = false }) {
  // Get form context from parent
  const { 
    control, 
    watch, 
    setValue, 
    getValues, 
    register,
    trigger,
    formState: { errors } 
  } = useFormContext();

  // Watch for values that affect conditional rendering or calculations
  const siteSelection = watch("franchiseDetails.support.siteSelection");
  const availableTerritories = watch("franchiseDetails.availableTerritories") || [];

  // Update the useEffect in your FranchiseForm component to trigger validation for all fields
useEffect(() => {
  if (submitAttempted) {
    // Create an array of all fields to validate
    const fieldsToValidate = [
      "franchiseDetails.franchiseBrand",
      "franchiseDetails.franchiseType",
      "franchiseDetails.franchiseSince",
      "franchiseDetails.brandEstablished",
      "franchiseDetails.totalUnits",
      "franchiseDetails.franchiseeCount",
      "franchiseDetails.companyOwnedUnits",
      "franchiseDetails.availableTerritories",
      "franchiseDetails.investment.franchiseFee.value",
      "franchiseDetails.investment.totalInitialInvestment.value",
      "franchiseDetails.investment.royaltyFee",
      "franchiseDetails.investment.marketingFee",
      "franchiseDetails.investment.royaltyStructure",
      "franchiseDetails.investment.recurringFees",
      "franchiseDetails.support.initialTraining",
      "franchiseDetails.support.trainingDuration",
      "franchiseDetails.support.trainingLocation",
      "franchiseDetails.support.ongoingSupport",
      "franchiseDetails.support.fieldSupport",
      "franchiseDetails.support.marketingSupport",
      "franchiseDetails.support.technologySystems",
      "franchiseDetails.performance.averageUnitSales.value",
      "franchiseDetails.performance.salesGrowth",
      "franchiseDetails.performance.averageBreakeven",
      "franchiseDetails.performance.franchiseeRequirements",
      "franchiseDetails.performance.netWorthRequirement.value",
      "franchiseDetails.performance.liquidCapitalRequired.value"
    ];
    
    // Trigger validation for all fields
    Promise.all(fieldsToValidate.map(field => trigger(field))).then(() => {
      // Then trigger the parent field to check overall validity
      trigger("franchiseDetails");
    });
  }
}, [submitAttempted, trigger]);

// Also add this function to register fields with validation:
const registerWithValidation = (name, options) => {
  return register(name, {
    ...options,
    onBlur: () => trigger(name)
  });
};

  // Toggle a predefined territory
  const toggleTerritory = (territory) => {
    const currentTerritories = getValues("franchiseDetails.availableTerritories") || [];
    const territoryExists = currentTerritories.includes(territory);
    
    if (territoryExists) {
      setValue(
        "franchiseDetails.availableTerritories", 
        currentTerritories.filter(t => t !== territory)
      );
    } else {
      setValue("franchiseDetails.availableTerritories", [...currentTerritories, territory]);
    }
  };

  // Helper function to show error message consistently
  const renderErrorMessage = (errorObj) => {
    if (!errorObj) return null;
    
    return (
      <p className="text-sm text-red-600 flex items-center mt-1">
        <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
        {errorObj.message}
      </p>
    );
  };

  return (
    <div className="space-y-6">
      {/* Info Message */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Franchise Details</p>
          <p>
            Provide comprehensive information about your franchise opportunity, including investment requirements,
            support options, and performance metrics. All fields marked with an asterisk (*) are required.
          </p>
        </div>
      </div>

      {/* Franchise Information Section */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-gray-800">Franchise Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Franchise Brand */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.franchiseBrand" className="block text-sm font-semibold text-gray-800 mr-2">
                Franchise Brand <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Official name of the franchise system">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="franchiseDetails.franchiseBrand"
              type="text"
              placeholder="Enter franchise brand name"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.franchiseDetails?.franchiseBrand ? "border-red-300" : "border-gray-300"
              )}
              {...register("franchiseDetails.franchiseBrand", {
                required: "Franchise brand name is required",
                onBlur: () => trigger("franchiseDetails.franchiseBrand")
              })}
            />

            {renderErrorMessage(errors.franchiseDetails?.franchiseBrand) || (
              <p className="text-xs text-gray-500 mt-1">
                Official name of the franchise system
              </p>
            )}
          </div>

          {/* Franchise Type */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Franchise Type <span className="text-red-500">*</span>
              </label>
              <Tooltip content="The category or industry of the franchise">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <Listbox
              value={watch("franchiseDetails.franchiseType")}
              onChange={(value) => {
                setValue("franchiseDetails.franchiseType", value);
                trigger("franchiseDetails.franchiseType");
              }}
            >
              <div className="relative mt-1">
                <Listbox.Button className={cn(
                  "relative w-full rounded-md border py-2 pl-3 pr-10 text-left shadow-sm focus:border-[#0031ac] focus:outline-none focus:ring-1 focus:ring-[#0031ac] text-sm",
                  errors.franchiseDetails?.franchiseType ? "border-red-300" : "border-gray-300"
                )}>
                  <span className="block truncate">
                    {franchiseTypeOptions.find(option => option.value === watch("franchiseDetails.franchiseType"))?.label || "Select franchise type"}
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
                            active ? "bg-[#0031ac] text-white" : "text-gray-900"
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
                                active ? "text-white" : "text-[#0031ac]"
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

            {renderErrorMessage(errors.franchiseDetails?.franchiseType) || (
              <p className="text-xs text-gray-500 mt-1">
                The category or industry of the franchise
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Franchise Since */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.franchiseSince" className="block text-sm font-semibold text-gray-800 mr-2">
                Franchising Since <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Year when franchising operations began">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="franchiseDetails.franchiseSince"
              type="number" 
              placeholder="YYYY" 
              min={1900} 
              max={new Date().getFullYear()}
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.franchiseDetails?.franchiseSince ? "border-red-300" : "border-gray-300"
              )}
              {...register("franchiseDetails.franchiseSince", {
                required: "Franchising since year is required",
                onBlur: () => trigger("franchiseDetails.franchiseSince")
              })}
            />

            {renderErrorMessage(errors.franchiseDetails?.franchiseSince) || (
              <p className="text-xs text-gray-500 mt-1">
                Year when franchising operations began
              </p>
            )}
          </div>

          {/* Brand Established */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.brandEstablished" className="block text-sm font-semibold text-gray-800 mr-2">
                Brand Established <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Year when the brand was first established">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="franchiseDetails.brandEstablished"
              type="number" 
              placeholder="YYYY" 
              min={1900} 
              max={new Date().getFullYear()}
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.franchiseDetails?.brandEstablished ? "border-red-300" : "border-gray-300"
              )}
              {...register("franchiseDetails.brandEstablished", {
                required: "Brand establishment year is required",
                onBlur: () => trigger("franchiseDetails.brandEstablished")
              })}
            />

            {renderErrorMessage(errors.franchiseDetails?.brandEstablished) || (
              <p className="text-xs text-gray-500 mt-1">
                Year when the brand was first established
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Units */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.totalUnits" className="block text-sm font-semibold text-gray-800 mr-2">
                Total Units <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Total operating locations">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="franchiseDetails.totalUnits"
              type="number" 
              min="0"
              placeholder="Number of units"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.franchiseDetails?.totalUnits ? "border-red-300" : "border-gray-300"
              )}
              {...register("franchiseDetails.totalUnits", {
                required: "Total units is required",
                onBlur: () => trigger("franchiseDetails.totalUnits")
              })}
            />

            {renderErrorMessage(errors.franchiseDetails?.totalUnits) || (
              <p className="text-xs text-gray-500 mt-1">
                Total operating locations
              </p>
            )}
          </div>

          {/* Franchisee Count */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.franchiseeCount" className="block text-sm font-semibold text-gray-800 mr-2">
                Franchisee Count <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Total number of franchisees">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="franchiseDetails.franchiseeCount"
              type="number" 
              min="0"
              placeholder="Number of franchisees"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.franchiseDetails?.franchiseeCount ? "border-red-300" : "border-gray-300"
              )}
              {...register("franchiseDetails.franchiseeCount", {
                required: "Franchisee count is required",
                onBlur: () => trigger("franchiseDetails.franchiseeCount")
              })}
            />

            {renderErrorMessage(errors.franchiseDetails?.franchiseeCount) || (
              <p className="text-xs text-gray-500 mt-1">
                Total number of franchisees
              </p>
            )}
          </div>

          {/* Company-Owned Units */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.companyOwnedUnits" className="block text-sm font-semibold text-gray-800 mr-2">
                Company-Owned Units <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Units owned by the franchisor">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="franchiseDetails.companyOwnedUnits"
              type="number" 
              min="0"
              placeholder="Number of corporate units"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.franchiseDetails?.companyOwnedUnits ? "border-red-300" : "border-gray-300"
              )}
              {...register("franchiseDetails.companyOwnedUnits", {
                required: "Company-owned units is required",
                onBlur: () => trigger("franchiseDetails.companyOwnedUnits")
              })}
            />

            {renderErrorMessage(errors.franchiseDetails?.companyOwnedUnits) || (
              <p className="text-xs text-gray-500 mt-1">
                Units owned by the franchisor
              </p>
            )}
          </div>
        </div>

        {/* Available Territories */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Available Territories <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Geographic regions where franchises are available">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <span className="text-xs text-gray-500">
              {availableTerritories.length} selected
            </span>
          </div>

          <div className={cn(
            "border rounded-md p-4 space-y-3",
            errors.franchiseDetails?.availableTerritories ? "border-red-300" : "border-gray-300"
          )}>
            {/* Predefined territory options */}
            <div className="flex flex-wrap gap-2">
              {availableTerritoryOptions.map(territory => (
                <div 
                  key={territory.value}
                  onClick={() => toggleTerritory(territory.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full cursor-pointer transition-colors",
                    availableTerritories.includes(territory.value)
                      ? "bg-[#0031ac] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {territory.label}
                </div>
              ))}
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
                          onClick={() => toggleTerritory(territory)}
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {renderErrorMessage(errors.franchiseDetails?.availableTerritories) || (
            <p className="text-xs text-gray-500 mt-1">
              Select the geographic regions where franchises are available
            </p>
          )}
        </div>
      </div>

      {/* Investment Details Section */}
      <div className="space-y-6 mt-8">
        <h3 className="text-base font-semibold text-gray-800">Investment Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Franchise Fee */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.investment.franchiseFee.value" className="block text-sm font-semibold text-gray-800 mr-2">
                Franchise Fee <span className="text-red-500">*</span>
              </label>
              <Tooltip content="One-time initial fee for the franchise license">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 text-sm">₹</span>
              </div>
              <input
                id="franchiseDetails.investment.franchiseFee.value"
                type="number" 
                min="0"
                step="10000"
                placeholder="Initial franchise fee"
                className={cn(
                  "w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.franchiseDetails?.investment?.franchiseFee?.value ? "border-red-300" : "border-gray-300"
                )}
                {...register("franchiseDetails.investment.franchiseFee.value", {
                  required: "Franchise fee is required",
                  onBlur: () => trigger("franchiseDetails.investment.franchiseFee.value")
                })}
              />
            </div>

            {renderErrorMessage(errors.franchiseDetails?.investment?.franchiseFee?.value) || (
              <p className="text-xs text-gray-500 mt-1">
                One-time initial fee for the franchise license
              </p>
            )}
          </div>

          {/* Total Initial Investment */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.investment.totalInitialInvestment.value" className="block text-sm font-semibold text-gray-800 mr-2">
                Total Initial Investment <span className="text-red-500">*</span>
              </label>
              <Tooltip content="All-inclusive total investment to start">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 text-sm">₹</span>
              </div>
              <input
                id="franchiseDetails.investment.totalInitialInvestment.value"
                type="number" 
                min="0"
                step="10000"
                placeholder="Total startup investment required"
                className={cn(
                  "w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.franchiseDetails?.investment?.totalInitialInvestment?.value ? "border-red-300" : "border-gray-300"
                )}
                {...register("franchiseDetails.investment.totalInitialInvestment.value", {
                  required: "Total initial investment is required",
                  onBlur: () => trigger("franchiseDetails.investment.totalInitialInvestment.value")
                })}
              />
            </div>

            {renderErrorMessage(errors.franchiseDetails?.investment?.totalInitialInvestment?.value) || (
              <p className="text-xs text-gray-500 mt-1">
                All-inclusive total investment to start
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Royalty Fee */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.investment.royaltyFee" className="block text-sm font-semibold text-gray-800 mr-2">
                Royalty Fee <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Ongoing percentage of revenue paid to franchisor">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <input
                id="franchiseDetails.investment.royaltyFee"
                type="number" 
                min="0"
                max="50"
                step="0.1"
                placeholder="Ongoing royalty percentage"
                className={cn(
                  "w-full pr-8 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.franchiseDetails?.investment?.royaltyFee ? "border-red-300" : "border-gray-300"
                )}
                {...register("franchiseDetails.investment.royaltyFee", {
                  required: "Royalty fee percentage is required",
                  onBlur: () => trigger("franchiseDetails.investment.royaltyFee")
                })}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">%</span>
              </div>
            </div>

            {renderErrorMessage(errors.franchiseDetails?.investment?.royaltyFee) || (
              <p className="text-xs text-gray-500 mt-1">
                Ongoing percentage of revenue paid to franchisor
              </p>
            )}
          </div>

          {/* Marketing Fee */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.investment.marketingFee" className="block text-sm font-semibold text-gray-800 mr-2">
                Marketing Fee <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Ongoing contribution to marketing fund">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <input
                id="franchiseDetails.investment.marketingFee"
                type="number" 
                min="0"
                max="20"
                step="0.1"
                placeholder="Marketing contribution percentage"
                className={cn(
                  "w-full pr-8 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.franchiseDetails?.investment?.marketingFee ? "border-red-300" : "border-gray-300"
                )}
                {...register("franchiseDetails.investment.marketingFee", {
                  required: "Marketing fee percentage is required",
                  onBlur: () => trigger("franchiseDetails.investment.marketingFee")
                })}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">%</span>
              </div>
            </div>

            {renderErrorMessage(errors.franchiseDetails?.investment?.marketingFee) || (
              <p className="text-xs text-gray-500 mt-1">
                Ongoing contribution to marketing fund
              </p>
            )}
          </div>
        </div>

        {/* Royalty Structure */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="franchiseDetails.investment.royaltyStructure" className="block text-sm font-semibold text-gray-800 mr-2">
              Royalty Structure <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Explain the basis and frequency of royalty payments">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <textarea
            id="franchiseDetails.investment.royaltyStructure"
            rows="3"
            placeholder="Explain how royalties are calculated and collected"
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.franchiseDetails?.investment?.royaltyStructure ? "border-red-300" : "border-gray-300"
            )}
            {...register("franchiseDetails.investment.royaltyStructure", {
              required: "Royalty structure details are required",
              onBlur: () => trigger("franchiseDetails.investment.royaltyStructure")
            })}
          ></textarea>

          {renderErrorMessage(errors.franchiseDetails?.investment?.royaltyStructure) || (
            <p className="text-xs text-gray-500 mt-1">
              Explain the basis and frequency of royalty payments
            </p>
          )}
        </div>

        {/* Recurring Fees */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="franchiseDetails.investment.recurringFees" className="block text-sm font-semibold text-gray-800 mr-2">
              Recurring Fees <span className="text-red-500">*</span>
            </label>
            <Tooltip content="List all regular payments required from franchisees">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <textarea
            id="franchiseDetails.investment.recurringFees"
            rows="3"
            placeholder="Detail all ongoing fees beyond royalty and marketing"
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.franchiseDetails?.investment?.recurringFees ? "border-red-300" : "border-gray-300"
            )}
            {...register("franchiseDetails.investment.recurringFees", {
              required: "Recurring fees information is required",
              onBlur: () => trigger("franchiseDetails.investment.recurringFees")
            })}
          ></textarea>

          {renderErrorMessage(errors.franchiseDetails?.investment?.recurringFees) || (
            <p className="text-xs text-gray-500 mt-1">
              List all regular payments required from franchisees
            </p>
          )}
        </div>
      </div>

      {/* Support & Training Section */}
      <div className="space-y-6 mt-8">
        <h3 className="text-base font-semibold text-gray-800">Support & Training</h3>

        {/* Initial Training */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="franchiseDetails.support.initialTraining" className="block text-sm font-semibold text-gray-800 mr-2">
              Initial Training <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Detail the content and approach of initial training">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <textarea
            id="franchiseDetails.support.initialTraining"
            rows="4"
            placeholder="Describe the initial training program for franchisees"
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.franchiseDetails?.support?.initialTraining ? "border-red-300" : "border-gray-300"
            )}
            {...register("franchiseDetails.support.initialTraining", {
              required: "Initial training details are required",
              onBlur: () => trigger("franchiseDetails.support.initialTraining")
            })}
          ></textarea>

          {renderErrorMessage(errors.franchiseDetails?.support?.initialTraining) || (
            <p className="text-xs text-gray-500 mt-1">
              Detail the content and approach of initial training
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Training Duration */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.support.trainingDuration" className="block text-sm font-semibold text-gray-800 mr-2">
                Training Duration <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Length of initial training period">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="franchiseDetails.support.trainingDuration"
              type="text"
              placeholder="e.g., 2 weeks, 10 days, etc."
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.franchiseDetails?.support?.trainingDuration ? "border-red-300" : "border-gray-300"
              )}
              {...register("franchiseDetails.support.trainingDuration", {
                required: "Training duration is required",
                onBlur: () => trigger("franchiseDetails.support.trainingDuration")
              })}
            />

            {renderErrorMessage(errors.franchiseDetails?.support?.trainingDuration) || (
              <p className="text-xs text-gray-500 mt-1">
                Length of initial training period
              </p>
            )}
          </div>

          {/* Training Location */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.support.trainingLocation" className="block text-sm font-semibold text-gray-800 mr-2">
                Training Location <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Where training is conducted">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="franchiseDetails.support.trainingLocation"
              type="text"
              placeholder="e.g., Headquarters, Online, Regional centers"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.franchiseDetails?.support?.trainingLocation ? "border-red-300" : "border-gray-300"
              )}
              {...register("franchiseDetails.support.trainingLocation", {
                required: "Training location is required",
                onBlur: () => trigger("franchiseDetails.support.trainingLocation")
              })}
            />

            {renderErrorMessage(errors.franchiseDetails?.support?.trainingLocation) || (
              <p className="text-xs text-gray-500 mt-1">
                Where training is conducted
              </p>
            )}
          </div>
        </div>

        {/* Ongoing Support */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="franchiseDetails.support.ongoingSupport" className="block text-sm font-semibold text-gray-800 mr-2">
              Ongoing Support <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Detail the types and frequency of ongoing support">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <textarea
            id="franchiseDetails.support.ongoingSupport"
            rows="4"
            placeholder="Describe the continuing support offered after opening"
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.franchiseDetails?.support?.ongoingSupport ? "border-red-300" : "border-gray-300"
            )}
            {...register("franchiseDetails.support.ongoingSupport", {
              required: "Ongoing support details are required",
              onBlur: () => trigger("franchiseDetails.support.ongoingSupport")
            })}
          ></textarea>

          {renderErrorMessage(errors.franchiseDetails?.support?.ongoingSupport) || (
            <p className="text-xs text-gray-500 mt-1">
              Detail the types and frequency of ongoing support
            </p>
          )}
        </div>

        {/* Field Support */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="franchiseDetails.support.fieldSupport" className="block text-sm font-semibold text-gray-800 mr-2">
              Field Support <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Frequency and type of in-person support visits">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <input
            id="franchiseDetails.support.fieldSupport"
            type="text"
            placeholder="e.g., Monthly visits, Quarterly reviews"
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.franchiseDetails?.support?.fieldSupport ? "border-red-300" : "border-gray-300"
            )}
            {...register("franchiseDetails.support.fieldSupport", {
              required: "Field support information is required",
              onBlur: () => trigger("franchiseDetails.support.fieldSupport")
            })}
          />

          {renderErrorMessage(errors.franchiseDetails?.support?.fieldSupport) || (
            <p className="text-xs text-gray-500 mt-1">
              Frequency and type of in-person support visits
            </p>
          )}
        </div>

        {/* Marketing Support */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="franchiseDetails.support.marketingSupport" className="block text-sm font-semibold text-gray-800 mr-2">
              Marketing Support <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Detail marketing tools and programs provided">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <textarea
            id="franchiseDetails.support.marketingSupport"
            rows="3"
            placeholder="Describe the marketing assistance provided"
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.franchiseDetails?.support?.marketingSupport ? "border-red-300" : "border-gray-300"
            )}
            {...register("franchiseDetails.support.marketingSupport", {
              required: "Marketing support details are required",
              onBlur: () => trigger("franchiseDetails.support.marketingSupport")
            })}
          ></textarea>

          {renderErrorMessage(errors.franchiseDetails?.support?.marketingSupport) || (
            <p className="text-xs text-gray-500 mt-1">
              Detail marketing tools and programs provided
            </p>
          )}
        </div>

        {/* Technology Systems */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="franchiseDetails.support.technologySystems" className="block text-sm font-semibold text-gray-800 mr-2">
              Technology Systems <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Detail key systems provided (POS, inventory, etc.)">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <textarea
            id="franchiseDetails.support.technologySystems"
            rows="3"
            placeholder="Describe the technological infrastructure provided"
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.franchiseDetails?.support?.technologySystems ? "border-red-300" : "border-gray-300"
            )}
            {...register("franchiseDetails.support.technologySystems", {
              required: "Technology systems details are required",
              onBlur: () => trigger("franchiseDetails.support.technologySystems")
            })}
          ></textarea>

          {renderErrorMessage(errors.franchiseDetails?.support?.technologySystems) || (
            <p className="text-xs text-gray-500 mt-1">
              Detail key systems provided (POS, inventory, etc.)
            </p>
          )}
        </div>

    {/* Site Selection - Improved Checkbox */}
<div className="p-4 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id="franchiseDetails.support.siteSelection"
      className="h-5 w-5 text-[#0031ac] focus:ring-[#0031ac] border-gray-300 rounded cursor-pointer"
      {...register("franchiseDetails.support.siteSelection")}
    />
    <label htmlFor="franchiseDetails.support.siteSelection" className="text-sm font-semibold text-gray-800 cursor-pointer">
      Site Selection Assistance
    </label>
  </div>
  <p className="text-xs text-gray-500 mt-1 ml-7">
    Franchisor provides help with location selection
  </p>
</div>
      </div>

      {/* Performance Metrics Section */}
      <div className="space-y-6 mt-8">
        <h3 className="text-base font-semibold text-gray-800">Performance Metrics</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Unit Sales */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.performance.averageUnitSales.value" className="block text-sm font-semibold text-gray-800 mr-2">
                Average Unit Sales <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Typical revenue per franchise location">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 text-sm">₹</span>
              </div>
              <input
                id="franchiseDetails.performance.averageUnitSales.value"
                type="number" 
                min="0"
                step="10000"
                placeholder="Average annual revenue per location"
                className={cn(
                  "w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.franchiseDetails?.performance?.averageUnitSales?.value ? "border-red-300" : "border-gray-300"
                )}
                {...register("franchiseDetails.performance.averageUnitSales.value", {
                  required: "Average unit sales is required",
                  onBlur: () => trigger("franchiseDetails.performance.averageUnitSales.value")
                })}
              />
            </div>

            {renderErrorMessage(errors.franchiseDetails?.performance?.averageUnitSales?.value) || (
              <p className="text-xs text-gray-500 mt-1">
                Typical revenue per franchise location
              </p>
            )}
          </div>

          {/* Success Rate (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.performance.successRate" className="block text-sm font-semibold text-gray-800 mr-2">
                Success Rate
              </label>
              <Tooltip content="Percentage of units still operating after 5 years">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <input
                id="franchiseDetails.performance.successRate"
                type="number" 
                min="0"
                max="100"
                step="1"
                placeholder="Unit survival rate (optional)"
                className={cn(
                  "w-full pr-8 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.franchiseDetails?.performance?.successRate ? "border-red-300" : "border-gray-300"
                )}
                {...register("franchiseDetails.performance.successRate")}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">%</span>
              </div>
            </div>

            {renderErrorMessage(errors.franchiseDetails?.performance?.successRate) || (
              <p className="text-xs text-gray-500 mt-1">
                Percentage of units still operating after 5 years
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales Growth */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.performance.salesGrowth" className="block text-sm font-semibold text-gray-800 mr-2">
                Sales Growth <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Revenue growth trend with timeframe">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="franchiseDetails.performance.salesGrowth"
              type="text"
              placeholder="e.g., 5-10% annually"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.franchiseDetails?.performance?.salesGrowth ? "border-red-300" : "border-gray-300"
              )}
              {...register("franchiseDetails.performance.salesGrowth", {
                required: "Sales growth information is required",
                onBlur: () => trigger("franchiseDetails.performance.salesGrowth")
              })}
            />

            {renderErrorMessage(errors.franchiseDetails?.performance?.salesGrowth) || (
              <p className="text-xs text-gray-500 mt-1">
                Revenue growth trend with timeframe
              </p>
            )}
          </div>

          {/* Average Breakeven */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.performance.averageBreakeven" className="block text-sm font-semibold text-gray-800 mr-2">
                Average Breakeven <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Typical time to reach profitability">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <input
              id="franchiseDetails.performance.averageBreakeven"
              type="text"
              placeholder="e.g., 12-18 months"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.franchiseDetails?.performance?.averageBreakeven ? "border-red-300" : "border-gray-300"
              )}
              {...register("franchiseDetails.performance.averageBreakeven", {
                required: "Average breakeven information is required",
                onBlur: () => trigger("franchiseDetails.performance.averageBreakeven")
              })}
            />

            {renderErrorMessage(errors.franchiseDetails?.performance?.averageBreakeven) || (
              <p className="text-xs text-gray-500 mt-1">
                Typical time to reach profitability
              </p>
            )}
          </div>
        </div>

        {/* Franchisee Requirements */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="franchiseDetails.performance.franchiseeRequirements" className="block text-sm font-semibold text-gray-800 mr-2">
              Franchisee Requirements <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Outline financial, experience, and personal requirements">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <textarea
            id="franchiseDetails.performance.franchiseeRequirements"
            rows="4"
            placeholder="Describe qualification criteria for potential franchisees"
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.franchiseDetails?.performance?.franchiseeRequirements ? "border-red-300" : "border-gray-300"
            )}
            {...register("franchiseDetails.performance.franchiseeRequirements", {
              required: "Franchisee requirements are required",
              onBlur: () => trigger("franchiseDetails.performance.franchiseeRequirements")
            })}
          ></textarea>

          {renderErrorMessage(errors.franchiseDetails?.performance?.franchiseeRequirements) || (
            <p className="text-xs text-gray-500 mt-1">
              Outline financial, experience, and personal requirements
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Net Worth Requirement */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.performance.netWorthRequirement.value" className="block text-sm font-semibold text-gray-800 mr-2">
                Net Worth Requirement <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Minimum financial position required">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 text-sm">₹</span>
              </div>
              <input
                id="franchiseDetails.performance.netWorthRequirement.value"
                type="number" 
                min="0"
                step="100000"
                placeholder="Minimum net worth required"
                className={cn(
                  "w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.franchiseDetails?.performance?.netWorthRequirement?.value ? "border-red-300" : "border-gray-300"
                )}
                {...register("franchiseDetails.performance.netWorthRequirement.value", {
                  required: "Net worth requirement is required",
                  onBlur: () => trigger("franchiseDetails.performance.netWorthRequirement.value")
                })}
              />
            </div>

            {renderErrorMessage(errors.franchiseDetails?.performance?.netWorthRequirement?.value) || (
              <p className="text-xs text-gray-500 mt-1">
                Minimum financial position required
              </p>
            )}
          </div>

          {/* Liquid Capital Required */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="franchiseDetails.performance.liquidCapitalRequired.value" className="block text-sm font-semibold text-gray-800 mr-2">
                Liquid Capital Required <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Cash required for initial investment">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 text-sm">₹</span>
              </div>
              <input
                id="franchiseDetails.performance.liquidCapitalRequired.value"
                type="number" 
                min="0"
                step="100000"
                placeholder="Immediately available cash needed"
                className={cn(
                  "w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.franchiseDetails?.performance?.liquidCapitalRequired?.value ? "border-red-300" : "border-gray-300"
                )}
                {...register("franchiseDetails.performance.liquidCapitalRequired.value", {
                  required: "Liquid capital requirement is required",
                  onBlur: () => trigger("franchiseDetails.performance.liquidCapitalRequired.value")
                })}
              />
            </div>

            {renderErrorMessage(errors.franchiseDetails?.performance?.liquidCapitalRequired?.value) || (
              <p className="text-xs text-gray-500 mt-1">
                Cash required for initial investment
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}