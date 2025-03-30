import React, { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ListingType } from '@/types/listings';
import { AlertTriangle, Info } from 'lucide-react';

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

const ListingDetails = () => {
  const { control, formState: { errors } } = useFormContext();
  const [isLoading, setIsLoading] = useState(false);
  const [prevType, setPrevType] = useState<ListingType | null>(null);
  
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

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {listingType ? `${listingType.charAt(0).toUpperCase() + listingType.slice(1)} Details` : 'Listing Details'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Step 3 of 5: Provide specific details about your {listingType} listing
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p>{getTypeInstructions()}</p>
          <p className="mt-2">All fields marked with * are required.</p>
        </div>
      </div>

      {/* Error Warning */}
      {hasTypeErrors() && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-700">
            <p className="font-medium">There are errors in your form</p>
            <p>Please review the highlighted fields and correct the errors before proceeding.</p>
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
        className="space-y-8"
      >
        {renderForm()}
      </motion.div>
    </div>
  );
};

export default ListingDetails;