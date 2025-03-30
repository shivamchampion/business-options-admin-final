import React, { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Info, 
  HelpCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { ListingType } from '@/types/listings';
import { cn } from '@/lib/utils';

// Import type-specific forms
import BusinessForm from '../business/BusinessForm';
import FranchiseForm from '../franchise/FranchiseForm';
import StartupForm from '../startup/StartupForm';
import InvestorForm from '../investor/InvestorForm';
import DigitalAssetForm from '../digital-asset/DigitalAssetForm';

// Animation variants
const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

// Tooltip component (reused from BasicInfo for consistency)
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

const ListingDetails = () => {
  const { control, formState: { errors } } = useFormContext();
  const [isLoading, setIsLoading] = useState(false);
  const [prevType, setPrevType] = useState(null);
  const [expandedErrors, setExpandedErrors] = useState(false);
  
  // Watch the listing type to render the appropriate form
  const listingType = useWatch({
    control,
    name: 'type',
    defaultValue: ListingType.BUSINESS
  });

  // Show loading state when switching between types
  useEffect(() => {
    if (prevType && prevType !== listingType) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
    setPrevType(listingType);
  }, [listingType, prevType]);

  // Type-specific instructions
  const getTypeInstructions = () => {
    switch (listingType) {
      case ListingType.BUSINESS:
        return "Please provide details about your business, including operations, financials, and sale information.";
      case ListingType.FRANCHISE:
        return "Please provide details about your franchise opportunity, including investment requirements, support, and performance metrics.";
      case ListingType.STARTUP:
        return "Please provide details about your startup, including team information, market traction, and funding requirements.";
      case ListingType.INVESTOR:
        return "Please provide details about your investment profile, including your investment focus, capacity, and process.";
      case ListingType.DIGITAL_ASSET:
        return "Please provide details about your digital asset, including technical information, traffic data, and sale requirements.";
      default:
        return "Please select a listing type and provide the required details.";
    }
  };

  // Function to get type-specific form title
  const getTypeTitle = () => {
    switch (listingType) {
      case ListingType.BUSINESS:
        return "Business Details";
      case ListingType.FRANCHISE:
        return "Franchise Opportunity Details";
      case ListingType.STARTUP:
        return "Startup Details";
      case ListingType.INVESTOR:
        return "Investor Profile Details";
      case ListingType.DIGITAL_ASSET:
        return "Digital Asset Details";
      default:
        return "Listing Details";
    }
  };

  // Render form based on listing type
  const renderForm = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (listingType) {
      case ListingType.BUSINESS:
        return <BusinessForm />;
      case ListingType.FRANCHISE:
        return <FranchiseForm />;
      case ListingType.STARTUP:
        return <StartupForm />;
      case ListingType.INVESTOR:
        return <InvestorForm />;
      case ListingType.DIGITAL_ASSET:
        return <DigitalAssetForm />;
      default:
        return (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="text-red-500 flex items-center text-sm">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Invalid listing type selected. Please go back and select a valid type.
            </div>
          </div>
        );
    }
  };

  // Check for errors in this step
  const hasTypeErrors = () => {
    const errorKeys = Object.keys(errors);
    
    switch (listingType) {
      case ListingType.BUSINESS:
        return errorKeys.some(key => key.startsWith('businessDetails'));
      case ListingType.FRANCHISE:
        return errorKeys.some(key => key.startsWith('franchiseDetails'));
      case ListingType.STARTUP:
        return errorKeys.some(key => key.startsWith('startupDetails'));
      case ListingType.INVESTOR:
        return errorKeys.some(key => key.startsWith('investorDetails'));
      case ListingType.DIGITAL_ASSET:
        return errorKeys.some(key => key.startsWith('digitalAssetDetails'));
      default:
        return false;
    }
  };

  // Get all errors for the current listing type
  const getTypeErrors = () => {
    const result = [];
    const prefix = listingType ? listingType + 'Details' : '';
    
    if (!prefix) return result;
    
    Object.entries(errors).forEach(([key, value]) => {
      if (key.startsWith(prefix)) {
        const field = key.replace(prefix + '.', '');
        result.push({
          field: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
          message: value.message
        });
      }
    });
    
    return result;
  };

  const typeErrors = getTypeErrors();

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {getTypeTitle()}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Step 3 of 5: Provide specific details about your {listingType} listing
        </p>
      </div>

      {/* Instructions */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Detailed Information</p>
          <p>{getTypeInstructions()}</p>
          <p className="mt-2">All fields marked with an asterisk (*) are required.</p>
        </div>
      </div>

      {/* Error Warning */}
      {hasTypeErrors() && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-red-700 flex-1">
              <p className="font-medium mb-1">There are errors in your form</p>
              <p>Please review the highlighted fields and correct the errors before proceeding.</p>
              
              {typeErrors.length > 0 && (
                <div className="mt-2">
                  <button 
                    onClick={() => setExpandedErrors(!expandedErrors)}
                    className="flex items-center text-sm font-medium text-red-700 hover:text-red-800"
                  >
                    <ChevronRight className={`h-4 w-4 mr-1 transition-transform ${expandedErrors ? 'rotate-90' : ''}`} />
                    {expandedErrors ? 'Hide error details' : 'Show error details'}
                  </button>
                  
                  {expandedErrors && (
                    <ul className="mt-2 space-y-1 pl-6 list-disc">
                      {typeErrors.map((error, index) => (
                        <li key={index}>
                          <span className="font-medium">{error.field}:</span> {error.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Form Content */}
      <motion.div
        key={listingType}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeVariants}
        className="space-y-8 bg-white rounded-lg"
      >
        {renderForm()}
      </motion.div>
    </div>
  );
};

export default ListingDetails;