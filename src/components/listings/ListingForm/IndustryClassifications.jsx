import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import Select from 'react-select';
import { 
  AlertCircle, 
  HelpCircle, 
  Plus, 
  Trash, 
  ChevronDown, 
  ChevronUp,
  Briefcase,
  Tags
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { getAllIndustries, getCategoriesByIndustry, getSubCategoriesByCategory } from '@/services/industryService';
import ToastManager, { TOAST_IDS } from "@/utils/ToastManager";

// Tooltip component using span elements to prevent DOM nesting issues
const Tooltip = ({ content, children }) => {
  return (
    <span className="group relative inline-block">
      {children}
      <span className="absolute z-10 w-60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transform -translate-x-1/2 left-1/2 bottom-full mb-2 transition-all duration-150">
        <span className="relative bg-gray-800 text-white text-xs rounded p-2 block text-center shadow-lg">
          {content}
          <span className="absolute w-2 h-2 bg-gray-800 transform rotate-45 translate-y-1 translate-x-0 left-1/2 -ml-1 bottom-0"></span>
        </span>
      </span>
    </span>
  );
};

// Default styles for react-select
const defaultSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    fontSize: '0.875rem',
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#0031ac' : '#D1D5DB',
    boxShadow: state.isFocused ? '0 0 0 1px #0031ac' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#0031ac' : '#9CA3AF'
    }
  }),
  option: (base, state) => ({
    ...base,
    padding: '8px 12px',
    fontSize: '0.875rem',
    backgroundColor: state.isSelected ? '#0031ac' : state.isFocused ? '#E6EEFF' : null,
    color: state.isSelected ? 'white' : '#333333'
  }),
  menuPortal: base => ({ ...base, zIndex: 9999 }),
  menu: base => ({ ...base, zIndex: 9999 }),
  placeholder: base => ({
    ...base,
    fontSize: '0.875rem',
    padding: '2px 0'
  }),
  singleValue: base => ({
    ...base,
    fontSize: '0.875rem',
    padding: '2px 0'
  }),
  valueContainer: base => ({
    ...base,
    padding: '2px 12px'
  }),
  input: base => ({
    ...base,
    margin: '0',
    padding: '2px 0'
  })
};

// Industry Classifications Section Component
const IndustryClassifications = () => {
  const { control, formState: { errors }, watch, setValue, trigger, getValues } = useFormContext();
  
  // Use fieldArray for classifications
  const { fields, append, remove } = useFieldArray({
    control,
    name: "classifications"
  });
  
  // Track expanded industry sections
  const [expandedSections, setExpandedSections] = useState(fields.map(() => true));
  
  // State for industries data
  const [allIndustries, setAllIndustries] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({}); // industryId -> categories[]
  const [subCategoriesMap, setSubCategoriesMap] = useState({}); // categoryId -> subCategories[]
  
  // Loading states
  const [loading, setLoading] = useState({
    industries: false,
    categories: {},  // industryId -> bool
    subcategories: {} // categoryId -> bool
  });

  // Track API requests to avoid hammering the server
  const apiRequestTracker = useMemo(() => ({
    industries: { inProgress: false, lastRequest: null },
    categories: {}, // industryId -> {inProgress, lastRequest}
    subcategories: {} // categoryId -> {inProgress, lastRequest}
  }), []);

  // Watch the classifications array to keep track of selected industries and categories
  const classificationsData = watch('classifications') || [];

  // Toggle expansion of industry section
  const toggleSection = (index) => {
    setExpandedSections(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  // Fetch all industries on component mount
  useEffect(() => {
    const loadIndustries = async (retryCount = 0) => {
      if (apiRequestTracker.industries.inProgress) {
        return;
      }
      
      // Update tracker
      apiRequestTracker.industries.inProgress = true;
      apiRequestTracker.industries.lastRequest = new Date();
      
      try {
        setLoading(prev => ({ ...prev, industries: true }));
        console.log('Loading all industries...');
        
        const industriesData = await getAllIndustries();
        
        if (industriesData && industriesData.length > 0) {
          console.log(`Loaded ${industriesData.length} industries`);
          setAllIndustries(industriesData);
        } else {
          console.warn('No industries found in the database or empty response received');
          
          // Retry logic - up to 3 retries with increasing delays
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`Retrying to load industries after ${delay}ms (attempt ${retryCount + 1}/3)`);
            
            setTimeout(() => {
              apiRequestTracker.industries.inProgress = false;
              loadIndustries(retryCount + 1);
            }, delay);
          } else {
            ToastManager.error('Could not load industry data. Please try again later.', TOAST_IDS.GENERIC_ERROR);
          }
        }
      } catch (error) {
        console.error('Error loading industries:', error);
        
        // Check if error is related to authentication
        const errorMessage = error?.message || '';
        const isAuthError = 
          errorMessage.includes('permission') || 
          errorMessage.includes('auth') || 
          errorMessage.includes('token') ||
          errorMessage.includes('transport errored');
        
        if (isAuthError) {
          // Auth-related errors will be handled by the AuthVerifier at root level
          ToastManager.error('Authentication issue detected. Refreshing connection...', TOAST_IDS.AUTH_ERROR);
          
          // Just display fallback UI and let AuthVerifier handle it
          return;
        }
        
        // For non-auth errors, implement retry
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying to load industries after ${delay}ms (attempt ${retryCount + 1}/3)`);
          
          setTimeout(() => {
            apiRequestTracker.industries.inProgress = false;
            loadIndustries(retryCount + 1);
          }, delay);
        } else {
          ToastManager.error('Failed to load industry data. Please refresh the page.', TOAST_IDS.GENERIC_ERROR);
        }
      } finally {
        setLoading(prev => ({ ...prev, industries: false }));
        apiRequestTracker.industries.inProgress = false;
      }
    };

    loadIndustries();
    
    // Load categories and subcategories for existing selections
    const loadExistingData = async () => {
      const existingData = getValues('classifications') || [];
      
      for (const classification of existingData) {
        if (classification.industry) {
          await loadCategoriesForIndustry(classification.industry);
          
          if (classification.category) {
            await loadSubcategoriesForCategory(classification.category);
          }
        }
      }
    };
    
    loadExistingData();
  }, []);

  // Load categories for a specific industry - memoized for performance
  const loadCategoriesForIndustry = useCallback(async (industryId, retryCount = 0) => {
    // Skip if no industry selected or if request is in progress
    if (!industryId) return;
    
    // Check tracker to avoid duplicate requests
    if (!apiRequestTracker.categories[industryId]) {
      apiRequestTracker.categories[industryId] = { inProgress: false, lastRequest: null };
    }
    
    if (apiRequestTracker.categories[industryId].inProgress) {
      return;
    }
    
    // Check if we already have categories for this industry
    if (categoriesMap[industryId] && categoriesMap[industryId].length > 0) {
      return;
    }
    
    // Update tracker
    apiRequestTracker.categories[industryId].inProgress = true;
    apiRequestTracker.categories[industryId].lastRequest = new Date();
    
    // Update loading state
      setLoading(prev => ({
        ...prev,
      categories: {
        ...prev.categories,
        [industryId]: true
      }
      }));
      
    try {
      console.log(`Loading categories for industry ${industryId}`);
      const categoriesData = await getCategoriesByIndustry(industryId);
      
      if (categoriesData && categoriesData.length > 0) {
        console.log(`Loaded ${categoriesData.length} categories for industry ${industryId}`);
        setCategoriesMap(prev => ({
          ...prev,
          [industryId]: categoriesData
        }));
      } else {
        console.log(`No categories found for industry ${industryId}`);
        
        // Retry logic for categories
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
          console.log(`Retrying to load categories after ${delay}ms (attempt ${retryCount + 1}/2)`);
          
          setTimeout(() => {
            apiRequestTracker.categories[industryId].inProgress = false;
            loadCategoriesForIndustry(industryId, retryCount + 1);
          }, delay);
      } else {
          // After retries, just set empty array
          setCategoriesMap(prev => ({
            ...prev,
            [industryId]: []
          }));
        }
      }
          } catch (error) {
      console.error(`Error loading categories for industry ${industryId}:`, error);
      
      // Check if error is related to authentication
      const errorMessage = error?.message || '';
      const isAuthError = 
        errorMessage.includes('permission') || 
        errorMessage.includes('auth') || 
        errorMessage.includes('token') ||
        errorMessage.includes('transport errored');
      
      if (isAuthError) {
        // Auth errors will be handled by AuthVerifier
        return;
      }
      
      // Retry for non-auth errors
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          apiRequestTracker.categories[industryId].inProgress = false;
          loadCategoriesForIndustry(industryId, retryCount + 1);
        }, delay);
      } else {
        // After retries, just set empty array
        setCategoriesMap(prev => ({
          ...prev,
          [industryId]: []
        }));
      }
    } finally {
      setLoading(prev => ({
        ...prev,
        categories: {
          ...prev.categories,
          [industryId]: false
        }
      }));
        apiRequestTracker.categories[industryId].inProgress = false;
    }
  }, [categoriesMap]);

  // Load subcategories for a specific category - memoized for performance
  const loadSubcategoriesForCategory = useCallback(async (categoryId, retryCount = 0) => {
    // Skip if no category selected or if request is in progress
    if (!categoryId) return;
    
    // Check tracker to avoid duplicate requests
    if (!apiRequestTracker.subcategories[categoryId]) {
      apiRequestTracker.subcategories[categoryId] = { inProgress: false, lastRequest: null };
    }
    
    if (apiRequestTracker.subcategories[categoryId].inProgress) {
      return;
    }
    
    // Check if we already have subcategories for this category
    if (subCategoriesMap[categoryId] && subCategoriesMap[categoryId].length > 0) {
      return;
    }
    
    // Update tracker
    apiRequestTracker.subcategories[categoryId].inProgress = true;
    apiRequestTracker.subcategories[categoryId].lastRequest = new Date();
    
    // Update loading state
      setLoading(prev => ({
        ...prev,
      subcategories: {
        ...prev.subcategories,
        [categoryId]: true
      }
      }));
      
    try {
      console.log(`Loading subcategories for category ${categoryId}`);
      const subcategoriesData = await getSubCategoriesByCategory(categoryId);
      
      if (subcategoriesData && subcategoriesData.length > 0) {
        console.log(`Loaded ${subcategoriesData.length} subcategories for category ${categoryId}`);
        setSubCategoriesMap(prev => ({
          ...prev,
          [categoryId]: subcategoriesData
        }));
      } else {
        console.log(`No subcategories found for category ${categoryId}`);
        
        // Retry logic for subcategories
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
          console.log(`Retrying to load subcategories after ${delay}ms (attempt ${retryCount + 1}/2)`);
          
          setTimeout(() => {
            apiRequestTracker.subcategories[categoryId].inProgress = false;
            loadSubcategoriesForCategory(categoryId, retryCount + 1);
          }, delay);
      } else {
          // After retries, just set empty array
          setSubCategoriesMap(prev => ({
            ...prev,
            [categoryId]: []
          }));
        }
      }
    } catch (error) {
      console.error(`Error loading subcategories for category ${categoryId}:`, error);
      
      // Check if error is related to authentication
      const errorMessage = error?.message || '';
      const isAuthError = 
        errorMessage.includes('permission') || 
        errorMessage.includes('auth') || 
        errorMessage.includes('token') ||
        errorMessage.includes('transport errored');
      
      if (isAuthError) {
        // Auth errors will be handled by AuthVerifier
        return;
      }
      
      // Retry for non-auth errors
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          apiRequestTracker.subcategories[categoryId].inProgress = false;
          loadSubcategoriesForCategory(categoryId, retryCount + 1);
        }, delay);
      } else {
        // After retries, just set empty array
        setSubCategoriesMap(prev => ({
          ...prev,
          [categoryId]: []
        }));
      }
    } finally {
      setLoading(prev => ({
        ...prev,
        subcategories: {
          ...prev.subcategories,
          [categoryId]: false
        }
      }));
        apiRequestTracker.subcategories[categoryId].inProgress = false;
    }
  }, [subCategoriesMap]);

  // Handle industry selection - memoized to avoid recreating function
  const handleIndustryChange = useCallback((option, index) => {
    console.log(`Industry selected: ${option?.label} (${option?.value}) for index ${index}`);
    
    // Update industry and clear category and subcategories
    if (option && option.value) {
      setValue(`classifications.${index}.industry`, option.value);
      setValue(`classifications.${index}.industryName`, option.label);
      
      // Clear dependent fields
      setValue(`classifications.${index}.category`, '');
      setValue(`classifications.${index}.categoryName`, '');
      setValue(`classifications.${index}.subCategories`, []);
      setValue(`classifications.${index}.subCategoryNames`, []);
      
      // Immediately load categories (no timeout needed)
      loadCategoriesForIndustry(option.value);
      
      // Trigger validation
      trigger(`classifications.${index}.industry`);
    } else {
      // If no option selected, clear all fields
      setValue(`classifications.${index}.industry`, '');
      setValue(`classifications.${index}.industryName`, '');
    setValue(`classifications.${index}.category`, '');
    setValue(`classifications.${index}.categoryName`, '');
    setValue(`classifications.${index}.subCategories`, []);
    setValue(`classifications.${index}.subCategoryNames`, []);

    trigger(`classifications.${index}.industry`);
    }
  }, [setValue, trigger, loadCategoriesForIndustry]);

  // Handle category selection - memoized to avoid recreating function
  const handleCategoryChange = useCallback((option, index) => {
    console.log(`Category selected: ${option?.label} (${option?.value}) for index ${index}`);
    
    // Update category and clear subcategories
    if (option && option.value) {
      setValue(`classifications.${index}.category`, option.value);
      setValue(`classifications.${index}.categoryName`, option.label);
      
      // Clear subcategories
      setValue(`classifications.${index}.subCategories`, []);
      setValue(`classifications.${index}.subCategoryNames`, []);
      
      // Immediately load subcategories (no timeout needed)
      loadSubcategoriesForCategory(option.value);
      
      // Trigger validation
      trigger(`classifications.${index}.category`);
    } else {
      // If no option selected, clear dependent fields
      setValue(`classifications.${index}.category`, '');
      setValue(`classifications.${index}.categoryName`, '');
    setValue(`classifications.${index}.subCategories`, []);
    setValue(`classifications.${index}.subCategoryNames`, []);

    trigger(`classifications.${index}.category`);
    }
  }, [setValue, trigger, loadSubcategoriesForCategory]);

  // Handle subcategory selection
  const handleSubCategoryToggle = useCallback((subCategoryId, subCategoryName, index) => {
    const currentSubCategories = watch(`classifications.${index}.subCategories`) || [];
    const currentSubCategoryNames = watch(`classifications.${index}.subCategoryNames`) || [];

    const isSelected = currentSubCategories.includes(subCategoryId);

    if (isSelected) {
      // Remove subcategory
      const newSubCategories = currentSubCategories.filter(id => id !== subCategoryId);
      const newSubCategoryNames = currentSubCategoryNames.filter((_, i) =>
        currentSubCategories[i] !== subCategoryId
      );

      setValue(`classifications.${index}.subCategories`, newSubCategories);
      setValue(`classifications.${index}.subCategoryNames`, newSubCategoryNames);
    } else {
      // Add subcategory if less than 3 are selected
      if (currentSubCategories.length < 3) {
        setValue(`classifications.${index}.subCategories`, [...currentSubCategories, subCategoryId]);
        setValue(`classifications.${index}.subCategoryNames`, [...currentSubCategoryNames, subCategoryName]);
      } else {
        ToastManager.error('You can select up to 3 subcategories', TOAST_IDS.GENERIC_ERROR);
      }
    }

    trigger(`classifications.${index}.subCategories`);
  }, [watch, setValue, trigger]);

  // Add new industry classification
  const addClassification = useCallback(() => {
    if (fields.length >= 3) {
      ToastManager.error('You can select up to 3 industries', TOAST_IDS.GENERIC_ERROR);
      return;
    }

    append({
      industry: '',
      industryName: '',
      category: '',
      categoryName: '',
      subCategories: [],
      subCategoryNames: []
    });

    // Expand the newly added section
    setExpandedSections(prev => [...prev, true]);
  }, [append, fields.length]);

  // Remove an industry classification
  const removeClassification = useCallback((index) => {
    remove(index);

    // Update expanded sections
    setExpandedSections(prev => {
      const newState = [...prev];
      newState.splice(index, 1);
      return newState;
    });
  }, [remove]);

  // Custom styles for react-select with error handling
  const getSelectStyles = useCallback((index, fieldName) => {
    return {
      ...defaultSelectStyles,
    control: (base, state) => ({
        ...defaultSelectStyles.control(base, state),
        borderColor: state.isFocused 
          ? '#0031ac' 
          : errors.classifications?.[index]?.[fieldName] 
            ? '#fca5a5' 
            : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 1px #0031ac' : 'none',
      })
    };
  }, [errors.classifications]);

  // Check if we have any array-level validation errors
  const hasArrayValidationError = errors.classifications && typeof errors.classifications.message === 'string';

  return (
    <div className="space-y-3">
      {/* Header area with title and Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Tags className="h-4 w-4 text-[#0031ac]" />
          <label className="block text-sm font-semibold text-gray-800">
            Industry Classification <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Select up to 3 industries that best describe your listing">
            <HelpCircle className="h-4 w-4 text-gray-500" />
          </Tooltip>
        </div>
        
        {/* Add button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addClassification}
          disabled={fields.length >= 3}
          className={cn(
            "h-8 text-sm border-[#0031ac] text-[#0031ac] hover:bg-blue-50",
            fields.length >= 3 ? "opacity-50 cursor-not-allowed" : ""
          )}
        >
          <div className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Industry
          </div>
        </Button>
      </div>
      
      {/* Error for classifications array */}
      {hasArrayValidationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-xs text-red-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
            {errors.classifications.message}
          </p>
        </div>
      )}

      {/* Display industry classifications */}
      <div className="space-y-3">
        {fields.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="mx-auto h-10 w-10 flex items-center justify-center rounded-full bg-blue-100">
              <Briefcase className="h-5 w-5 text-blue-700" />
            </div>
            <h3 className="mt-3 text-xs font-medium text-gray-900">No industry classifications added</h3>
            <p className="mt-1 text-xs text-gray-500">
              Add at least one industry classification to continue.
            </p>
          </div>
        ) : (
          fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Section header with toggle and remove */}
              <div
                className={cn(
                  "px-3 py-2 flex items-center justify-between cursor-pointer", 
                  watch(`classifications.${index}.industry`) ? "bg-blue-50 border-b border-blue-100" : "bg-gray-50 border-b border-gray-200"
                )}
                onClick={() => toggleSection(index)}
              >
                <div className="flex items-center">
                  <span className="w-5 h-5 flex items-center justify-center bg-[#0031ac] text-white rounded-full mr-2 text-xs">
                    {index + 1}
                  </span>
                  <h3 className="text-xs font-medium text-gray-800">
                    {watch(`classifications.${index}.industryName`) || `Industry Classification ${index + 1}`}
                    {watch(`classifications.${index}.categoryName`) && (
                      <span className="text-gray-500 ml-1 font-normal">
                        {" › "}{watch(`classifications.${index}.categoryName`)}
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeClassification(index);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Remove classification"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                  {expandedSections[index] ? (
                    <ChevronUp className="h-4 w-4 text-gray-400 ml-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
                  )}
                </div>
              </div>

              {/* Section content (collapsible) */}
              {expandedSections[index] && (
                <div className="p-3 bg-white">
                  {/* Responsive layout container - stacked on mobile, grid on tablets and larger */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Industry Select - takes more space */}
                    <div className="md:col-span-5">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Industry <span className="text-red-500">*</span>
                      </label>
                      <Select
                        options={allIndustries.map(industry => ({
                          value: industry.id,
                          label: industry.name
                        }))}
                        value={
                          watch(`classifications.${index}.industry`)
                            ? {
                              value: watch(`classifications.${index}.industry`),
                              label: watch(`classifications.${index}.industryName`)
                            }
                            : null
                        }
                        onChange={(option) => handleIndustryChange(option, index)}
                        placeholder={loading.industries ? "Loading industries..." : "Select an industry"}
                        styles={getSelectStyles(index, 'industry')}
                        isSearchable
                        isLoading={loading.industries}
                        menuPortalTarget={document.body}
                        menuPosition={'fixed'}
                        className={cn(
                          errors.classifications?.[index]?.industry ? "select-error" : ""
                        )}
                        noOptionsMessage={() => allIndustries.length === 0 ? "No industries found" : "No matches found"}
                      />
                      {errors.classifications?.[index]?.industry && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                          {errors.classifications[index].industry.message}
                        </p>
                      )}
                    </div>

                    {/* Category Select */}
                    {watch(`classifications.${index}.industry`) && (
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <Select
                          options={
                            (categoriesMap[watch(`classifications.${index}.industry`)] || [])
                              .map(category => ({
                                value: category.id,
                                label: category.name
                              }))
                          }
                          value={
                            watch(`classifications.${index}.category`)
                              ? {
                                value: watch(`classifications.${index}.category`),
                                label: watch(`classifications.${index}.categoryName`)
                              }
                              : null
                          }
                          onChange={(option) => handleCategoryChange(option, index)}
                          placeholder={loading.categories[watch(`classifications.${index}.industry`)] 
                            ? "Loading categories..." 
                            : "Select category"}
                          styles={getSelectStyles(index, 'category')}
                          isSearchable
                          isLoading={loading.categories[watch(`classifications.${index}.industry`)]}
                          menuPortalTarget={document.body}
                          menuPosition={'fixed'}
                          className={cn(
                            errors.classifications?.[index]?.category ? "select-error" : ""
                          )}
                          noOptionsMessage={() => "No categories found"}
                        />
                        {errors.classifications?.[index]?.category && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                            {errors.classifications[index].category.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Subcategory Selection */}
                    {watch(`classifications.${index}.category`) && (
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Subcategories <span className="text-red-500">*</span> (1-3)
                        </label>

                        {loading.subcategories[watch(`classifications.${index}.category`)] ? (
                          <div className="text-xs text-gray-500 flex items-center p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="animate-spin mr-2 h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            Loading subcategories...
                          </div>
                        ) : (
                          <>
                            {(subCategoriesMap[watch(`classifications.${index}.category`)] || []).length === 0 ? (
                              <div className="text-xs text-amber-600 p-2 bg-amber-50 rounded border border-amber-200 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                                No subcategories found
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1 bg-gray-50 p-1.5 rounded-md border border-gray-200">
                                {(subCategoriesMap[watch(`classifications.${index}.category`)] || []).map((subCategory) => (
                                  <div
                                    key={subCategory.id}
                                    className={cn(
                                      "flex items-center px-1.5 py-0.5 text-[10px] rounded cursor-pointer transition-colors",
                                      watch(`classifications.${index}.subCategories`, []).includes(subCategory.id)
                                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                                        : "bg-white border border-gray-300 hover:bg-gray-100"
                                    )}
                                    onClick={() => handleSubCategoryToggle(subCategory.id, subCategory.name, index)}
                                  >
                                    {watch(`classifications.${index}.subCategories`, []).includes(subCategory.id) && (
                                      <svg className="w-2.5 h-2.5 text-blue-600 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                    <span>{subCategory.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {errors.classifications?.[index]?.subCategories && (
                              <p className="mt-1 text-xs text-red-600 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-0.5 flex-shrink-0" />
                                {errors.classifications[index].subCategories.message}
                              </p>
                            )}

                            <p className="text-[10px] text-gray-500 mt-1 flex items-center">
                              Selected: {watch(`classifications.${index}.subCategories`, []).length}/3
                              {watch(`classifications.${index}.subCategories`, []).length >= 3 && (
                                <span className="text-amber-600 ml-1">(Max)</span>
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IndustryClassifications;