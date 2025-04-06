import React, { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  HelpCircle
} from 'lucide-react';
import { ListingType } from '@/types/listings';
import { FormSection } from '@/components/ui/FormField';

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

const ListingDetails = ({ submitAttempted = false, shouldShowErrors = false, isLoading: formLoading = false }) => {
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
        return <BusinessForm submitAttempted={submitAttempted} shouldShowErrors={shouldShowErrors} />;
      case ListingType.FRANCHISE:
        return <FranchiseForm submitAttempted={submitAttempted} shouldShowErrors={shouldShowErrors} />;
      case ListingType.STARTUP:
        return <StartupForm submitAttempted={submitAttempted} shouldShowErrors={shouldShowErrors} />;
      case ListingType.INVESTOR:
        return <InvestorForm submitAttempted={submitAttempted} shouldShowErrors={shouldShowErrors} />;
      case ListingType.DIGITAL_ASSET:
        return <DigitalAssetForm submitAttempted={submitAttempted} shouldShowErrors={shouldShowErrors} />;
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
      {/* Dynamic Form Content */}
      <FormSection
        title={getTypeTitle()}
        description={`Provide specific details about your ${listingType || 'listing'}`}
      >
        <motion.div
          key={listingType}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeVariants}
        >
          {renderForm()}
        </motion.div>
      </FormSection>
    </div>
  );
};

export default ListingDetails;