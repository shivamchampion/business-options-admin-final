import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Store, 
  Building2, 
  DollarSign, 
  MapPin,
  Tag,
  Users,
  BarChart3,
  Phone
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

  // Helper to safely truncate long text
  const truncate = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Core Business Information */}
      <ReviewSection title="Business Information" icon={Store} onEdit={() => {/* Navigate to appropriate step */}}>
        <ReviewField label="Business Name" value={truncate(basicInfo.name)} highlight={true} />
        <ReviewField label="Business Type" value={truncate(businessDetails?.businessType)} />
        <ReviewField label="Entity Type" value={truncate(businessDetails?.entityType)} />
        <ReviewField label="Established Year" value={businessDetails?.establishedYear} />
        <ReviewField label="Registration Number" value={truncate(businessDetails?.registrationNumber)} />
        <ReviewField label="GST Number" value={truncate(businessDetails?.gstNumber)} optional={true} />
      </ReviewSection>

      {/* Classification */}
      <ReviewSection title="Business Classification" icon={Tag} onEdit={() => {/* Navigate to appropriate step */}}>
        {basicInfo.classifications && basicInfo.classifications.map((classification, index) => (
          <div key={index} className={index > 0 ? "mt-1 pt-1 border-t border-gray-100" : ""}>
            <ReviewField label="Industry" value={truncate(classification.industryName)} />
            <ReviewField label="Category" value={truncate(classification.categoryName)} />
            <ReviewField label="Sub-Categories" value={truncate(classification.subCategoryNames?.join(', '))} />
          </div>
        ))}
      </ReviewSection>

      {/* Location */}
      <ReviewSection title="Location" icon={MapPin} onEdit={() => {/* Navigate to appropriate step */}}>
        <ReviewField label="Country" value={truncate(location.countryName)} />
        <ReviewField label="State" value={truncate(location.stateName)} />
        <ReviewField label="City" value={truncate(location.cityName)} />
        <ReviewField label="Address" value={truncate(location.address)} optional={true} />
        <ReviewField label="Pincode" value={location.pincode} optional={true} />
      </ReviewSection>

      {/* Operations */}
      <ReviewSection title="Operations" icon={Building2} onEdit={() => {/* Navigate to appropriate step */}}>
        <ReviewField label="Total Employees" value={operations?.employees?.count} />
        <ReviewField label="Full-time Employees" value={operations?.employees?.fullTime} />
        <ReviewField label="Part-time Employees" value={operations?.employees?.partTime} optional={true} />
        <ReviewField label="Location Type" value={truncate(operations?.locationType)} />
          
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
        
        <ReviewField label="Operation Description" value={truncate(operations?.operationDescription, 150)} />
      </ReviewSection>

      {/* Financials */}
      <ReviewSection title="Financial Information" icon={BarChart3} onEdit={() => {/* Navigate to appropriate step */}}>
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
          value={truncate(financials?.revenueTrend)} 
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
      </ReviewSection>

      {/* Sale Details */}
      <ReviewSection title="Sale Details" icon={DollarSign} onEdit={() => {/* Navigate to appropriate step */}}>
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
        <ReviewField label="Reason for Selling" value={truncate(sale?.reasonForSelling, 150)} />
        <ReviewField label="Training Included" value={truncate(sale?.trainingIncluded, 150)} />
        <ReviewField label="Assets Included" value={truncate(sale?.assetsIncluded, 150)} />
      </ReviewSection>

      {/* Contact Information */}
      <ReviewSection title="Contact Information" icon={Users} onEdit={() => {/* Navigate to appropriate step */}}>
        <ReviewField label="Contact Email" value={truncate(contactInfo?.email)} />
        <ReviewField label="Contact Phone" value={contactInfo?.phone} optional={true} />
        <ReviewField label="Alternate Phone" value={contactInfo?.alternatePhone} optional={true} />
        <ReviewField label="Website" value={truncate(contactInfo?.website)} optional={true} />
        <ReviewField label="Contact Person" value={truncate(contactInfo?.contactName)} optional={true} />
        <ReviewField label="Preferred Contact" value={truncate(contactInfo?.preferredContactMethod)} optional={true} />
      </ReviewSection>
    </div>
  );
};

export default BusinessReview;