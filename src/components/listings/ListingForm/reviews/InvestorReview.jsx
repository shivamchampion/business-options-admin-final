import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  User, 
  Building, 
  DollarSign, 
  Briefcase, 
  Target,
  Phone
} from 'lucide-react';

const InvestorReview = ({ ReviewSection, ReviewField }) => {
  const { watch } = useFormContext();
  const investorDetails = watch();
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

  return (
    <>
      {/* Investor Profile Section */}
      <ReviewSection 
        title="Investor Profile" 
        icon={User}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Investor Name" 
          value={basicInfo.name} 
          highlight 
        />
        <ReviewField 
          label="Investor Type" 
          value={investorDetails.investorType} 
        />
        <ReviewField 
          label="Years of Experience" 
          value={investorDetails.yearsOfExperience} 
        />
        <ReviewField 
          label="Investment Style" 
          value={investorDetails.investmentStyle} 
        />
      </ReviewSection>

      {/* Portfolio Information Section */}
      <ReviewSection 
        title="Portfolio Information" 
        icon={Building}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Portfolio Size" 
          value={formatCurrency(investorDetails.portfolioSize?.value)} 
        />
        <ReviewField 
          label="Number of Companies" 
          value={investorDetails.numberOfCompanies} 
        />
        <ReviewField 
          label="Notable Investments" 
          value={investorDetails.notableInvestments?.join(', ')} 
          optional 
        />
        <ReviewField 
          label="Successful Exits" 
          value={investorDetails.successfulExits} 
          optional 
        />
      </ReviewSection>

      {/* Investment Criteria Section */}
      <ReviewSection 
        title="Investment Criteria" 
        icon={Target}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Investment Range" 
          value={`${formatCurrency(investorDetails.investmentRangeMin?.value)} - ${formatCurrency(investorDetails.investmentRangeMax?.value)}`} 
          highlight 
        />
        <ReviewField 
          label="Preferred Industries" 
          value={investorDetails.preferredIndustries?.join(', ')} 
        />
        <ReviewField 
          label="Preferred Stages" 
          value={investorDetails.preferredStages?.join(', ')} 
        />
        <ReviewField 
          label="Geographic Focus" 
          value={investorDetails.geographicFocus?.join(', ')} 
        />
      </ReviewSection>

      {/* Investment Process Section */}
      <ReviewSection 
        title="Investment Process" 
        icon={Briefcase}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Due Diligence Process" 
          value={investorDetails.dueDiligenceProcess} 
        />
        <ReviewField 
          label="Decision Timeline" 
          value={investorDetails.decisionTimeline} 
        />
        <ReviewField 
          label="Post-Investment Support" 
          value={investorDetails.postInvestmentSupport} 
          optional 
        />
        <ReviewField 
          label="Board Seat Requirements" 
          value={investorDetails.boardSeatRequirements ? 'Yes' : 'No'} 
        />
      </ReviewSection>

      {/* Financial Details Section */}
      <ReviewSection 
        title="Financial Details" 
        icon={DollarSign}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Typical Investment Size" 
          value={formatCurrency(investorDetails.typicalInvestmentSize?.value)} 
        />
        <ReviewField 
          label="Equity Range" 
          value={`${investorDetails.equityRangeMin}% - ${investorDetails.equityRangeMax}%`} 
        />
        <ReviewField 
          label="Expected ROI" 
          value={`${investorDetails.expectedROI}%`} 
          optional 
        />
        <ReviewField 
          label="Investment Horizon" 
          value={`${investorDetails.investmentHorizon} years`} 
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
          value={investorDetails.contactName} 
        />
        <ReviewField 
          label="Contact Email" 
          value={investorDetails.contactEmail} 
        />
        <ReviewField 
          label="Contact Phone" 
          value={investorDetails.contactPhone} 
        />
        <ReviewField 
          label="Preferred Contact Method" 
          value={investorDetails.preferredContactMethod} 
        />
      </ReviewSection>
    </>
  );
};

export default InvestorReview;