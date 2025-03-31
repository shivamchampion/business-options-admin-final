import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { 
  Info, 
  AlertCircle, 
  HelpCircle, 
  Check,
  Globe, 
  Plus,
  Minus,
  Star,
  Calendar
} from 'lucide-react';
import { 
  InvestorType, 
  BoardInvolvement 
} from '@/types/listings';
import { cn, formatCurrency } from '@/lib/utils';

// Tooltip component - exact match with BasicInfo and BusinessForm
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

// Switch component (Toggle) - consistency with BusinessForm
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

/**
 * InvestorForm - Handles the Investor-specific fields
 * 
 * This component implements all fields according to the Business Options Platform specifications
 * for investor listings, including validation and conditional fields.
 */
const InvestorForm = ({ submitAttempted = false, editMode = false }) => {
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

  // Check if certain fields are required based on investor type
  const isInstitutional = investorType && ['venture_capital', 'private_equity', 'family_office', 'corporate'].includes(investorType);

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

  // Validate all fields when form submission is attempted
  useEffect(() => {
    if (submitAttempted) {
      // Create an array of all fields to validate
      const fieldsToValidate = [
        "investorDetails.investorType",
        "investorDetails.yearsOfExperience",
        "investorDetails.investmentPhilosophy",
        "investorDetails.backgroundSummary",
        "investorDetails.investment.decisionTimeline",
        "investorDetails.investment.preferredRounds",
        "investorDetails.focus.primaryIndustries",
        "investorDetails.focus.businessStagePreference",
        "investorDetails.focus.geographicFocus",
        "investorDetails.focus.investmentCriteria",
        "investorDetails.portfolio.investmentProcess",
        "investorDetails.portfolio.postInvestmentSupport"
      ];
      
      // Add conditional validations for institutional investors
      if (isInstitutional) {
        fieldsToValidate.push("investorDetails.investmentTeamSize");
      }
      
      // Trigger validation for all fields
      Promise.all(fieldsToValidate.map(field => trigger(field))).then((results) => {
        // If any validation fails, show a toast
        
        
        // Then trigger the parent field to check overall validity
        trigger("investorDetails");
      });
    }
  }, [submitAttempted, trigger, isInstitutional]);

  // Initialize from form values if editing
  useEffect(() => {
    if (editMode) {
      const min = getValues("investorDetails.investment.preferredEquityStake.min");
      const max = getValues("investorDetails.investment.preferredEquityStake.max");
      if (min !== undefined) setMinEquity(min);
      if (max !== undefined) setMaxEquity(max);
    }
  }, [editMode, getValues]);

  // Helper function to register fields with validation
  const registerWithValidation = (name, options = {}) => {
    return register(name, {
      ...options,
      onBlur: () => {
        trigger(name).then(isValid => {
          if (!isValid && options.required) {
            // You can optionally show individual field toast errors here
            // toast.error(`Please fix the ${name.split('.').pop()} field`);
          }
        });
      }
    });
  };

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

  return (
    <div className="space-y-6">
      {/* Info Message - matching BasicInfo styling */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Investor Information</p>
          <p>
            Provide information about yourself or your organization as an investor.
            All fields marked with an asterisk (*) are required.
          </p>
        </div>
      </div>

      {/* Investor Information Section */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-gray-800">Investor Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investor Type */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="investorType" className="block text-sm font-semibold text-gray-800 mr-2">
                Investor Type <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Select the type that best describes your investment approach. This helps startups understand your investment strategy.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <select
                id="investorType"
                className={cn(
                  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.investorDetails?.investorType ? "border-red-300" : "border-gray-300"
                )}
                {...registerWithValidation("investorDetails.investorType", { 
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
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.investorDetails.investorType.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                This helps startups understand your investment approach
              </p>
            )}
          </div>

          {/* Years of Experience */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="yearsOfExperience" className="block text-sm font-semibold text-gray-800 mr-2">
                Years of Experience <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Total years of investing or relevant professional experience.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <input
                type="number"
                id="yearsOfExperience"
                min="0"
                max="100"
                className={cn(
                  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.investorDetails?.yearsOfExperience ? "border-red-300" : "border-gray-300"
                )}
                {...registerWithValidation("investorDetails.yearsOfExperience", { 
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
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.investorDetails.yearsOfExperience.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Total years of investing or relevant professional experience
              </p>
            )}
          </div>

          {/* Investment Team Size - Conditional for institutional investors */}
          {isInstitutional && (
            <div className="space-y-2">
              <div className="flex items-center">
                <label htmlFor="investmentTeamSize" className="block text-sm font-semibold text-gray-800 mr-2">
                  Investment Team Size <span className="text-red-500">*</span>
                </label>
                <Tooltip content="Number of professionals on your investment team.">
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </Tooltip>
              </div>
              <div className="relative">
                <input
                  type="number"
                  id="investmentTeamSize"
                  min="1"
                  className={cn(
                    "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                    errors.investorDetails?.investmentTeamSize ? "border-red-300" : "border-gray-300"
                  )}
                  {...registerWithValidation("investorDetails.investmentTeamSize", { 
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
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.investorDetails.investmentTeamSize.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Number of professionals on your investment team
                </p>
              )}
            </div>
          )}

          {/* Investment Philosophy */}
          <div className="col-span-full space-y-2">
            <div className="flex items-center">
              <label htmlFor="investmentPhilosophy" className="block text-sm font-semibold text-gray-800 mr-2">
                Investment Philosophy <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Describe your overall approach to investments and decision-making.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <textarea
                id="investmentPhilosophy"
                rows={3}
                className={cn(
                  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.investorDetails?.investmentPhilosophy ? "border-red-300" : "border-gray-300"
                )}
                {...registerWithValidation("investorDetails.investmentPhilosophy", { 
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
            <div className="flex justify-between">
              {errors.investorDetails?.investmentPhilosophy ? (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
          <div className="col-span-full space-y-2">
            <div className="flex items-center">
              <label htmlFor="backgroundSummary" className="block text-sm font-semibold text-gray-800 mr-2">
                Background Summary <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Provide a professional overview of your experience and expertise.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <textarea
                id="backgroundSummary"
                rows={3}
                className={cn(
                  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.investorDetails?.backgroundSummary ? "border-red-300" : "border-gray-300"
                )}
                {...registerWithValidation("investorDetails.backgroundSummary", { 
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
            <div className="flex justify-between">
              {errors.investorDetails?.backgroundSummary ? (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
          <div className="col-span-full space-y-2">
            <div className="flex items-center">
              <label htmlFor="keyAchievements" className="block text-sm font-semibold text-gray-800 mr-2">
                Key Achievements <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Highlight notable investment successes or achievements.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <textarea
                id="keyAchievements"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
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
            <div className="flex justify-between">
              {errors.investorDetails?.keyAchievements ? (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-gray-800">Investment Capacity</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Annual Investment Target - Optional */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="annualInvestmentTarget" className="block text-sm font-semibold text-gray-800 mr-2">
                Annual Investment Target <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Total amount you aim to invest annually.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                id="annualInvestmentTarget"
                className="w-full pl-7 pr-12 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                placeholder="0"
                {...register("investorDetails.investment.annualInvestmentTarget.value", {
                  onChange: (e) => {
                    const value = e.target.valueAsNumber || 0;
                    // Also update the formatted value
                    const formattedValue = value ? formatCurrency(value, 'INR') : '';
                    setValue("investorDetails.investment.annualInvestmentTarget.formatted", formattedValue);
                  }
                })}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">INR</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Total amount you aim to invest annually
            </p>
          </div>

          {/* Decision Timeline */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="decisionTimeline" className="block text-sm font-semibold text-gray-800 mr-2">
                Decision Timeline <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Typical time from initial meeting to investment decision.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <input
                type="text"
                id="decisionTimeline"
                className={cn(
                  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.investorDetails?.investment?.decisionTimeline ? "border-red-300" : "border-gray-300"
                )}
                {...registerWithValidation("investorDetails.investment.decisionTimeline", { 
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
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.investorDetails.investment.decisionTimeline.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Typical time from initial meeting to investment decision
              </p>
            )}
          </div>

          {/* Preferred Rounds - Multi-select */}
          <div className="col-span-full space-y-2">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Preferred Investment Rounds <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Select all funding stages you typically invest in.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
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
                      {...registerWithValidation("investorDetails.investment.preferredRounds", { 
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
            {errors.investorDetails?.investment?.preferredRounds ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.investorDetails.investment.preferredRounds.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Select all funding stages you typically invest in
              </p>
            )}
          </div>

          {/* Lead Investor Status */}
          <div className="col-span-full mt-2">
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
          <div className="col-span-full space-y-2 mt-2">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Preferred Equity Stake Range <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Typical ownership percentage you target in investments.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="mb-2">
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
                  background: 'transparent',
                  WebkitAppearance: 'none',
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
                  background: 'transparent',
                  WebkitAppearance: 'none',
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Typical ownership percentage you target in investments
            </p>
          </div>
        </div>
      </div>

      {/* Investment Focus Section */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-gray-800">Investment Focus</h3>

        <div className="grid grid-cols-1 gap-6">
          {/* Primary Industries - Multi-select */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Primary Industries <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Select up to 5 industries where you primarily focus your investments.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
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
                      {...registerWithValidation("investorDetails.focus.primaryIndustries", { 
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
            {errors.investorDetails?.focus?.primaryIndustries ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.investorDetails.focus.primaryIndustries.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Select up to 5 industries where you primarily focus your investments
              </p>
            )}
          </div>

          {/* Secondary Industries - Multi-select */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Secondary Industries <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Additional industries you're interested in but are not your primary focus.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
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
            <p className="text-xs text-gray-500">
              Additional industries you're interested in but are not your primary focus
            </p>
          </div>

          {/* Business Stage Preference - Multi-select */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Business Stage Preference <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Development stages you typically invest in.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {businessStages.map((stage) => (
                <div key={stage.value} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`stage-${stage.value}`}
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      value={stage.value}
                      {...registerWithValidation("investorDetails.focus.businessStagePreference", { 
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
            {errors.investorDetails?.focus?.businessStagePreference ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.investorDetails.focus.businessStagePreference.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Development stages you typically invest in
              </p>
            )}
          </div>

          {/* Geographic Focus - Multi-select */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Geographic Focus <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Regions where you focus your investments.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {geographicRegions.map((region) => (
                <div key={region.value} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`region-${region.value}`}
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      value={region.value}
                      {...registerWithValidation("investorDetails.focus.geographicFocus", { 
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
            {errors.investorDetails?.focus?.geographicFocus ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.investorDetails.focus.geographicFocus.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Regions where you focus your investments
              </p>
            )}
          </div>

          {/* Investment Criteria */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="investmentCriteria" className="block text-sm font-semibold text-gray-800 mr-2">
                Investment Criteria <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Specific qualifications and features you seek in potential investments.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <textarea
                id="investmentCriteria"
                rows={3}
                className={cn(
                  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.investorDetails?.focus?.investmentCriteria ? "border-red-300" : "border-gray-300"
                )}
                {...registerWithValidation("investorDetails.focus.investmentCriteria", { 
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
            <div className="flex justify-between">
              {errors.investorDetails?.focus?.investmentCriteria ? (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="minimumRevenue" className="block text-sm font-semibold text-gray-800 mr-2">
                Minimum Revenue <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="The minimum annual revenue a business should have to be considered for investment.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                id="minimumRevenue"
                className="w-full pl-7 pr-12 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                placeholder="0"
                {...register("investorDetails.focus.minimumRevenue.value", {
                  onChange: (e) => {
                    const value = e.target.valueAsNumber || 0;
                    // Also update the formatted value
                    const formattedValue = value ? formatCurrency(value, 'INR') : '';
                    setValue("investorDetails.focus.minimumRevenue.formatted", formattedValue);
                  }
                })}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">INR</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Minimum annual revenue required for consideration
            </p>
          </div>

          {/* Minimum Traction - Optional */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="minimumTraction" className="block text-sm font-semibold text-gray-800 mr-2">
                Minimum Traction <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Other key metrics besides revenue that demonstrate traction.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <textarea
              id="minimumTraction"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("investorDetails.focus.minimumTraction", {
                maxLength: { value: 300, message: "Minimum traction cannot exceed 300 characters" }
              })}
              placeholder="Describe other metrics you look for (users, growth rate, etc.)"
            />
            <div className="flex justify-between">
              {errors.investorDetails?.focus?.minimumTraction ? (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-gray-800">Portfolio & Process</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portfolio Size - Optional */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="portfolioSize" className="block text-sm font-semibold text-gray-800 mr-2">
                Portfolio Size <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Total number of investments made to date.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <input
                type="number"
                id="portfolioSize"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
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
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.investorDetails.portfolio.portfolioSize.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Total number of investments made to date
              </p>
            )}
          </div>

          {/* Active Investments - Optional */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="activeInvestments" className="block text-sm font-semibold text-gray-800 mr-2">
                Active Investments <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Current number of active portfolio companies.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <input
                type="number"
                id="activeInvestments"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
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
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.investorDetails.portfolio.activeInvestments.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Current number of active portfolio companies
              </p>
            )}
          </div>

          {/* Success Stories - Optional */}
          <div className="col-span-full space-y-2">
            <div className="flex items-center">
              <label htmlFor="successStories" className="block text-sm font-semibold text-gray-800 mr-2">
                Success Stories <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Examples of successful investments or notable exits.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <textarea
                id="successStories"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
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
            <div className="flex justify-between">
              {errors.investorDetails?.portfolio?.successStories ? (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
          <div className="col-span-full space-y-2">
            <div className="flex items-center">
              <label htmlFor="investmentProcess" className="block text-sm font-semibold text-gray-800 mr-2">
                Investment Process <span className="text-red-500">*</span>
              </label>
              <Tooltip content="A clear outline of your process from pitch to funding.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <textarea
                id="investmentProcess"
                rows={3}
                className={cn(
                  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.investorDetails?.portfolio?.investmentProcess ? "border-red-300" : "border-gray-300"
                )}
                {...registerWithValidation("investorDetails.portfolio.investmentProcess", { 
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
            <div className="flex justify-between">
              {errors.investorDetails?.portfolio?.investmentProcess ? (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
          <div className="col-span-full space-y-2">
            <div className="flex items-center">
              <label htmlFor="postInvestmentSupport" className="block text-sm font-semibold text-gray-800 mr-2">
                Post-Investment Support <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Value-add support you provide beyond capital.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <textarea
                id="postInvestmentSupport"
                rows={3}
                className={cn(
                  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.investorDetails?.portfolio?.postInvestmentSupport ? "border-red-300" : "border-gray-300"
                )}
                {...registerWithValidation("investorDetails.portfolio.postInvestmentSupport", { 
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
            <div className="flex justify-between">
              {errors.investorDetails?.portfolio?.postInvestmentSupport ? (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
          <div className="col-span-full space-y-2">
            <div className="flex items-center">
              <label htmlFor="reportingRequirements" className="block text-sm font-semibold text-gray-800 mr-2">
                Reporting Requirements <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Frequency and content of expected reports from investments.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <textarea
              id="reportingRequirements"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("investorDetails.portfolio.reportingRequirements", {
                maxLength: { value: 300, message: "Reporting requirements cannot exceed 300 characters" }
              })}
              placeholder="Describe the reporting you expect from portfolio companies"
            />
            <div className="flex justify-between">
              {errors.investorDetails?.portfolio?.reportingRequirements ? (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="boardInvolvement" className="block text-sm font-semibold text-gray-800 mr-2">
                Board Involvement <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Level of governance participation you typically seek.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative">
              <select
                id="boardInvolvement"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
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
            <p className="text-xs text-gray-500">
              Level of governance participation you typically seek
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorForm;