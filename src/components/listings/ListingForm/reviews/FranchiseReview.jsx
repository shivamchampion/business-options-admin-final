import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Store, 
  MapPin, 
  DollarSign, 
  GraduationCap, 
  BarChart, 
  Phone 
} from 'lucide-react';

const FranchiseReview = ({ ReviewSection, ReviewField }) => {
  const { watch } = useFormContext();
  const franchiseDetails = watch('franchiseDetails') || {};
  const basicInfo = watch();
  const location = watch('location') || {};
  const contactInfo = watch('contactInfo') || {};

  // Helper function to format currency
  const formatCurrency = (value, currency = '₹') => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    return `${currency} ${numValue.toLocaleString()}`;
  };

  return (
    <>
      {/* Franchise Information */}
      <ReviewSection 
        title="Franchise Information" 
        icon={Store}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField label="Franchise Name" value={basicInfo.name} highlight />
        <ReviewField label="Franchise Type" value={franchiseDetails?.franchiseType} />
        <ReviewField label="Parent Company" value={franchiseDetails?.parentCompany} />
        <ReviewField label="Established Year" value={franchiseDetails?.establishedYear} />
        <ReviewField label="Brand Started" value={franchiseDetails?.brandStarted} />
      </ReviewSection>

      {/* Territories */}
      <ReviewSection 
        title="Available Territories" 
        icon={MapPin}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Available Territories" 
          value={franchiseDetails?.availableTerritories?.join(', ')} 
        />
        <ReviewField 
          label="Territory Exclusivity" 
          value={franchiseDetails?.territoryExclusivity ? 'Yes' : 'No'} 
        />
        <ReviewField 
          label="Location" 
          value={`${location.cityName}, ${location.stateName}, ${location.countryName}`} 
        />
      </ReviewSection>

      {/* Investment */}
      <ReviewSection 
        title="Investment Details" 
        icon={DollarSign}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Franchise Fee" 
          value={formatCurrency(franchiseDetails?.investment?.franchiseFee?.value)} 
          highlight 
        />
        <ReviewField 
          label="Total Initial Investment" 
          value={formatCurrency(franchiseDetails?.investment?.totalInitialInvestment?.value)} 
        />
        <ReviewField 
          label="Royalty Fee" 
          value={franchiseDetails?.investment?.royaltyFee ? `${franchiseDetails.investment.royaltyFee}%` : ''} 
        />
        <ReviewField 
          label="Marketing Fee" 
          value={franchiseDetails?.investment?.marketingFee ? `${franchiseDetails.investment.marketingFee}%` : ''} 
        />
        <ReviewField 
          label="Term Length" 
          value={franchiseDetails?.investment?.termLength ? `${franchiseDetails.investment.termLength} years` : ''} 
        />
      </ReviewSection>

      {/* Support & Training */}
      <ReviewSection 
        title="Support & Training" 
        icon={GraduationCap}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Initial Training" 
          value={franchiseDetails?.support?.initialTraining} 
        />
        <ReviewField 
          label="Training Duration" 
          value={franchiseDetails?.support?.trainingDuration} 
        />
        <ReviewField 
          label="Training Location" 
          value={franchiseDetails?.support?.trainingLocation} 
        />
        <ReviewField 
          label="Ongoing Support" 
          value={franchiseDetails?.support?.ongoingSupport} 
        />
        <ReviewField 
          label="Site Selection" 
          value={franchiseDetails?.support?.siteSelection ? 'Yes' : 'No'} 
        />
      </ReviewSection>

      {/* Performance */}
      <ReviewSection 
        title="Performance Metrics" 
        icon={BarChart}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Average Unit Sales" 
          value={formatCurrency(franchiseDetails?.performance?.averageUnitSales?.value)} 
        />
        <ReviewField 
          label="Sales Growth" 
          value={franchiseDetails?.performance?.salesGrowth} 
        />
        <ReviewField 
          label="Average Breakeven" 
          value={franchiseDetails?.performance?.averageBreakeven} 
        />
        <ReviewField 
          label="Success Rate" 
          value={franchiseDetails?.performance?.successRate ? `${franchiseDetails.performance.successRate}%` : ''} 
          optional 
        />
      </ReviewSection>

      {/* Contact Information */}
      <ReviewSection 
        title="Contact Information" 
        icon={Phone}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField label="Contact Name" value={contactInfo?.contactName} />
        <ReviewField label="Contact Email" value={contactInfo?.email} />
        <ReviewField label="Contact Phone" value={contactInfo?.phone} />
        <ReviewField label="Alternate Phone" value={contactInfo?.alternatePhone} optional />
        <ReviewField label="Website" value={contactInfo?.website} optional />
        <ReviewField label="Preferred Contact" value={contactInfo?.preferredContactMethod} optional />
      </ReviewSection>
    </>
  );
};

export default FranchiseReview;