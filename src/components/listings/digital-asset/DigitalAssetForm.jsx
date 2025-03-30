import React, { useEffect, useState } from 'react';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { 
  Globe, 
  Server, 
  Code, 
  LineChart, 
  CreditCard, 
  Calendar, 
  HelpCircle, 
  Check, 
  X, 
  Clock, 
  Clock3,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AssetType, ManagementEase, RevenueTrend } from '@/types/listings';
import { cn } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';

/**
 * Digital Asset Details Form Component
 * 
 * This component implements the third step in the listing form for Digital Assets,
 * containing all the specific fields required for this listing type.
 * 
 * It's organized into four main sections:
 * 1. Asset Information
 * 2. Technical Details
 * 3. Traffic & Analytics
 * 4. Financials & Sale Information
 */
const DigitalAssetForm = ({ className }) => {
  const { 
    control, 
    register, 
    formState: { errors }, 
    setValue, 
    getValues,
    trigger,
    clearErrors
  } = useFormContext();

  // Using these to watch and calculate totals
  const [trafficPercentages, setTrafficPercentages] = useState({
    organicTrafficPercentage: 0,
    directTrafficPercentage: 0,
    referralTrafficPercentage: 0,
    socialTrafficPercentage: 0,
    otherTrafficPercentage: 0
  });

  const [revenueBreakdown, setRevenueBreakdown] = useState({
    advertising: 0,
    affiliates: 0,
    productSales: 0, 
    subscriptions: 0,
    other: 0
  });

  // Watch for selected asset type to enable conditional fields
  const assetType = useWatch({
    control,
    name: 'digitalAssetDetails.assetType',
    defaultValue: ''
  });

  const easeOfManagement = useWatch({
    control,
    name: 'digitalAssetDetails.easeOfManagement',
    defaultValue: ''
  });
  
  // Watch traffic percentages for validation
  const organicTraffic = useWatch({
    control,
    name: 'digitalAssetDetails.traffic.organicTrafficPercentage',
    defaultValue: 0
  });
  
  const directTraffic = useWatch({
    control,
    name: 'digitalAssetDetails.traffic.directTrafficPercentage',
    defaultValue: 0
  });
  
  const referralTraffic = useWatch({
    control,
    name: 'digitalAssetDetails.traffic.referralTrafficPercentage',
    defaultValue: 0
  });
  
  const socialTraffic = useWatch({
    control,
    name: 'digitalAssetDetails.traffic.socialTrafficPercentage',
    defaultValue: 0
  });
  
  const otherTraffic = useWatch({
    control,
    name: 'digitalAssetDetails.traffic.otherTrafficPercentage',
    defaultValue: 0
  });

  // Watch revenue breakdown percentages for validation
  const advertisingRevenue = useWatch({
    control,
    name: 'digitalAssetDetails.financials.revenueBreakdown.advertising',
    defaultValue: 0
  });
  
  const affiliatesRevenue = useWatch({
    control,
    name: 'digitalAssetDetails.financials.revenueBreakdown.affiliates',
    defaultValue: 0
  });
  
  const productSalesRevenue = useWatch({
    control,
    name: 'digitalAssetDetails.financials.revenueBreakdown.productSales',
    defaultValue: 0
  });
  
  const subscriptionsRevenue = useWatch({
    control,
    name: 'digitalAssetDetails.financials.revenueBreakdown.subscriptions',
    defaultValue: 0
  });
  
  const otherRevenue = useWatch({
    control,
    name: 'digitalAssetDetails.financials.revenueBreakdown.other',
    defaultValue: 0
  });

  // Update traffic total when percentages change
  useEffect(() => {
    const newPercentages = {
      organicTrafficPercentage: Number(organicTraffic) || 0,
      directTrafficPercentage: Number(directTraffic) || 0,
      referralTrafficPercentage: Number(referralTraffic) || 0,
      socialTrafficPercentage: Number(socialTraffic) || 0,
      otherTrafficPercentage: Number(otherTraffic) || 0
    };
    
    setTrafficPercentages(newPercentages);
    
    // Calculate total to check if it's 100%
    const total = Object.values(newPercentages).reduce((sum, value) => sum + value, 0);
    
    // If all fields are filled out and total is not 100%, show a warning
    const allFieldsFilled = Object.values(newPercentages).every(val => val !== null && val !== undefined);
    
    if (allFieldsFilled && Math.abs(total - 100) > 0.01) {
      // Set a custom form error
      setValue('digitalAssetDetails.traffic.totalPercentageError', 
        `Traffic source percentages should add up to 100%. Current total: ${total}%`);
    } else {
      // Clear the error if total is now 100%
      setValue('digitalAssetDetails.traffic.totalPercentageError', undefined);
      clearErrors('digitalAssetDetails.traffic.totalPercentageError');
    }
  }, [organicTraffic, directTraffic, referralTraffic, socialTraffic, otherTraffic, setValue, clearErrors]);

  // Update revenue breakdown total when percentages change
  useEffect(() => {
    const newBreakdown = {
      advertising: Number(advertisingRevenue) || 0,
      affiliates: Number(affiliatesRevenue) || 0,
      productSales: Number(productSalesRevenue) || 0,
      subscriptions: Number(subscriptionsRevenue) || 0,
      other: Number(otherRevenue) || 0
    };
    
    setRevenueBreakdown(newBreakdown);
    
    // Calculate total to check if it's 100%
    const total = Object.values(newBreakdown).reduce((sum, value) => sum + value, 0);
    
    // If all fields are filled out and total is not 100%, show a warning
    const allFieldsFilled = Object.values(newBreakdown).every(val => val !== null && val !== undefined);
    
    if (allFieldsFilled && Math.abs(total - 100) > 0.01) {
      // Set a custom form error
      setValue('digitalAssetDetails.financials.revenueBreakdown.totalPercentageError', 
        `Revenue sources should add up to 100%. Current total: ${total}%`);
    } else {
      // Clear the error if total is now 100%
      setValue('digitalAssetDetails.financials.revenueBreakdown.totalPercentageError', undefined);
      clearErrors('digitalAssetDetails.financials.revenueBreakdown.totalPercentageError');
    }
  }, [advertisingRevenue, affiliatesRevenue, productSalesRevenue, subscriptionsRevenue, otherRevenue, setValue, clearErrors]);

  // Function to auto-distribute remaining percentage to make total 100%
  const autoDistributeTrafficPercentage = () => {
    const currentTotal = Object.values(trafficPercentages).reduce((sum, value) => sum + value, 0);
    
    if (Math.abs(currentTotal - 100) < 0.01) {
      return; // Already equals 100%
    }
    
    // Get all the fields that have values
    const filledFields = Object.entries(trafficPercentages)
      .filter(([_, value]) => value > 0)
      .map(([key]) => key);
    
    if (filledFields.length === 0) {
      // If no fields have values, distribute evenly
      const evenValue = 20; // 100% / 5 fields
      Object.keys(trafficPercentages).forEach(key => {
        setValue(`digitalAssetDetails.traffic.${key}`, evenValue);
      });
      return;
    }
    
    // Calculate how much needs to be distributed
    const remaining = 100 - currentTotal;
    
    // Distribute remaining percentage evenly among filled fields
    const adjustment = remaining / filledFields.length;
    
    filledFields.forEach(field => {
      const newValue = Math.max(0, Math.min(100, trafficPercentages[field] + adjustment));
      setValue(`digitalAssetDetails.traffic.${field}`, parseFloat(newValue.toFixed(1)));
    });
    
    // Trigger validation update
    trigger([
      'digitalAssetDetails.traffic.organicTrafficPercentage',
      'digitalAssetDetails.traffic.directTrafficPercentage',
      'digitalAssetDetails.traffic.referralTrafficPercentage',
      'digitalAssetDetails.traffic.socialTrafficPercentage',
      'digitalAssetDetails.traffic.otherTrafficPercentage'
    ]);
    
    toast.success('Traffic percentages adjusted to total 100%');
  };

  // Function to auto-distribute revenue percentages
  const autoDistributeRevenuePercentage = () => {
    const currentTotal = Object.values(revenueBreakdown).reduce((sum, value) => sum + value, 0);
    
    if (Math.abs(currentTotal - 100) < 0.01) {
      return; // Already equals 100%
    }
    
    // Get all the fields that have values
    const filledFields = Object.entries(revenueBreakdown)
      .filter(([_, value]) => value > 0)
      .map(([key]) => key);
    
    if (filledFields.length === 0) {
      // If no fields have values, distribute evenly
      const evenValue = 20; // 100% / 5 fields
      Object.keys(revenueBreakdown).forEach(key => {
        setValue(`digitalAssetDetails.financials.revenueBreakdown.${key}`, evenValue);
      });
      return;
    }
    
    // Calculate how much needs to be distributed
    const remaining = 100 - currentTotal;
    
    // Distribute remaining percentage evenly among filled fields
    const adjustment = remaining / filledFields.length;
    
    filledFields.forEach(field => {
      const newValue = Math.max(0, Math.min(100, revenueBreakdown[field] + adjustment));
      setValue(`digitalAssetDetails.financials.revenueBreakdown.${field}`, parseFloat(newValue.toFixed(1)));
    });
    
    // Trigger validation update
    trigger([
      'digitalAssetDetails.financials.revenueBreakdown.advertising',
      'digitalAssetDetails.financials.revenueBreakdown.affiliates',
      'digitalAssetDetails.financials.revenueBreakdown.productSales',
      'digitalAssetDetails.financials.revenueBreakdown.subscriptions',
      'digitalAssetDetails.financials.revenueBreakdown.other'
    ]);
    
    toast.success('Revenue percentages adjusted to total 100%');
  };

  // Helper function to get the error message for a field
  const getErrorMessage = (fieldName) => {
    // Use lodash-like get functionality to safely access deeply nested properties
    const getNestedProperty = (obj, path) => {
      return path.split('.').reduce((prev, curr) => {
        return prev && prev[curr] ? prev[curr] : null;
      }, obj);
    };
    
    return getNestedProperty(errors, fieldName)?.message;
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Section 1: Asset Information */}
      <div className="card space-y-6">
        <div className="flex items-center border-b border-gray-200 pb-3 mb-6">
          <Globe className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Asset Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Asset Type */}
          <div className="col-span-1">
            <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 mb-1">
              Asset Type <span className="text-red-500">*</span>
            </label>
            <Controller
              name="digitalAssetDetails.assetType"
              control={control}
              render={({ field }) => (
                <select
                  id="assetType"
                  className={cn(
                    "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                    errors.digitalAssetDetails?.assetType && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  {...field}
                >
                  <option value="">Select Asset Type</option>
                  <option value={AssetType.WEBSITE}>Website</option>
                  <option value={AssetType.E_COMMERCE}>E-commerce Store</option>
                  <option value={AssetType.BLOG}>Blog</option>
                  <option value={AssetType.MOBILE_APP}>Mobile App</option>
                  <option value={AssetType.SAAS}>SaaS (Software as a Service)</option>
                  <option value={AssetType.ONLINE_COMMUNITY}>Online Community</option>
                  <option value={AssetType.DOMAIN_PORTFOLIO}>Domain Portfolio</option>
                </select>
              )}
            />
            {getErrorMessage('digitalAssetDetails.assetType') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.assetType')}
              </p>
            )}
          </div>
          
          {/* Platform/Framework */}
          <div className="col-span-1">
            <label htmlFor="platformFramework" className="block text-sm font-medium text-gray-700 mb-1">
              Platform/Framework <span className="text-red-500">*</span>
              <Tooltip content="The technical platform or framework that powers the digital asset (e.g., WordPress, Shopify, React, etc.)">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <input
              id="platformFramework"
              type="text"
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.platformFramework && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="e.g., WordPress, Shopify, Custom PHP"
              {...register("digitalAssetDetails.platformFramework")}
            />
            {getErrorMessage('digitalAssetDetails.platformFramework') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.platformFramework')}
              </p>
            )}
          </div>
          
          {/* Niche Industry */}
          <div className="col-span-1">
            <label htmlFor="nicheIndustry" className="block text-sm font-medium text-gray-700 mb-1">
              Niche/Industry <span className="text-red-500">*</span>
              <Tooltip content="The specific market sector or niche the digital asset serves">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <input
              id="nicheIndustry"
              type="text"
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.nicheIndustry && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="e.g., Health & Fitness, Financial Reviews, Travel Guides"
              {...register("digitalAssetDetails.nicheIndustry")}
            />
            {getErrorMessage('digitalAssetDetails.nicheIndustry') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.nicheIndustry')}
              </p>
            )}
          </div>
          
          {/* Creation Date */}
          <div className="col-span-1">
            <label htmlFor="creationDate" className="block text-sm font-medium text-gray-700 mb-1">
              Creation Date <span className="text-red-500">*</span>
              <Tooltip content="When the digital asset was first created or established">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <Controller
                name="digitalAssetDetails.creationDate"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <input
                    id="creationDate"
                    type="date"
                    className={cn(
                      "w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                      errors.digitalAssetDetails?.creationDate && "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                    onChange={onChange}
                    value={value instanceof Date ? value.toISOString().split('T')[0] : value}
                    {...field}
                  />
                )}
              />
            </div>
            {getErrorMessage('digitalAssetDetails.creationDate') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.creationDate')}
              </p>
            )}
          </div>
          
          {/* Business Model */}
          <div className="col-span-full">
            <label htmlFor="businessModel" className="block text-sm font-medium text-gray-700 mb-1">
              Business Model <span className="text-red-500">*</span>
              <Tooltip content="Describe how the digital asset generates revenue">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <textarea
              id="businessModel"
              rows={4}
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.businessModel && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="Describe how the digital asset generates revenue (e.g., advertising, affiliate marketing, product sales, subscriptions, etc.)"
              {...register("digitalAssetDetails.businessModel")}
            />
            {getErrorMessage('digitalAssetDetails.businessModel') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.businessModel')}
              </p>
            )}
            <div className="mt-1 text-xs text-gray-500 flex justify-between">
              <span>Minimum 100 characters</span>
              <span>
                {getValues("digitalAssetDetails.businessModel")?.length || 0}/500 characters
              </span>
            </div>
          </div>
          
          {/* Ease of Management */}
          <div className="col-span-1">
            <label htmlFor="easeOfManagement" className="block text-sm font-medium text-gray-700 mb-1">
              Ease of Management <span className="text-red-500">*</span>
              <Tooltip content="How much involvement the asset requires to operate">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <Controller
              name="digitalAssetDetails.easeOfManagement"
              control={control}
              render={({ field }) => (
                <select
                  id="easeOfManagement"
                  className={cn(
                    "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                    errors.digitalAssetDetails?.easeOfManagement && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  {...field}
                >
                  <option value="">Select Management Level</option>
                  <option value={ManagementEase.PASSIVE}>Passive (0-5 hrs/week)</option>
                  <option value={ManagementEase.SEMI_PASSIVE}>Semi-Passive (5-20 hrs/week)</option>
                  <option value={ManagementEase.ACTIVE}>Active (20+ hrs/week)</option>
                </select>
              )}
            />
            {getErrorMessage('digitalAssetDetails.easeOfManagement') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.easeOfManagement')}
              </p>
            )}
          </div>
          
          {/* Owner Time Required */}
          <div className="col-span-1">
            <label htmlFor="ownerTimeRequired" className="block text-sm font-medium text-gray-700 mb-1">
              Weekly Hours Required <span className="text-red-500">*</span>
              <Tooltip content="Average number of hours per week required to manage the asset">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="ownerTimeRequired"
                type="number"
                min="0"
                max="168"
                step="0.5"
                className={cn(
                  "w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                  errors.digitalAssetDetails?.ownerTimeRequired && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                placeholder="Hours per week"
                {...register("digitalAssetDetails.ownerTimeRequired", {
                  valueAsNumber: true
                })}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500">hrs/week</span>
              </div>
            </div>
            {getErrorMessage('digitalAssetDetails.ownerTimeRequired') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.ownerTimeRequired')}
              </p>
            )}
            {easeOfManagement && (
              <p className="mt-1 text-xs text-gray-500">
                {easeOfManagement === ManagementEase.PASSIVE && "This should be between 0-5 hours for Passive management"}
                {easeOfManagement === ManagementEase.SEMI_PASSIVE && "This should be between 5-20 hours for Semi-Passive management"}
                {easeOfManagement === ManagementEase.ACTIVE && "This should be 20+ hours for Active management"}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Section 2: Technical Details */}
      <div className="card space-y-6">
        <div className="flex items-center border-b border-gray-200 pb-3 mb-6">
          <Server className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Technical Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Domain Name */}
          <div className="col-span-1">
            <label htmlFor="domainName" className="block text-sm font-medium text-gray-700 mb-1">
              Domain Name <span className="text-red-500">*</span>
            </label>
            <input
              id="domainName"
              type="text"
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.technical?.domainName && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="e.g., example.com"
              {...register("digitalAssetDetails.technical.domainName")}
            />
            {getErrorMessage('digitalAssetDetails.technical.domainName') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.technical.domainName')}
              </p>
            )}
          </div>
          
          {/* Domain Authority */}
          <div className="col-span-1">
            <label htmlFor="domainAuthority" className="block text-sm font-medium text-gray-700 mb-1">
              Domain Authority
              <Tooltip content="Domain Authority (0-100) is a search engine ranking score developed by Moz">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <input
              id="domainAuthority"
              type="number"
              min="0"
              max="100"
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.technical?.domainAuthority && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="e.g., 30"
              {...register("digitalAssetDetails.technical.domainAuthority", {
                valueAsNumber: true
              })}
            />
            <p className="mt-1 text-xs text-gray-500">Score from 0-100</p>
          </div>
          
          {/* Domain Age */}
          <div className="col-span-1">
            <label htmlFor="domainAge" className="block text-sm font-medium text-gray-700 mb-1">
              Domain Age (Years)
              <Tooltip content="How long the domain has been registered">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <input
              id="domainAge"
              type="number"
              min="0"
              max="30"
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.technical?.domainAge && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="e.g., 5"
              {...register("digitalAssetDetails.technical.domainAge", {
                valueAsNumber: true
              })}
            />
            <p className="mt-1 text-xs text-gray-500">Age in years</p>
          </div>
          
          {/* Hosting Provider */}
          <div className="col-span-1">
            <label htmlFor="hostingProvider" className="block text-sm font-medium text-gray-700 mb-1">
              Hosting Provider <span className="text-red-500">*</span>
            </label>
            <input
              id="hostingProvider"
              type="text"
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.technical?.hostingProvider && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="e.g., AWS, DigitalOcean, Bluehost"
              {...register("digitalAssetDetails.technical.hostingProvider")}
            />
            {getErrorMessage('digitalAssetDetails.technical.hostingProvider') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.technical.hostingProvider')}
              </p>
            )}
          </div>
          
          {/* Monthly Hosting Cost */}
          <div className="col-span-1">
            <label htmlFor="monthlyHostingCost" className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Hosting Cost <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
              <input
                id="monthlyHostingCost"
                type="number"
                min="0"
                step="1"
                className={cn(
                  "w-full pl-8 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                  errors.digitalAssetDetails?.technical?.monthlyHostingCost?.value && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                placeholder="Monthly cost"
                {...register("digitalAssetDetails.technical.monthlyHostingCost.value", {
                  valueAsNumber: true
                })}
              />
            </div>
            {getErrorMessage('digitalAssetDetails.technical.monthlyHostingCost.value') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.technical.monthlyHostingCost.value')}
              </p>
            )}
          </div>
          
          {/* Technology Stack */}
          <div className="col-span-full">
            <label htmlFor="technologyStack" className="block text-sm font-medium text-gray-700 mb-1">
              Technology Stack <span className="text-red-500">*</span>
              <Tooltip content="The programming languages, frameworks, and tools used to build the asset">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Code className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="technologyStack"
                type="text"
                className={cn(
                  "w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                  errors.digitalAssetDetails?.technical?.technologyStack && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                placeholder="e.g., PHP, MySQL, JavaScript, jQuery"
                {...register("digitalAssetDetails.technical.technologyStack")}
              />
            </div>
            {getErrorMessage('digitalAssetDetails.technical.technologyStack') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.technical.technologyStack')}
              </p>
            )}
          </div>
          
          {/* Mobile Responsiveness */}
          <div className="col-span-1">
            <div className="flex items-center">
              <input
                id="mobileResponsiveness"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                {...register("digitalAssetDetails.technical.mobileResponsiveness")}
              />
              <label htmlFor="mobileResponsiveness" className="ml-2 block text-sm text-gray-700">
                Mobile Responsive <span className="text-red-500">*</span>
                <Tooltip content="Does the website/app work well on mobile devices?">
                  <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
                </Tooltip>
              </label>
            </div>
            {getErrorMessage('digitalAssetDetails.technical.mobileResponsiveness') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.technical.mobileResponsiveness')}
              </p>
            )}
          </div>
          
          {/* Content Management */}
          <div className="col-span-1">
            <label htmlFor="contentManagement" className="block text-sm font-medium text-gray-700 mb-1">
              Content Management <span className="text-red-500">*</span>
              <Tooltip content="How content on the site is managed and updated">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <input
              id="contentManagement"
              type="text"
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.technical?.contentManagement && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="e.g., WordPress Admin, Custom CMS"
              {...register("digitalAssetDetails.technical.contentManagement")}
            />
            {getErrorMessage('digitalAssetDetails.technical.contentManagement') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.technical.contentManagement')}
              </p>
            )}
          </div>
          
          {/* SSL Security */}
          <div className="col-span-1">
            <div className="flex items-center">
              <input
                id="sslSecurity"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                {...register("digitalAssetDetails.technical.sslSecurity")}
              />
              <label htmlFor="sslSecurity" className="ml-2 block text-sm text-gray-700">
                SSL Security Enabled <span className="text-red-500">*</span>
                <Tooltip content="Whether the site has an SSL certificate (https://)">
                  <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
                </Tooltip>
              </label>
            </div>
            {getErrorMessage('digitalAssetDetails.technical.sslSecurity') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.technical.sslSecurity')}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Section 3: Traffic & Analytics */}
      <div className="card space-y-6">
        <div className="flex items-center border-b border-gray-200 pb-3 mb-6">
          <LineChart className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Traffic & Analytics</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Monthly Visitors */}
          <div className="col-span-1">
            <label htmlFor="monthlyVisitors" className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Unique Visitors <span className="text-red-500">*</span>
              <Tooltip content="Average number of unique visitors per month">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <input
              id="monthlyVisitors"
              type="number"
              min="0"
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.traffic?.monthlyVisitors && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="e.g., 5000"
              {...register("digitalAssetDetails.traffic.monthlyVisitors", {
                valueAsNumber: true
              })}
            />
            {getErrorMessage('digitalAssetDetails.traffic.monthlyVisitors') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.traffic.monthlyVisitors')}
              </p>
            )}
          </div>
          
          {/* Monthly Pageviews */}
          <div className="col-span-1">
            <label htmlFor="monthlyPageviews" className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Pageviews <span className="text-red-500">*</span>
              <Tooltip content="Total page views per month (usually higher than visitor count)">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <input
              id="monthlyPageviews"
              type="number"
              min="0"
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.traffic?.monthlyPageviews && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="e.g., 15000"
              {...register("digitalAssetDetails.traffic.monthlyPageviews", {
                valueAsNumber: true
              })}
            />
            {getErrorMessage('digitalAssetDetails.traffic.monthlyPageviews') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.traffic.monthlyPageviews')}
              </p>
            )}
          </div>
          
          {/* Traffic Trend */}
          <div className="col-span-1">
            <label htmlFor="trafficTrend" className="block text-sm font-medium text-gray-700 mb-1">
              Traffic Trend <span className="text-red-500">*</span>
            </label>
            <Controller
              name="digitalAssetDetails.traffic.trafficTrend"
              control={control}
              render={({ field }) => (
                <select
                  id="trafficTrend"
                  className={cn(
                    "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                    errors.digitalAssetDetails?.traffic?.trafficTrend && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  {...field}
                >
                  <option value="">Select Traffic Trend</option>
                  <option value={RevenueTrend.GROWING}>Growing (&gt;10%)</option>
                  <option value={RevenueTrend.STABLE}>Stable (±10%)</option>
                  <option value={RevenueTrend.DECLINING}>Declining (&lt;-10%)</option>
                </select>
              )}
            />
            {getErrorMessage('digitalAssetDetails.traffic.trafficTrend') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.traffic.trafficTrend')}
              </p>
            )}
          </div>
          
          {/* Analytics Verification */}
          <div className="col-span-1">
            <div className="flex items-center">
              <input
                id="analyticsVerification"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                {...register("digitalAssetDetails.traffic.analyticsVerification")}
              />
              <label htmlFor="analyticsVerification" className="ml-2 block text-sm text-gray-700">
                Analytics Verification Available <span className="text-red-500">*</span>
                <Tooltip content="Can you provide access to analytics data to verify traffic claims?">
                  <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
                </Tooltip>
              </label>
            </div>
            {getErrorMessage('digitalAssetDetails.traffic.analyticsVerification') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.traffic.analyticsVerification')}
              </p>
            )}
          </div>
          
          <div className="col-span-full">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Traffic Sources (%) <span className="text-red-500">*</span>
                <Tooltip content="Breakdown of where traffic comes from - must total 100%">
                  <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
                </Tooltip>
              </label>
              <button
                type="button"
                onClick={autoDistributeTrafficPercentage}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Auto-distribute to 100%
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-3">
                {/* Organic Traffic % */}
                <div className="flex flex-wrap items-center">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label htmlFor="organicTrafficPercentage" className="block text-sm font-medium text-gray-700">
                      Organic Search
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        id="organicTrafficPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className={cn(
                          "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                          errors.digitalAssetDetails?.traffic?.organicTrafficPercentage && "border-red-300 focus:border-red-500 focus:ring-red-500"
                        )}
                        placeholder="0"
                        {...register("digitalAssetDetails.traffic.organicTrafficPercentage", {
                          valueAsNumber: true
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Direct Traffic % */}
                <div className="flex flex-wrap items-center">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label htmlFor="directTrafficPercentage" className="block text-sm font-medium text-gray-700">
                      Direct Traffic
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        id="directTrafficPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className={cn(
                          "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                          errors.digitalAssetDetails?.traffic?.directTrafficPercentage && "border-red-300 focus:border-red-500 focus:ring-red-500"
                        )}
                        placeholder="0"
                        {...register("digitalAssetDetails.traffic.directTrafficPercentage", {
                          valueAsNumber: true
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Referral Traffic % */}
                <div className="flex flex-wrap items-center">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label htmlFor="referralTrafficPercentage" className="block text-sm font-medium text-gray-700">
                      Referral Traffic
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        id="referralTrafficPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className={cn(
                          "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                          errors.digitalAssetDetails?.traffic?.referralTrafficPercentage && "border-red-300 focus:border-red-500 focus:ring-red-500"
                        )}
                        placeholder="0"
                        {...register("digitalAssetDetails.traffic.referralTrafficPercentage", {
                          valueAsNumber: true
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Social Traffic % */}
                <div className="flex flex-wrap items-center">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label htmlFor="socialTrafficPercentage" className="block text-sm font-medium text-gray-700">
                      Social Media
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        id="socialTrafficPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className={cn(
                          "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                          errors.digitalAssetDetails?.traffic?.socialTrafficPercentage && "border-red-300 focus:border-red-500 focus:ring-red-500"
                        )}
                        placeholder="0"
                        {...register("digitalAssetDetails.traffic.socialTrafficPercentage", {
                          valueAsNumber: true
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Other Traffic % */}
                <div className="flex flex-wrap items-center">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label htmlFor="otherTrafficPercentage" className="block text-sm font-medium text-gray-700">
                      Other Sources
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        id="otherTrafficPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className={cn(
                          "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                          errors.digitalAssetDetails?.traffic?.otherTrafficPercentage && "border-red-300 focus:border-red-500 focus:ring-red-500"
                        )}
                        placeholder="0"
                        {...register("digitalAssetDetails.traffic.otherTrafficPercentage", {
                          valueAsNumber: true
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Total with calculation */}
                <div className="flex flex-wrap items-center pt-2 border-t border-gray-200">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label className="block text-sm font-medium text-gray-800">
                      Total
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        type="text"
                        className={cn(
                          "w-full rounded-lg border-gray-300 bg-gray-50 font-medium",
                          Math.abs(Object.values(trafficPercentages).reduce((sum, val) => sum + val, 0) - 100) > 0.01
                            ? "text-red-600 border-red-300"
                            : "text-green-600 border-green-300"
                        )}
                        value={`${Object.values(trafficPercentages).reduce((sum, val) => sum + val, 0).toFixed(1)}%`}
                        readOnly
                      />
                      <div className="absolute inset-y-0 right-10 flex items-center">
                        {Math.abs(Object.values(trafficPercentages).reduce((sum, val) => sum + val, 0) - 100) > 0.01 ? (
                          <X className="h-5 w-5 text-red-500" />
                        ) : (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    {getErrorMessage('digitalAssetDetails.traffic.totalPercentageError') && (
                      <p className="mt-1 text-sm text-red-600">
                        {getErrorMessage('digitalAssetDetails.traffic.totalPercentageError')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Email Subscribers */}
          <div className="col-span-1">
            <label htmlFor="emailSubscribers" className="block text-sm font-medium text-gray-700 mb-1">
              Email Subscribers
              <Tooltip content="Number of subscribers on email list (if applicable)">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <input
              id="emailSubscribers"
              type="number"
              min="0"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., 1000"
              {...register("digitalAssetDetails.traffic.emailSubscribers", {
                valueAsNumber: true
              })}
            />
            <p className="mt-1 text-xs text-gray-500">Optional - leave blank if not applicable</p>
          </div>
          
          {/* Social Media Accounts */}
          <div className="col-span-1">
            <label htmlFor="socialMediaAccounts" className="block text-sm font-medium text-gray-700 mb-1">
              Social Media Accounts
              <Tooltip content="Details of associated social media accounts and followers">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <input
              id="socialMediaAccounts"
              type="text"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., Instagram: 5K, Facebook: 2K"
              {...register("digitalAssetDetails.traffic.socialMediaAccounts")}
            />
            <p className="mt-1 text-xs text-gray-500">Optional - leave blank if not applicable</p>
          </div>
        </div>
      </div>
      
      {/* Section 4: Financials & Sale Information */}
      <div className="card space-y-6">
        <div className="flex items-center border-b border-gray-200 pb-3 mb-6">
          <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Financials & Sale Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Monthly Revenue */}
          <div className="col-span-1">
            <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Revenue <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
              <input
                id="monthlyRevenue"
                type="number"
                min="0"
                className={cn(
                  "w-full pl-8 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                  errors.digitalAssetDetails?.financials?.monthlyRevenue?.value && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                placeholder="Average monthly revenue"
                {...register("digitalAssetDetails.financials.monthlyRevenue.value", {
                  valueAsNumber: true
                })}
              />
            </div>
            {getErrorMessage('digitalAssetDetails.financials.monthlyRevenue.value') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.financials.monthlyRevenue.value')}
              </p>
            )}
          </div>
          
          {/* Annual Revenue */}
          <div className="col-span-1">
            <label htmlFor="annualRevenue" className="block text-sm font-medium text-gray-700 mb-1">
              Annual Revenue <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
              <input
                id="annualRevenue"
                type="number"
                min="0"
                className={cn(
                  "w-full pl-8 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                  errors.digitalAssetDetails?.financials?.annualRevenue?.value && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                placeholder="Annual revenue"
                {...register("digitalAssetDetails.financials.annualRevenue.value", {
                  valueAsNumber: true
                })}
              />
            </div>
            {getErrorMessage('digitalAssetDetails.financials.annualRevenue.value') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.financials.annualRevenue.value')}
              </p>
            )}
          </div>
          
          {/* Expense Breakdown */}
          <div className="col-span-full">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Monthly Expense Breakdown <span className="text-red-500">*</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hosting */}
              <div className="col-span-1">
                <label htmlFor="expenseHosting" className="block text-sm text-gray-700 mb-1">
                  Hosting & Infrastructure
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₹</span>
                  </div>
                  <input
                    id="expenseHosting"
                    type="number"
                    min="0"
                    className={cn(
                      "w-full pl-8 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                      errors.digitalAssetDetails?.financials?.expenseBreakdown?.hosting?.value && "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                    placeholder="Hosting costs"
                    {...register("digitalAssetDetails.financials.expenseBreakdown.hosting.value", {
                      valueAsNumber: true
                    })}
                  />
                </div>
                {getErrorMessage('digitalAssetDetails.financials.expenseBreakdown.hosting.value') && (
                  <p className="mt-1 text-sm text-red-600">
                    {getErrorMessage('digitalAssetDetails.financials.expenseBreakdown.hosting.value')}
                  </p>
                )}
              </div>
              
              {/* Content */}
              <div className="col-span-1">
                <label htmlFor="expenseContent" className="block text-sm text-gray-700 mb-1">
                  Content Creation
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₹</span>
                  </div>
                  <input
                    id="expenseContent"
                    type="number"
                    min="0"
                    className={cn(
                      "w-full pl-8 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                      errors.digitalAssetDetails?.financials?.expenseBreakdown?.content?.value && "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                    placeholder="Content costs"
                    {...register("digitalAssetDetails.financials.expenseBreakdown.content.value", {
                      valueAsNumber: true
                    })}
                  />
                </div>
                {getErrorMessage('digitalAssetDetails.financials.expenseBreakdown.content.value') && (
                  <p className="mt-1 text-sm text-red-600">
                    {getErrorMessage('digitalAssetDetails.financials.expenseBreakdown.content.value')}
                  </p>
                )}
              </div>
              
              {/* Marketing */}
              <div className="col-span-1">
                <label htmlFor="expenseMarketing" className="block text-sm text-gray-700 mb-1">
                  Marketing & Advertising
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₹</span>
                  </div>
                  <input
                    id="expenseMarketing"
                    type="number"
                    min="0"
                    className={cn(
                      "w-full pl-8 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                      errors.digitalAssetDetails?.financials?.expenseBreakdown?.marketing?.value && "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                    placeholder="Marketing costs"
                    {...register("digitalAssetDetails.financials.expenseBreakdown.marketing.value", {
                      valueAsNumber: true
                    })}
                  />
                </div>
                {getErrorMessage('digitalAssetDetails.financials.expenseBreakdown.marketing.value') && (
                  <p className="mt-1 text-sm text-red-600">
                    {getErrorMessage('digitalAssetDetails.financials.expenseBreakdown.marketing.value')}
                  </p>
                )}
              </div>
              
              {/* Other */}
              <div className="col-span-1">
                <label htmlFor="expenseOther" className="block text-sm text-gray-700 mb-1">
                  Other Expenses
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₹</span>
                  </div>
                  <input
                    id="expenseOther"
                    type="number"
                    min="0"
                    className={cn(
                      "w-full pl-8 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                      errors.digitalAssetDetails?.financials?.expenseBreakdown?.other?.value && "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                    placeholder="Other costs"
                    {...register("digitalAssetDetails.financials.expenseBreakdown.other.value", {
                      valueAsNumber: true
                    })}
                  />
                </div>
                {getErrorMessage('digitalAssetDetails.financials.expenseBreakdown.other.value') && (
                  <p className="mt-1 text-sm text-red-600">
                    {getErrorMessage('digitalAssetDetails.financials.expenseBreakdown.other.value')}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Profit Margin */}
          <div className="col-span-1">
            <label htmlFor="profitMargin" className="block text-sm font-medium text-gray-700 mb-1">
              Profit Margin <span className="text-red-500">*</span>
              <Tooltip content="Percentage of revenue that is profit">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <div className="relative mt-1">
              <input
                id="profitMargin"
                type="number"
                min="0"
                max="100"
                step="0.1"
                className={cn(
                  "w-full pr-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                  errors.digitalAssetDetails?.financials?.profitMargin && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                placeholder="e.g., 40"
                {...register("digitalAssetDetails.financials.profitMargin", {
                  valueAsNumber: true
                })}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500">%</span>
              </div>
            </div>
            {getErrorMessage('digitalAssetDetails.financials.profitMargin') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.financials.profitMargin')}
              </p>
            )}
          </div>
          
          <div className="col-span-full">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Revenue Sources (%) <span className="text-red-500">*</span>
                <Tooltip content="Breakdown of revenue sources - must total 100%">
                  <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
                </Tooltip>
              </label>
              <button
                type="button"
                onClick={autoDistributeRevenuePercentage}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Auto-distribute to 100%
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-3">
                {/* Advertising */}
                <div className="flex flex-wrap items-center">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label htmlFor="revenueAdvertising" className="block text-sm font-medium text-gray-700">
                      Advertising
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        id="revenueAdvertising"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className={cn(
                          "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                          errors.digitalAssetDetails?.financials?.revenueBreakdown?.advertising && "border-red-300 focus:border-red-500 focus:ring-red-500"
                        )}
                        placeholder="0"
                        {...register("digitalAssetDetails.financials.revenueBreakdown.advertising", {
                          valueAsNumber: true
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Affiliates */}
                <div className="flex flex-wrap items-center">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label htmlFor="revenueAffiliates" className="block text-sm font-medium text-gray-700">
                      Affiliate Marketing
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        id="revenueAffiliates"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className={cn(
                          "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                          errors.digitalAssetDetails?.financials?.revenueBreakdown?.affiliates && "border-red-300 focus:border-red-500 focus:ring-red-500"
                        )}
                        placeholder="0"
                        {...register("digitalAssetDetails.financials.revenueBreakdown.affiliates", {
                          valueAsNumber: true
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Product Sales */}
                <div className="flex flex-wrap items-center">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label htmlFor="revenueProductSales" className="block text-sm font-medium text-gray-700">
                      Product Sales
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        id="revenueProductSales"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className={cn(
                          "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                          errors.digitalAssetDetails?.financials?.revenueBreakdown?.productSales && "border-red-300 focus:border-red-500 focus:ring-red-500"
                        )}
                        placeholder="0"
                        {...register("digitalAssetDetails.financials.revenueBreakdown.productSales", {
                          valueAsNumber: true
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Subscriptions */}
                <div className="flex flex-wrap items-center">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label htmlFor="revenueSubscriptions" className="block text-sm font-medium text-gray-700">
                      Subscriptions
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        id="revenueSubscriptions"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className={cn(
                          "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                          errors.digitalAssetDetails?.financials?.revenueBreakdown?.subscriptions && "border-red-300 focus:border-red-500 focus:ring-red-500"
                        )}
                        placeholder="0"
                        {...register("digitalAssetDetails.financials.revenueBreakdown.subscriptions", {
                          valueAsNumber: true
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Other */}
                <div className="flex flex-wrap items-center">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label htmlFor="revenueOther" className="block text-sm font-medium text-gray-700">
                      Other Revenue
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        id="revenueOther"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className={cn(
                          "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                          errors.digitalAssetDetails?.financials?.revenueBreakdown?.other && "border-red-300 focus:border-red-500 focus:ring-red-500"
                        )}
                        placeholder="0"
                        {...register("digitalAssetDetails.financials.revenueBreakdown.other", {
                          valueAsNumber: true
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Total with calculation */}
                <div className="flex flex-wrap items-center pt-2 border-t border-gray-200">
                  <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                    <label className="block text-sm font-medium text-gray-800">
                      Total
                    </label>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <div className="relative">
                      <input
                        type="text"
                        className={cn(
                          "w-full rounded-lg border-gray-300 bg-gray-50 font-medium",
                          Math.abs(Object.values(revenueBreakdown).reduce((sum, val) => sum + val, 0) - 100) > 0.01
                            ? "text-red-600 border-red-300"
                            : "text-green-600 border-green-300"
                        )}
                        value={`${Object.values(revenueBreakdown).reduce((sum, val) => sum + val, 0).toFixed(1)}%`}
                        readOnly
                      />
                      <div className="absolute inset-y-0 right-10 flex items-center">
                        {Math.abs(Object.values(revenueBreakdown).reduce((sum, val) => sum + val, 0) - 100) > 0.01 ? (
                          <X className="h-5 w-5 text-red-500" />
                        ) : (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    {getErrorMessage('digitalAssetDetails.financials.revenueBreakdown.totalPercentageError') && (
                      <p className="mt-1 text-sm text-red-600">
                        {getErrorMessage('digitalAssetDetails.financials.revenueBreakdown.totalPercentageError')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Monetization Details */}
          <div className="col-span-full">
            <label htmlFor="monetizationDetails" className="block text-sm font-medium text-gray-700 mb-1">
              Monetization Details <span className="text-red-500">*</span>
              <Tooltip content="Detailed explanation of how the digital asset generates revenue">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <textarea
              id="monetizationDetails"
              rows={3}
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.financials?.monetizationDetails && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="Describe how revenue is generated and any monetization strategies used"
              {...register("digitalAssetDetails.financials.monetizationDetails")}
            />
            {getErrorMessage('digitalAssetDetails.financials.monetizationDetails') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.financials.monetizationDetails')}
              </p>
            )}
          </div>
          
          {/* Asking Price */}
          <div className="col-span-1">
            <label htmlFor="askingPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Asking Price <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
              <input
                id="askingPrice"
                type="number"
                min="0"
                className={cn(
                  "w-full pl-8 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                  errors.digitalAssetDetails?.sale?.askingPrice?.value && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                placeholder="Sale price"
                {...register("digitalAssetDetails.sale.askingPrice.value", {
                  valueAsNumber: true
                })}
              />
            </div>
            {getErrorMessage('digitalAssetDetails.sale.askingPrice.value') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.sale.askingPrice.value')}
              </p>
            )}
          </div>
          
          {/* Price Multiple */}
          <div className="col-span-1">
            <label htmlFor="priceMultiple" className="block text-sm font-medium text-gray-700 mb-1">
              Price Multiple
              <Tooltip content="Multiple of monthly/annual revenue or profit">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <div className="relative mt-1">
              <input
                id="priceMultiple"
                type="number"
                min="0"
                step="0.1"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., 24 (months)"
                {...register("digitalAssetDetails.sale.priceMultiple", {
                  valueAsNumber: true
                })}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500">× revenue</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Optional - typical range is 24-36× monthly revenue</p>
          </div>
          
          {/* Reason for Selling */}
          <div className="col-span-full">
            <label htmlFor="reasonForSelling" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Selling <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reasonForSelling"
              rows={3}
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.sale?.reasonForSelling && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="Explain why you are selling this digital asset"
              {...register("digitalAssetDetails.sale.reasonForSelling")}
            />
            {getErrorMessage('digitalAssetDetails.sale.reasonForSelling') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.sale.reasonForSelling')}
              </p>
            )}
          </div>
          
          {/* Assets Included */}
          <div className="col-span-full">
            <label htmlFor="assetsIncluded" className="block text-sm font-medium text-gray-700 mb-1">
              Assets Included <span className="text-red-500">*</span>
              <Tooltip content="List all assets included in the sale">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <textarea
              id="assetsIncluded"
              rows={3}
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.sale?.assetsIncluded && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="List all assets included (e.g., domain, content, social media accounts, email list, etc.)"
              {...register("digitalAssetDetails.sale.assetsIncluded")}
            />
            {getErrorMessage('digitalAssetDetails.sale.assetsIncluded') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.sale.assetsIncluded')}
              </p>
            )}
          </div>
          
          {/* Training & Support */}
          <div className="col-span-full">
            <label htmlFor="trainingSupport" className="block text-sm font-medium text-gray-700 mb-1">
              Training & Support <span className="text-red-500">*</span>
              <Tooltip content="What training and support will you provide to the buyer?">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <textarea
              id="trainingSupport"
              rows={3}
              className={cn(
                "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                errors.digitalAssetDetails?.sale?.trainingSupport && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="Describe the training and support you will provide to the buyer"
              {...register("digitalAssetDetails.sale.trainingSupport")}
            />
            {getErrorMessage('digitalAssetDetails.sale.trainingSupport') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.sale.trainingSupport')}
              </p>
            )}
          </div>
          
          {/* Transition Period */}
          <div className="col-span-1">
            <label htmlFor="transitionPeriod" className="block text-sm font-medium text-gray-700 mb-1">
              Transition Period (Months) <span className="text-red-500">*</span>
              <Tooltip content="How long you'll assist with the transition to new ownership">
                <HelpCircle className="h-4 w-4 text-gray-400 inline ml-1" />
              </Tooltip>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock3 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="transitionPeriod"
                type="number"
                min="0"
                max="12"
                className={cn(
                  "w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                  errors.digitalAssetDetails?.sale?.transitionPeriod && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                placeholder="e.g., 1-3"
                {...register("digitalAssetDetails.sale.transitionPeriod", {
                  valueAsNumber: true
                })}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500">months</span>
              </div>
            </div>
            {getErrorMessage('digitalAssetDetails.sale.transitionPeriod') && (
              <p className="mt-1 text-sm text-red-600">
                {getErrorMessage('digitalAssetDetails.sale.transitionPeriod')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalAssetForm;