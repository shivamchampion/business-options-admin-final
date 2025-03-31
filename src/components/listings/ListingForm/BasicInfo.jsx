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
  Globe
} from 'lucide-react';
import { ListingType, ListingStatus, ListingPlan } from '@/types/listings';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import IndustryClassifications from './IndustryClassifications';

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
      minHeight: '42px', // Increased height for more professional look
      fontSize: '0.875rem', // Slightly larger font size
      borderRadius: '0.5rem', // Slightly more rounded corners
      borderColor: state.isFocused ? '#0031ac' : errors.location?.country ? '#fca5a5' : '#D1D5DB',
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
      padding: '8px 12px', // Increased padding
      fontSize: '0.875rem', // Slightly larger font size
      backgroundColor: state.isSelected ? '#0031ac' : state.isFocused ? '#E6EEFF' : null,
      color: state.isSelected ? 'white' : '#333333'
    }),
    placeholder: base => ({
      ...base,
      fontSize: '0.875rem' // Slightly larger font size
    }),
    singleValue: base => ({
      ...base,
      fontSize: '0.875rem' // Slightly larger font size
    }),
    valueContainer: base => ({
      ...base,
      padding: '0 12px' // Increased padding
    }),
    input: base => ({
      ...base,
      margin: '0',
      padding: '0'
    })
  };

  // Type selection cards
  const typeOptions = [
    {
      value: ListingType.BUSINESS,
      label: 'Business',
      icon: <Store className="h-5 w-5" />, // Slightly larger icon
      description: 'Established businesses for sale with proven revenue and operations.',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      value: ListingType.FRANCHISE,
      label: 'Franchise',
      icon: <Briefcase className="h-5 w-5" />, // Slightly larger icon
      description: 'Franchise opportunities with established brands and systems.',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    {
      value: ListingType.STARTUP,
      label: 'Startup',
      icon: <FlaskConical className="h-5 w-5" />, // Slightly larger icon
      description: 'Early-stage ventures seeking investment or partnerships.',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      value: ListingType.INVESTOR,
      label: 'Investor',
      icon: <Users className="h-5 w-5" />, // Slightly larger icon
      description: 'Investors looking to fund businesses, startups, or franchises.',
      color: 'bg-amber-50 border-amber-200 text-amber-700'
    },
    {
      value: ListingType.DIGITAL_ASSET,
      label: 'Digital Asset',
      icon: <Globe className="h-5 w-5" />, // Slightly larger icon
      description: 'Online businesses, websites, apps, or digital properties for sale.',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Info Message */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Basic Information</p>
          <p>
            Start by selecting your listing type and entering essential information.
            All fields marked with an asterisk (*) are required.
          </p>
        </div>
      </div>

      {/* Listing Type */}
      <div className="space-y-3">
        <div className="flex items-center">
          <label className="block text-sm font-semibold text-gray-800 mr-2">
            Listing Type <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Select the type that best describes what you're listing. This determines the specific details you'll need to provide.">
            <HelpCircle className="h-4 w-4 text-gray-500" />
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {typeOptions.map((type) => (
            <div
              key={type.value}
              className={cn(
                "relative border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md",
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
                    "p-2 rounded-full mr-2.5",
                    selectedType === type.value ? type.color : "bg-gray-100"
                  )}>
                    {type.icon}
                  </div>
                  <h3 className="font-semibold text-sm">{type.label}</h3>
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
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
            {errors.type.message}
          </p>
        ) : null}
      </div>

      {/* Listing Name */}
      <div className="space-y-2">
        <div className="flex items-center">
          <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mr-2">
            Listing Name <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Provide a clear, descriptive name for your listing. This is what people will see first.">
            <HelpCircle className="h-4 w-4 text-gray-500" />
          </Tooltip>
        </div>

        <input
          id="name"
          type="text"
          placeholder="e.g. Profitable Coffee Shop in Mumbai"
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
            errors.name ? "border-red-300" : "border-gray-300"
          )}
          {...register("name")}
        />

        {errors.name ? (
          <p className="text-sm text-red-600 flex items-center mt-1">
            <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
            {errors.name.message}
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">
            3-100 characters. Be specific and include key details like location or industry.
          </p>
        )}
      </div>

      {/* Industry Classifications */}
      <IndustryClassifications />

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center">
          <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mr-2">
            Description <span className="text-red-500">*</span>
          </label>
          <Tooltip content="Provide a comprehensive overview of your listing. Be detailed but concise, highlighting key features and benefits.">
            <HelpCircle className="h-4 w-4 text-gray-500" />
          </Tooltip>
        </div>
        <textarea
          id="description"
          rows="5"
          placeholder="Describe your listing in detail..."
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
            errors.description ? "border-red-300" : "border-gray-300"
          )}
          {...register("description")}
        ></textarea>

        {errors.description ? (
          <p className="text-sm text-red-600 flex items-center mt-1">
            <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
            {errors.description.message}
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">
            100-5000 characters. Provide a detailed overview of what you're offering.
          </p>
        )}
      </div>

      {/* Status and Plan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="status" className="block text-sm font-semibold text-gray-800 mr-2">
              Status <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Set the current status of your listing. Draft is only visible to you until you're ready to submit.">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <select
            id="status"
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
              errors.status ? "border-red-300" : "border-gray-300"
            )}
            {...register("status")}
          >
            <option value={ListingStatus.DRAFT}>Draft</option>
            <option value={ListingStatus.PENDING}>Submit for Review</option>
          </select>

          {errors.status && errors.status.message ? (
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {errors.status.message}
            </p>
          ) : null}
        </div>

        {/* Plan */}
        <div className="space-y-2">
          <div className="flex items-center">
            <label htmlFor="plan" className="block text-sm font-semibold text-gray-800 mr-2">
              Plan Type <span className="text-red-500">*</span>
            </label>
            <Tooltip content="Select your subscription plan. Different plans offer different visibility and features.">
              <HelpCircle className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </div>

          <select
            id="plan"
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
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
            <p className="text-sm text-red-600 flex items-center mt-1">
              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {errors.plan.message}
            </p>
          ) : null}
        </div>
      </div>

      {/* Location Information */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-800">Location Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Country */}
          <div className="space-y-2">
            <label htmlFor="location.country" className="block text-sm font-semibold text-gray-800">
              Country <span className="text-red-500">*</span>
            </label>

            <Select
              inputId="location.country"
              options={countries}
              value={findSelectedCountry()}
              onChange={handleCountryChange}
              placeholder="Select country"
              styles={selectStyles}
              className={cn(
                errors.location?.country ? "select-error" : ""
              )}
            />

            {errors.location?.country && errors.location?.country.message ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
            <label htmlFor="location.state" className="block text-sm font-semibold text-gray-800">
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
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
            <label htmlFor="location.city" className="block text-sm font-semibold text-gray-800">
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
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="location.address" className="block text-sm font-semibold text-gray-800">
              Address (Optional)
            </label>

            <input
              id="location.address"
              type="text"
              placeholder="e.g. 123 Main Street"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("location.address")}
            />

            <p className="text-xs text-gray-500 mt-1">
              This will not be displayed publicly for privacy reasons.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="location.pincode" className="block text-sm font-semibold text-gray-800">
              Pincode (Optional)
            </label>

            <input
              id="location.pincode"
              type="text"
              placeholder="e.g. 400001"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("location.pincode")}
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-800">Contact Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="contactInfo.email" className="block text-sm font-semibold text-gray-800">
              Contact Email <span className="text-red-500">*</span>
            </label>

            <input
              id="contactInfo.email"
              type="email"
              placeholder="e.g. contact@example.com"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.contactInfo?.email ? "border-red-300" : "border-gray-300"
              )}
              {...register("contactInfo.email")}
            />

            {errors.contactInfo?.email && errors.contactInfo?.email.message ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.contactInfo.email.message}
              </p>
            ) : null}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="contactInfo.phone" className="block text-sm font-semibold text-gray-800">
              Contact Phone (Optional)
            </label>

            <input
              id="contactInfo.phone"
              type="tel"
              placeholder="e.g. +91 9876543210"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("contactInfo.phone")}
            />
          </div>
        </div>

        {/* Website & Contact Name (optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="contactInfo.website" className="block text-sm font-semibold text-gray-800">
              Website (Optional)
            </label>

            <input
              id="contactInfo.website"
              type="url"
              placeholder="e.g. https://www.example.com"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                errors.contactInfo?.website ? "border-red-300" : "border-gray-300"
              )}
              {...register("contactInfo.website")}
            />

            {errors.contactInfo?.website && errors.contactInfo?.website.message ? (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.contactInfo.website.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="contactInfo.contactName" className="block text-sm font-semibold text-gray-800">
              Contact Person (Optional)
            </label>

            <input
              id="contactInfo.contactName"
              type="text"
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("contactInfo.contactName")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}