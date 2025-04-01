import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Save,
  AlertCircle,
  ArrowLeft,
  X,
  Loader
} from 'lucide-react';
import { useLoading } from '@/context/LoadingContext';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BasicInfo from './BasicInfo';
import MediaUpload from './MediaUpload';
import ListingDetails from './ListingDetails';
import Documents from './Documents';
import ReviewSubmit from './ReviewSubmit';
import {
  getListingById,
  createListing,
  updateListing
} from '@/services/listingService';
import { seedIndustriesData } from '@/services/industryService';
import { ListingType, ListingStatus, ListingPlan } from '@/types/listings';
import { cn } from '@/lib/utils';

// Classification schema for industry-category-subcategory
const classificationSchema = z.object({
  industry: z.string().min(1, "Please select an industry"),
  industryName: z.string(),
  category: z.string().min(1, "Please select a category"),
  categoryName: z.string(),
  subCategories: z.array(z.string()).min(1, "Select at least one subcategory").max(3, "Maximum 3 subcategories allowed"),
  subCategoryNames: z.array(z.string())
});
const startupDetailsSchema = z.object({
  developmentStage: z.string().min(1, "Development stage is required"),
  registeredName: z.string()
    .min(3, "Registered name must be at least 3 characters")
    .max(100, "Registered name cannot exceed 100 characters"),
  foundedDate: z.date({
    required_error: "Foundation date is required",
  }),
  launchDate: z.date().optional().nullable(),
  missionStatement: z.string()
    .min(50, "Mission statement must be at least 50 characters")
    .max(300, "Mission statement cannot exceed 300 characters"),
  problemStatement: z.string()
    .min(50, "Problem statement must be at least 50 characters")
    .max(300, "Problem statement cannot exceed 300 characters"),
  solutionDescription: z.string()
    .min(100, "Solution description must be at least 100 characters")
    .max(500, "Solution description cannot exceed 500 characters"),
  team: z.object({
    teamSize: z.number({
      required_error: "Team size is required",
      invalid_type_error: "Team size must be a number"
    })
      .min(1, "Team size must be at least 1")
      .max(100, "Team size must be less than 100"),
    productStage: z.string().min(1, "Product stage is required"),
    intellectualProperty: z.array(z.string()).optional(),
    technologyStack: z.string().optional(),
    uniqueSellingPoints: z.string()
      .min(100, "Unique selling points must be at least 100 characters")
      .max(500, "Unique selling points cannot exceed 500 characters"),
    founders: z.array(z.object({
      name: z.string().min(1, "Founder name is required"),
      role: z.string().min(1, "Founder role is required"),
      experience: z.string()
        .min(50, "Experience must be at least 50 characters")
        .max(300, "Experience cannot exceed 300 characters"),
      linkedinProfile: z.string()
        .regex(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/, "Please enter a valid LinkedIn profile URL")
        .optional()
        .or(z.literal(''))
    }))
    .min(1, "At least one founder is required")
  }),
  market: z.object({
    totalUsers: z.number().min(0, "Total users cannot be negative").optional(),
    activeUsers: z.number().min(0, "Active users cannot be negative").optional()
      .superRefine((val, ctx) => {
        if (!val) return z.NEVER;
        if (!ctx.parent) return z.NEVER;
        
        const totalUsers = ctx.parent.totalUsers;
        if (totalUsers && val > totalUsers) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Active users cannot be more than total users",
          });
        }
        return z.NEVER;
      }),
    revenueModel: z.string()
      .min(50, "Revenue model must be at least 50 characters")
      .max(300, "Revenue model cannot exceed 300 characters"),
    monthlyRevenue: z.object({
      value: z.number().min(0, "Monthly revenue cannot be negative").optional(),
      formatted: z.string().optional(),
      currency: z.string().default("INR")
    }).optional(),
    growthRate: z.number().min(0, "Growth rate cannot be negative")
      .max(1000, "Growth rate cannot exceed 1000%").optional(),
    targetMarket: z.string()
      .min(50, "Target market must be at least 50 characters")
      .max(300, "Target market cannot exceed 300 characters"),
    marketSize: z.object({
      value: z.number({
        required_error: "Market size is required",
        invalid_type_error: "Market size must be a number"
      }).min(0, "Market size cannot be negative"),
      formatted: z.string().optional(),
      currency: z.string().default("INR")
    }),
    competitiveAnalysis: z.string()
      .min(100, "Competitive analysis must be at least 100 characters")
      .max(500, "Competitive analysis cannot exceed 500 characters")
  }),
  funding: z.object({
    fundingStage: z.string().min(1, "Funding stage is required"),
    totalRaisedToDate: z.object({
      value: z.number().min(0, "Total raised cannot be negative").optional(),
      formatted: z.string().optional(),
      currency: z.string().default("INR")
    }).optional(),
    currentRaisingAmount: z.object({
      value: z.number({
        required_error: "Raising amount is required",
        invalid_type_error: "Raising amount must be a number"
      }).min(0, "Raising amount cannot be negative"),
      formatted: z.string().optional(),
      currency: z.string().default("INR")
    }),
    equityOffered: z.number({
      required_error: "Equity offered is required",
      invalid_type_error: "Equity offered must be a number"
    })
      .min(0.1, "Equity offered must be at least 0.1%")
      .max(100, "Equity offered cannot exceed 100%"),
    preMoneyValuation: z.object({
      value: z.number({
        required_error: "Pre-money valuation is required",
        invalid_type_error: "Pre-money valuation must be a number"
      }).min(0, "Pre-money valuation cannot be negative"),
      formatted: z.string().optional(),
      currency: z.string().default("INR")
    }),
    useOfFunds: z.string()
      .min(100, "Use of funds must be at least 100 characters")
      .max(500, "Use of funds cannot exceed 500 characters"),
    previousInvestors: z.string()
      .max(300, "Previous investors cannot exceed 300 characters")
      .optional(),
    burnRate: z.object({
      value: z.number().min(0, "Burn rate cannot be negative").optional(),
      formatted: z.string().optional(),
      currency: z.string().default("INR")
    }).optional(),
    runway: z.number()
      .min(0, "Runway cannot be negative")
      .max(60, "Runway cannot exceed 60 months")
      .optional()
  }),
  links: z.object({
    website: z.string()
      .regex(/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}([\/\w-]*)*\/?$/, "Please enter a valid URL")
      .optional()
      .or(z.literal('')),
    pitchDeck: z.string()
      .regex(/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}([\/\w-]*)*\/?$/, "Please enter a valid URL")
      .optional()
      .or(z.literal('')),
    socialMedia: z.string().optional(),
    productDemo: z.string().optional()
  }).optional()
});
// Business Details schema
const businessDetailsSchema = z.object({
  businessType: z.string().min(1, "Business type is required"),
  entityType: z.string().min(1, "Entity type is required"),
  establishedYear: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Year must be a number")
    .refine((val) => {
      const year = parseInt(val);
      return year >= 1900 && year <= new Date().getFullYear();
    }, `Year must be between 1900 and ${new Date().getFullYear()}`),
  registrationNumber: z.string().min(1, "Registration number is required"),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  operations: z.object({
    employees: z.object({
      count: z.string()
        .refine((val) => !isNaN(parseInt(val)), "Employee count must be a number")
        .refine((val) => parseInt(val) >= 0, "Employee count must be a positive number"),
      fullTime: z.string()
        .refine((val) => !isNaN(parseInt(val)), "Full-time employee count must be a number")
        .refine((val) => parseInt(val) >= 0, "Full-time count must be a positive number"),
      partTime: z.string()
        .refine((val) => !isNaN(parseInt(val)), "Part-time employee count must be a number")
        .refine((val) => parseInt(val) >= 0, "Part-time count must be a positive number")
        .optional(),
    }).refine((data) => {
      const total = parseInt(data.count);
      const fullTime = parseInt(data.fullTime);
      const partTime = parseInt(data.partTime || '0');
      return fullTime + partTime === total;
    }, {
      message: "Full-time and part-time employees must add up to total employees",
      path: ["count"],
    }),
    locationType: z.string().min(1, "Location type is required"),
    leaseInformation: z.object({
      expiryDate: z.coerce.date({
        required_error: "Lease expiry date is required",
        invalid_type_error: "Please enter a valid date"
      }).refine((date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
        return date > today;
      }, { message: "Lease expiry date must be in the future" }),
      monthlyCost: z.object({
        value: z.string()
          .refine((val) => !isNaN(parseFloat(val)), "Lease cost must be a number")
          .refine((val) => parseFloat(val) >= 0, "Lease cost must be a positive number"),
        currency: z.string().default("INR"),
      }).optional(),
      isTransferable: z.boolean().optional(),
    }).optional(),
    operationDescription: z.string()
      .min(100, "Description must be at least 100 characters")
      .max(1000, "Description cannot exceed 1000 characters"),
  }),
  financials: z.object({
    annualRevenue: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Annual revenue must be a number")
        .refine((val) => parseFloat(val) >= 0, "Annual revenue must be a positive number"),
      currency: z.string().default("INR"),
    }),
    monthlyRevenue: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Monthly revenue must be a number")
        .refine((val) => parseFloat(val) >= 0, "Monthly revenue must be a positive number"),
      currency: z.string().default("INR"),
    }),
    profitMargin: z.object({
      percentage: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Profit margin must be a number")
        .refine((val) => parseFloat(val) >= 0 && parseFloat(val) <= 100, "Profit margin must be between 0 and 100%"),
      trend: z.string().default("stable"),
    }),
    revenueTrend: z.string().min(1, "Revenue trend is required"),
    inventory: z.object({
      isIncluded: z.boolean().optional(),
      value: z.object({
        value: z.union([
          z.string()
            .refine((val) => !isNaN(parseFloat(val)), "Inventory value must be a number")
            .refine((val) => parseFloat(val) >= 0, "Inventory value must be a positive number")
            .optional(),
          z.undefined()
        ]).optional(),
        currency: z.string().default("INR").optional(),
      }).optional(),
      description: z.string().optional(),
    }).optional(),
    equipment: z.object({
      isIncluded: z.boolean().optional(),
      value: z.object({
        value: z.string()
          .refine((val) => !isNaN(parseFloat(val)), "Equipment value must be a number")
          .refine((val) => parseFloat(val) >= 0, "Equipment value must be a positive number"),
        currency: z.string().default("INR"),
      }).optional(),
      description: z.string().min(1, "Equipment description is required").optional(),
    }).optional(),
    customerConcentration: z.string()
      .refine((val) => !isNaN(parseFloat(val)), "Customer concentration must be a number")
      .refine((val) => parseFloat(val) >= 0 && parseFloat(val) <= 100, "Customer concentration must be between 0 and 100%"),
  }),
  sale: z.object({
    askingPrice: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Asking price must be a number")
        .refine((val) => parseFloat(val) >= 0, "Asking price must be a positive number"),
      currency: z.string().default("INR"),
      priceMultiple: z.string()
        .refine((val) => val === '' || !isNaN(parseFloat(val)), "Price multiple must be a number if provided")
        .refine((val) => val === '' || (parseFloat(val) >= 0), "Price multiple must be a positive number")
        .optional(),
      isNegotiable: z.boolean().optional(),
    }),
    reasonForSelling: z.string()
      .min(50, "Reason must be at least 50 characters")
      .max(500, "Reason cannot exceed 500 characters"),
    sellerFinancing: z.object({
      isAvailable: z.boolean().optional(),
      details: z.string().optional(),
      downPaymentPercentage: z.string()
        .refine((val) => val === '' || !isNaN(parseFloat(val)), "Down payment must be a number if provided")
        .refine((val) => val === '' || (parseFloat(val) >= 10 && parseFloat(val) <= 100), "Down payment must be between 10% and 100%")
        .optional(),
    }).optional(),
    transitionPeriod: z.string()
      .refine((val) => !isNaN(parseInt(val)), "Transition period must be a number")
      .refine((val) => parseInt(val) >= 0 && parseInt(val) <= 12, "Transition period must be between 0 and 12 months"),
    trainingIncluded: z.string()
      .min(50, "Training details must be at least 50 characters")
      .max(500, "Training details cannot exceed 500 characters"),
    assetsIncluded: z.string()
      .min(100, "Assets description must be at least 100 characters")
      .max(1000, "Assets description cannot exceed 1000 characters"),
  }),
});

// Add this to your schema definitions (alongside businessDetailsSchema)
const franchiseDetailsSchema = z.object({
  franchiseBrand: z.string().min(1, "Franchise brand name is required"),
  franchiseType: z.string().min(1, "Franchise type is required"),
  franchiseSince: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Year must be a number")
    .refine((val) => {
      const year = parseInt(val);
      return year >= 1900 && year <= new Date().getFullYear();
    }, `Year must be between 1900 and ${new Date().getFullYear()}`),
  brandEstablished: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Year must be a number")
    .refine((val) => {
      const year = parseInt(val);
      return year >= 1900 && year <= new Date().getFullYear();
    }, `Year must be between 1900 and ${new Date().getFullYear()}`),
  totalUnits: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Total units must be a number")
    .refine((val) => parseInt(val) >= 0, "Total units must be a positive number"),
  franchiseeCount: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Franchisee count must be a number")
    .refine((val) => parseInt(val) >= 0, "Franchisee count must be a positive number"),
  companyOwnedUnits: z.string()
    .refine((val) => !isNaN(parseInt(val)), "Company-owned units must be a number")
    .refine((val) => parseInt(val) >= 0, "Company-owned units must be a positive number"),
  availableTerritories: z.array(z.string()).min(1, "At least one territory must be selected"),
  investment: z.object({
    franchiseFee: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Franchise fee must be a number")
        .refine((val) => parseFloat(val) >= 0, "Franchise fee must be a positive number"),
      currency: z.string().default("INR"),
    }),
    totalInitialInvestment: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Total initial investment must be a number")
        .refine((val) => parseFloat(val) >= 0, "Total initial investment must be a positive number"),
      currency: z.string().default("INR"),
    }),
    royaltyFee: z.string()
      .refine((val) => !isNaN(parseFloat(val)), "Royalty fee must be a number")
      .refine((val) => parseFloat(val) >= 0 && parseFloat(val) <= 50, "Royalty fee must be between 0 and 50%"),
    marketingFee: z.string()
      .refine((val) => !isNaN(parseFloat(val)), "Marketing fee must be a number")
      .refine((val) => parseFloat(val) >= 0 && parseFloat(val) <= 20, "Marketing fee must be between 0 and 20%"),
    royaltyStructure: z.string().min(10, "Royalty structure details are required"),
    recurringFees: z.string().min(10, "Recurring fees information is required"),
  }),
  support: z.object({
    initialTraining: z.string().min(10, "Initial training details are required"),
    trainingDuration: z.string().min(1, "Training duration is required"),
    trainingLocation: z.string().min(1, "Training location is required"),
    ongoingSupport: z.string().min(10, "Ongoing support details are required"),
    fieldSupport: z.string().min(1, "Field support information is required"),
    marketingSupport: z.string().min(10, "Marketing support details are required"),
    technologySystems: z.string().min(10, "Technology systems details are required"),
    siteSelection: z.boolean().optional(),
  }),
  performance: z.object({
    averageUnitSales: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Average unit sales must be a number")
        .refine((val) => parseFloat(val) >= 0, "Average unit sales must be a positive number"),
      currency: z.string().default("INR"),
    }),
    successRate: z.string().optional()
      .refine((val) => val === '' || !isNaN(parseFloat(val)), "Success rate must be a number if provided")
      .refine((val) => val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100), "Success rate must be between 0 and 100%"),
    salesGrowth: z.string().min(1, "Sales growth information is required"),
    averageBreakeven: z.string().min(1, "Average breakeven information is required"),
    franchiseeRequirements: z.string().min(10, "Franchisee requirements are required"),
    netWorthRequirement: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Net worth requirement must be a number")
        .refine((val) => parseFloat(val) >= 0, "Net worth requirement must be a positive number"),
      currency: z.string().default("INR"),
    }),
    liquidCapitalRequired: z.object({
      value: z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Liquid capital requirement must be a number")
        .refine((val) => parseFloat(val) >= 0, "Liquid capital requirement must be a positive number"),
      currency: z.string().default("INR"),
    }),
  }),
});

// Replace the investorDetailsSchema definition with this:
const investorDetailsSchema = z.object({
  investorType: z.string().min(1, "Investor type is required"),
  yearsOfExperience: z.number({
    required_error: "Years of experience is required", 
    invalid_type_error: "Years of experience must be a number"
  }).min(0, "Years cannot be negative").max(100, "Years cannot exceed 100"),
  
  // Fixed validation for team size - doesn't use getValues anymore
  investmentTeamSize: z.number().optional().nullable()
    .superRefine((value, ctx) => {
      // Get the investor type from the parent object
      const investorType = ctx.parent?.investorType;
      const isInstitutional = investorType && 
        ['venture_capital', 'private_equity', 'family_office', 'corporate'].includes(investorType);
      
      if (isInstitutional && (value === null || value === undefined || value < 1)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Team size is required for institutional investors",
        });
      }
      return z.NEVER;
    }),
  
  investmentPhilosophy: z.string()
    .min(100, "Investment philosophy must be at least 100 characters")
    .max(500, "Investment philosophy cannot exceed 500 characters"),
  backgroundSummary: z.string()
    .min(100, "Background summary must be at least 100 characters")
    .max(500, "Background summary cannot exceed 500 characters"),
  keyAchievements: z.string().max(500, "Key achievements cannot exceed 500 characters").optional(),
  investment: z.object({
    annualInvestmentTarget: z.object({
      value: z.string().optional(),
      formatted: z.string().optional(),
      currency: z.string().default("INR"),
    }).optional(),
    decisionTimeline: z.string()
      .min(1, "Decision timeline is required")
      .max(100, "Decision timeline cannot exceed 100 characters"),
    preferredRounds: z.array(z.string())
      .min(1, "Please select at least one investment round"),
    isLeadInvestor: z.boolean().optional(),
    preferredEquityStake: z.object({
      min: z.number().min(0).max(100).optional(),
      max: z.number().min(0).max(100).optional(),
    }).optional(),
  }),
  focus: z.object({
    primaryIndustries: z.array(z.string())
      .min(1, "Please select at least one primary industry")
      .max(5, "You can select up to 5 primary industries"),
    secondaryIndustries: z.array(z.string()).optional(),
    businessStagePreference: z.array(z.string())
      .min(1, "Please select at least one business stage"),
    geographicFocus: z.array(z.string())
      .min(1, "Please select at least one geographic region"),
    investmentCriteria: z.string()
      .min(100, "Investment criteria must be at least 100 characters")
      .max(500, "Investment criteria cannot exceed 500 characters"),
    minimumRevenue: z.object({
      value: z.string().optional(),
      formatted: z.string().optional(),
      currency: z.string().default("INR"),
    }).optional(),
    minimumTraction: z.string().max(300, "Minimum traction cannot exceed 300 characters").optional(),
  }),
  portfolio: z.object({
    portfolioSize: z.number().min(0, "Portfolio size cannot be negative").optional(),
    
    // Fixed validation for active investments
    activeInvestments: z.number().min(0, "Active investments cannot be negative").optional()
      .superRefine((value, ctx) => {
        const portfolioSize = ctx.parent?.portfolioSize;
        if (portfolioSize !== undefined && value !== undefined && value > portfolioSize) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Active investments cannot exceed total portfolio size",
          });
        }
        return z.NEVER;
      }),
      
    successStories: z.string().max(500, "Success stories cannot exceed 500 characters").optional(),
    investmentProcess: z.string()
      .min(100, "Investment process must be at least 100 characters")
      .max(500, "Investment process cannot exceed 500 characters"),
    postInvestmentSupport: z.string()
      .min(100, "Post-investment support must be at least 100 characters")
      .max(500, "Post-investment support cannot exceed 500 characters"),
    reportingRequirements: z.string().max(300, "Reporting requirements cannot exceed 300 characters").optional(),
    boardInvolvement: z.string().optional(),
  }),
});


// Main listing schema
const listingSchema = z.object({
  // Core Fields (common across all types)
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  type: z.nativeEnum(ListingType, { errorMap: () => ({ message: "Please select a listing type" }) }),

  // Classification fields - now as an array (1-3 items)
  classifications: z.array(classificationSchema)
    .min(1, "Please add at least one industry classification")
    .max(3, "You can add up to 3 industry classifications"),

  // Legacy fields for backward compatibility
  industry: z.string().optional(),
  industryName: z.string().optional(),
  category: z.string().optional(),
  categoryName: z.string().optional(),
  subCategories: z.array(z.string()).optional(),
  subCategoryNames: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),

  description: z.string().min(100, "Description must be at least 100 characters").max(5000, "Description cannot exceed 5000 characters"),
  shortDescription: z.string().optional(),
  status: z.nativeEnum(ListingStatus, { errorMap: () => ({ message: "Please select a status" }) }),
  plan: z.nativeEnum(ListingPlan, { errorMap: () => ({ message: "Please select a plan" }) }),

  // Location Information (required)
  location: z.object({
    country: z.string().min(1, "Country is required"),
    countryName: z.string().optional(),
    state: z.string().min(1, "State is required"),
    stateName: z.string().optional(),
    city: z.string().min(1, "City is required"),
    cityName: z.string().optional(),
    address: z.string().optional(),
    pincode: z.string().optional(),
    displayLocation: z.string().optional(),
  }),

  // Contact Information
  contactInfo: z.object({
    email: z.string().email("Please enter a valid email"),
    phone: z.string().optional(),
    alternatePhone: z.string().optional(),
    website: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
    contactName: z.string().optional(),
    preferredContactMethod: z.string().optional(),
  }),

  // Type-specific details
  businessDetails: businessDetailsSchema.optional(),
  franchiseDetails: franchiseDetailsSchema.optional(),
  startupDetails: startupDetailsSchema.optional(),
  investorDetails: investorDetailsSchema.optional(),
  // digitalAssetDetails: digitalAssetDetailsSchema.optional(),

  // Media validation
  mediaValidation: z.any().optional(),
  
  // Media and type-specific fields are handled separately
}).catchall(z.any());



// Migration helper to convert old schema to new schema
const migrateListingData = (data) => {
  // If data already has classifications array, just return it
  if (data.classifications && Array.isArray(data.classifications) && data.classifications.length > 0) {
    return data;
  }

  // Create new data object with all existing properties
  const newData = { ...data };

  // Check if we have legacy fields to migrate
  if (data.industry || data.industries) {
    // Create classifications array
    newData.classifications = [];
    
    // If we have single industry data
    if (data.industry) {
      newData.classifications.push({
        industry: data.industry,
        industryName: data.industryName || '',
        category: data.category || '',
        categoryName: data.categoryName || '',
        subCategories: Array.isArray(data.subCategories) ? data.subCategories : [],
        subCategoryNames: Array.isArray(data.subCategoryNames) ? data.subCategoryNames : []
      });
    }
    
    // If we have multiple industries data (legacy)
    else if (Array.isArray(data.industries)) {
      data.industries.forEach((industry, index) => {
        newData.classifications.push({
          industry,
          industryName: data.industryNames?.[index] || '',
          category: '',
          categoryName: '',
          subCategories: [],
          subCategoryNames: []
        });
      });
    }
  }
  
  // If we still don't have classifications (no legacy data), add an empty one
  if (!newData.classifications || newData.classifications.length === 0) {
    newData.classifications = [{
      industry: '',
      industryName: '',
      category: '',
      categoryName: '',
      subCategories: [],
      subCategoryNames: []
    }];
  }
  
  return newData;
};

const steps = [
  { id: 'basic-info', title: 'Basic Info', component: BasicInfo },
  { id: 'media', title: 'Media', component: MediaUpload },
  { id: 'details', title: 'Details', component: ListingDetails },
  { id: 'documents', title: 'Documents', component: Documents },
  { id: 'review', title: 'Review & Submit', component: ReviewSubmit },
];

// Storage keys
const STORAGE_KEYS = {
  FORM_DATA: 'listingFormData',
  IMAGES: 'listingFormImages',
  FEATURED_IMAGE: 'listingFormFeaturedImage',
  STEP: 'listingFormStep'
};

// Helper function for safe localStorage operations
const safeStorage = {
  get: (key, defaultValue = null) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage:`, error);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  },
  clear: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error(`Error clearing localStorage:`, error);
      return false;
    }
  }
};

// Helper function to sanitize images for storage
const sanitizeImagesForStorage = (images) => {
  if (!images || !Array.isArray(images)) return [];
  
  return images.map(image => {
    if (!image) return null;
    
    // Create a new clean object with only the necessary data
    const sanitizedImage = {
      id: image.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: image.name || 'image',
      size: image.size || 0,
      url: image.url || image.preview || '',
      preview: image.preview || image.url || '',
      type: image.type || 'image/jpeg'
    };
    
    // Add path only if it exists
    if (image.path) {
      sanitizedImage.path = image.path;
    }
    
    // Preserve base64 data if it exists
    if (image.base64) {
      sanitizedImage.base64 = image.base64;
    }
    
    // Remove any file objects which can't be serialized
    if (sanitizedImage.file) {
      delete sanitizedImage.file;
    }
    
    return sanitizedImage;
  }).filter(Boolean); // Remove any nulls
};

function ListingForm({ isEdit = false, externalOnSubmit }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { startLoading, stopLoading } = useLoading();
  
  // IMPORTANT: Read from localStorage synchronously to avoid flicker
  // This is crucial for proper tab preservation
  const initialStep = (() => {
    try {
      const savedStep = localStorage.getItem(STORAGE_KEYS.STEP);
      if (savedStep !== null) {
        const stepIndex = parseInt(savedStep, 10);
        if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < steps.length) {
          return stepIndex;
        }
      }
    } catch (e) {
      console.error("Error loading initial step:", e);
    }
    return 0;
  })();
  
  // Pre-load saved images to prevent flicker
  const initialImages = (() => {
    try {
      // Try multiple storage locations for better reliability
      const primaryStorage = localStorage.getItem(STORAGE_KEYS.IMAGES);
      const secondaryStorage = localStorage.getItem('listingFormImagesData');
      
      let savedImages = primaryStorage || secondaryStorage;
      
      if (savedImages) {
        const parsed = JSON.parse(savedImages);
        if (Array.isArray(parsed)) {
          // Ensure all images have required properties
          return parsed.map((img, idx) => ({
            ...img,
            id: img.id || `local-img-${Date.now()}-${idx}`,
            // Prefer base64 data if available
            url: img.base64 || img.url || img.preview || '',
            preview: img.base64 || img.preview || img.url || '',
            type: img.type || 'image/jpeg'
          }));
        }
      }
    } catch (e) {
      console.error("Error loading saved images:", e);
    }
    return [];
  })();
  
  // Pre-load featured image index
  const initialFeaturedIndex = (() => {
    try {
      const savedIndex = localStorage.getItem(STORAGE_KEYS.FEATURED_IMAGE);
      if (savedIndex !== null) {
        const index = parseInt(savedIndex, 10);
        return !isNaN(index) ? index : 0;
      }
    } catch (e) {
      console.error("Error loading featured image index:", e);
    }
    return 0;
  })();

  // State variables
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState(initialImages);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [documentsToDelete, setDocumentsToDelete] = useState([]);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [stepErrors, setStepErrors] = useState({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(initialFeaturedIndex);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [transitioningStep, setTransitioningStep] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);

  // Refs for debouncing and tracking
  const saveTimeout = useRef(null);
  const pendingStep = useRef(null);

  // Initialize react-hook-form with default values that can be loaded from localStorage
  const methods = useForm({
    resolver: zodResolver(listingSchema),
    mode: 'onChange',
    defaultValues: {
      type: undefined,
      name: '',
      classifications: [{
        industry: '',
        industryName: '',
        category: '',
        categoryName: '',
        subCategories: [],
        subCategoryNames: []
      }],
      description: '',
      status: ListingStatus.DRAFT,
      plan: ListingPlan.FREE,
      location: {
        country: 'IN',
        countryName: 'India',
        state: '',
        city: '',
      },
      contactInfo: {
        email: '',
        phone: '',
      },
      mediaValidation: initialImages.length >= 3,
      businessDetails: {
        businessType: '',
        entityType: '',
        establishedYear: new Date().getFullYear().toString(),
        registrationNumber: '',
        operations: {
          employees: {
            count: '0',
            fullTime: '0',
            partTime: '0',
          },
          locationType: '',
          operationDescription: '',
        },
        financials: {
          annualRevenue: {
            value: '0',
            currency: 'INR',
          },
          monthlyRevenue: {
            value: '0',
            currency: 'INR',
          },
          profitMargin: {
            percentage: '0',
            trend: 'stable',
          },
          revenueTrend: '',
          customerConcentration: '0',
        },
        sale: {
          askingPrice: {
            value: '0',
            currency: 'INR',
            priceMultiple: '',
            isNegotiable: true,
          },
          reasonForSelling: '',
          transitionPeriod: '1',
          trainingIncluded: '',
          assetsIncluded: '',
        },
        startupDetails: {
          developmentStage: '',
          registeredName: '',
          foundedDate: new Date(),
          missionStatement: '',
          problemStatement: '',
          solutionDescription: '',
          team: {
            teamSize: 1,
            productStage: '',
            intellectualProperty: [],
            technologyStack: '',
            uniqueSellingPoints: '',
            founders: [{
              name: '',
              role: '',
              experience: ''
            }]
          },
          market: {
            totalUsers: 0,
            activeUsers: 0,
            revenueModel: '',
            monthlyRevenue: {
              value: 0,
              currency: 'INR'
            },
            growthRate: 0,
            targetMarket: '',
            marketSize: {
              value: 0,
              currency: 'INR'
            },
            competitiveAnalysis: ''
          },
          funding: {
            fundingStage: '',
            totalRaisedToDate: {
              value: 0,
              currency: 'INR'
            },
            currentRaisingAmount: {
              value: 0,
              currency: 'INR'
            },
            equityOffered: 0,
            preMoneyValuation: {
              value: 0,
              currency: 'INR'
            },
            useOfFunds: '',
            previousInvestors: '',
            burnRate: {
              value: 0,
              currency: 'INR'
            },
            runway: 0
          },
          links: {
            website: '',
            pitchDeck: '',
            socialMedia: '',
            productDemo: ''
          }
        }
      }
    },
    shouldUnregister: false
  });

  const { handleSubmit, reset, trigger, formState: { errors }, watch, setValue, getValues } = methods;

  // Watch listing type to update type-specific forms
  const listingType = watch('type');

  // Load saved data on component mount
  useEffect(() => {
    // Flag to track if component is mounted
    let isMounted = true;
    
    const initForm = async () => {
      if (!isMounted) return;
      setInitialLoading(true);
      
      try {
        if (!isEdit) {
          // Load form data from localStorage
          const savedFormData = safeStorage.get(STORAGE_KEYS.FORM_DATA);
          if (savedFormData) {
            reset(savedFormData);
          }
          
          // We already loaded images and featured index in initialization
          if (initialImages.length >= 3) {
            setValue('mediaValidation', true);
          }
          
          setDataLoaded(true);
          setInitialLoading(false);
        }
        
        // Seed industry data (can happen in background)
        await seedIndustriesData();
        
        // If in edit mode, load from server
        if (isEdit && id) {
          setIsLoading(true);
          startLoading('Loading listing data...');
          
          try {
            const listingData = await getListingById(id);
            if (!isMounted) return;
            
            setListing(listingData);
            
            // Migrate and reset form data
            const migratedData = migrateListingData(listingData);
            reset(migratedData);
            
            // Process images
            if (listingData.media?.galleryImages) {
              const processedImages = listingData.media.galleryImages.map((img, idx) => ({
                ...img,
                id: img.id || `server-img-${Date.now()}-${idx}`,
                url: img.url || img.preview || '',
                preview: img.preview || img.url || '',
                type: img.type || 'image/jpeg'
              }));
              
              setUploadedImages(processedImages);
              setValue('mediaValidation', processedImages.length >= 3);
              
              // Set first image as featured
              if (processedImages.length > 0) {
                setFeaturedImageIndex(0);
              }
            }
            
            // Load documents
            if (listingData.documents) {
              setUploadedDocuments(listingData.documents);
            }
            
            setDataLoaded(true);
          } catch (error) {
            console.error('Error loading listing:', error);
            if (isMounted) {
              toast.error('Failed to load listing data. Please try again.');
              navigate('/listings');
            }
          } finally {
            if (isMounted) {
              setIsLoading(false);
              stopLoading();
              setInitialLoading(false);
            }
          }
        } else {
          if (isMounted) {
            setInitialLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        if (isMounted) {
          setDataLoaded(true);
          setInitialLoading(false);
        }
      }
    };

    initForm();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [id, isEdit, navigate, reset, setValue, startLoading, stopLoading, initialImages.length]);

  // Save form data when it changes
  useEffect(() => {
    // Don't save in edit mode
    if (isEdit) return;
    
    // Clean up on unmount
    let isMounted = true;
    
    const saveFormData = () => {
      if (!isMounted) return;
      
      try {
        const formData = getValues();
        if (formData) {
          const cleanData = { ...formData };
          // Remove potentially problematic fields
          delete cleanData.mediaUploads;
          delete cleanData.file;
          safeStorage.set(STORAGE_KEYS.FORM_DATA, cleanData);
        }
      } catch (error) {
        console.error("Error saving form data:", error);
      }
    };
    
    // Debounced save
    const debouncedSave = () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(saveFormData, 500);
    };
    
    const subscription = watch(debouncedSave);
    
    return () => {
      isMounted = false;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      subscription.unsubscribe();
    };
  }, [isEdit, getValues, watch]);

  // Save current step when it changes
  useEffect(() => {
    if (isEdit) return;
    
    // IMPORTANT: Save step immediately to ensure it's saved before reload
    localStorage.setItem(STORAGE_KEYS.STEP, currentStep);
    
    // Also save in our reference
    pendingStep.current = currentStep;
  }, [currentStep, isEdit]);
  
  // Save featured image index when it changes
  useEffect(() => {
    if (!isEdit) {
      localStorage.setItem(STORAGE_KEYS.FEATURED_IMAGE, featuredImageIndex);
    }
  }, [featuredImageIndex, isEdit]);
  
  // Save images when they change
  useEffect(() => {
    if (!isEdit && dataLoaded) {
      // Sanitize images before saving
      const sanitizedImages = sanitizeImagesForStorage(uploadedImages);
      localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(sanitizedImages));
    }
  }, [uploadedImages, isEdit, dataLoaded]);
  
  // Update error state
  useEffect(() => {
    const newErrors = {};
    
    // Basic Info errors (step 0)
    const basicInfoFields = ['name', 'type', 'classifications', 'description', 'status', 'plan', 'location', 'contactInfo'];
    const hasBasicInfoErrors = Object.keys(errors).some(key => 
      basicInfoFields.some(field => key === field || key.startsWith(`${field}.`))
    );
    
    if (hasBasicInfoErrors) {
      newErrors[0] = true;
    }
    
    // Media errors (step 1)
    if (uploadedImages.length < 3) {
      newErrors[1] = true;
    }
    
    // Details errors (step 2)
    const detailsField = listingType ? `${listingType.toLowerCase()}Details` : '';
    const hasDetailsErrors = Object.keys(errors).some(key => key.startsWith(detailsField));
    
    if (hasDetailsErrors) {
      newErrors[2] = true;
    }
    
    setStepErrors(newErrors);
  }, [errors, listingType, uploadedImages.length]);

  // Handle image upload
  const handleImageUpload = (files) => {
    // Validate files first
    if (!files || !Array.isArray(files) || files.length === 0) {
      console.warn("No valid files to upload");
      return;
    }
    
    // Create a copy of the current images
    const currentImages = [...uploadedImages];
    const wasEmpty = currentImages.length === 0;
    
    // Add the new images
    const newImages = [...currentImages, ...files];
    
    // Update state
    setUploadedImages(newImages);
    
    // Set featured image if this is the first upload
    if (wasEmpty && files.length > 0) {
      console.log("Setting first image as featured");
      setFeaturedImageIndex(0);
      
      // Save featured index to localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.FEATURED_IMAGE, "0");
      } catch (e) {
        console.error("Error saving featured index:", e);
      }
    }
    
    // Update validation
    setValue('mediaValidation', newImages.length >= 3);
    
    // Save to localStorage (for immediate persistence)
    // But only save the IDs to avoid quota issues
    try {
      // Just save image IDs instead of full image data
      const sanitizedImages = sanitizeImagesForStorage(newImages);
      localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(sanitizedImages));
      
      // Also save to secondary storage as backup
      localStorage.setItem('listingFormImagesData', JSON.stringify(sanitizedImages));
    } catch (e) {
      console.error("Error saving images:", e);
    }
    
    console.log("Images updated:", newImages.length);
    
    // Show success toast
    toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully`);
  };

  // Handle image deletion
  const handleImageDelete = (imageToDelete) => {
    // Add to delete list if it's a server image
    if (imageToDelete.url || imageToDelete.path) {
      setImagesToDelete(prev => [...prev, imageToDelete.path || imageToDelete.url]);
    }
    
    // Find the image index
    const imageIndex = uploadedImages.findIndex(img => {
      if (imageToDelete.id && img.id) return img.id === imageToDelete.id;
      if (imageToDelete.path && img.path) return img.path === imageToDelete.path;
      if (imageToDelete.url && img.url) return img.url === imageToDelete.url;
      return false;
    });
    
    // If image not found, exit
    if (imageIndex === -1) {
      console.warn("Image not found:", imageToDelete);
      return;
    }
    
    // Create new array without the deleted image
    const newImages = [...uploadedImages];
    newImages.splice(imageIndex, 1);
    
    // Update state
    setUploadedImages(newImages);
    
    // Handle featured image adjustment
    let newFeaturedIndex = featuredImageIndex;
    
    if (imageIndex === featuredImageIndex) {
      // If deleting the featured image, set the first remaining as featured
      if (newImages.length > 0) {
        newFeaturedIndex = 0;
      } else {
        newFeaturedIndex = -1;
      }
      setFeaturedImageIndex(newFeaturedIndex);
    } else if (imageIndex < featuredImageIndex) {
      // If deleting before the featured image, decrement index
      newFeaturedIndex = featuredImageIndex - 1;
      setFeaturedImageIndex(newFeaturedIndex);
    }
    
    // Update validation
    setValue('mediaValidation', newImages.length >= 3);
    
    // Save to localStorage (for immediate persistence)
    try {
      const sanitizedImages = sanitizeImagesForStorage(newImages);
      localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(sanitizedImages));
      localStorage.setItem('listingFormImagesData', JSON.stringify(sanitizedImages));
      localStorage.setItem(STORAGE_KEYS.FEATURED_IMAGE, newFeaturedIndex.toString());
    } catch (e) {
      console.error("Error saving after deletion:", e);
    }
    
    // Show toast
    toast.success("Image deleted");
  };

  // Handle setting featured image
  const handleSetFeatured = (index) => {
    setFeaturedImageIndex(index);
    localStorage.setItem(STORAGE_KEYS.FEATURED_IMAGE, index.toString());
  };

  // Fixed document upload handler with proper typing and error handling
const handleDocumentUpload = async (files) => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    console.warn("No valid files to upload");
    return;
  }

  try {
    // Use document-specific loading state
    setDocumentUploadLoading(true);
    
    // Process the files to ensure they have the expected format
    const processedFiles = files.map(file => {
      // If it's already a File object with required properties, use it
      if (file instanceof File) {
        // Add type information based on file extension/mimetype for better categorization
        const getDocType = (file) => {
          const filename = file.name.toLowerCase();
          const mimetype = file.type.toLowerCase();
          
          if (mimetype.includes('pdf') || filename.endsWith('.pdf')) {
            return 'pdf';
          } else if (mimetype.includes('word') || filename.endsWith('.doc') || filename.endsWith('.docx')) {
            return 'doc';
          } else if (mimetype.includes('excel') || mimetype.includes('spreadsheet') || 
                   filename.endsWith('.xls') || filename.endsWith('.xlsx')) {
            return 'spreadsheet';
          } else if (mimetype.includes('image')) {
            return 'image';
          } else if (mimetype.includes('text')) {
            return 'text';
          } else {
            return 'document';
          }
        };
        
        return {
          id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file: file,
          name: file.name,
          type: getDocType(file),
          mime: file.type,
          size: file.size,
          uploadDate: new Date(),
          description: file.name,
          isPublic: false // Default to private
        };
      }
      
      // If it's an object that appears like a document but not a File instance
      if (file && file.name) {
        return {
          ...file,
          id: file.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          // Ensure we have these standard fields
          description: file.description || file.name,
          isPublic: !!file.isPublic,
          type: file.type || 'document'
        };
      }
      
      // Fallback for unknown format
      return {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file: file,
        name: 'Document',
        type: 'document',
        size: 0,
        description: 'Document',
        isPublic: false
      };
    });
    
    // Add the processed documents to state
    setUploadedDocuments(prev => [...prev, ...processedFiles]);
    
    // Success message
    toast.success(`${files.length} document${files.length > 1 ? 's' : ''} uploaded successfully`);
  } catch (error) {
    console.error("Error processing documents:", error);
    toast.error("Failed to process documents. Please try again.");
  } finally {
    // Clear document-specific loading state after a slight delay to avoid flicker
    setTimeout(() => {
      setDocumentUploadLoading(false);
    }, 500);
  }
};


  // Handle document deletion
  const handleDocumentDelete = (docToDelete) => {
    if (docToDelete.url || docToDelete.id) {
      setDocumentsToDelete(prev => [...prev, docToDelete.id]);
    }
    
    setUploadedDocuments(prev => {
      if (docToDelete.id) {
        return prev.filter(doc => doc.id !== docToDelete.id);
      }
      return prev.filter(doc => doc !== docToDelete);
    });
  };

  // Handle save as draft
  const handleSaveAsDraft = () => {
    setSaveAsDraft(true);
    setValue('status', ListingStatus.DRAFT);
    handleSubmit(onSubmit)();
  };

  // Extract error messages for display
  const getErrorMessages = (errors) => {
    const messages = [];

    const extractErrors = (obj, path = '') => {
      if (!obj) return;

      if (obj.message) {
        messages.push({ path, message: obj.message });
        return;
      }

      if (typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key;
          extractErrors(value, newPath);
        });
      }
    };

    extractErrors(errors);
    return messages;
  };

  // Replace the handleNext function in ListingForm.jsx with this implementation
const handleNext = async () => {
  // Set submitAttempted to true to show all validation errors
  setSubmitAttempted(true);
  
  try {
    // Validate current step
    let isStepValid = false;
    let currentStepErrors = [];
    
    switch (currentStep) {
      case 0: // Basic Info
        const basicInfoFields = ['name', 'type', 'classifications', 'description', 'status', 'plan', 'location', 'contactInfo'];
        isStepValid = await trigger(basicInfoFields);
        
        if (!isStepValid) {
          currentStepErrors = getErrorMessages(errors).filter(error => {
            return basicInfoFields.some(field => error.path === field || error.path.startsWith(`${field}.`));
          });
          setErrorMessages(currentStepErrors);
          setShowErrorSummary(true);
          toast.dismiss(); 
          toast.error('Please fix the errors before proceeding');
          window.scrollTo(0, 0);
          return; // Exit function if validation fails
        }
        break;
        
      case 1: // Media
        if (uploadedImages.length < 3) {
          toast.error('Please upload at least 3 images to continue');
          return; // Exit function if not enough images
        }
        isStepValid = true;
        break;
        
      case 2: // Details
        // Type-specific validation based on listing type
        if (listingType === ListingType.BUSINESS) {
          // Create an array of all the business fields to validate
          const businessFieldPaths = [
            'businessDetails.businessType',
            'businessDetails.entityType',
            'businessDetails.establishedYear',
            'businessDetails.registrationNumber',
            'businessDetails.operations.employees.count',
            'businessDetails.operations.employees.fullTime',
            'businessDetails.operations.locationType',
            'businessDetails.operations.operationDescription',
            'businessDetails.financials.annualRevenue.value',
            'businessDetails.financials.monthlyRevenue.value',
            'businessDetails.financials.profitMargin.percentage',
            'businessDetails.financials.revenueTrend',
            'businessDetails.financials.customerConcentration',
            'businessDetails.sale.askingPrice.value',
            'businessDetails.sale.reasonForSelling',
            'businessDetails.sale.transitionPeriod',
            'businessDetails.sale.trainingIncluded',
            'businessDetails.sale.assetsIncluded'
          ];
          
          // Trigger validation for all business fields
          await Promise.all(businessFieldPaths.map(field => trigger(field)));
          
          // Then check if there are any errors
          isStepValid = !Object.keys(errors).some(key => 
            key === 'businessDetails' || key.startsWith('businessDetails.')
          );
          
          if (!isStepValid) {
            currentStepErrors = getErrorMessages(errors).filter(error => 
              error.path === 'businessDetails' || error.path.startsWith('businessDetails.')
            );
            
            setErrorMessages(currentStepErrors);
            setShowErrorSummary(true);
            toast.dismiss(); // Dismiss previous toasts
  toast.error('Please fix the errors before proceeding');
            window.scrollTo(0, 0);
            return; // Exit function if validation fails
          }
        } else if (listingType === ListingType.FRANCHISE) {
          // Create an array of all the franchise fields to validate
          const franchiseFieldPaths = [
            'franchiseDetails.franchiseBrand',
            'franchiseDetails.franchiseType',
            'franchiseDetails.franchiseSince',
            'franchiseDetails.brandEstablished',
            'franchiseDetails.totalUnits',
            'franchiseDetails.franchiseeCount',
            'franchiseDetails.companyOwnedUnits',
            'franchiseDetails.availableTerritories',
            'franchiseDetails.investment.franchiseFee.value',
            'franchiseDetails.investment.totalInitialInvestment.value',
            'franchiseDetails.investment.royaltyFee',
            'franchiseDetails.investment.marketingFee',
            'franchiseDetails.investment.royaltyStructure',
            'franchiseDetails.investment.recurringFees',
            'franchiseDetails.support.initialTraining',
            'franchiseDetails.support.trainingDuration',
            'franchiseDetails.support.trainingLocation',
            'franchiseDetails.support.ongoingSupport',
            'franchiseDetails.support.fieldSupport',
            'franchiseDetails.support.marketingSupport',
            'franchiseDetails.support.technologySystems',
            'franchiseDetails.performance.averageUnitSales.value',
            'franchiseDetails.performance.salesGrowth',
            'franchiseDetails.performance.averageBreakeven',
            'franchiseDetails.performance.franchiseeRequirements',
            'franchiseDetails.performance.netWorthRequirement.value',
            'franchiseDetails.performance.liquidCapitalRequired.value'
          ];
          
          // First trigger all fields individually to gather all validation errors
          await Promise.all(franchiseFieldPaths.map(field => trigger(field)));
          
          // Then check if there are any errors
          const hasErrors = Object.keys(errors).some(key => 
            key === 'franchiseDetails' || key.startsWith('franchiseDetails.')
          );
          
          if (hasErrors) {
            currentStepErrors = getErrorMessages(errors).filter(error => 
              error.path === 'franchiseDetails' || error.path.startsWith('franchiseDetails.')
            );
            
            setErrorMessages(currentStepErrors);
            setShowErrorSummary(true);
            window.scrollTo(0, 0);
            toast.dismiss(); // Dismiss previous toasts
            toast.error('Please fix all errors before proceeding');
            return; // Exit function if validation fails
          }
          
          // Extra validation for available territories
          const territories = getValues('franchiseDetails.availableTerritories') || [];
          if (territories.length === 0) {
            toast.error('Please select at least one territory');
            return; // Exit function if validation fails
          }
        } else if (listingType === ListingType.STARTUP) {
          // Trigger validation for all startup fields
          isStepValid = await trigger('startupDetails');
          
          if (!isStepValid) {
            currentStepErrors = getErrorMessages(errors).filter(error => 
              error.path.startsWith('startupDetails')
            );
            
            setErrorMessages(currentStepErrors);
            setShowErrorSummary(true);
            toast.dismiss(); // Dismiss previous toasts
  toast.error('Please fix the errors before proceeding');
            return; // Exit function if validation fails
          }
        } else if (listingType === ListingType.INVESTOR) {
          // Create an array of all the investor fields to validate
          const investorFieldPaths = [
            'investorDetails.investorType',
            'investorDetails.yearsOfExperience',
            'investorDetails.investmentPhilosophy',
            'investorDetails.backgroundSummary',
            'investorDetails.investment.decisionTimeline',
            'investorDetails.investment.preferredRounds',
            'investorDetails.focus.primaryIndustries',
            'investorDetails.focus.businessStagePreference',
            'investorDetails.focus.geographicFocus',
            'investorDetails.focus.investmentCriteria',
            'investorDetails.portfolio.investmentProcess',
            'investorDetails.portfolio.postInvestmentSupport'
          ];
          
          // Check if institutional investor fields are required
          const investorType = getValues('investorDetails.investorType');
          const isInstitutional = investorType && ['venture_capital', 'private_equity', 'family_office', 'corporate'].includes(investorType);
          
          if (isInstitutional) {
            investorFieldPaths.push('investorDetails.investmentTeamSize');
          }
          
          // Trigger validation for all investor fields
          await Promise.all(investorFieldPaths.map(field => trigger(field)));
          
          // Then check if there are any errors
          isStepValid = !Object.keys(errors).some(key => 
            key === 'investorDetails' || key.startsWith('investorDetails.')
          );
          
          if (!isStepValid) {
            currentStepErrors = getErrorMessages(errors).filter(error => 
              error.path === 'investorDetails' || error.path.startsWith('investorDetails.')
            );
            
            setErrorMessages(currentStepErrors);
            setShowErrorSummary(true);
            toast.dismiss(); // Dismiss previous toasts
  toast.error('Please fix the errors before proceeding');
            window.scrollTo(0, 0);
            return; // Exit function if validation fails
          }
        }
        else if (listingType === ListingType.STARTUP) {
          // Create an array of all the startup fields to validate
          const startupFieldPaths = [
            'startupDetails.developmentStage',
            'startupDetails.registeredName',
            'startupDetails.foundedDate',
            'startupDetails.missionStatement',
            'startupDetails.problemStatement',
            'startupDetails.solutionDescription',
            'startupDetails.team.teamSize',
            'startupDetails.team.productStage',
            'startupDetails.team.uniqueSellingPoints',
            'startupDetails.team.founders',
            'startupDetails.market.revenueModel',
            'startupDetails.market.targetMarket',
            'startupDetails.market.marketSize.value',
            'startupDetails.market.competitiveAnalysis',
            'startupDetails.funding.fundingStage',
            'startupDetails.funding.currentRaisingAmount.value',
            'startupDetails.funding.equityOffered',
            'startupDetails.funding.preMoneyValuation.value',
            'startupDetails.funding.useOfFunds'
          ];
          
          // Add conditional validation for user metrics based on development stage
          const devStage = getValues('startupDetails.developmentStage');
          if (devStage && devStage !== 'idea' && devStage !== 'mvp') {
            startupFieldPaths.push('startupDetails.market.totalUsers');
            startupFieldPaths.push('startupDetails.market.activeUsers');
          }
          
          // Add conditional validation for monthly revenue based on funding stage
          if (devStage && ['seed', 'series_a', 'series_b_plus'].includes(devStage)) {
            startupFieldPaths.push('startupDetails.market.monthlyRevenue.value');
          }
          
          // Trigger validation for all startup fields
          await Promise.all(startupFieldPaths.map(field => trigger(field)));
          
          // Then check if there are any errors
          isStepValid = !Object.keys(errors).some(key => 
            key === 'startupDetails' || key.startsWith('startupDetails.')
          );
          
          if (!isStepValid) {
            currentStepErrors = getErrorMessages(errors).filter(error => 
              error.path === 'startupDetails' || error.path.startsWith('startupDetails.')
            );
            
            setErrorMessages(currentStepErrors);
            setShowErrorSummary(true);
            toast.dismiss(); // Dismiss previous toasts
            toast.error('Please fix the errors before proceeding');
            window.scrollTo(0, 0);
            return; // Exit function if validation fails
          }
          
          // Validate that we have at least one founder
          const founders = getValues('startupDetails.team.founders') || [];
          if (founders.length === 0) {
            toast.error('Please add at least one founder');
            return; // Exit function if validation fails
          }
        } 
        else if (listingType === ListingType.DIGITAL_ASSET) {
          isStepValid = await trigger('digitalAssetDetails');
          
          if (!isStepValid) {
            currentStepErrors = getErrorMessages(errors).filter(error => 
              error.path.startsWith('digitalAssetDetails')
            );
            
            setErrorMessages(currentStepErrors);
            setShowErrorSummary(true);
            toast.dismiss(); // Dismiss previous toasts
  toast.error('Please fix the errors before proceeding');
            return; // Exit function if validation fails
          }
        }
        break;
        
      case 3: // Documents
        // Document validation is optional
        isStepValid = true;
        break;
        
      case 4: // Review & Submit
        // Validate all fields before submitting
        isStepValid = await trigger();
        
        if (!isStepValid) {
          currentStepErrors = getErrorMessages(errors);
          setErrorMessages(currentStepErrors);
          setShowErrorSummary(true);
          toast.error('Please fix the errors before submitting');
          return; // Exit function if validation fails
        }
        break;
        
      default:
        isStepValid = true;
        break;
    }

    // Only start transition if validation passes
    setTransitioningStep(true);
    
    // If validation passes, move to next step or submit
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      
      // IMPORTANT: Immediately save the next step to localStorage
      localStorage.setItem(STORAGE_KEYS.STEP, nextStep.toString());
      pendingStep.current = nextStep;
      
      setTimeout(() => {
        setSubmitAttempted(false); // Reset submission state when changing steps
        setCurrentStep(nextStep);
        window.scrollTo(0, 0);
        setShowErrorSummary(false);
        setTransitioningStep(false);
      }, 300);
    } else {
      // Submit form on final step
      setTransitioningStep(false);
      handleSubmit(onSubmit)();
    }
  } catch (error) {
    console.error("Error during form validation:", error);
    toast.error('An error occurred. Please try again.');
  }
};

  // FIXED: handlePrevious with proper state reset
  const handlePrevious = () => {
    if (currentStep > 0) {
      setTransitioningStep(true);
      
      const prevStep = currentStep - 1;
      
      // IMPORTANT: Immediately save the previous step to localStorage
      localStorage.setItem(STORAGE_KEYS.STEP, prevStep.toString());
      pendingStep.current = prevStep;
      
      // Reset validation state when changing steps
      setTimeout(() => {
        setSubmitAttempted(false); // Reset submission state when changing steps
        setCurrentStep(prevStep);
        window.scrollTo(0, 0);
        setShowErrorSummary(false);
        setTransitioningStep(false);
      }, 300);
    }
  };
// Enhanced form submission handler
const onSubmit = async (data) => {
  try {
    // Use external loading if available, otherwise manage our own
    if (!externalOnSubmit) {
      startLoading(isEdit ? 'Updating listing...' : 'Creating listing...');
    }
    
    setIsLoading(true);
    console.log("Starting form submission...");

    // Check that we have at least the required number of images
    if (uploadedImages.length < 3) {
      toast.error('You must upload at least 3 images');
      stopLoading();
      setIsLoading(false);
      return;
    }

    // Prepare listing data
    const listingData = {
      ...data,
      // Set short description if not provided
      shortDescription: data.shortDescription || data.description.substring(0, 150) + '...',
      // Set featured image
      featuredImageIndex
    };
    
    console.log(`Prepared submission with ${uploadedImages.length} images and ${uploadedDocuments.length} documents`);

    // If external onSubmit is provided, use it
    if (externalOnSubmit) {
      try {
        console.log("Using external onSubmit handler");
        
        // Ensure documents are in the expected format for the service
        const formattedDocuments = uploadedDocuments.map(doc => {
          // If this is a document from server with URL, skip it in upload
          if (doc.url) {
            return null;
          }
          
          return {
            file: doc.file || doc, // Handle both object with file property and direct File objects
            type: doc.type || 'document',
            description: doc.description || doc.name || 'Document',
            isPublic: !!doc.isPublic
          };
        }).filter(Boolean); // Remove null items (server documents)
        
        console.log(`Submitting to external handler with ${formattedDocuments.length} new documents`);
        
        // Submit with timeout protection
        const submitPromise = externalOnSubmit(listingData, uploadedImages, formattedDocuments);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Submission timed out")), 120000)
        );
        
        // Race against timeout
        const result = await Promise.race([submitPromise, timeoutPromise]);
        
        if (result === false) {
          // External handler returned false to indicate failure
          console.error("External submission handler returned failure");
          throw new Error("Failed to save listing");
        }
        
        console.log("External submission completed successfully");
      } catch (error) {
        console.error("Error in external submission:", error);
        toast.error(`Failed to save listing: ${error.message || 'Unknown error'}`);
        throw error; // Rethrow to reach the finally block
      }
    } else {
      // Create or update listing using internal logic
      if (isEdit) {
        await updateListing(
          id,
          listingData,
          uploadedImages.filter(img => !img.url), // New images
          uploadedDocuments.filter(doc => !doc.url), // New documents
          imagesToDelete,
          documentsToDelete
        );

        toast.success('Listing updated successfully!');
      } else {
        const newListingId = await createListing(
          listingData,
          uploadedImages,
          uploadedDocuments
        );

        // Clear stored form data on success
        safeStorage.clear();

        toast.success('Listing created successfully!');
        navigate(`/listings/${newListingId}`);
      }
    }
  } catch (error) {
    console.error('Error submitting listing:', error);
    toast.error(`Failed to save listing: ${error.message || 'Unknown error'}`);
  } finally {
    if (!externalOnSubmit) {
      stopLoading();
    }
    setIsLoading(false);
    setSaveAsDraft(false);
  }
};

  // Loading state
  if (isLoading || initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="md" color="primary" text={initialLoading ? "Loading saved form data..." : "Loading listing data..."} />
      </div>
    );
  }

  // Get current step component
  const StepComponent = steps[currentStep].component;

  return (
    <div className="w-full px-2 md:px-4 mx-auto">
      {/* Progress Stepper */}
      <div className="mb-4 max-w-full mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step indicator */}
              <div className="flex flex-col items-center relative">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${
                    index < currentStep
                      ? 'bg-[#0031ac] text-white border-[#0031ac]'
                      : index === currentStep
                        ? 'bg-white text-[#0031ac] border-[#0031ac]'
                        : 'bg-white text-gray-400 border-gray-300'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <span className="text-xs md:text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                {/* Error indicator */}
                {stepErrors[index] && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] z-10">
                    !
                  </span>
                )}
                
                <span className={`text-[10px] md:text-xs mt-1 font-medium text-center ${
                  index <= currentStep ? 'text-[#0031ac]' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1 md:mx-2 ${
                  index < currentStep ? 'bg-[#0031ac]' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <div className="bg-white rounded-lg shadow border border-gray-100 p-3 md:p-4">
            {/* Step title */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">{steps[currentStep].title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentStep === 0 && "Enter the basic information about your listing"}
                {currentStep === 1 && "Upload images to showcase your listing"}
                {currentStep === 2 && "Provide detailed information about your listing"}
                {currentStep === 3 && "Upload relevant documents to support your listing"}
                {currentStep === 4 && "Review your listing before submitting"}
              </p>
            </div>

            {/* Error summary if submission attempted */}
            {submitAttempted && showErrorSummary && errorMessages.length > 0 && (
              <div className="mb-4 p-3 border border-red-200 bg-red-50 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-medium text-red-800">Please fix the following errors:</h3>
                      <button 
                        type="button"
                        onClick={() => setShowErrorSummary(false)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <ul className="mt-1 text-xs text-red-700 space-y-0.5">
                      {errorMessages.map((error, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-1.5">•</span>
                          <span>{error.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step Content with transition */}
            <div className={`mb-4 ${transitioningStep ? 'opacity-25' : 'opacity-100'} transition-opacity duration-300`}>
              <StepComponent
                uploadedImages={uploadedImages}
                onImageUpload={handleImageUpload}
                onImageDelete={handleImageDelete}
                onSetFeatured={handleSetFeatured}
                featuredImageIndex={featuredImageIndex}
                uploadedDocuments={uploadedDocuments}
                onDocumentUpload={handleDocumentUpload}
                onDocumentDelete={handleDocumentDelete}
                submitAttempted={submitAttempted}
                isLoading={!dataLoaded}
                listingType={listingType}
              />
            </div>

            {/* Loading overlay while transitioning */}
            {transitioningStep && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
                <div className="flex flex-col items-center">
                  <Loader className="h-6 w-6 text-[#0031ac] animate-spin" />
                  <p className="mt-2 text-xs text-gray-600">Loading...</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200">
              <div>
                {currentStep > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                    disabled={transitioningStep}
                    className={`text-sm ${transitioningStep ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Previous
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/listings')}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                    disabled={transitioningStep}
                    className={`text-sm ${transitioningStep ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Back to Listings
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAsDraft}
                  leftIcon={<Save className="h-4 w-4" />}
                  disabled={transitioningStep}
                  className={`text-sm ${transitioningStep ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Save as Draft
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  rightIcon={currentStep < steps.length - 1 ? <ChevronRight className="h-4 w-4" /> : undefined}
                  disabled={transitioningStep}
                  className={`text-sm ${transitioningStep ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {currentStep < steps.length - 1 ? 'Next' : 'Submit Listing'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

export default ListingForm;