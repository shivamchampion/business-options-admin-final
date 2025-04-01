import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Globe, 
  Users, 
  DollarSign, 
  Rocket,
  TrendingUp,
  BookOpen,
  MapPin
} from 'lucide-react';

const StartupReview = ({ ReviewSection, ReviewField }) => {
  const { watch } = useFormContext();
  const startupDetails = watch('startupDetails');
  const basicInfo = watch();

  // Helper function to truncate long text
  const truncate = (text, length = 100) => 
    text && text.length > length ? text.substring(0, length) + '...' : text;

  return (
    <>
      {/* Basic Information Section */}
      <ReviewSection 
        title="Startup Overview" 
        icon={Rocket}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Startup Name" 
          value={basicInfo.name} 
          highlight 
        />
        <ReviewField 
          label="Registered Name" 
          value={startupDetails?.registeredName} 
        />
        <ReviewField 
          label="Development Stage" 
          value={startupDetails?.developmentStage} 
        />
        <ReviewField 
          label="Founded Date" 
          value={startupDetails?.foundedDate?.toLocaleDateString()} 
        />
        <ReviewField 
          label="Launch Date" 
          value={startupDetails?.launchDate?.toLocaleDateString()} 
          optional 
        />
      </ReviewSection>

      {/* Mission & Problem Section */}
      <ReviewSection 
        title="Mission & Problem" 
        icon={Globe}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Mission Statement" 
          value={truncate(startupDetails?.missionStatement)} 
        />
        <ReviewField 
          label="Problem Statement" 
          value={truncate(startupDetails?.problemStatement)} 
        />
        <ReviewField 
          label="Solution Description" 
          value={truncate(startupDetails?.solutionDescription)} 
        />
      </ReviewSection>

      {/* Team Information Section */}
      <ReviewSection 
        title="Team Details" 
        icon={Users}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Team Size" 
          value={startupDetails?.team?.teamSize} 
        />
        <ReviewField 
          label="Product Stage" 
          value={startupDetails?.team?.productStage} 
        />
        <ReviewField 
          label="Unique Selling Points" 
          value={truncate(startupDetails?.team?.uniqueSellingPoints)} 
        />
        
        {/* Founders List */}
        <div className="space-y-2 mt-2">
          <h4 className="text-sm font-semibold text-gray-700">Founders</h4>
          {startupDetails?.team?.founders?.map((founder, index) => (
            <div 
              key={index} 
              className="bg-gray-50 rounded p-2 border border-gray-200"
            >
              <ReviewField 
                label="Name" 
                value={founder.name} 
              />
              <ReviewField 
                label="Role" 
                value={founder.role} 
              />
              <ReviewField 
                label="Experience" 
                value={truncate(founder.experience, 150)} 
              />
              <ReviewField 
                label="LinkedIn" 
                value={founder.linkedinProfile} 
                optional 
              />
            </div>
          ))}
        </div>
      </ReviewSection>

      {/* Market & Traction Section */}
      <ReviewSection 
        title="Market & Traction" 
        icon={TrendingUp}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Total Users" 
          value={startupDetails?.market?.totalUsers} 
          optional 
        />
        <ReviewField 
          label="Active Users" 
          value={startupDetails?.market?.activeUsers} 
          optional 
        />
        <ReviewField 
          label="Revenue Model" 
          value={truncate(startupDetails?.market?.revenueModel)} 
        />
        <ReviewField 
          label="Monthly Revenue" 
          value={`₹ ${startupDetails?.market?.monthlyRevenue?.value?.toLocaleString() || ''}`} 
          optional 
        />
        <ReviewField 
          label="Growth Rate" 
          value={`${startupDetails?.market?.growthRate}%`} 
          optional 
        />
        <ReviewField 
          label="Target Market" 
          value={truncate(startupDetails?.market?.targetMarket)} 
        />
        <ReviewField 
          label="Market Size" 
          value={`₹ ${startupDetails?.market?.marketSize?.value?.toLocaleString() || ''}`} 
        />
      </ReviewSection>

      {/* Funding Information Section */}
      <ReviewSection 
        title="Funding Details" 
        icon={DollarSign}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Funding Stage" 
          value={startupDetails?.funding?.fundingStage} 
        />
        <ReviewField 
          label="Total Raised to Date" 
          value={`₹ ${startupDetails?.funding?.totalRaisedToDate?.value?.toLocaleString() || ''}`} 
          optional 
        />
        <ReviewField 
          label="Current Raising Amount" 
          value={`₹ ${startupDetails?.funding?.currentRaisingAmount?.value?.toLocaleString() || ''}`} 
          highlight 
        />
        <ReviewField 
          label="Equity Offered" 
          value={`${startupDetails?.funding?.equityOffered}%`} 
        />
        <ReviewField 
          label="Pre-money Valuation" 
          value={`₹ ${startupDetails?.funding?.preMoneyValuation?.value?.toLocaleString() || ''}`} 
        />
        <ReviewField 
          label="Use of Funds" 
          value={truncate(startupDetails?.funding?.useOfFunds, 200)} 
        />
      </ReviewSection>

      {/* External Links Section */}
      <ReviewSection 
        title="External Links" 
        icon={MapPin}
        onEdit={() => {/* Navigate to appropriate step */}}
      >
        <ReviewField 
          label="Website" 
          value={startupDetails?.links?.website} 
          optional 
        />
        <ReviewField 
          label="Pitch Deck" 
          value={startupDetails?.links?.pitchDeck} 
          optional 
        />
        <ReviewField 
          label="Social Media" 
          value={startupDetails?.links?.socialMedia} 
          optional 
        />
        <ReviewField 
          label="Product Demo" 
          value={startupDetails?.links?.productDemo} 
          optional 
        />
      </ReviewSection>
    </>
  );
};

export default StartupReview;