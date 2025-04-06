import React from 'react';
import { 
  Building2, 
  Users, 
  MapPin, 
  Calendar, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Percent, 
  BarChart, 
  Package, 
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BusinessDetailsProps {
  details: {
    businessType: string;
    entityType: string;
    establishedYear: string | number;
    registrationNumber: string;
    gstNumber?: string;
    panNumber?: string;
    operations: {
      employees: {
        count: string;
        fullTime: string;
        partTime?: string;
      };
      locationType: string;
      leaseInformation?: {
        expiryDate: Date;
        monthlyCost?: {
          value: string;
          currency: string;
        };
        isTransferable?: boolean;
      };
      operationDescription: string;
    };
    financials: {
      annualRevenue: {
        value: string;
        currency: string;
      };
      monthlyRevenue: {
        value: string;
        currency: string;
      };
      profitMargin: {
        percentage: string;
        trend: string;
      };
      revenueTrend: string;
      inventory?: {
        isIncluded: boolean;
        value?: {
          value: string;
          currency: string;
        };
        description?: string;
      };
      equipment?: {
        isIncluded: boolean;
        value?: {
          value: string;
          currency: string;
        };
        description?: string;
      };
      customerConcentration: string;
    };
    sale: {
      askingPrice: {
        value: string;
        currency: string;
        priceMultiple?: string;
        isNegotiable?: boolean;
      };
      reasonForSelling: string;
      sellerFinancing?: {
        isAvailable: boolean;
        details?: string;
        downPaymentPercentage?: string;
      };
      transitionPeriod: string;
      trainingIncluded: string;
      assetsIncluded: string;
    };
  };
}

const BusinessDetails: React.FC<BusinessDetailsProps> = ({ details }) => {
  return (
    <div className="space-y-6">
      {/* Business Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Building2 className="h-5 w-5 text-gray-500 mr-2" />
          Business Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Business Type</div>
            <div className="font-medium">{details.businessType}</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Entity Type</div>
            <div className="font-medium">{details.entityType}</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Established Year</div>
            <div className="font-medium">{details.establishedYear}</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Registration Number</div>
            <div className="font-medium">{details.registrationNumber}</div>
          </div>
          
          {details.gstNumber && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">GST Number</div>
              <div className="font-medium">{details.gstNumber}</div>
            </div>
          )}
          
          {details.panNumber && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">PAN Number</div>
              <div className="font-medium">{details.panNumber}</div>
            </div>
          )}
        </div>
      </div>

      {/* Operations Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Briefcase className="h-5 w-5 text-gray-500 mr-2" />
          Operations
        </h3>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500 mb-2">Employee Information</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">Total Employees</div>
              <div className="font-medium">{details.operations.employees.count}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Full Time</div>
              <div className="font-medium">{details.operations.employees.fullTime}</div>
            </div>
            {details.operations.employees.partTime && (
              <div>
                <div className="text-xs text-gray-500">Part Time</div>
                <div className="font-medium">{details.operations.employees.partTime}</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500 mb-2">Location & Lease</div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500">Location Type</div>
              <div className="font-medium">{details.operations.locationType}</div>
            </div>
            
            {details.operations.leaseInformation && (
              <>
                <div>
                  <div className="text-xs text-gray-500">Lease Expiry</div>
                  <div className="font-medium">
                    {new Date(details.operations.leaseInformation.expiryDate).toLocaleDateString()}
                  </div>
                </div>
                
                {details.operations.leaseInformation.monthlyCost && (
                  <div>
                    <div className="text-xs text-gray-500">Monthly Lease Cost</div>
                    <div className="font-medium">
                      {formatCurrency(typeof details.operations.leaseInformation.monthlyCost.value === 'string' 
                        ? parseFloat(details.operations.leaseInformation.monthlyCost.value) 
                        : details.operations.leaseInformation.monthlyCost.value)}
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="text-xs text-gray-500">Lease Transferable</div>
                  <div className="font-medium">
                    {details.operations.leaseInformation.isTransferable ? 'Yes' : 'No'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500 mb-2">Operation Description</div>
          <div className="text-gray-700 whitespace-pre-line">{details.operations.operationDescription}</div>
        </div>
      </div>

      {/* Financials Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
          Financial Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-2">Revenue</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">Annual Revenue</div>
                <div className="font-medium">
                  {formatCurrency(typeof details.financials.annualRevenue.value === 'string' 
                    ? parseFloat(details.financials.annualRevenue.value) 
                    : details.financials.annualRevenue.value)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Monthly Revenue</div>
                <div className="font-medium">
                  {formatCurrency(typeof details.financials.monthlyRevenue.value === 'string' 
                    ? parseFloat(details.financials.monthlyRevenue.value) 
                    : details.financials.monthlyRevenue.value)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-2">Profitability</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">Profit Margin</div>
                <div className="font-medium">{details.financials.profitMargin.percentage}%</div>
                <div className="text-xs text-gray-500">Trend: {details.financials.profitMargin.trend}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Revenue Trend</div>
                <div className="font-medium">{details.financials.revenueTrend}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-2">Customer Concentration</div>
            <div className="font-medium">{details.financials.customerConcentration}%</div>
          </div>

          {details.financials.inventory && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-2">Inventory</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Included in Sale</div>
                  <div className="font-medium">
                    {details.financials.inventory.isIncluded ? 'Yes' : 'No'}
                  </div>
                </div>
                {details.financials.inventory.value && (
                  <div>
                    <div className="text-xs text-gray-500">Value</div>
                    <div className="font-medium">
                      {formatCurrency(typeof details.financials.inventory.value.value === 'string' 
                        ? parseFloat(details.financials.inventory.value.value) 
                        : details.financials.inventory.value.value)}
                    </div>
                  </div>
                )}
                {details.financials.inventory.description && (
                  <div>
                    <div className="text-xs text-gray-500">Description</div>
                    <div className="text-gray-700">{details.financials.inventory.description}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {details.financials.equipment && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-2">Equipment</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Included in Sale</div>
                  <div className="font-medium">
                    {details.financials.equipment.isIncluded ? 'Yes' : 'No'}
                  </div>
                </div>
                {details.financials.equipment.value && (
                  <div>
                    <div className="text-xs text-gray-500">Value</div>
                    <div className="font-medium">
                      {formatCurrency(typeof details.financials.equipment.value.value === 'string' 
                        ? parseFloat(details.financials.equipment.value.value) 
                        : details.financials.equipment.value.value)}
                    </div>
                  </div>
                )}
                {details.financials.equipment.description && (
                  <div>
                    <div className="text-xs text-gray-500">Description</div>
                    <div className="text-gray-700">{details.financials.equipment.description}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sale Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Package className="h-5 w-5 text-gray-500 mr-2" />
          Sale Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-2">Asking Price</div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(typeof details.sale.askingPrice.value === 'string' 
                  ? parseFloat(details.sale.askingPrice.value) 
                  : details.sale.askingPrice.value)}
              </div>
              {details.sale.askingPrice.priceMultiple && (
                <div className="text-sm text-gray-500">
                  {typeof details.sale.askingPrice.priceMultiple === 'string' 
                    ? `${details.sale.askingPrice.priceMultiple}x Multiple` 
                    : `${details.sale.askingPrice.priceMultiple}x Multiple`}
                </div>
              )}
              <div className="text-sm text-gray-500">
                {details.sale.askingPrice.isNegotiable ? 'Price is negotiable' : 'Price is fixed'}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-2">Seller Financing</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">Available</div>
                <div className="font-medium">
                  {details.sale.sellerFinancing?.isAvailable ? 'Yes' : 'No'}
                </div>
              </div>
              {details.sale.sellerFinancing?.downPaymentPercentage && (
                <div>
                  <div className="text-xs text-gray-500">Down Payment Required</div>
                  <div className="font-medium">
                    {details.sale.sellerFinancing.downPaymentPercentage}%
                  </div>
                </div>
              )}
              {details.sale.sellerFinancing?.details && (
                <div>
                  <div className="text-xs text-gray-500">Details</div>
                  <div className="text-gray-700">{details.sale.sellerFinancing.details}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-2">Transition Period</div>
            <div className="font-medium">{details.sale.transitionPeriod} months</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-2">Reason for Selling</div>
            <div className="text-gray-700">{details.sale.reasonForSelling}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
            <div className="text-sm text-gray-500 mb-2">Training Included</div>
            <div className="text-gray-700">{details.sale.trainingIncluded}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
            <div className="text-sm text-gray-500 mb-2">Assets Included</div>
            <div className="text-gray-700">{details.sale.assetsIncluded}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetails; 