// src/components/listings/ListingForm/BasicInfo.jsx
import React, { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';
import {
  Info,
  AlertCircle,
  HelpCircle,
  Store,
  Briefcase,
  FlaskConical,
  Users,
  Globe,
  Plus,
  Trash,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ListingType, ListingStatus, ListingPlan } from '@/types/listings';
import {
  getAllIndustries,
  getSubCategoriesByCategory,
  getCategoriesByIndustry
} from '@/services/industryService';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

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
  const { control, register, formState: { errors }, watch, setValue, clearErrors, trigger } = useFormContext();

  // Use fieldArray for classifications
  const { fields, append, remove } = useFieldArray({
    control,
    name: "classifications"
  });

  // Track expanded industry sections
  const [expandedSections, setExpandedSections] = useState(fields.map((_, i) => true));

  // State for dropdowns
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  // Add this constant near the top of your component
  const INDIA_OPTION = { value: 'IN', label: 'India' };

  // State for industries data
  const [allIndustries, setAllIndustries] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({}); // industryId -> categories[]
  const [subCategoriesMap, setSubCategoriesMap] = useState({}); // categoryId -> subCategories[]
  const [loadingIndustries, setLoadingIndustries] = useState(false);

  // Watch values for location
  const selectedCountry = watch('location.country');
  const selectedState = watch('location.state');
  const selectedCity = watch('location.city');

  // Watch values for type
  const selectedType = watch('type');

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

  // Load countries on component mount
  useEffect(() => {
    const countryList = Country.getAllCountries().map(country => ({
      value: country.isoCode,
      label: country.name
    }));
    setCountries(countryList);
  }, []); // Close this useEffect properly

  // Load states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const stateList = State.getStatesOfCountry(selectedCountry).map(state => ({
        value: state.isoCode,
        label: state.name
      }));
      setStates(stateList);

      // If state is already set, validate it exists in new country
      if (selectedState) {
        const stateExists = stateList.some(state => state.value === selectedState);
        if (!stateExists) {
          setValue('location.state', '');
          setValue('location.stateName', '');
          setValue('location.city', '');
          setValue('location.cityName', '');
        }
      }
    }
  }, [selectedCountry]);

  // Load cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const cityList = City.getCitiesOfState(selectedCountry, selectedState).map(city => ({
        value: city.name,
        label: city.name
      }));
      setCities(cityList);

      // If city is already set, validate it exists in new state
      if (selectedCity) {
        const cityExists = cityList.some(city => city.value === selectedCity);
        if (!cityExists) {
          setValue('location.city', '');
          setValue('location.cityName', '');
        }
      }
    }
  }, [selectedCountry, selectedState]);

  // Fetch all industries on component mount
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        setLoadingIndustries(true);
        const industriesData = await getAllIndustries();
        setAllIndustries(industriesData);
      } catch (error) {
        console.error('Error loading industries:', error);
        toast.error('Failed to load industries');
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
            newCategoriesMap[industryId] = categoriesData;
          } catch (error) {
            console.error(`Error loading categories for industry ${industryId}:`, error);
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
            newSubCategoriesMap[categoryId] = subCategoriesData;
          } catch (error) {
            console.error(`Error loading subcategories for category ${categoryId}:`, error);
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

  // All handler functions should be defined at the component level, not inside useEffect
  const handleCountryChange = (option) => {
    setValue('location.country', option.value);
    setValue('location.countryName', option.label);

    // Reset state and city when country changes
    setValue('location.state', '');
    setValue('location.stateName', '');
    setValue('location.city', '');
    setValue('location.cityName', '');

    trigger('location.country');
  };

  const handleStateChange = (option) => {
    setValue('location.state', option.value);
    setValue('location.stateName', option.label);

    // Reset city when state changes
    setValue('location.city', '');
    setValue('location.cityName', '');

    trigger('location.state');
  };

  const handleCityChange = (option) => {
    setValue('location.city', option.value);
    setValue('location.cityName', option.label);

    trigger('location.city');
  };

  // Find selected options for dropdowns
  const findSelectedCountry = () => countries.find(country => country.value === selectedCountry) || null;
  const findSelectedState = () => states.find(state => state.value === selectedState) || null;
  const findSelectedCity = () => cities.find(city => city.value === selectedCity || city.label === selectedCity) || null;

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

  // Custom styles for react-select
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '40px',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#0031ac' : errors.location?.country ? '#fca5a5' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 1px #0031ac' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#0031ac' : '#9CA3AF'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#0031ac' : state.isFocused ? '#E6EEFF' : null,
      color: state.isSelected ? 'white' : '#333333'
    })
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

      {/* Industry Classifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Industry Classification <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Select up to 3 industries that best describe your listing, along with categories and subcategories.">
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </Tooltip>
        </div>

        {/* Error for classifications array */}
        {errors.classifications && errors.classifications.message && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            {errors.classifications.message}
          </p>
        )}

        {/* Display industry classifications */}
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Section header with toggle and remove */}
              <div
                className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection(index)}
              >
                <div className="flex items-center">
                  <span className="w-6 h-6 flex items-center justify-center bg-[#0031ac] text-white rounded-full mr-2 text-sm">
                    {index + 1}
                  </span>
                  <h3 className="font-medium text-gray-800">
                    {watch(`classifications.${index}.industryName`) || `Industry Classification ${index + 1}`}
                  </h3>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeClassification(index);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 mr-2"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                  {expandedSections[index] ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Section content (collapsible) */}
              {expandedSections[index] && (
                <div className="p-4 space-y-4">
                  {/* Industry Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      placeholder="Select an industry"
                      styles={selectStyles}
                      isSearchable
                      isLoading={loadingIndustries}
                      className={cn(
                        errors.classifications?.[index]?.industry ? "select-error" : ""
                      )}
                    />
                    {errors.classifications?.[index]?.industry && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                        {errors.classifications[index].industry.message}
                      </p>
                    )}
                  </div>

                  {/* Category Select - Only show if industry is selected */}
                  {watch(`classifications.${index}.industry`) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        placeholder="Select a category"
                        styles={selectStyles}
                        isSearchable
                        isLoading={!categoriesMap[watch(`classifications.${index}.industry`)]}
                        className={cn(
                          errors.classifications?.[index]?.category ? "select-error" : ""
                        )}
                      />
                      {errors.classifications?.[index]?.category && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                          {errors.classifications[index].category.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Subcategory Selection - Only show if category is selected */}
                  {watch(`classifications.${index}.category`) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subcategories <span className="text-red-500">*</span> (select at least 1, up to 3)
                      </label>

                      {!subCategoriesMap[watch(`classifications.${index}.category`)] ? (
                        <div className="text-sm text-gray-500 flex items-center">
                          <div className="animate-spin mr-1 h-3 w-3 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                          Loading subcategories...
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {(subCategoriesMap[watch(`classifications.${index}.category`)] || []).map((subCategory) => (
                              <div
                                key={subCategory.id}
                                className={cn(
                                  "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                                  watch(`classifications.${index}.subCategories`, []).includes(subCategory.id)
                                    ? "bg-blue-50 border-blue-200"
                                    : "border-gray-200 hover:border-gray-300"
                                )}
                                onClick={() => handleSubCategoryToggle(subCategory.id, subCategory.name, index)}
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded mr-2 flex items-center justify-center",
                                  watch(`classifications.${index}.subCategories`, []).includes(subCategory.id)
                                    ? "bg-[#0031ac]"
                                    : "border border-gray-300"
                                )}>
                                  {watch(`classifications.${index}.subCategories`, []).includes(subCategory.id) && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-sm">{subCategory.name}</span>
                              </div>
                            ))}
                          </div>

                          {(subCategoriesMap[watch(`classifications.${index}.category`)] || []).length === 0 && (
                            <p className="text-sm text-gray-500 py-2">
                              No subcategories available for this category.
                            </p>
                          )}
                        </>
                      )}

                      {errors.classifications?.[index]?.subCategories && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                          {errors.classifications[index].subCategories.message}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        Selected: {watch(`classifications.${index}.subCategories`, []).length}/3
                        {watch(`classifications.${index}.subCategories`, []).length >= 3 && " (Maximum reached)"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add classification button */}
          <Button
            type="button"
            variant="outline"
            onClick={addClassification}
            disabled={fields.length >= 3}
            className="w-full flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Industry Classification {fields.length >= 3 && "(Maximum reached)"}
          </Button>
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

      {/* Location Information */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-800">Location Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Country */}
          <div className="space-y-2">
            <label htmlFor="location.country" className="block text-sm font-medium text-gray-700">
              Country <span className="text-red-500">*</span>
            </label>

            <Select
              inputId="location.country"
              options={countries}
              value={countries.find(country => country.value === selectedCountry) || INDIA_OPTION}
              onChange={handleCountryChange}
              placeholder="Select country"
              styles={selectStyles}
              className={cn(
                errors.location?.country ? "select-error" : ""
              )}
            />

            {errors.location?.country && errors.location?.country.message ? (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                {errors.location.country.message}
              </p>
            ) : null}

            {/* Hidden inputs for form validation */}
            <input
              type="hidden"
              {...register("location.country")}
            />
            <input
              type="hidden"
              {...register("location.countryName")}
            />
          </div>

          {/* State */}
          <div className="space-y-2">
            <label htmlFor="location.state" className="block text-sm font-medium text-gray-700">
              State <span className="text-red-500">*</span>
            </label>

            <Select
              inputId="location.state"
              options={states}
              value={findSelectedState()}
              onChange={handleStateChange}
              placeholder="Select state"
              styles={selectStyles}
              isDisabled={!selectedCountry || states.length === 0}
              className={cn(
                errors.location?.state ? "select-error" : ""
              )}
            />

            {errors.location?.state && errors.location?.state.message ? (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                {errors.location.state.message}
              </p>
            ) : null}

            {/* Hidden inputs for form validation */}
            <input
              type="hidden"
              {...register("location.state")}
            />
            <input
              type="hidden"
              {...register("location.stateName")}
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <label htmlFor="location.city" className="block text-sm font-medium text-gray-700">
              City <span className="text-red-500">*</span>
            </label>

            <Select
              inputId="location.city"
              options={cities}
              value={findSelectedCity()}
              onChange={handleCityChange}
              placeholder="Select city"
              styles={selectStyles}
              isDisabled={!selectedState || cities.length === 0}
              className={cn(
                errors.location?.city ? "select-error" : ""
              )}
            />

            {errors.location?.city && errors.location?.city.message ? (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                {errors.location.city.message}
              </p>
            ) : null}

            {/* Hidden inputs for form validation */}
            <input
              type="hidden"
              {...register("location.city")}
            />
            <input
              type="hidden"
              {...register("location.cityName")}
            />
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