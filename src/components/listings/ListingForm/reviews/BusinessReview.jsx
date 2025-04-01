import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Store, 
  Building2, 
  DollarSign, 
  MapPin,
  Tag,
  Users,
  BarChart3
} from 'lucide-react';

const BusinessReview = ({ ReviewSection, ReviewField }) => {
  const { watch } = useFormContext();
  const businessDetails = watch('businessDetails') || {};
  const basicInfo = watch();
  const location = watch('location') || {};
  const contactInfo = watch('contactInfo') || {};
  const operations = businessDetails?.operations || {};
  const financials = businessDetails?.financials || {};
  const sale = businessDetails?.sale || {};

  // Helper to format currency values
  const formatCurrency = (value, currency = '₹') => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    return `${currency} ${numValue.toLocaleString()}`;
  };

  return (
    <>
      {/* Core Business Information */}
      <ReviewSection title="Business Information" icon={Store}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
          <ReviewField label="Business Name" value={basicInfo.name} highlight={true} />
          <ReviewField label="Business Type" value={businessDetails?.businessType} />
          <ReviewField label="Entity Type" value={businessDetails?.entityType} />
          <ReviewField label="Established Year" value={businessDetails?.establishedYear} />
          <ReviewField label="Registration Number" value={businessDetails?.registrationNumber} />
          <ReviewField label="GST Number" value={businessDetails?.gstNumber} optional={true} />
        </div>
      </ReviewSection>

      {/* Classification */}
      <ReviewSection title="Business Classification" icon={Tag}>
        {basicInfo.classifications && basicInfo.classifications.map((classification, index) => (
          <div key={index} className={index > 0 ? "mt-2 pt-2 border-t border-gray-100" : ""}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
              <ReviewField label="Industry" value={classification.industryName} />
              <ReviewField label="Category" value={classification.categoryName} />
            </div>
            <ReviewField label="Sub-Categories" value={classification.subCategoryNames?.join(', ')} />
          </div>
        ))}
      </ReviewSection>

      {/* Location */}
      <ReviewSection title="Location" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
          <ReviewField label="Country" value={location.countryName} />
          <ReviewField label="State" value={location.stateName} />
          <ReviewField label="City" value={location.cityName} />
          <ReviewField label="Address" value={location.address} optional={true} />
          <ReviewField label="Pincode" value={location.pincode} optional={true} />
        </div>
      </ReviewSection>

      {/* Operations */}
      <ReviewSection title="Operations" icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
          <ReviewField label="Total Employees" value={operations?.employees?.count} />
          <ReviewField label="Full-time Employees" value={operations?.employees?.fullTime} />
          <ReviewField label="Part-time Employees" value={operations?.employees?.partTime} optional={true} />
          <ReviewField label="Location Type" value={operations?.locationType} />
          
          {operations?.leaseInformation && (
            <>
              <ReviewField 
                label="Lease Expiry Date" 
                value={operations.leaseInformation.expiryDate instanceof Date 
                  ? operations.leaseInformation.expiryDate.toLocaleDateString() 
                  : operations.leaseInformation.expiryDate} 
                optional={true}
              />
              <ReviewField 
                label="Monthly Lease Cost" 
                value={operations.leaseInformation.monthlyCost?.value 
                  ? formatCurrency(operations.leaseInformation.monthlyCost.value) 
                  : ''} 
                optional={true}
              />
            </>
          )}
        </div>
        
        <ReviewField label="Operation Description" value={operations?.operationDescription} />
      </ReviewSection>

      {/* Financials */}
      <ReviewSection title="Financial Information" icon={BarChart3}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
          <ReviewField 
            label="Annual Revenue" 
            value={formatCurrency(financials?.annualRevenue?.value)} 
            highlight={true}
          />
          <ReviewField 
            label="Monthly Revenue" 
            value={formatCurrency(financials?.monthlyRevenue?.value)} 
          />
          <ReviewField 
            label="Profit Margin" 
            value={financials?.profitMargin?.percentage ? `${financials.profitMargin.percentage}%` : ''} 
          />
          <ReviewField 
            label="Revenue Trend" 
            value={financials?.revenueTrend} 
          />
          
          <ReviewField 
            label="Customer Concentration" 
            value={financials?.customerConcentration ? `${financials.customerConcentration}%` : ''} 
          />
          
          {financials?.inventory?.isIncluded && (
            <ReviewField 
              label="Inventory Value" 
              value={formatCurrency(financials.inventory.value?.value)} 
              optional={true}
            />
          )}
        </div>
      </ReviewSection>

      {/* Sale Details */}
      <ReviewSection title="Sale Details" icon={DollarSign}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
          <ReviewField 
            label="Asking Price" 
            value={formatCurrency(sale?.askingPrice?.value)} 
            highlight={true}
          />
          <ReviewField 
            label="Price Multiple" 
            value={sale?.askingPrice?.priceMultiple ? `${sale.askingPrice.priceMultiple}x` : ''} 
            optional={true}
          />
          <ReviewField 
            label="Price Negotiable" 
            value={sale?.askingPrice?.isNegotiable ? 'Yes' : 'No'} 
          />
          <ReviewField 
            label="Transition Period" 
            value={`${sale?.transitionPeriod || 0} months`} 
          />
        </div>
        
        <div className="mt-2">
          <ReviewField label="Reason for Selling" value={sale?.reasonForSelling} />
          <ReviewField label="Training Included" value={sale?.trainingIncluded} />
          <ReviewField label="Assets Included" value={sale?.assetsIncluded} />
        </div>
      </ReviewSection>

      {/* Contact Information */}
      <ReviewSection title="Contact Information" icon={Users}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
          <ReviewField label="Contact Email" value={contactInfo?.email} />
          <ReviewField label="Contact Phone" value={contactInfo?.phone} optional={true} />
          <ReviewField label="Alternate Phone" value={contactInfo?.alternatePhone} optional={true} />
          <ReviewField label="Website" value={contactInfo?.website} optional={true} />
          <ReviewField label="Contact Person" value={contactInfo?.contactName} optional={true} />
          <ReviewField label="Preferred Contact" value={contactInfo?.preferredContactMethod} optional={true} />
        </div>
      </ReviewSection>
    </>
  );
};

export default BusinessReview;