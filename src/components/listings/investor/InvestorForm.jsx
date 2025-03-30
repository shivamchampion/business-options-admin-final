import React, { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { 
  Info, 
  AlertCircle, 
  InfoIcon, 
  Check,
  Globe, 
  Plus,
  Minus,
  Star
} from 'lucide-react';
import { 
  InvestorType, 
  BoardInvolvement 
} from '@/types/listings';
import { cn, formatCurrency } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';

/**
 * InvestorForm - Handles the Investor-specific fields (Step 3 in listing creation)
 * 
 * This component implements all fields according to the Business Options Platform specifications
 * for investor listings, including validation and conditional fields.
 */
const InvestorForm = ({ editMode = false }) => {
  const { 
    control, 
    register, 
    watch, 
    formState: { errors }, 
    setValue, 
    getValues, 
    trigger 
  } = useFormContext();
  
  // Watch values for conditional fields
  const investorType = watch("investorDetails.investorType");
  
  // For equity stake range
  const [minEquity, setMinEquity] = useState(0);
  const [maxEquity, setMaxEquity] = useState(25);

  // Initialize from form values if editing
  useEffect(() => {
    if (editMode) {
      const min = getValues("investorDetails.investment.preferredEquityStake.min");
      const max = getValues("investorDetails.investment.preferredEquityStake.max");
      if (min !== undefined) setMinEquity(min);
      if (max !== undefined) setMaxEquity(max);
    }
  }, [editMode, getValues]);

  // Handle range changes and update form values
  const handleMinChange = (e) => {
    const value = parseInt(e.target.value);
    if (value <= maxEquity) {
      setMinEquity(value);
      setValue("investorDetails.investment.preferredEquityStake.min", value);
    }
  };

  const handleMaxChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= minEquity) {
      setMaxEquity(value);
      setValue("investorDetails.investment.preferredEquityStake.max", value);
    }
  };

  // List of business stages for multi-select
  const businessStages = [
    { value: 'idea', label: 'Idea Stage' },
    { value: 'pre_seed', label: 'Pre-seed' },
    { value: 'seed', label: 'Seed' },
    { value: 'early_growth', label: 'Early Growth' },
    { value: 'expansion', label: 'Expansion' },
    { value: 'series_a', label: 'Series A' },
    { value: 'series_b', label: 'Series B' },
    { value: 'series_c_plus', label: 'Series C+' },
    { value: 'pre_ipo', label: 'Pre-IPO' },
    { value: 'mature', label: 'Mature Business' }
  ];

  // List of investment rounds for multi-select
  const investmentRounds = [
    { value: 'pre_seed', label: 'Pre-seed' },
    { value: 'seed', label: 'Seed' },
    { value: 'series_a', label: 'Series A' },
    { value: 'series_b', label: 'Series B' },
    { value: 'series_c_plus', label: 'Series C+' },
    { value: 'growth', label: 'Growth' },
    { value: 'late_stage', label: 'Late Stage' }
  ];

  // Geographic regions for multi-select
  const geographicRegions = [
    { value: 'north_india', label: 'North India' },
    { value: 'south_india', label: 'South India' },
    { value: 'east_india', label: 'East India' },
    { value: 'west_india', label: 'West India' },
    { value: 'central_india', label: 'Central India' },
    { value: 'northeast_india', label: 'Northeast India' },
    { value: 'pan_india', label: 'Pan India' },
    { value: 'asia_pacific', label: 'Asia Pacific' },
    { value: 'north_america', label: 'North America' },
    { value: 'europe', label: 'Europe' },
    { value: 'middle_east', label: 'Middle East' },
    { value: 'africa', label: 'Africa' },
    { value: 'latin_america', label: 'Latin America' },
    { value: 'global', label: 'Global' }
  ];

  // Check if certain fields are required based on investor type
  const isInstitutional = investorType && ['venture_capital', 'private_equity', 'family_office', 'corporate'].includes(investorType);

  return (
    <div className="space-y-6">
      {/* Investor Information Section */}
      <div className="card border border-gray-200 bg-white rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Investor Information</h3>
          <p className="text-sm text-gray-500">Provide basic information about yourself or your investment firm</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investor Type */}
          <div className="col-span-1">
            <label htmlFor="investorType" className="block text-sm font-medium text-gray-700 mb-1">
              Investor Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="investorType"
                className={cn(
                  "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
                  errors.investorDetails?.investorType && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register("investorDetails.investorType", { 
                  required: "Investor type is required" 
                })}
              >
                <option value="">Select Investor Type</option>
                {Object.entries(InvestorType).map(([key, value]) => (
                  <option key={value} value={value}>
                    {value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
              {errors.investorDetails?.investorType && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.investorDetails?.investorType ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.investorDetails.investorType.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                This helps startups understand your investment approach
              </p>
            )}
          </div>

          {/* Years of Experience */}
          <div className="col-span-1">
            <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="yearsOfExperience"
                min="0"
                max="100"
                className={cn(
                  "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
                  errors.investorDetails?.yearsOfExperience && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register("investorDetails.yearsOfExperience", { 
                  required: "Years of experience is required",
                  min: { value: 0, message: "Years cannot be negative" },
                  max: { value: 100, message: "Years cannot exceed 100" },
                  valueAsNumber: true
                })}
                placeholder="Years of investment experience"
              />
              {errors.investorDetails?.yearsOfExperience && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.investorDetails?.yearsOfExperience ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.investorDetails.yearsOfExperience.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Total years of investing or relevant professional experience
              </p>
            )}
          </div>

          {/* Investment Team Size - Conditional for institutional investors */}
          {isInstitutional && (
            <div className="col-span-1">
              <label htmlFor="investmentTeamSize" className="block text-sm font-medium text-gray-700 mb-1">
                Investment Team Size <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="investmentTeamSize"
                  min="1"
                  className={cn(
                    "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
                    errors.investorDetails?.investmentTeamSize && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  {...register("investorDetails.investmentTeamSize", { 
                    required: "Team size is required for institutional investors",
                    min: { value: 1, message: "Team size must be at least 1" },
                    valueAsNumber: true
                  })}
                  placeholder="Number of investment team members"
                />
                {errors.investorDetails?.investmentTeamSize && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.investorDetails?.investmentTeamSize ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.investorDetails.investmentTeamSize.message}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Number of professionals on your investment team
                </p>
              )}
            </div>
          )}

          {/* Investment Philosophy */}
          <div className="col-span-full">
            <label htmlFor="investmentPhilosophy" className="block text-sm font-medium text-gray-700 mb-1">
              Investment Philosophy <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                id="investmentPhilosophy"
                rows={3}
                className={cn(
                  "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
                  errors.investorDetails?.investmentPhilosophy && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register("investorDetails.investmentPhilosophy", { 
                  required: "Investment philosophy is required",
                  minLength: { value: 100, message: "Philosophy must be at least 100 characters" },
                  maxLength: { value: 500, message: "Philosophy cannot exceed 500 characters" }
                })}
                placeholder="Describe your investment approach, thesis, and values"
              />
              {errors.investorDetails?.investmentPhilosophy && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.investorDetails?.investmentPhilosophy ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.investorDetails.investmentPhilosophy.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Your overall approach to investments and decision-making
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("investorDetails.investmentPhilosophy")?.length || 0}/500 characters
              </p>
            </div>
          </div>

          {/* Background Summary */}
          <div className="col-span-full">
            <label htmlFor="backgroundSummary" className="block text-sm font-medium text-gray-700 mb-1">
              Background Summary <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                id="backgroundSummary"
                rows={3}
                className={cn(
                  "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
                  errors.investorDetails?.backgroundSummary && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register("investorDetails.backgroundSummary", { 
                  required: "Background summary is required",
                  minLength: { value: 100, message: "Background summary must be at least 100 characters" },
                  maxLength: { value: 500, message: "Background summary cannot exceed 500 characters" }
                })}
                placeholder="Provide a professional overview of your experience and expertise"
              />
              {errors.investorDetails?.backgroundSummary && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.investorDetails?.backgroundSummary ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.investorDetails.backgroundSummary.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Professional overview and relevant experience
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("investorDetails.backgroundSummary")?.length || 0}/500 characters
              </p>
            </div>
          </div>

          {/* Key Achievements - Optional */}
          <div className="col-span-full">
            <label htmlFor="keyAchievements" className="block text-sm font-medium text-gray-700 mb-1">
              Key Achievements <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <textarea
                id="keyAchievements"
                rows={2}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                {...register("investorDetails.keyAchievements", {
                  maxLength: { value: 500, message: "Key achievements cannot exceed 500 characters" }
                })}
                placeholder="Highlight notable investment successes or achievements"
              />
              {errors.investorDetails?.keyAchievements && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.investorDetails?.keyAchievements ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.investorDetails.keyAchievements.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Showcase your notable investment wins and relevant achievements
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("investorDetails.keyAchievements")?.length || 0}/500 characters
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Capacity Section */}
      <div className="card border border-gray-200 bg-white rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Investment Capacity</h3>
          <p className="text-sm text-gray-500">Information about your investment preferences and capabilities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Annual Investment Target - Optional */}
          <div className="col-span-1">
            <label htmlFor="annualInvestmentTarget" className="block text-sm font-medium text-gray-700 mb-1">
              Annual Investment Target <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <Controller
                control={control}
                name="investorDetails.investment.annualInvestmentTarget.value"
                render={({ field }) => (
                  <input
                    type="number"
                    id="annualInvestmentTarget"
                    className="block w-full pl-7 pr-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.valueAsNumber || 0);
                      // Also update the formatted value
                      const formattedValue = e.target.valueAsNumber 
                        ? formatCurrency(e.target.valueAsNumber, 'INR') 
                        : '';
                      setValue("investorDetails.investment.annualInvestmentTarget.formatted", formattedValue);
                    }}
                  />
                )}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">INR</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Total amount you aim to invest annually
            </p>
          </div>

          {/* Decision Timeline */}
          <div className="col-span-1">
            <label htmlFor="decisionTimeline" className="block text-sm font-medium text-gray-700 mb-1">
              Decision Timeline <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="decisionTimeline"
                className={cn(
                  "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
                  errors.investorDetails?.investment?.decisionTimeline && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register("investorDetails.investment.decisionTimeline", { 
                  required: "Decision timeline is required",
                  minLength: { value: 1, message: "Decision timeline is required" },
                  maxLength: { value: 100, message: "Decision timeline cannot exceed 100 characters" }
                })}
                placeholder="e.g., 4-8 weeks"
              />
              {errors.investorDetails?.investment?.decisionTimeline && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.investorDetails?.investment?.decisionTimeline ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.investorDetails.investment.decisionTimeline.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Typical time from initial meeting to investment decision
              </p>
            )}
          </div>

          {/* Preferred Rounds - Multi-select */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Investment Rounds <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {investmentRounds.map((round) => (
                <div
                  key={round.value}
                  className="relative flex items-start"
                >
                  <div className="flex items-center h-5">
                    <input
                      id={`round-${round.value}`}
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      value={round.value}
                      {...register("investorDetails.investment.preferredRounds", { 
                        required: "Please select at least one investment round" 
                      })}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={`round-${round.value}`} className="font-medium text-gray-700">
                      {round.label}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {errors.investorDetails?.investment?.preferredRounds && (
              <p className="mt-1 text-sm text-red-600">
                {errors.investorDetails.investment.preferredRounds.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Select all funding stages you typically invest in
            </p>
          </div>

          {/* Lead Investor Status */}
          <div className="col-span-full">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="isLeadInvestor"
                  type="checkbox"
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  {...register("investorDetails.investment.isLeadInvestor")}
                />
              </div>
              <div className="ml-3">
                <label htmlFor="isLeadInvestor" className="text-sm font-medium text-gray-700">
                  Willing to Lead Investment Rounds
                </label>
                <p className="text-xs text-gray-500">
                  Indicates your willingness to set deal terms and coordinate with other investors
                </p>
              </div>
            </div>
          </div>

          {/* Preferred Equity Stake - Range slider */}
          <div className="col-span-full">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Preferred Equity Stake Range <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-500">{minEquity}%</span>
                <span className="text-sm text-gray-500">{maxEquity}%</span>
              </div>
            </div>
            <div className="relative">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="absolute h-2 bg-primary-500 rounded-full"
                  style={{
                    left: `${minEquity}%`,
                    width: `${maxEquity - minEquity}%`
                  }}
                ></div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={minEquity}
                onChange={handleMinChange}
                className="absolute top-0 left-0 w-full h-2 appearance-none bg-transparent pointer-events-none"
                style={{
                  // Show the thumb only for min thumb
                  // hide the range track
                  background: 'transparent',
                  // Make only the thumb visible and clickable
                  WebkitAppearance: 'none',
                  // Chrome thumb
                  '::-webkit-slider-thumb': {
                    WebkitAppearance: 'none',
                    height: '16px',
                    width: '16px',
                    borderRadius: '50%',
                    background: '#0031AC',
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                  },
                  // Firefox thumb
                  '::-moz-range-thumb': {
                    height: '16px',
                    width: '16px',
                    borderRadius: '50%',
                    background: '#0031AC',
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                  }
                }}
              />
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={maxEquity}
                onChange={handleMaxChange}
                className="absolute top-0 left-0 w-full h-2 appearance-none bg-transparent pointer-events-none"
                style={{
                  // Show the thumb only for max thumb
                  // hide the range track
                  background: 'transparent',
                  // Make only the thumb visible and clickable
                  WebkitAppearance: 'none',
                  // Chrome thumb
                  '::-webkit-slider-thumb': {
                    WebkitAppearance: 'none',
                    height: '16px',
                    width: '16px',
                    borderRadius: '50%',
                    background: '#0031AC',
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                  },
                  // Firefox thumb
                  '::-moz-range-thumb': {
                    height: '16px',
                    width: '16px',
                    borderRadius: '50%',
                    background: '#0031AC',
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                  }
                }}
              />
            </div>
            <div className="flex justify-between mt-4">
              <div className="relative w-full md:w-1/3">
                <label htmlFor="minEquity" className="block text-xs font-medium text-gray-500 mb-1">
                  Min %
                </label>
                <input
                  type="number"
                  id="minEquity"
                  min="0"
                  max={maxEquity}
                  value={minEquity}
                  onChange={handleMinChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div className="relative w-full md:w-1/3 ml-4">
                <label htmlFor="maxEquity" className="block text-xs font-medium text-gray-500 mb-1">
                  Max %
                </label>
                <input
                  type="number"
                  id="maxEquity"
                  min={minEquity}
                  max="100"
                  value={maxEquity}
                  onChange={handleMaxChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Typical ownership percentage you target in investments
            </p>
          </div>
        </div>
      </div>

      {/* Investment Focus Section */}
      <div className="card border border-gray-200 bg-white rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Investment Focus</h3>
          <p className="text-sm text-gray-500">Details about what types of businesses you prefer to invest in</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Industries - Multi-select */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Industries <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {/* This would ideally be populated from a list of industries via API */}
              {[
                "Technology", "Healthcare", "Finance", "Education", 
                "Real Estate", "E-commerce", "Manufacturing", "Energy", 
                "Food & Beverage", "Media & Entertainment", "Transport & Logistics",
                "Agriculture", "Retail", "Hospitality", "Consumer Goods"
              ].map((industry) => (
                <div key={industry} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`industry-${industry}`}
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      value={industry.toLowerCase().replace(/\s+/g, '_')}
                      {...register("investorDetails.focus.primaryIndustries", { 
                        required: "Please select at least one primary industry",
                        validate: {
                          maxFive: value => !value || value.length <= 5 || "You can select up to 5 primary industries"
                        }
                      })}
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <label htmlFor={`industry-${industry}`} className="font-medium text-gray-700">
                      {industry}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {errors.investorDetails?.focus?.primaryIndustries && (
              <p className="mt-1 text-sm text-red-600">
                {errors.investorDetails.focus.primaryIndustries.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Select up to 5 industries where you primarily focus your investments
            </p>
          </div>

          {/* Secondary Industries - Multi-select */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Industries <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {/* This would ideally be populated from a list of industries via API */}
              {[
                "Biotechnology", "AI & Machine Learning", "IoT", "Blockchain", 
                "Renewable Energy", "Space Tech", "CleanTech", "EdTech", 
                "FinTech", "MedTech", "Cybersecurity", "AR/VR", "Gaming"
              ].map((industry) => (
                <div key={industry} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`secondary-industry-${industry}`}
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      value={industry.toLowerCase().replace(/\s+/g, '_')}
                      {...register("investorDetails.focus.secondaryIndustries")}
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <label htmlFor={`secondary-industry-${industry}`} className="font-medium text-gray-700">
                      {industry}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Additional industries you're interested in but are not your primary focus
            </p>
          </div>

          {/* Business Stage Preference - Multi-select */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Stage Preference <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {businessStages.map((stage) => (
                <div key={stage.value} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`stage-${stage.value}`}
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      value={stage.value}
                      {...register("investorDetails.focus.businessStagePreference", { 
                        required: "Please select at least one business stage" 
                      })}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={`stage-${stage.value}`} className="font-medium text-gray-700">
                      {stage.label}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {errors.investorDetails?.focus?.businessStagePreference && (
              <p className="mt-1 text-sm text-red-600">
                {errors.investorDetails.focus.businessStagePreference.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Development stages you typically invest in
            </p>
          </div>

          {/* Geographic Focus - Multi-select */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Geographic Focus <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {geographicRegions.map((region) => (
                <div key={region.value} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`region-${region.value}`}
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      value={region.value}
                      {...register("investorDetails.focus.geographicFocus", { 
                        required: "Please select at least one geographic region" 
                      })}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={`region-${region.value}`} className="font-medium text-gray-700">
                      {region.label}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {errors.investorDetails?.focus?.geographicFocus && (
              <p className="mt-1 text-sm text-red-600">
                {errors.investorDetails.focus.geographicFocus.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Regions where you focus your investments
            </p>
          </div>

          {/* Investment Criteria */}
          <div className="col-span-full">
            <label htmlFor="investmentCriteria" className="block text-sm font-medium text-gray-700 mb-1">
              Investment Criteria <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                id="investmentCriteria"
                rows={3}
                className={cn(
                  "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
                  errors.investorDetails?.focus?.investmentCriteria && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register("investorDetails.focus.investmentCriteria", { 
                  required: "Investment criteria is required",
                  minLength: { value: 100, message: "Investment criteria must be at least 100 characters" },
                  maxLength: { value: 500, message: "Investment criteria cannot exceed 500 characters" }
                })}
                placeholder="Describe key factors you look for in investment opportunities"
              />
              {errors.investorDetails?.focus?.investmentCriteria && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.investorDetails?.focus?.investmentCriteria ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.investorDetails.focus.investmentCriteria.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Specific qualifications and features you seek in potential investments
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("investorDetails.focus.investmentCriteria")?.length || 0}/500 characters
              </p>
            </div>
          </div>

          {/* Minimum Revenue - Optional */}
          <div className="col-span-1">
            <label htmlFor="minimumRevenue" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              Minimum Revenue <span className="text-gray-400 ml-1">(Optional)</span>
              <Tooltip content="The minimum annual revenue a business should have to be considered for investment.">
                <InfoIcon className="h-4 w-4 text-gray-400 ml-1" />
              </Tooltip>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <Controller
                control={control}
                name="investorDetails.focus.minimumRevenue.value"
                render={({ field }) => (
                  <input
                    type="number"
                    id="minimumRevenue"
                    className="block w-full pl-7 pr-12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.valueAsNumber || 0);
                      // Also update the formatted value
                      const formattedValue = e.target.valueAsNumber 
                        ? formatCurrency(e.target.valueAsNumber, 'INR') 
                        : '';
                      setValue("investorDetails.focus.minimumRevenue.formatted", formattedValue);
                    }}
                  />
                )}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">INR</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Minimum annual revenue required for consideration
            </p>
          </div>

          {/* Minimum Traction - Optional */}
          <div className="col-span-full">
            <label htmlFor="minimumTraction" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Traction <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              id="minimumTraction"
              rows={2}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              {...register("investorDetails.focus.minimumTraction", {
                maxLength: { value: 300, message: "Minimum traction cannot exceed 300 characters" }
              })}
              placeholder="Describe other metrics you look for (users, growth rate, etc.)"
            />
            <div className="flex justify-between mt-1">
              {errors.investorDetails?.focus?.minimumTraction ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.investorDetails.focus.minimumTraction.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Other key metrics besides revenue that demonstrate traction
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("investorDetails.focus.minimumTraction")?.length || 0}/300 characters
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio & Process Section */}
      <div className="card border border-gray-200 bg-white rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Portfolio & Process</h3>
          <p className="text-sm text-gray-500">Information about your investment process and portfolio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portfolio Size - Optional */}
          <div className="col-span-1">
            <label htmlFor="portfolioSize" className="block text-sm font-medium text-gray-700 mb-1">
              Portfolio Size <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="portfolioSize"
                min="0"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                {...register("investorDetails.portfolio.portfolioSize", {
                  min: { value: 0, message: "Portfolio size cannot be negative" },
                  valueAsNumber: true
                })}
                placeholder="Number of investments to date"
              />
              {errors.investorDetails?.portfolio?.portfolioSize && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.investorDetails?.portfolio?.portfolioSize ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.investorDetails.portfolio.portfolioSize.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Total number of investments made to date
              </p>
            )}
          </div>

          {/* Active Investments - Optional */}
          <div className="col-span-1">
            <label htmlFor="activeInvestments" className="block text-sm font-medium text-gray-700 mb-1">
              Active Investments <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="activeInvestments"
                min="0"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                {...register("investorDetails.portfolio.activeInvestments", {
                  min: { value: 0, message: "Active investments cannot be negative" },
                  validate: {
                    notMoreThanTotal: value => {
                      const portfolioSize = watch("investorDetails.portfolio.portfolioSize");
                      return !portfolioSize || !value || value <= portfolioSize || "Active investments cannot exceed total portfolio size";
                    }
                  },
                  valueAsNumber: true
                })}
                placeholder="Current ongoing investments"
              />
              {errors.investorDetails?.portfolio?.activeInvestments && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.investorDetails?.portfolio?.activeInvestments ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.investorDetails.portfolio.activeInvestments.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Current number of active portfolio companies
              </p>
            )}
          </div>

          {/* Success Stories - Optional */}
          <div className="col-span-full">
            <label htmlFor="successStories" className="block text-sm font-medium text-gray-700 mb-1">
              Success Stories <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <textarea
                id="successStories"
                rows={2}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                {...register("investorDetails.portfolio.successStories", {
                  maxLength: { value: 500, message: "Success stories cannot exceed 500 characters" }
                })}
                placeholder="Highlight notable exits or successful investments"
              />
              {errors.investorDetails?.portfolio?.successStories && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.investorDetails?.portfolio?.successStories ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.investorDetails.portfolio.successStories.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Examples of successful investments or notable exits
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("investorDetails.portfolio.successStories")?.length || 0}/500 characters
              </p>
            </div>
          </div>

          {/* Investment Process */}
          <div className="col-span-full">
            <label htmlFor="investmentProcess" className="block text-sm font-medium text-gray-700 mb-1">
              Investment Process <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                id="investmentProcess"
                rows={3}
                className={cn(
                  "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
                  errors.investorDetails?.portfolio?.investmentProcess && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register("investorDetails.portfolio.investmentProcess", { 
                  required: "Investment process is required",
                  minLength: { value: 100, message: "Investment process must be at least 100 characters" },
                  maxLength: { value: 500, message: "Investment process cannot exceed 500 characters" }
                })}
                placeholder="Describe your evaluation steps from initial contact to investment"
              />
              {errors.investorDetails?.portfolio?.investmentProcess && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.investorDetails?.portfolio?.investmentProcess ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.investorDetails.portfolio.investmentProcess.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  A clear outline of your process from pitch to funding
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("investorDetails.portfolio.investmentProcess")?.length || 0}/500 characters
              </p>
            </div>
          </div>

          {/* Post-Investment Support */}
          <div className="col-span-full">
            <label htmlFor="postInvestmentSupport" className="block text-sm font-medium text-gray-700 mb-1">
              Post-Investment Support <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                id="postInvestmentSupport"
                rows={3}
                className={cn(
                  "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
                  errors.investorDetails?.portfolio?.postInvestmentSupport && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register("investorDetails.portfolio.postInvestmentSupport", { 
                  required: "Post-investment support is required",
                  minLength: { value: 100, message: "Post-investment support must be at least 100 characters" },
                  maxLength: { value: 500, message: "Post-investment support cannot exceed 500 characters" }
                })}
                placeholder="Describe how you support portfolio companies after investment"
              />
              {errors.investorDetails?.portfolio?.postInvestmentSupport && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.investorDetails?.portfolio?.postInvestmentSupport ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.investorDetails.portfolio.postInvestmentSupport.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Value-add support you provide beyond capital
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("investorDetails.portfolio.postInvestmentSupport")?.length || 0}/500 characters
              </p>
            </div>
          </div>

          {/* Reporting Requirements - Optional */}
          <div className="col-span-full">
            <label htmlFor="reportingRequirements" className="block text-sm font-medium text-gray-700 mb-1">
              Reporting Requirements <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              id="reportingRequirements"
              rows={2}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              {...register("investorDetails.portfolio.reportingRequirements", {
                maxLength: { value: 300, message: "Reporting requirements cannot exceed 300 characters" }
              })}
              placeholder="Describe the reporting you expect from portfolio companies"
            />
            <div className="flex justify-between mt-1">
              {errors.investorDetails?.portfolio?.reportingRequirements ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.investorDetails.portfolio.reportingRequirements.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Frequency and content of expected reports from investments
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("investorDetails.portfolio.reportingRequirements")?.length || 0}/300 characters
              </p>
            </div>
          </div>

          {/* Board Involvement - Optional */}
          <div className="col-span-1">
            <label htmlFor="boardInvolvement" className="block text-sm font-medium text-gray-700 mb-1">
              Board Involvement <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <select
                id="boardInvolvement"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                {...register("investorDetails.portfolio.boardInvolvement")}
              >
                <option value="">Select Involvement Level</option>
                {Object.entries(BoardInvolvement).map(([key, value]) => (
                  <option key={value} value={value}>
                    {value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Level of governance participation you typically seek
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorForm;