import React, { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Info, 
  HelpCircle
} from 'lucide-react';
import { ListingType } from '@/types/listings';

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

const ListingDetails = ({ submitAttempted = false, isLoading: formLoading = false }) => {
  const { control } = useFormContext();
  const [isLoading, setIsLoading] = useState(formLoading);
  const [prevType, setPrevType] = useState(null);
  
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
        return <BusinessForm submitAttempted={submitAttempted} />;
      case ListingType.FRANCHISE:
        return <FranchiseForm submitAttempted={submitAttempted} />;
      case ListingType.STARTUP:
        return <StartupForm submitAttempted={submitAttempted} />;
      case ListingType.INVESTOR:
        return <InvestorForm submitAttempted={submitAttempted} />;
      case ListingType.DIGITAL_ASSET:
        return <DigitalAssetForm submitAttempted={submitAttempted} />;
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