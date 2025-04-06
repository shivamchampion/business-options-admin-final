import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Globe, 
  Laptop, 
  BarChart, 
  DollarSign, 
  Shield,
  Phone
} from 'lucide-react';

const DigitalAssetReview = ({ ReviewSection, ReviewField }) => {
  const { watch } = useFormContext();
  const digitalAssetDetails = watch();
  const basicInfo = watch();

  // Helper function to format currency
  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper function to truncate long text
  const truncate = (text, length = 100) => 
    text && text.length > length ? text.substring(0, length) + '...' : text;

    return (
    <>
      {/* Digital Asset Information Section */}
      <ReviewSection 
        title="Digital Asset Information" 
        icon={Globe}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Asset Name" 
          value={basicInfo.name} 
          highlight 
        />
        <ReviewField 
          label="Asset Type" 
          value={digitalAssetDetails.assetType} 
        />
        <ReviewField 
          label="Age of Asset" 
          value={`${digitalAssetDetails.ageOfAsset} years`} 
        />
        <ReviewField 
          label="Website URL" 
          value={digitalAssetDetails.websiteUrl} 
        />
        <ReviewField 
          label="Description" 
          value={truncate(digitalAssetDetails.description, 150)} 
        />
      </ReviewSection>

      {/* Technical Details Section */}
      <ReviewSection 
        title="Technical Details" 
        icon={Laptop}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Platform/CMS" 
          value={digitalAssetDetails.platform} 
        />
        <ReviewField 
          label="Technology Stack" 
          value={digitalAssetDetails.technologyStack?.join(', ')} 
        />
        <ReviewField 
          label="Hosting Provider" 
          value={digitalAssetDetails.hostingProvider} 
        />
        <ReviewField 
          label="Mobile Responsive" 
          value={digitalAssetDetails.mobileResponsive ? 'Yes' : 'No'} 
        />
        <ReviewField 
          label="Development Required" 
          value={digitalAssetDetails.developmentRequired ? 'Yes' : 'No'} 
        />
      </ReviewSection>

      {/* Performance Metrics Section */}
      <ReviewSection 
        title="Performance Metrics" 
        icon={BarChart}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Monthly Traffic" 
          value={digitalAssetDetails.monthlyTraffic?.toLocaleString()} 
        />
        <ReviewField 
          label="Traffic Sources" 
          value={digitalAssetDetails.trafficSources?.join(', ')} 
        />
        <ReviewField 
          label="Average Time on Site" 
          value={`${digitalAssetDetails.averageTimeOnSite} minutes`} 
          optional 
        />
        <ReviewField 
          label="Bounce Rate" 
          value={`${digitalAssetDetails.bounceRate}%`} 
          optional 
        />
        <ReviewField 
          label="Conversion Rate" 
          value={`${digitalAssetDetails.conversionRate}%`} 
          optional 
        />
      </ReviewSection>

      {/* Revenue & Financials Section */}
      <ReviewSection 
        title="Revenue & Financials" 
        icon={DollarSign}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Asking Price" 
          value={formatCurrency(digitalAssetDetails.askingPrice?.value)} 
          highlight 
        />
        <ReviewField 
          label="Monthly Revenue" 
          value={formatCurrency(digitalAssetDetails.monthlyRevenue?.value)} 
        />
        <ReviewField 
          label="Annual Revenue" 
          value={formatCurrency(digitalAssetDetails.annualRevenue?.value)} 
        />
        <ReviewField 
          label="Revenue Streams" 
          value={digitalAssetDetails.revenueStreams?.join(', ')} 
        />
        <ReviewField 
          label="Operating Costs" 
          value={formatCurrency(digitalAssetDetails.operatingCosts?.value)} 
        />
        <ReviewField 
          label="Profit Margin" 
          value={`${digitalAssetDetails.profitMargin}%`} 
        />
        <ReviewField 
          label="Revenue Growth Rate" 
          value={`${digitalAssetDetails.revenueGrowthRate}%`} 
          optional 
        />
      </ReviewSection>

      {/* Additional Information Section */}
      <ReviewSection 
        title="Additional Information" 
        icon={Shield}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Reason for Selling" 
          value={digitalAssetDetails.reasonForSelling} 
        />
        <ReviewField 
          label="Intellectual Property" 
          value={digitalAssetDetails.intellectualProperty?.join(', ')} 
        />
        <ReviewField 
          label="Assets Included" 
          value={digitalAssetDetails.assetsIncluded?.join(', ')} 
        />
        <ReviewField 
          label="Training & Support" 
          value={`${digitalAssetDetails.trainingAndSupport} hours`} 
        />
        <ReviewField 
          label="Growth Opportunities" 
          value={truncate(digitalAssetDetails.growthOpportunities, 150)} 
          optional 
        />
      </ReviewSection>

      {/* Contact Information Section */}
      <ReviewSection 
        title="Contact Information" 
        icon={Phone}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Contact Name" 
          value={digitalAssetDetails.contactName} 
        />
        <ReviewField 
          label="Contact Email" 
          value={digitalAssetDetails.contactEmail} 
        />
        <ReviewField 
          label="Contact Phone" 
          value={digitalAssetDetails.contactPhone} 
        />
        <ReviewField 
          label="Preferred Contact Method" 
          value={digitalAssetDetails.preferredContactMethod} 
        />
      </ReviewSection>
    </>
  );
};

export default DigitalAssetReview;
