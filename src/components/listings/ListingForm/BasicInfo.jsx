import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
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
  Mail,
  Phone,
  MapPin,
  Building,
  Check
} from 'lucide-react';
import { ListingType, ListingStatus, ListingPlan } from '@/types/listings';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import ToastManager, { TOAST_IDS } from "@/utils/ToastManager";
import IndustryClassifications from './IndustryClassifications';
import FormField, { FormSection, FormRow } from '@/components/ui/FormField';
import ErrorBanner from '@/components/ui/ErrorBanner';

// Tooltip component
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

export default function BasicInfo() {
  const { register, formState: { errors }, watch, setValue, clearErrors, trigger } = useFormContext();

  // State for dropdowns
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  
  // Add this constant near the top of your component
  const INDIA_OPTION = { value: 'IN', label: 'India' };

  // Watch values for location
  const selectedCountry = watch('location.country');
  const selectedState = watch('location.state');
  const selectedCity = watch('location.city');

  // Watch values for type
  const selectedType = watch('type');

  // Load countries on component mount
  useEffect(() => {
    const countryList = Country.getAllCountries().map(country => ({
      value: country.isoCode,
      label: country.name
    }));
    setCountries(countryList);
    
    // Default to India if no country is selected
    if (!selectedCountry) {
      setValue('location.country', 'IN');
      setValue('location.countryName', 'India');
    }
  }, []); 

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
  const findSelectedCountry = () => countries.find(country => country.value === selectedCountry) || INDIA_OPTION;
  const findSelectedState = () => states.find(state => state.value === selectedState) || null;
  const findSelectedCity = () => cities.find(city => city.value === selectedCity || city.label === selectedCity) || null;

  // Custom styles for react-select
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      fontSize: '0.875rem',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#0031ac' : errors.location?.country ? '#fca5a5' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 1px #0031ac' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#0031ac' : '#9CA3AF'
      },
      backgroundColor: 'white'
    }),
    option: (base, state) => ({
      ...base,
      padding: '8px 12px',
      paddingLeft: '44px',
      fontSize: '0.875rem',
      backgroundColor: state.isSelected ? '#0031ac' : state.isFocused ? '#E6EEFF' : 'white',
      color: state.isSelected ? 'white' : '#333333'
    }),
    placeholder: base => ({
      ...base,
      fontSize: '0.875rem',
      marginLeft: '32px',
      color: '#6B7280'
    }),
    singleValue: base => ({
      ...base,
      fontSize: '0.875rem',
      marginLeft: '32px'
    }),
    valueContainer: base => ({
      ...base,
      padding: '2px 12px'
    }),
    input: base => ({
      ...base,
      margin: '0',
      paddingTop: '2px',
      paddingBottom: '2px',
      marginLeft: '32px'
    }),
    menuPortal: base => ({
      ...base,
      zIndex: 9999,
      backgroundColor: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '0.375rem'
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
      description: 'Franchise opportunities for entrepreneurs looking to join established brands.',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      value: ListingType.STARTUP,
      label: 'Startup',
      icon: <FlaskConical className="h-5 w-5" />,
      description: 'Early-stage companies seeking investment or acquisition.',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    {
      value: ListingType.INVESTOR,
      label: 'Investor',
      icon: <Users className="h-5 w-5" />,
      description: 'Investor profiles looking for business opportunities.',
      color: 'bg-amber-50 border-amber-200 text-amber-700'
    },
    {
      value: ListingType.DIGITAL_ASSET,
      label: 'Digital Asset',
      icon: <Globe className="h-5 w-5" />,
      description: 'Websites, apps, domains and other digital assets for sale.',
      color: 'bg-red-50 border-red-200 text-red-700'
    }
  ];

  return (
    <div className="space-y-5">
      {/* Info Alert Message */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Basic Information</p>
          <p>
            Provide basic details about your listing. The information you provide here will be used to categorize
            and display your listing to potential buyers or investors. Fields marked with an asterisk (*) are required.
          </p>
        </div>
      </div>

      {/* Listing Type Section */}
      <FormSection 
        title="Listing Type" 
        description="Select the type of listing you want to create. This will determine the specific details we'll collect."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {typeOptions.map((type) => (
            <div
              key={type.value}
              className={cn(
                'border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md relative',
                selectedType === type.value
                  ? 'border-[#0031ac] bg-blue-50 ring-1 ring-[#0031ac]'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              onClick={() => setValue('type', type.value)}
            >
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-2', type.color.split(' ')[0])}>
                    {type.icon}
                  </div>
              <h3 className="font-medium text-gray-900">{type.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{type.description}</p>
              
                  {selectedType === type.value && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-[#0031ac] rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
        {errors.type && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            {errors.type.message}
          </p>
        )}
      </FormSection>

      {/* Basic Details Section */}
      <FormSection 
        title="Basic Details" 
        description="Enter key information about your listing"
      >
        <FormRow>
          <FormField
            name="name"
            label="Listing Title"
            placeholder="Enter a descriptive title"
            required={true}
            tooltip="A clear, concise title helps your listing stand out"
            icon={<Building className="h-5 w-5 text-gray-400" />}
          />
        </FormRow>
        
        <FormField
          name="description"
          label="Description"
          type="textarea"
          placeholder="Provide a detailed description of your listing"
          required={true}
          tooltip="A comprehensive description increases interest in your listing"
        />
      </FormSection>

      {/* Industry Classification */}
      <FormSection 
        title="Industry Classification" 
        description="Select the industry and categories that best describe your listing"
      >
      <IndustryClassifications />
      </FormSection>

      {/* Location Section */}
      <FormSection 
        title="Location Information" 
        description="Specify where your business, franchise, or opportunity is located"
      >
        <FormRow>
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-sm font-medium text-gray-800 flex-shrink-0">
                Country <span className="text-red-500">*</span>
          </label>
              <Tooltip content="Select the country where your opportunity is primarily located.">
          <div className="flex items-center">
                  <HelpCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
            </Tooltip>
          </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                <Globe className="h-5 w-5 text-gray-400" />
      </div>
            <Select
              value={findSelectedCountry()}
              onChange={handleCountryChange}
                options={countries}
                placeholder="Select Country"
                className="country-select"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={selectStyles}
              />
              {errors.location?.country && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                {errors.location.country.message}
              </p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-sm font-medium text-gray-800 flex-shrink-0">
              State <span className="text-red-500">*</span>
            </label>
              <Tooltip content="Select the state where your opportunity is primarily located.">
                <div className="flex items-center">
                  <HelpCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              </Tooltip>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
            <Select
              value={findSelectedState()}
              onChange={handleStateChange}
                options={states}
                placeholder="Select State"
                isDisabled={!selectedCountry}
                className="state-select"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={selectStyles}
              />
              {errors.location?.state && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                {errors.location.state.message}
              </p>
              )}
            </div>
          </div>
        </FormRow>

        <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-sm font-medium text-gray-800 flex-shrink-0">
              City <span className="text-red-500">*</span>
            </label>
              <Tooltip content="Select the city where your opportunity is primarily located.">
                <div className="flex items-center">
                  <HelpCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              </Tooltip>
            </div>
            <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
              <Building className="h-5 w-5 text-gray-400" />
              </div>
            <Select
              value={findSelectedCity()}
              onChange={handleCityChange}
                options={cities}
                placeholder="Select City"
                isDisabled={!selectedState}
              className="city-select"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={selectStyles}
              />
              {errors.location?.city && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                {errors.location.city.message}
              </p>
              )}
          </div>
          </div>
      </FormSection>

      {/* Contact Information Section */}
      <FormSection 
        title="Contact Information" 
        description="How potential buyers or investors can reach you"
      >
        <FormRow>
          <FormField
            name="contactInfo.email"
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            required={true}
            tooltip="Your business contact email"
            icon={<Mail className="h-5 w-5 text-gray-400" />}
          />

          <div>
          <FormField
            name="contactInfo.phone"
            label="Phone Number"
            placeholder="Enter your phone number"
            required={true}
            tooltip="Your business contact phone number"
            icon={<Phone className="h-5 w-5 text-gray-400" />}
              registerOptions={{
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]{10,}$/,
                  message: "Please enter a valid phone number with at least 10 digits"
                },
                validate: {
                  validType: (value) => {
                    // Handle both string and number types
                    if (value === undefined || value === null) {
                      return "Phone number is required";
                    }
                    if (typeof value === 'number') {
                      // Convert number to string for validation
                      value = value.toString();
                    }
                    // Then validate that it's numbers only
                    return /^[0-9]+$/.test(value) || "Only numbers are allowed";
                  }
                },
                onBlur: () => trigger("contactInfo.phone")
              }}
            />
          </div>
        </FormRow>
      </FormSection>
    </div>
  );
}

// Add CSS to prevent icon leakage between dropdowns
const styles = `
  /* Base styles for dropdown containers */
  .country-select,
  .state-select,
  .city-select {
    position: relative;
  }

  /* Icon positioning */
  .country-select .absolute,
  .state-select .absolute,
  .city-select .absolute {
    z-index: 20;
  }

  /* Ensure dropdown menu is above other elements */
  .select__menu-portal {
    z-index: 9999 !important;
    background-color: white !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  /* Hide icons from other dropdowns in the menu */
  .select__menu-portal .absolute {
    display: none !important;
  }

  /* Ensure proper padding in dropdown options */
  .select__option {
    position: relative !important;
    padding-left: 44px !important;
    background-color: white !important;
  }

  /* Ensure dropdown has solid background */
  .select__menu {
    background-color: white !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  /* Ensure menu list has solid background */
  .select__menu-list {
    background-color: white !important;
  }

  /* Style focused and selected options */
  .select__option--is-focused {
    background-color: #E6EEFF !important;
  }

  .select__option--is-selected {
    background-color: #0031ac !important;
  }
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);