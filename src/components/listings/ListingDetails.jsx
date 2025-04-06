import React, { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { AlertTriangle } from 'react-feather';
import BusinessForm from './BusinessForm';
import FranchiseForm from './FranchiseForm';
import StartupForm from './StartupForm';
import InvestorForm from './InvestorForm';
import DigitalAssetForm from './DigitalAssetForm';
import ListingType from '../../constants/listingType';

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
  
  // ... existing code ...

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
};

export default ListingDetails;