// src/components/listings/ListingForm/BasicInfo.jsx

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Info,
  AlertCircle,
  HelpCircle,
  Store,
  Briefcase,
  FlaskConical,
  Users,
  Globe
} from 'lucide-react';
import { ListingType, ListingStatus, ListingPlan } from '@/types/listings';
import {
  getAllIndustries,
  getSubCategoriesByCategory,
  getCategoriesByIndustry
} from '@/services/industryService';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Tooltip component
const Tooltip = ({ content, children }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute z-10 w-60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transform -translate-x-1/2 left-1/2 bottom-full mb-2 transition-all duration-150">
        <div className="relative bg-gray-800 text-white text-xs rounded p-2 text-center shadow-lg">
          {content}
          <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 translate-y-1 translate-x-0 left-1/2 -ml-1 bottom-0"></div>
        </div>
      </div>
    </div>
  );
};

export default function BasicInfo() {
  const { register, formState: { errors }, watch, setValue, clearErrors, trigger } = useFormContext();

  // State for hierarchical selection
  const [industries, setIndustries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Watch values
  const selectedType = watch('type');
  const selectedIndustry = watch('industry');
  const selectedCategory = watch('category');
  const selectedSubCategories = watch('subCategories') || [];

  // Fetch industries on component mount
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const industriesData = await getAllIndustries();
        setIndustries(industriesData);
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Error loading industries:', error);
        setInitialLoadComplete(true);
      }
    };

    loadIndustries();
  }, []);

  // Fetch categories when industry changes
  useEffect(() => {
    const loadCategories = async () => {
      if (!selectedIndustry) {
        setCategories([]);
        return;
      }

      try {
        setLoadingCategories(true);
        const categoriesData = await getCategoriesByIndustry(selectedIndustry);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (initialLoadComplete && selectedIndustry) {
      loadCategories();
    }
  }, [selectedIndustry, initialLoadComplete]);

  // Fetch subcategories when category changes
  useEffect(() => {
    const loadSubCategories = async () => {
      if (!selectedCategory) {
        setSubCategories([]);
        return;
      }

      try {
        setLoadingSubCategories(true);
        const subCategoriesData = await getSubCategoriesByCategory(selectedCategory);
        setSubCategories(subCategoriesData);
      } catch (error) {
        console.error('Error loading subcategories:', error);
      } finally {
        setLoadingSubCategories(false);
      }
    };

    if (initialLoadComplete && selectedCategory) {
      loadSubCategories();
    }
  }, [selectedCategory, initialLoadComplete]);

  // Add validation effect
useEffect(() => {
  if (initialLoadComplete) {
    // Validate fields when they have values
    if (selectedIndustry) {
      trigger('industry');
      
      if (selectedCategory) {
        trigger('category');
        
        if (selectedSubCategories.length > 0) {
          trigger('subCategories');
        }
      }
    }
  }
}, [initialLoadComplete, selectedIndustry, selectedCategory, selectedSubCategories, trigger]);

  // Handle industry selection
  const handleIndustrySelect = (industryId) => {
    // Only clear category and subcategories if industry is changing
    if (industryId !== selectedIndustry) {
      setValue('industry', industryId, { shouldValidate: true });
      setValue('category', '', { shouldValidate: false });
      setValue('subCategories', [], { shouldValidate: false });

      // If industry is selected, trigger validation for it
      if (industryId) {
        setTimeout(() => trigger('industry'), 100);
      }
    } else if (industryId === '') {
      // If clearing industry, also clear category and subcategories
      setValue('industry', '', { shouldValidate: true });
      setValue('category', '', { shouldValidate: false });
      setValue('subCategories', [], { shouldValidate: false });
    }
  };

// Update category selection handler
const handleCategorySelect = (categoryId) => {
  // Only clear subcategories if category is changing
  if (categoryId !== selectedCategory) {
    setValue('category', categoryId, { shouldValidate: true });
    setValue('subCategories', [], { shouldValidate: false });
    
    // If category is selected, trigger validation for it
    if (categoryId) {
      setTimeout(() => trigger('category'), 100);
    }
  } else if (categoryId === '') {
    // If clearing category, also clear subcategories
    setValue('category', '', { shouldValidate: true });
    setValue('subCategories', [], { shouldValidate: false });
  }
};

// Update subcategory selection handler
const handleSubCategoryToggle = (subCategoryId) => {
  const isSelected = selectedSubCategories.includes(subCategoryId);
  
  if (isSelected) {
    // Remove subcategory
    const newSubcategories = selectedSubCategories.filter(id => id !== subCategoryId);
    setValue('subCategories', newSubcategories, { shouldValidate: true });
    
    // Trigger validation immediately after update
    setTimeout(() => trigger('subCategories'), 100);
  } else if (selectedSubCategories.length < 3) {
    // Add subcategory if less than 3 are selected
    const newSubcategories = [...selectedSubCategories, subCategoryId];
    setValue('subCategories', newSubcategories, { shouldValidate: true });
    
    // Trigger validation immediately after update
    setTimeout(() => trigger('subCategories'), 100);
  }
};

  // Type selection cards
  const typeOptions = [
    {
      value: ListingType.BUSINESS,
      label: 'Business',
      icon: <Store className="h-5 w-5" />,
      description: 'Established businesses for sale with proven revenue and operations.',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      value: ListingType.FRANCHISE,
      label: 'Franchise',
      icon: <Briefcase className="h-5 w-5" />,
      description: 'Franchise opportunities with established brands and systems.',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    {
      value: ListingType.STARTUP,
      label: 'Startup',
      icon: <FlaskConical className="h-5 w-5" />,
      description: 'Early-stage ventures seeking investment or partnerships.',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      value: ListingType.INVESTOR,
      label: 'Investor',
      icon: <Users className="h-5 w-5" />,
      description: 'Investors looking to fund businesses, startups, or franchises.',
      color: 'bg-amber-50 border-amber-200 text-amber-700'
    },
    {
      value: ListingType.DIGITAL_ASSET,
      label: 'Digital Asset',
      icon: <Globe className="h-5 w-5" />,
      description: 'Online businesses, websites, apps, or digital properties for sale.',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Info Message */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Basic Information</p>
          <p>
            Start by selecting your listing type and entering essential information.
            All fields marked with an asterisk (*) are required.
          </p>
        </div>
      </div>

      {/* Listing Type */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Listing Type <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Select the type that best describes what you're listing. This determines the specific details you'll need to provide.">
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {typeOptions.map((type) => (
            <div
              key={type.value}
              className={cn(
                "relative border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                selectedType === type.value
                  ? `${type.color} border-2`
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => {
                setValue('type', type.value, { shouldValidate: true });
                clearErrors('type');
              }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center mb-2">
                  <div className={cn(
                    "p-2 rounded-full mr-2",
                    selectedType === type.value ? type.color : "bg-gray-100"
                  )}>
                    {type.icon}
                  </div>
                  <h3 className="font-medium">{type.label}</h3>
                </div>
                <p className="text-xs text-gray-600 flex-grow">{type.description}</p>

                <div className={cn(
                  "absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-200",
                  selectedType === type.value
                    ? "bg-[#0031ac] border-[#0031ac]"
                    : "border-gray-300"
                )}>
                  {selectedType === type.value && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {errors.type && errors.type.message ? (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            {errors.type.message}
          </p>
        ) : null}
      </div>

      {/* Listing Name */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Listing Name <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Provide a clear, descriptive name for your listing. This is what people will see first.">
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </Tooltip>
        </div>

        <input
          id="name"
          type="text"
          placeholder="e.g. Profitable Coffee Shop in Mumbai"
          className={cn(
            "w-full px-3 py-2 border rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
            errors.name ? "border-red-300" : "border-gray-300"
          )}
          {...register("name")}
        />

        {errors.name ? (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            {errors.name.message}
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            3-100 characters. Be specific and include key details like location or industry.
          </p>
        )}
      </div>

      {/* Industry, Category, and Subcategory Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Industry Classification <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Select the industry, category, and subcategory that best describe your listing. This helps with search and discovery.">
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </Tooltip>
        </div>

        {/* Industry Selection */}
        <div className="space-y-4">
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-600 mb-1">
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              id="industry"
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.industry ? "border-red-300" : "border-gray-300"
              )}
              value={selectedIndustry || ''}
              onChange={(e) => handleIndustrySelect(e.target.value)}
            >
              <option value="">Select an industry</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>

            {errors.industry && errors.industry.message ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                {errors.industry.message}
              </p>
            ) : null}
          </div>

          {/* Category Selection - only show if industry is selected */}
          {selectedIndustry && (
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-600 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.category ? "border-red-300" : "border-gray-300"
                )}
                value={selectedCategory || ''}
                onChange={(e) => handleCategorySelect(e.target.value)}
                disabled={loadingCategories}
                onBlur={() => trigger('category')} // Add this to trigger validation on blur
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {loadingCategories && (
                <div className="mt-1 text-sm text-gray-500 flex items-center">
                  <div className="animate-spin mr-1 h-3 w-3 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                  Loading categories...
                </div>
              )}

              {errors.category && errors.category.message ? (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                  {errors.category.message}
                </p>
              ) : null}
            </div>
          )}

          {/* Subcategory Selection - only show if category is selected */}
          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Subcategories <span className="text-red-500">*</span> (select at least 1, up to 3)
              </label>

              {loadingSubCategories ? (
                <div className="mt-1 text-sm text-gray-500 flex items-center">
                  <div className="animate-spin mr-1 h-3 w-3 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                  Loading subcategories...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {subCategories.map((subCategory) => (
                      <div
                        key={subCategory.id}
                        className={cn(
                          "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                          selectedSubCategories.includes(subCategory.id)
                            ? "bg-blue-50 border-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => handleSubCategoryToggle(subCategory.id)}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded mr-2 flex items-center justify-center",
                          selectedSubCategories.includes(subCategory.id)
                            ? "bg-[#0031ac]"
                            : "border border-gray-300"
                        )}>
                          {selectedSubCategories.includes(subCategory.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm">{subCategory.name}</span>
                      </div>
                    ))}
                  </div>

                  {subCategories.length === 0 && (
                    <p className="text-sm text-gray-500 py-2">
                      No subcategories available for this category.
                    </p>
                  )}
                </>
              )}

              {errors.subCategories && errors.subCategories.message ? (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                  {errors.subCategories.message}
                </p>
              ) : null}

              <p className="text-xs text-gray-500 mt-1">
                Selected: {selectedSubCategories.length}/3 {selectedSubCategories.length >= 3 && "(Maximum reached)"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Provide a comprehensive overview of your listing. Be detailed but concise, highlighting key features and benefits.">
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </Tooltip>
        </div>

        <textarea
          id="description"
          rows="6"
          placeholder="Describe your listing in detail..."
          className={cn(
            "w-full px-3 py-2 border rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
            errors.description ? "border-red-300" : "border-gray-300"
          )}
          {...register("description")}
        ></textarea>

        {errors.description ? (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            {errors.description.message}
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            100-5000 characters. Provide a detailed overview of what you're offering.
          </p>
        )}
      </div>

      {/* Status and Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Set the current status of your listing. Draft is only visible to you until you're ready to submit.">
              <HelpCircle className="h-4 w-4 text-gray-400" />
            </Tooltip>
          </div>

          <select
            id="status"
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.status ? "border-red-300" : "border-gray-300"
            )}
            {...register("status")}
          >
            <option value={ListingStatus.DRAFT}>Draft</option>
            <option value={ListingStatus.PENDING}>Submit for Review</option>
          </select>

          {errors.status && errors.status.message ? (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              {errors.status.message}
            </p>
          ) : null}
        </div>

        {/* Plan */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
              Plan Type <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Select your subscription plan. Different plans offer different visibility and features.">
              <HelpCircle className="h-4 w-4 text-gray-400" />
            </Tooltip>
          </div>

          <select
            id="plan"
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.plan ? "border-red-300" : "border-gray-300"
            )}
            {...register("plan")}
          >
            <option value={ListingPlan.FREE}>Free Plan</option>
            <option value={ListingPlan.BASIC}>Basic Plan</option>
            <option value={ListingPlan.ADVANCED}>Advanced Plan</option>
            <option value={ListingPlan.PREMIUM}>Premium Plan</option>
            <option value={ListingPlan.PLATINUM}>Platinum Plan</option>
          </select>

          {errors.plan && errors.plan.message ? (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              {errors.plan.message}
            </p>
          ) : null}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-800">Location Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* State */}
          <div className="space-y-2">
            <label htmlFor="location.state" className="block text-sm font-medium text-gray-700">
              State <span className="text-red-500">*</span>
            </label>

            <input
              id="location.state"
              type="text"
              placeholder="e.g. Maharashtra"
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.location?.state ? "border-red-300" : "border-gray-300"
              )}
              {...register("location.state")}
            />

            {errors.location?.state && errors.location?.state.message ? (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                {errors.location.state.message}
              </p>
            ) : null}
          </div>

          {/* City */}
          <div className="space-y-2">
            <label htmlFor="location.city" className="block text-sm font-medium text-gray-700">
              City <span className="text-red-500">*</span>
            </label>

            <input
              id="location.city"
              type="text"
              placeholder="e.g. Mumbai"
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.location?.city ? "border-red-300" : "border-gray-300"
              )}
              {...register("location.city")}
            />

            {errors.location?.city && errors.location?.city.message ? (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                {errors.location.city.message}
              </p>
            ) : null}
          </div>
        </div>

        {/* Address & Pincode (optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="location.address" className="block text-sm font-medium text-gray-700">
              Address (Optional)
            </label>

            <input
              id="location.address"
              type="text"
              placeholder="e.g. 123 Main Street"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("location.address")}
            />

            <p className="text-xs text-gray-500">
              This will not be displayed publicly for privacy reasons.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="location.pincode" className="block text-sm font-medium text-gray-700">
              Pincode (Optional)
            </label>

            <input
              id="location.pincode"
              type="text"
              placeholder="e.g. 400001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("location.pincode")}
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-800">Contact Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="contactInfo.email" className="block text-sm font-medium text-gray-700">
              Contact Email <span className="text-red-500">*</span>
            </label>

            <input
              id="contactInfo.email"
              type="email"
              placeholder="e.g. contact@example.com"
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.contactInfo?.email ? "border-red-300" : "border-gray-300"
              )}
              {...register("contactInfo.email")}
            />

            {errors.contactInfo?.email && errors.contactInfo?.email.message ? (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                {errors.contactInfo.email.message}
              </p>
            ) : null}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="contactInfo.phone" className="block text-sm font-medium text-gray-700">
              Contact Phone (Optional)
            </label>

            <input
              id="contactInfo.phone"
              type="tel"
              placeholder="e.g. +91 9876543210"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("contactInfo.phone")}
            />
          </div>
        </div>

        {/* Website & Contact Name (optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="contactInfo.website" className="block text-sm font-medium text-gray-700">
              Website (Optional)
            </label>

            <input
              id="contactInfo.website"
              type="url"
              placeholder="e.g. https://www.example.com"
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.contactInfo?.website ? "border-red-300" : "border-gray-300"
              )}
              {...register("contactInfo.website")}
            />

            {errors.contactInfo?.website && errors.contactInfo?.website.message ? (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                {errors.contactInfo.website.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="contactInfo.contactName" className="block text-sm font-medium text-gray-700">
              Contact Person (Optional)
            </label>

            <input
              id="contactInfo.contactName"
              type="text"
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("contactInfo.contactName")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}