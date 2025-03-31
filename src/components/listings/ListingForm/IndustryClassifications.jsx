import React, { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import Select from 'react-select';
import { 
  Info, 
  AlertCircle, 
  HelpCircle, 
  Plus, 
  Trash, 
  ChevronDown, 
  ChevronUp,
  Briefcase,
  Tag,
  Tags
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { getAllIndustries, getCategoriesByIndustry, getSubCategoriesByCategory } from '@/services/industryService';

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

// Industry Classifications Section Component
const IndustryClassifications = () => {
  const { control, register, formState: { errors }, watch, setValue, trigger, getValues } = useFormContext();
  
  // Use fieldArray for classifications
  const { fields, append, remove } = useFieldArray({
    control,
    name: "classifications"
  });
  
  // Track expanded industry sections
  const [expandedSections, setExpandedSections] = useState(fields.map((_, i) => true));
  
  // State for industries data
  const [allIndustries, setAllIndustries] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({}); // industryId -> categories[]
  const [subCategoriesMap, setSubCategoriesMap] = useState({}); // categoryId -> subCategories[]
  const [loadingIndustries, setLoadingIndustries] = useState(false);

  // Watch the classifications array to keep track of selected industries
  const classifications = watch('classifications') || [];

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
    const loadIndustries = async () => {
      try {
        setLoadingIndustries(true);
        const industriesData = await getAllIndustries();
        
        if (industriesData.length === 0) {
          console.warn('No industries found in the database. Check your Firestore permissions and data.');
        }
        
        setAllIndustries(industriesData);
      } catch (error) {
        console.error('Error loading industries:', error);
        toast.error('Failed to load industries. Please refresh the page or contact support.');
      } finally {
        setLoadingIndustries(false);
      }
    };

    loadIndustries();
  }, []);

  // Load categories for all selected industries
  useEffect(() => {
    const loadAllCategories = async () => {
      const newCategoriesMap = { ...categoriesMap };

      for (const classification of classifications) {
        const industryId = classification.industry;
        if (industryId && !newCategoriesMap[industryId]) {
          try {
            const categoriesData = await getCategoriesByIndustry(industryId);
            if (categoriesData.length === 0) {
              console.warn(`No categories found for industry ${industryId}. You may need to add some categories.`);
            }
            newCategoriesMap[industryId] = categoriesData;
          } catch (error) {
            console.error(`Error loading categories for industry ${industryId}:`, error);
            toast.error(`Failed to load categories for the selected industry. Please try again.`);
          }
        }
      }

      setCategoriesMap(newCategoriesMap);
    };

    if (classifications.length > 0) {
      loadAllCategories();
    }
  }, [classifications.map(c => c.industry).join(',')]);

  // Load subcategories for all selected categories
  useEffect(() => {
    const loadAllSubCategories = async () => {
      const newSubCategoriesMap = { ...subCategoriesMap };

      for (const classification of classifications) {
        const categoryId = classification.category;
        if (categoryId && !newSubCategoriesMap[categoryId]) {
          try {
            const subCategoriesData = await getSubCategoriesByCategory(categoryId);
            if (subCategoriesData.length === 0) {
              console.warn(`No subcategories found for category ${categoryId}. You may need to add some subcategories.`);
            }
            newSubCategoriesMap[categoryId] = subCategoriesData;
          } catch (error) {
            console.error(`Error loading subcategories for category ${categoryId}:`, error);
            toast.error(`Failed to load subcategories for the selected category. Please try again.`);
          }
        }
      }

      setSubCategoriesMap(newSubCategoriesMap);
    };

    if (classifications.length > 0) {
      loadAllSubCategories();
    }
  }, [classifications.map(c => c.category).join(',')]);

  // Add validation effect for classifications
  useEffect(() => {
    if (fields.length > 0) {
      fields.forEach((field, index) => {
        const industry = watch(`classifications.${index}.industry`);
        const category = watch(`classifications.${index}.category`);
        const subCategories = watch(`classifications.${index}.subCategories`) || [];

        if (industry) {
          trigger(`classifications.${index}.industry`);

          if (category) {
            trigger(`classifications.${index}.category`);

            if (subCategories.length > 0) {
              trigger(`classifications.${index}.subCategories`);
            }
          }
        }
      });
    }
  }, [fields, trigger, watch]);

  // Handle industry selection
  const handleIndustryChange = (option, index) => {
    // Update industry and clear category and subcategories
    setValue(`classifications.${index}.industry`, option?.value || '');
    setValue(`classifications.${index}.industryName`, option?.label || '');
    setValue(`classifications.${index}.category`, '');
    setValue(`classifications.${index}.categoryName`, '');
    setValue(`classifications.${index}.subCategories`, []);
    setValue(`classifications.${index}.subCategoryNames`, []);

    trigger(`classifications.${index}.industry`);
  };

  // Handle category selection
  const handleCategoryChange = (option, index) => {
    // Update category and clear subcategories
    setValue(`classifications.${index}.category`, option?.value || '');
    setValue(`classifications.${index}.categoryName`, option?.label || '');
    setValue(`classifications.${index}.subCategories`, []);
    setValue(`classifications.${index}.subCategoryNames`, []);

    trigger(`classifications.${index}.category`);
  };

  // Handle subcategory selection
  const handleSubCategoryToggle = (subCategoryId, subCategoryName, index) => {
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
        toast.error('You can select up to 3 subcategories');
      }
    }

    trigger(`classifications.${index}.subCategories`);
  };

  // Add new industry classification
  const addClassification = () => {
    if (classifications.length >= 3) {
      toast.error('You can select up to 3 industries');
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
    setExpandedSections([...expandedSections, true]);
  };

  // Remove an industry classification
  const removeClassification = (index) => {
    remove(index);

    // Update expanded sections
    setExpandedSections(prev => {
      const newState = [...prev];
      newState.splice(index, 1);
      return newState;
    });
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '36px',
      borderRadius: '0.375rem',
      borderColor: state.isFocused ? '#0031ac' : errors.classifications?.[state.selectProps.fieldIndex]?.industry ? '#fca5a5' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 1px #0031ac' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#0031ac' : '#9CA3AF'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#0031ac' : state.isFocused ? '#E6EEFF' : null,
      color: state.isSelected ? 'white' : '#333333',
      fontSize: '0.8125rem'
    }),
    // Add menuPortal to make dropdown float above other elements
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    menu: base => ({ ...base, zIndex: 9999 }),
    placeholder: base => ({
      ...base,
      fontSize: '0.8125rem'
    }),
    singleValue: base => ({
      ...base,
      fontSize: '0.8125rem'
    }),
    valueContainer: base => ({
      ...base,
      padding: '0 8px'
    }),
    input: base => ({
      ...base,
      margin: '0',
      padding: '0'
    })
  };

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
                        placeholder={loadingIndustries ? "Loading industries..." : "Select an industry"}
                        styles={selectStyles}
                        isSearchable
                        isLoading={loadingIndustries}
                        fieldIndex={index}
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
                          placeholder={!categoriesMap[watch(`classifications.${index}.industry`)] ? "Loading..." : "Select category"}
                          styles={selectStyles}
                          isSearchable
                          isLoading={!categoriesMap[watch(`classifications.${index}.industry`)]}
                          fieldIndex={index}
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

                        {!subCategoriesMap[watch(`classifications.${index}.category`)] ? (
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