import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Store, 
  DollarSign, 
  Users, 
  MapPin,
  Clock,
  BookOpen,
  TrendingUp
} from 'lucide-react';

const FranchiseReview = ({ ReviewSection, ReviewField }) => {
  const { watch } = useFormContext();
  const franchiseDetails = watch('franchiseDetails');
  const basicInfo = watch();

  return (
    <>
      {/* Basic Information Section */}
      <ReviewSection 
        title="Franchise Information" 
        icon={Store}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Franchise Brand" 
          value={franchiseDetails?.franchiseBrand} 
          highlight 
        />
        <ReviewField 
          label="Franchise Type" 
          value={franchiseDetails?.franchiseType} 
        />
        <ReviewField 
          label="Franchising Since" 
          value={franchiseDetails?.franchiseSince} 
        />
        <ReviewField 
          label="Brand Established" 
          value={franchiseDetails?.brandEstablished} 
        />
        <ReviewField 
          label="Total Units" 
          value={franchiseDetails?.totalUnits} 
        />
        <ReviewField 
          label="Franchisee Count" 
          value={franchiseDetails?.franchiseeCount} 
        />
        <ReviewField 
          label="Company-Owned Units" 
          value={franchiseDetails?.companyOwnedUnits} 
        />
      </ReviewSection>

      {/* Location & Territories Section */}
      <ReviewSection 
        title="Available Territories" 
        icon={MapPin}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <div className="flex flex-wrap gap-2">
          {franchiseDetails?.availableTerritories?.map((territory, index) => (
            <span 
              key={index} 
              className="px-2 py-1 bg-blue-50 text-blue-800 rounded-full text-xs"
            >
              {territory}
            </span>
          ))}
        </div>
      </ReviewSection>

      {/* Investment Details Section */}
      <ReviewSection 
        title="Investment Details" 
        icon={DollarSign}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Franchise Fee" 
          value={`₹ ${franchiseDetails?.investment?.franchiseFee?.value?.toLocaleString() || ''}`} 
          highlight
        />
        <ReviewField 
          label="Total Initial Investment" 
          value={`₹ ${franchiseDetails?.investment?.totalInitialInvestment?.value?.toLocaleString() || ''}`} 
        />
        <ReviewField 
          label="Royalty Fee" 
          value={`${franchiseDetails?.investment?.royaltyFee}%`} 
        />
        <ReviewField 
          label="Marketing Fee" 
          value={`${franchiseDetails?.investment?.marketingFee}%`} 
        />
      </ReviewSection>

      {/* Support & Training Section */}
      <ReviewSection 
        title="Support & Training" 
        icon={BookOpen}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Initial Training" 
          value={franchiseDetails?.support?.initialTraining?.substring(0, 100) + '...'} 
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
          label="Site Selection Assistance" 
          value={franchiseDetails?.support?.siteSelection ? 'Yes' : 'No'} 
        />
      </ReviewSection>

      {/* Performance Metrics Section */}
      <ReviewSection 
        title="Performance Metrics" 
        icon={TrendingUp}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Average Unit Sales" 
          value={`₹ ${franchiseDetails?.performance?.averageUnitSales?.value?.toLocaleString() || ''}`} 
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
          value={franchiseDetails?.performance?.successRate ? 
            `${franchiseDetails.performance.successRate}%` : 'Not Provided'} 
          optional 
        />
      </ReviewSection>

      {/* Contact Information */}
      <ReviewSection 
        title="Contact Information" 
        icon={Users}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Contact Email" 
          value={basicInfo.contactInfo?.email} 
        />
        <ReviewField 
          label="Contact Phone" 
          value={basicInfo.contactInfo?.phone} 
          optional 
        />
        <ReviewField 
          label="Website" 
          value={basicInfo.contactInfo?.website} 
          optional 
        />
      </ReviewSection>
    </>
  );
};

export default FranchiseReview;