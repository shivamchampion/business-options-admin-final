import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Users, 
  DollarSign, 
  Globe, 
  TrendingUp,
  Briefcase,
  MapPin
} from 'lucide-react';

const InvestorReview = ({ ReviewSection, ReviewField }) => {
  const { watch } = useFormContext();
  const investorDetails = watch('investorDetails');
  const basicInfo = watch();

  // Helper function to truncate long text
  const truncate = (text, length = 100) => 
    text && text.length > length ? text.substring(0, length) + '...' : text;

  return (
    <>
      {/* Basic Information Section */}
      <ReviewSection 
        title="Investor Profile" 
        icon={Users}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Investor Name" 
          value={basicInfo.name} 
          highlight 
        />
        <ReviewField 
          label="Investor Type" 
          value={investorDetails?.investorType} 
        />
        <ReviewField 
          label="Years of Experience" 
          value={`${investorDetails?.yearsOfExperience} years`} 
        />
        {investorDetails?.investmentTeamSize && (
          <ReviewField 
            label="Investment Team Size" 
            value={investorDetails?.investmentTeamSize} 
          />
        )}
      </ReviewSection>

      {/* Investment Philosophy Section */}
      <ReviewSection 
        title="Investment Philosophy" 
        icon={Globe}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Investment Philosophy" 
          value={truncate(investorDetails?.investmentPhilosophy, 200)} 
        />
        <ReviewField 
          label="Background Summary" 
          value={truncate(investorDetails?.backgroundSummary, 200)} 
        />
        {investorDetails?.keyAchievements && (
          <ReviewField 
            label="Key Achievements" 
            value={truncate(investorDetails?.keyAchievements, 200)} 
            optional 
          />
        )}
      </ReviewSection>

      {/* Investment Capacity Section */}
      <ReviewSection 
        title="Investment Capacity" 
        icon={DollarSign}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        {investorDetails?.investment?.annualInvestmentTarget && (
          <ReviewField 
            label="Annual Investment Target" 
            value={`₹ ${investorDetails?.investment?.annualInvestmentTarget?.value?.toLocaleString() || ''}`} 
            optional 
          />
        )}
        <ReviewField 
          label="Decision Timeline" 
          value={investorDetails?.investment?.decisionTimeline} 
        />
        <ReviewField 
          label="Preferred Investment Rounds" 
          value={investorDetails?.investment?.preferredRounds?.join(', ')} 
        />
        <ReviewField 
          label="Lead Investor" 
          value={investorDetails?.investment?.isLeadInvestor ? 'Yes' : 'No'} 
        />
        {investorDetails?.investment?.preferredEquityStake && (
          <ReviewField 
            label="Preferred Equity Stake" 
            value={`${investorDetails?.investment?.preferredEquityStake?.min || 0}% - ${investorDetails?.investment?.preferredEquityStake?.max || 0}%`} 
            optional 
          />
        )}
      </ReviewSection>

      {/* Investment Focus Section */}
      <ReviewSection 
        title="Investment Focus" 
        icon={TrendingUp}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Primary Industries" 
          value={investorDetails?.focus?.primaryIndustries?.join(', ')} 
        />
        {investorDetails?.focus?.secondaryIndustries && (
          <ReviewField 
            label="Secondary Industries" 
            value={investorDetails?.focus?.secondaryIndustries?.join(', ')} 
            optional 
          />
        )}
        <ReviewField 
          label="Business Stage Preference" 
          value={investorDetails?.focus?.businessStagePreference?.join(', ')} 
        />
        <ReviewField 
          label="Geographic Focus" 
          value={investorDetails?.focus?.geographicFocus?.join(', ')} 
        />
        <ReviewField 
          label="Investment Criteria" 
          value={truncate(investorDetails?.focus?.investmentCriteria, 200)} 
        />
        {investorDetails?.focus?.minimumRevenue && (
          <ReviewField 
            label="Minimum Revenue" 
            value={`₹ ${investorDetails?.focus?.minimumRevenue?.value?.toLocaleString() || ''}`} 
            optional 
          />
        )}
        {investorDetails?.focus?.minimumTraction && (
          <ReviewField 
            label="Minimum Traction" 
            value={truncate(investorDetails?.focus?.minimumTraction, 200)} 
            optional 
          />
        )}
      </ReviewSection>

      {/* Portfolio & Process Section */}
      <ReviewSection 
        title="Portfolio & Process" 
        icon={Briefcase}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        {investorDetails?.portfolio?.portfolioSize && (
          <ReviewField 
            label="Portfolio Size" 
            value={investorDetails?.portfolio?.portfolioSize} 
            optional 
          />
        )}
        {investorDetails?.portfolio?.activeInvestments && (
          <ReviewField 
            label="Active Investments" 
            value={investorDetails?.portfolio?.activeInvestments} 
            optional 
          />
        )}
        {investorDetails?.portfolio?.successStories && (
          <ReviewField 
            label="Success Stories" 
            value={truncate(investorDetails?.portfolio?.successStories, 200)} 
            optional 
          />
        )}
        <ReviewField 
          label="Investment Process" 
          value={truncate(investorDetails?.portfolio?.investmentProcess, 200)} 
        />
        <ReviewField 
          label="Post-Investment Support" 
          value={truncate(investorDetails?.portfolio?.postInvestmentSupport, 200)} 
        />
        {investorDetails?.portfolio?.reportingRequirements && (
          <ReviewField 
            label="Reporting Requirements" 
            value={truncate(investorDetails?.portfolio?.reportingRequirements, 200)} 
            optional 
          />
        )}
        {investorDetails?.portfolio?.boardInvolvement && (
          <ReviewField 
            label="Board Involvement" 
            value={investorDetails?.portfolio?.boardInvolvement} 
            optional 
          />
        )}
      </ReviewSection>

      {/* Contact Information */}
      <ReviewSection 
        title="Contact Information" 
        icon={MapPin}
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

export default InvestorReview;