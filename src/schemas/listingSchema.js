/**
 * Listing Schema
 * 
 * This file contains all schema definitions for the listing forms with proper
 * conditional validation logic to handle dependent fields.
 */

import { z } from 'zod';
import { ListingType, ListingStatus, ListingPlan } from '@/types/listings';

// Helper function to safely handle arrays
const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [];
};

/**
 * Common utility refinements
 */
const refinements = {
  yearRange: (min = 1900, max = new Date().getFullYear()) => 
    z.union([
      z.string()
        .trim()
        .refine(val => val !== "", "Year is required")
        .refine((val) => !isNaN(parseInt(val)), "Year must be a number")
        .refine((val) => {
          const year = parseInt(val);
          return year >= min && year <= max;
        }, `Year must be between ${min} and ${max}`)
        .transform(val => val.toString()),
      z.number()
        .int("Year must be a whole number")
        .min(min, `Year must be at least ${min}`)
        .max(max, `Year cannot exceed ${max}`)
        .transform(val => val.toString()),
      z.literal(""),
      z.undefined(),
      z.null()
    ]).nullable().optional(),
      
  positiveNumber: (errorMsg = "Must be a positive number") => 
    z.union([
      z.string()
        .trim()
        .refine(val => val !== "" ? !isNaN(parseFloat(val)) : true, "Must be a number")
        .refine(val => val === "" || parseFloat(val) >= 0, errorMsg)
        .transform(val => val === "" ? null : val),
      z.number()
        .min(0, errorMsg)
        .transform(val => val.toString()),
      z.literal(""),
      z.undefined(),
      z.null()
    ]).nullable().optional(),
      
  percentageRange: (min = 0, max = 100, errorMsg) => 
    z.union([
      z.string()
        .trim()
        .refine(val => val !== "" ? !isNaN(parseFloat(val)) : true, "Must be a number")
        .refine(
          (val) => val === "" || (parseFloat(val) >= min && parseFloat(val) <= max), 
          errorMsg || `Must be between ${min}% and ${max}%`
        )
        .transform(val => val === "" ? null : val),
      z.number()
        .min(min, errorMsg || `Must be at least ${min}%`)
        .max(max, errorMsg || `Cannot exceed ${max}%`)
        .transform(val => val.toString()),
      z.literal(""),
      z.undefined(),
      z.null()
    ]).nullable().optional(),
      
  moneyObject: (errorMsg = "Must be a positive number") => 
    z.object({
      value: z.union([
        z.string()
          .trim()
          .refine(val => val !== "" ? !isNaN(parseFloat(val)) : true, "Must be a number")
          .refine(val => val === "" || parseFloat(val) >= 0, errorMsg)
          .transform(val => val === "" ? null : val),
        z.number()
          .min(0, errorMsg)
          .transform(val => val.toString()),
        z.literal(""),
        z.undefined(),
        z.null()
      ]).nullable().optional(),
      currency: z.string().default("INR").nullable().optional(),
    }).nullable().optional(),
    
  optionalUrl: () => 
    z.string()
      .regex(
        /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}([\/\w-]*)*\/?$/, 
        "Please enter a valid URL"
      )
      .nullable()
      .optional()
      .or(z.literal(''))
};

/**
 * Classification schema for industry-category-subcategory
 */
export const classificationSchema = z.object({
  industry: z.string().min(1, "Please select an industry").nullable()
    .transform(val => val === null ? "" : val),
  industryName: z.string().nullable()
    .transform(val => val === null ? "" : val),
  category: z.string().min(1, "Please select a category").nullable()
    .transform(val => val === null ? "" : val),
  categoryName: z.string().nullable()
    .transform(val => val === null ? "" : val),
  subCategories: z.array(z.string())
    .min(1, "Select at least one subcategory")
    .max(3, "Maximum 3 subcategories allowed")
    .nullable()
    .default([])
    .transform(val => Array.isArray(val) ? val : []),
  subCategoryNames: z.array(z.string())
    .nullable()
    .default([])
    .transform(val => Array.isArray(val) ? val : [])
});

/**
 * Business Details Schema
 * 
 * Includes proper conditional validation for fields that depend on other values
 */
export const businessDetailsSchema = z.object({
  businessType: z.string().min(1, "Business type is required"),
  entityType: z.string().min(1, "Entity type is required"),
  establishedYear: refinements.yearRange(),
  registrationNumber: z.string().min(1, "Registration number is required"),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  operations: z.object({
    employees: z.object({
      count: refinements.positiveNumber("Employee count must be a positive number"),
      fullTime: refinements.positiveNumber("Full-time employee count must be a positive number")
        .superRefine((val, ctx) => {
          const total = parseInt(ctx.parent?.count || '0');
          const fullTime = parseInt(val || '0');
          
          // Skip validation if any field is empty or not a number
          if (isNaN(total) || isNaN(fullTime)) {
            return z.NEVER;
          }
          
          // Ensure full-time doesn't exceed total
          if (fullTime > total) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Full-time employees cannot exceed total employees",
              path: [],
            });
          }
          return z.NEVER;
        }),
      // Part-time is now a calculated field (total - fullTime)
      partTime: z.union([
        z.string(),
        z.number().transform(val => val.toString())
      ]).optional()
    }),
    locationType: z.string().min(1, "Location type is required"),
    leaseInformation: z.object({
      expiryDate: z.preprocess(
        (val) => {
          // Handle different input formats
          if (val === "" || val === null || val === undefined) return undefined;
          // Try to parse date string
          const date = new Date(val);
          return isNaN(date.getTime()) ? undefined : date;
        },
        z.date({
          required_error: "Lease expiry date is required",
          invalid_type_error: "Please enter a valid date"
        })
        .refine((date) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
          return date > today;
        }, { message: "Lease expiry date must be in the future" })
        .optional()
      ),
      monthlyCost: refinements.moneyObject("Lease cost must be a positive number").optional(),
      isTransferable: z.boolean().optional(),
    }).optional()
      .superRefine((val, ctx) => {
        // Get the parent context to access the sibling field
        const locationType = ctx.parent?.locationType;
        
        // Lease information should be required if location type is 'leased'
        if (locationType === 'leased' && !val) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Lease information is required for leased premises",
            path: [],
          });
        }
        return z.NEVER;
      }),
    operationDescription: z.string()
      .min(100, "Description must be at least 100 characters")
      .max(1000, "Description cannot exceed 1000 characters"),
  }),
  financials: z.object({
    annualRevenue: refinements.moneyObject("Annual revenue must be a positive number"),
    monthlyRevenue: refinements.moneyObject("Monthly revenue must be a positive number"),
    profitMargin: z.object({
      percentage: refinements.percentageRange(0, 100, "Profit margin must be between 0 and 100%"),
      trend: z.string().default("stable"),
    }),
    revenueTrend: z.string().min(1, "Revenue trend is required"),
    inventory: z.object({
      isIncluded: z.boolean().optional(),
      value: z.object({
        value: z.union([
          refinements.positiveNumber("Inventory value must be a positive number").optional(),
          z.undefined()
        ]).optional(),
        currency: z.string().default("INR").optional(),
      }).optional()
        .superRefine((val, ctx) => {
          // Check if inventory is included but no value is provided
          const isIncluded = ctx.parent?.isIncluded;
          if (isIncluded && (!val || !val.value)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Inventory value is required when inventory is included",
              path: ["value"],
            });
          }
          return z.NEVER;
        }),
      description: z.string().optional()
        .superRefine((val, ctx) => {
          // Description should be required if inventory is included
          const isIncluded = ctx.parent?.isIncluded;
          if (isIncluded && (!val || val.trim() === '')) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Inventory description is required when inventory is included",
              path: [],
            });
          }
          return z.NEVER;
        }),
    }).optional(),
    equipment: z.object({
      isIncluded: z.boolean().optional(),
      value: refinements.moneyObject("Equipment value must be a positive number").optional()
        .superRefine((val, ctx) => {
          // Check if equipment is included but no value is provided
          const isIncluded = ctx.parent?.isIncluded;
          if (isIncluded && (!val || !val.value)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Equipment value is required when equipment is included",
              path: ["value"],
            });
          }
          return z.NEVER;
        }),
      description: z.string().optional()
        .superRefine((val, ctx) => {
          // Description should be required if equipment is included
          const isIncluded = ctx.parent?.isIncluded;
          if (isIncluded && (!val || val.trim() === '')) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Equipment description is required when equipment is included",
              path: [],
            });
          }
          return z.NEVER;
        }),
    }).optional(),
    customerConcentration: refinements.percentageRange(0, 100, "Customer concentration must be between 0 and 100%"),
  }),
  sale: z.object({
    askingPrice: z.object({
      value: refinements.positiveNumber("Asking price must be a positive number"),
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
      details: z.string().optional()
        .superRefine((val, ctx) => {
          // Details should be required if seller financing is available
          const isAvailable = ctx.parent?.isAvailable;
          if (isAvailable && (!val || val.trim() === '')) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Financing details are required when seller financing is available",
              path: [],
            });
          }
          return z.NEVER;
        }),
      downPaymentPercentage: z.union([
        z.string()
          .refine((val) => val === '' || !isNaN(parseFloat(val)), "Down payment must be a number if provided")
          .refine((val) => val === '' || (parseFloat(val) >= 10 && parseFloat(val) <= 100), "Down payment must be between 10% and 100%"),
        z.number()
          .min(10, "Down payment must be at least 10%")
          .max(100, "Down payment cannot exceed 100%")
          .transform(val => val.toString())
      ]).optional()
        .superRefine((val, ctx) => {
          // Down payment should be required if seller financing is available
          const isAvailable = ctx.parent?.isAvailable;
          if (isAvailable && (!val || val.toString().trim() === '')) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Down payment percentage is required when seller financing is available",
              path: [],
            });
          }
          return z.NEVER;
        }),
    }).optional(),
    transitionPeriod: z.union([
      z.string()
        .refine((val) => !isNaN(parseInt(val)), "Transition period must be a number")
        .refine((val) => parseInt(val) >= 0 && parseInt(val) <= 12, "Transition period must be between 0 and 12 months"),
      z.number()
        .int("Transition period must be a whole number")
        .min(0, "Transition period must be at least 0 months")
        .max(12, "Transition period cannot exceed 12 months")
        .transform(val => val.toString())
    ]),
    trainingIncluded: z.string()
      .min(50, "Training details must be at least 50 characters")
      .max(500, "Training details cannot exceed 500 characters"),
    assetsIncluded: z.string()
      .min(100, "Assets description must be at least 100 characters")
      .max(1000, "Assets description cannot exceed 1000 characters"),
  }),
});

/**
 * Franchise Details Schema
 */
export const franchiseDetailsSchema = z.object({
  franchiseBrand: z.string().min(1, "Franchise brand name is required"),
  franchiseType: z.string().min(1, "Franchise type is required"),
  franchiseSince: refinements.yearRange(),
  brandEstablished: refinements.yearRange(),
  totalUnits: refinements.positiveNumber("Total units must be a positive number"),
  franchiseeCount: refinements.positiveNumber("Franchisee count must be a positive number"),
  // Company-owned units is now a virtual field that's calculated automatically
  companyOwnedUnits: z.union([
    z.string(),
    z.number().transform(val => val.toString())
  ]).optional(),
  availableTerritories: z.array(z.string())
    .min(1, "At least one territory must be selected")
    .default([])
    .transform(safeArray),
  investment: z.object({
    franchiseFee: refinements.moneyObject("Franchise fee must be a positive number"),
    totalInitialInvestment: refinements.moneyObject("Total initial investment must be a positive number"),
    royaltyFee: refinements.percentageRange(0, 50, "Royalty fee must be between 0 and 50%"),
    marketingFee: refinements.percentageRange(0, 20, "Marketing fee must be between 0 and 20%"),
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
    averageUnitSales: refinements.moneyObject("Average unit sales must be a positive number"),
    successRate: z.union([
      z.string().optional()
        .refine((val) => val === '' || !isNaN(parseFloat(val)), "Success rate must be a number if provided")
        .refine((val) => val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100), "Success rate must be between 0 and 100%"),
      z.number()
        .min(0, "Success rate must be at least 0%")
        .max(100, "Success rate cannot exceed 100%")
        .transform(val => val.toString())
        .optional()
    ]),
    salesGrowth: z.string().min(1, "Sales growth information is required"),
    averageBreakeven: z.string().min(1, "Average breakeven information is required"),
    franchiseeRequirements: z.string().min(10, "Franchisee requirements are required"),
    netWorthRequirement: refinements.moneyObject("Net worth requirement must be a positive number"),
    liquidCapitalRequired: refinements.moneyObject("Liquid capital requirement must be a positive number"),
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
      value: z.union([
        z.string().optional(),
        z.number().transform(val => val.toString()).optional()
      ]),
      formatted: z.string().optional(),
      currency: z.string().default("INR"),
    }).optional(),
    minimumTraction: z.string().max(300, "Minimum traction cannot exceed 300 characters").optional(),
  }),
  portfolio: z.object({
    portfolioSize: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseInt(val)), "Portfolio size must be a number")
        .transform(val => val === '' ? undefined : parseInt(val))
        .optional(),
      z.number().min(0, "Portfolio size cannot be negative").optional()
    ]),
    
    // Active investments must be less than total portfolio size
    activeInvestments: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseInt(val)), "Active investments must be a number")
        .transform(val => val === '' ? undefined : parseInt(val))
        .optional(),
      z.number().min(0, "Active investments cannot be negative").optional()
    ])
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

/**
 * Investor Details Schema
 */
export const investorDetailsSchema = z.object({
  investorType: z.string().min(1, "Investor type is required"),
  yearsOfExperience: z.union([
    z.string()
      .refine((val) => !isNaN(parseInt(val)), "Years of experience must be a number")
      .refine((val) => parseInt(val) >= 0, "Years cannot be negative")
      .refine((val) => parseInt(val) <= 100, "Years cannot exceed 100")
      .transform(val => parseInt(val)),
    z.number({
      required_error: "Years of experience is required", 
      invalid_type_error: "Years of experience must be a number"
    }).min(0, "Years cannot be negative").max(100, "Years cannot exceed 100")
  ]),
  
  // Team size is conditionally required based on investor type
  investmentTeamSize: z.union([
    z.string()
      .refine((val) => !isNaN(parseInt(val)), "Team size must be a number")
      .transform(val => parseInt(val))
      .optional()
      .nullable(),
    z.number().optional().nullable()
  ])
    .superRefine((value, ctx) => {
      // Get the investor type from the parent object
      const investorType = ctx.parent?.investorType;
      
      // List of institutional investor types that require team size
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
      value: z.union([
        z.string().optional(),
        z.number().transform(val => val.toString()).optional()
      ]),
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
      min: z.union([
        z.string()
          .refine((val) => val === '' || !isNaN(parseFloat(val)), "Minimum equity stake must be a number")
          .transform(val => val === '' ? undefined : parseFloat(val))
          .optional(),
        z.number().min(0).max(100).optional()
      ]),
      max: z.union([
        z.string()
          .refine((val) => val === '' || !isNaN(parseFloat(val)), "Maximum equity stake must be a number")
          .transform(val => val === '' ? undefined : parseFloat(val))
          .optional(),
        z.number().min(0).max(100).optional()
      ]),
    }).optional()
      .superRefine((val, ctx) => {
        // Validate that min is less than max if both are provided
        if (val && val.min !== undefined && val.max !== undefined && val.min > val.max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Minimum equity stake cannot be greater than maximum equity stake",
            path: ["min"],
          });
        }
        return z.NEVER;
      }),
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
      value: z.union([
        z.string().optional(),
        z.number().transform(val => val.toString()).optional()
      ]),
      formatted: z.string().optional(),
      currency: z.string().default("INR"),
    }).optional(),
    minimumTraction: z.string().max(300, "Minimum traction cannot exceed 300 characters").optional(),
  }),
  portfolio: z.object({
    portfolioSize: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseInt(val)), "Portfolio size must be a number")
        .transform(val => val === '' ? undefined : parseInt(val))
        .optional(),
      z.number().min(0, "Portfolio size cannot be negative").optional()
    ]),
    
    // Active investments must be less than total portfolio size
    activeInvestments: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseInt(val)), "Active investments must be a number")
        .transform(val => val === '' ? undefined : parseInt(val))
        .optional(),
      z.number().min(0, "Active investments cannot be negative").optional()
    ])
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

/**
 * Startup Details Schema
 */
export const startupDetailsSchema = z.object({
  developmentStage: z.string().min(1, "Development stage is required"),
  registeredName: z.string()
    .min(3, "Registered name must be at least 3 characters")
    .max(100, "Registered name cannot exceed 100 characters"),
  foundedDate: z.preprocess(
    (val) => {
      // Handle different input formats
      if (val === "" || val === null || val === undefined) return undefined;
      // Try to parse date string
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    },
    z.date({
      required_error: "Foundation date is required",
      invalid_type_error: "Please enter a valid date",
    }).optional()
  ),
  launchDate: z.preprocess(
    (val) => {
      // Handle different input formats
      if (val === "" || val === null || val === undefined) return undefined;
      // Try to parse date string
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    },
    z.date({
      invalid_type_error: "Please enter a valid date",
    }).optional()
  ).superRefine((val, ctx) => {
    // If launch date is provided, it should be after the founded date
    const foundedDate = ctx.parent?.foundedDate;
    if (val && foundedDate && val < foundedDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Launch date cannot be before the founding date",
      });
    }
    return z.NEVER;
  }),
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
    teamSize: z.union([
      z.string()
        .refine((val) => !isNaN(parseInt(val)), "Team size must be a number")
        .refine((val) => parseInt(val) >= 1, "Team size must be at least 1")
        .refine((val) => parseInt(val) <= 100, "Team size must be less than 100")
        .transform(val => parseInt(val)),
      z.number({
        required_error: "Team size is required",
        invalid_type_error: "Team size must be a number"
      })
        .min(1, "Team size must be at least 1")
        .max(100, "Team size must be less than 100")
    ]),
    productStage: z.string().min(1, "Product stage is required"),
    intellectualProperty: z.preprocess(
      (val) => (Array.isArray(val) ? val : (val === false || val === null || val === undefined) ? [] : []),
      z.array(z.string()).optional()
    ),
    technologyStack: z.string().optional(),
    uniqueSellingPoints: z.string()
      .min(100, "Unique selling points must be at least 100 characters")
      .max(500, "Unique selling points cannot exceed 500 characters"),
    founders: z.preprocess(
      (val) => {
        if (Array.isArray(val)) return val;
        if (val === false || val === null || val === undefined) return [];
        return [];
      },
      z.array(z.object({
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
      .default([])
    ).superRefine((founders, ctx) => {
      // Founders array size should not exceed team size
      const teamSize = ctx.parent?.teamSize || 0;
      if (founders.length > teamSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Number of founders cannot exceed team size",
        });
      }
      return z.NEVER;
    }),
  }),
  market: z.object({
    totalUsers: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseInt(val)), "Total users must be a number")
        .transform(val => val === '' ? undefined : parseInt(val))
        .optional(),
      z.number().min(0, "Total users cannot be negative").optional(),
      z.undefined()
    ]),
    activeUsers: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseInt(val)), "Active users must be a number")
        .transform(val => val === '' ? undefined : parseInt(val))
        .optional(),
      z.number().min(0, "Active users cannot be negative").optional(),
      z.undefined()
    ])
      .superRefine((val, ctx) => {
        // Active users should not exceed total users
        const totalUsers = ctx.parent?.totalUsers;
        if (totalUsers !== undefined && val !== undefined && val > totalUsers) {
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
    monthlyRevenue: z.preprocess(
      (val) => val === null || val === undefined ? { value: undefined, currency: 'INR' } : val,
      z.object({
        value: z.union([
          z.string()
            .refine((val) => val === '' || !isNaN(parseFloat(val)), "Monthly revenue must be a number")
            .transform(val => val === '' ? undefined : parseFloat(val))
            .optional(),
          z.number().min(0, "Monthly revenue cannot be negative").optional(),
          z.undefined()
        ]),
        formatted: z.string().optional(),
        currency: z.string().default("INR")
      }).optional()
    ),
    growthRate: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseFloat(val)), "Growth rate must be a number")
        .refine((val) => val === '' || parseFloat(val) >= 0, "Growth rate cannot be negative")
        .refine((val) => val === '' || parseFloat(val) <= 1000, "Growth rate cannot exceed 1000%")
        .transform(val => val === '' ? undefined : parseFloat(val))
        .optional(),
      z.number().min(0, "Growth rate cannot be negative")
        .max(1000, "Growth rate cannot exceed 1000%").optional(),
      z.undefined()
    ]),
    targetMarket: z.string()
      .min(50, "Target market must be at least 50 characters")
      .max(300, "Target market cannot exceed 300 characters"),
    marketSize: z.preprocess(
      (val) => val === null || val === undefined ? { value: 0, currency: 'INR' } : val,
      z.object({
        value: z.union([
          z.string()
            .refine((val) => !isNaN(parseFloat(val)), "Market size must be a number")
            .refine((val) => parseFloat(val) >= 0, "Market size cannot be negative")
            .transform(val => parseFloat(val)),
          z.number({
            required_error: "Market size is required",
            invalid_type_error: "Market size must be a number"
          }).min(0, "Market size cannot be negative")
        ]),
        formatted: z.string().optional(),
        currency: z.string().default("INR")
      })
    ),
    competitiveAnalysis: z.string()
      .min(100, "Competitive analysis must be at least 100 characters")
      .max(500, "Competitive analysis cannot exceed 500 characters")
  }),
  funding: z.object({
    fundingStage: z.string().min(1, "Funding stage is required"),
    totalRaisedToDate: z.preprocess(
      (val) => val === null || val === undefined ? { value: undefined, currency: 'INR' } : val,
      z.object({
        value: z.union([
          z.string()
            .refine((val) => val === '' || !isNaN(parseFloat(val)), "Total raised must be a number")
            .transform(val => val === '' ? undefined : parseFloat(val))
            .optional(),
          z.number().min(0, "Total raised cannot be negative").optional(),
          z.undefined()
        ]),
        formatted: z.string().optional(),
        currency: z.string().default("INR")
      }).optional()
    ),
    currentRaisingAmount: z.preprocess(
      (val) => val === null || val === undefined ? { value: 0, currency: 'INR' } : val,
      z.object({
        value: z.union([
          z.string()
            .refine((val) => !isNaN(parseFloat(val)), "Raising amount must be a number")
            .refine((val) => parseFloat(val) >= 0, "Raising amount cannot be negative")
            .transform(val => parseFloat(val)),
          z.number({
            required_error: "Raising amount is required",
            invalid_type_error: "Raising amount must be a number"
          }).min(0, "Raising amount cannot be negative")
        ]),
        formatted: z.string().optional(),
        currency: z.string().default("INR")
      })
    ),
    equityOffered: z.union([
      z.string()
        .refine((val) => !isNaN(parseFloat(val)), "Equity offered must be a number")
        .refine((val) => parseFloat(val) >= 0.1, "Equity offered must be at least 0.1%")
        .refine((val) => parseFloat(val) <= 100, "Equity offered cannot exceed 100%")
        .transform(val => parseFloat(val)),
      z.number({
        required_error: "Equity offered is required",
        invalid_type_error: "Equity offered must be a number"
      })
        .min(0.1, "Equity offered must be at least 0.1%")
        .max(100, "Equity offered cannot exceed 100%")
    ]),
    preMoneyValuation: z.preprocess(
      (val) => val === null || val === undefined ? { value: 0, currency: 'INR' } : val,
      z.object({
        value: z.union([
          z.string()
            .refine((val) => !isNaN(parseFloat(val)), "Pre-money valuation must be a number")
            .refine((val) => parseFloat(val) >= 0, "Pre-money valuation cannot be negative")
            .transform(val => parseFloat(val)),
          z.number({
            required_error: "Pre-money valuation is required",
            invalid_type_error: "Pre-money valuation must be a number"
          }).min(0, "Pre-money valuation cannot be negative")
        ]),
        formatted: z.string().optional(),
        currency: z.string().default("INR")
      })
    ),
    useOfFunds: z.string()
      .min(100, "Use of funds must be at least 100 characters")
      .max(500, "Use of funds cannot exceed 500 characters"),
    previousInvestors: z.string()
      .max(300, "Previous investors cannot exceed 300 characters")
      .optional(),
    burnRate: z.preprocess(
      (val) => val === null || val === undefined ? { value: undefined, currency: 'INR' } : val,
      z.object({
        value: z.union([
          z.string()
            .refine((val) => val === '' || !isNaN(parseFloat(val)), "Burn rate must be a number")
            .refine((val) => val === '' || parseFloat(val) >= 0, "Burn rate cannot be negative")
            .transform(val => val === '' ? undefined : parseFloat(val))
            .optional(),
          z.number().min(0, "Burn rate cannot be negative").optional(),
          z.undefined()
        ]),
        formatted: z.string().optional(),
        currency: z.string().default("INR")
      }).optional()
    ),
    runway: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseInt(val)), "Runway must be a number")
        .refine((val) => val === '' || parseInt(val) >= 0, "Runway cannot be negative")
        .refine((val) => val === '' || parseInt(val) <= 60, "Runway cannot exceed 60 months")
        .transform(val => val === '' ? undefined : parseInt(val))
        .optional(),
      z.number()
        .min(0, "Runway cannot be negative")
        .max(60, "Runway cannot exceed 60 months")
        .optional(),
      z.undefined()
    ])
  }),
  links: z.object({
    website: refinements.optionalUrl(),
    pitchDeck: refinements.optionalUrl(),
    socialMedia: z.string().optional(),
    productDemo: z.string().optional()
  }).optional()
});

/**
 * Digital Asset Details Schema
 */
export const digitalAssetDetailsSchema = z.object({
  assetType: z.string().min(1, "Asset type is required"),
  creationDate: z.coerce.date().optional(),
  technical: z.object({
    domainName: z.string()
      .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/, "Please enter a valid domain name")
      .optional()
      .or(z.literal(''))
      .superRefine((val, ctx) => {
        // Domain name is required for website and domain asset types
        const assetType = ctx.parent?.parent?.assetType;
        if ((assetType === 'website' || assetType === 'domain') && (!val || val.trim() === '')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Domain name is required for website and domain assets",
          });
        }
        return z.NEVER;
      }),
    platform: z.string().optional()
      .superRefine((val, ctx) => {
        // Platform is required for app, SaaS, and marketplace asset types
        const assetType = ctx.parent?.parent?.assetType;
        if ((assetType === 'app' || assetType === 'saas' || assetType === 'marketplace') && 
            (!val || val.trim() === '')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Platform is required for app, SaaS, and marketplace assets",
          });
        }
        return z.NEVER;
      }),
    technology: z.string().optional(),
    hosting: z.string().optional(),
    mobileFriendly: z.boolean().optional(),
  }),
  traffic: z.object({
    monthlyVisitors: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseInt(val)), "Monthly visitors must be a number")
        .refine((val) => val === '' || parseInt(val) >= 0, "Monthly visitors cannot be negative")
        .transform(val => val === '' ? undefined : parseInt(val))
        .optional(),
      z.number().min(0, "Monthly visitors cannot be negative").optional()
    ]),
    trafficSources: z.array(z.string()).optional(),
    // Traffic percentage fields - no need to validate sum equals 100% since UI handles auto-distribution
    organicTrafficPercentage: z.union([
      z.string().optional(),
      z.number().min(0).max(100).optional()
    ]),
    directTrafficPercentage: z.union([
      z.string().optional(),
      z.number().min(0).max(100).optional()
    ]),
    referralTrafficPercentage: z.union([
      z.string().optional(),
      z.number().min(0).max(100).optional()
    ]),
    socialTrafficPercentage: z.union([
      z.string().optional(),
      z.number().min(0).max(100).optional()
    ]),
    otherTrafficPercentage: z.union([
      z.string().optional(),
      z.number().min(0).max(100).optional()
    ]),
    // Custom error field for UI to display total percentage error
    totalPercentageError: z.string().optional(),
    pageViews: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseInt(val)), "Page views must be a number")
        .refine((val) => val === '' || parseInt(val) >= 0, "Page views cannot be negative")
        .transform(val => val === '' ? undefined : parseInt(val))
        .optional(),
      z.number().min(0, "Page views cannot be negative").optional()
    ]),
    bounceRate: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseFloat(val)), "Bounce rate must be a number")
        .refine((val) => val === '' || parseFloat(val) >= 0, "Bounce rate cannot be negative")
        .refine((val) => val === '' || parseFloat(val) <= 100, "Bounce rate cannot exceed 100%")
        .transform(val => val === '' ? undefined : parseFloat(val))
        .optional(),
      z.number().min(0, "Bounce rate cannot be negative")
        .max(100, "Bounce rate cannot exceed 100%").optional()
    ]),
    averageTimeOnSite: z.string().optional(),
  }).optional(),
  financials: z.object({
    monthlyRevenue: z.object({
      value: z.union([
        z.string()
          .refine((val) => val === '' || !isNaN(parseFloat(val)), "Monthly revenue must be a number")
          .refine((val) => val === '' || parseFloat(val) >= 0, "Monthly revenue cannot be negative")
          .transform(val => val === '' ? undefined : parseFloat(val))
          .optional(),
        z.number().min(0, "Monthly revenue cannot be negative").optional()
      ]),
      formatted: z.string().optional(),
      currency: z.string().default("INR")
    }).optional(),
    annualRevenue: z.object({
      value: z.union([
        z.string()
          .refine((val) => val === '' || !isNaN(parseFloat(val)), "Annual revenue must be a number")
          .refine((val) => val === '' || parseFloat(val) >= 0, "Annual revenue cannot be negative")
          .transform(val => val === '' ? undefined : parseFloat(val))
          .optional(),
        z.number().min(0, "Annual revenue cannot be negative").optional()
      ]),
      formatted: z.string().optional(),
      currency: z.string().default("INR")
    }).optional(),
    profitMargin: z.union([
      z.string()
        .refine((val) => val === '' || !isNaN(parseFloat(val)), "Profit margin must be a number")
        .refine((val) => val === '' || parseFloat(val) >= 0, "Profit margin cannot be negative")
        .refine((val) => val === '' || parseFloat(val) <= 100, "Profit margin cannot exceed 100%")
        .transform(val => val === '' ? undefined : parseFloat(val))
        .optional(),
      z.number().min(0, "Profit margin cannot be negative")
        .max(100, "Profit margin cannot exceed 100%").optional()
    ]),
    revenueModel: z.string().optional(),
    revenueStreams: z.array(z.string()).optional(),
    // Revenue percentage fields - no need to validate sum equals 100% since UI handles auto-distribution
    revenueBreakdown: z.object({
      advertising: z.union([
        z.string().optional(),
        z.number().min(0).max(100).optional()
      ]),
      affiliates: z.union([
        z.string().optional(),
        z.number().min(0).max(100).optional()
      ]),
      productSales: z.union([
        z.string().optional(),
        z.number().min(0).max(100).optional()
      ]),
      subscriptions: z.union([
        z.string().optional(),
        z.number().min(0).max(100).optional()
      ]),
      other: z.union([
        z.string().optional(),
        z.number().min(0).max(100).optional()
      ]),
      // Custom error field for UI to display total percentage error
      totalPercentageError: z.string().optional(),
    }).optional(),
  }).optional(),
  sale: z.object({
    askingPrice: z.object({
      value: z.union([
        z.string()
          .refine((val) => !isNaN(parseFloat(val)), "Asking price must be a number")
          .refine((val) => parseFloat(val) >= 0, "Asking price cannot be negative")
          .transform(val => parseFloat(val)),
        z.number().min(0, "Asking price cannot be negative")
      ]),
      formatted: z.string().optional(),
      currency: z.string().default("INR")
    }),
    reasonForSelling: z.string()
      .min(50, "Reason for selling must be at least 50 characters")
      .max(500, "Reason for selling cannot exceed 500 characters"),
    includedAssets: z.string()
      .min(50, "Included assets description must be at least 50 characters")
      .max(500, "Included assets description cannot exceed 500 characters"),
    monetizationPotential: z.string().optional(),
  }),
});

/**
 * Main Listing Schema
 * 
 * Includes proper conditional validation for type-specific details
 */
export const listingSchema = z.object({
  // Core Fields (common across all types)
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  type: z.nativeEnum(ListingType, {
    required_error: "Please select a listing type",
    invalid_type_error: "Invalid listing type"
  })
  .nullable()
  .refine(val => val !== null, {
    message: "Please select a listing type"
  }),

  // Classification fields - now as an array (1-3 items)
  classifications: z.array(
    z.object({
      industry: z.string().min(1, "Industry is required"),
      industryName: z.string().optional(),
      category: z.string().min(1, "Category is required"),
      categoryName: z.string().optional(),
      subCategories: z.array(z.string()).default([]).transform(safeArray),
      subCategoryNames: z.array(z.string()).default([]).transform(safeArray),
    })
  )
  .min(1, "Please add at least one industry classification")
  .max(3, "You can add up to 3 industry classifications")
  .default([{
    industry: "",
    industryName: "",
    category: "",
    categoryName: "",
    subCategories: [],
    subCategoryNames: []
  }])
  .transform(val => {
    if (!val || val === false) return [{
      industry: "",
      industryName: "",
      category: "",
      categoryName: "",
      subCategories: [],
      subCategoryNames: []
    }];
    return val;
  }),

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
  }).default({
    country: 'IN',
    countryName: 'India',
    state: '',
    city: '',
  }).nullable().transform(val => {
    if (!val) {
      return {
        country: 'IN',
        countryName: 'India',
        state: '',
        city: '',
      };
    }
    return val;
  }),

  // Contact Information
  contactInfo: z.object({
    email: z.string().email("Please enter a valid email").nullable().optional(),
    phone: z.union([z.string(), z.number()])
      .transform(val => typeof val === 'number' ? val.toString() : val)
      .refine(val => val !== undefined && val !== null && val !== '', {
        message: "Phone number is required"
      })
      .refine(val => /^[0-9]{10,}$/.test(val), {
        message: "Please enter a valid phone number with at least 10 digits"
      }),
    alternatePhone: z.string().optional().nullable(),
    website: z.string().url("Please enter a valid URL").nullable().optional().or(z.literal('')),
    contactName: z.string().optional().nullable(),
    preferredContactMethod: z.string().optional().nullable(),
  }).default({
    email: '',
    phone: '',
  }).nullable().transform(val => {
    if (!val) {
      return {
        email: '',
        phone: '',
      };
    }
    return val;
  }),

  // Type-specific details with conditional validation
  businessDetails: z.preprocess(
    (val) => val || undefined,
    businessDetailsSchema.optional()
  ).superRefine((val, ctx) => {
    // Only validate businessDetails when type is BUSINESS
    if (ctx.parent?.type === ListingType.BUSINESS) {
      // businessDetails is required when type is BUSINESS
      if (!val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Business details are required for business listings",
        });
      }
      // Do not validate businessDetails for other listing types
    }
    return z.NEVER;
  }),
  
  franchiseDetails: z.preprocess(
    (val) => val || undefined,
    franchiseDetailsSchema.optional()
  ).superRefine((val, ctx) => {
    // Only validate franchiseDetails when type is FRANCHISE
    if (ctx.parent?.type === ListingType.FRANCHISE) {
      // franchiseDetails is required when type is FRANCHISE
      if (!val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Franchise details are required for franchise listings",
        });
      } 
      // Do not validate franchiseDetails for other listing types, no matter what state it's in
    }
    return z.NEVER;
  }),
  
  startupDetails: z.preprocess(
    (val) => val || undefined,
    startupDetailsSchema.optional()
  ).superRefine((val, ctx) => {
    // Only validate startupDetails when type is STARTUP
    if (ctx.parent?.type === ListingType.STARTUP) {
      // startupDetails is required when type is STARTUP
      if (!val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Startup details are required for startup listings",
        });
      }
      // Do not validate startupDetails for other listing types
    }
    return z.NEVER;
  }),
  
  investorDetails: z.preprocess(
    (val) => val || undefined,
    investorDetailsSchema.optional()
  ).superRefine((val, ctx) => {
    // Only validate investorDetails when type is INVESTOR
    if (ctx.parent?.type === ListingType.INVESTOR) {
      // investorDetails is required when type is INVESTOR
      if (!val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Investor details are required for investor listings",
        });
      }
      // Do not validate investorDetails for other listing types
    }
    return z.NEVER;
  }),
  
  digitalAssetDetails: z.preprocess(
    (val) => val || undefined,
    digitalAssetDetailsSchema.optional()
  ).superRefine((val, ctx) => {
    // Only validate digitalAssetDetails when type is DIGITAL_ASSET
    if (ctx.parent?.type === ListingType.DIGITAL_ASSET) {
      // digitalAssetDetails is required when type is DIGITAL_ASSET
      if (!val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Digital asset details are required for digital asset listings",
        });
      }
      // Do not validate digitalAssetDetails for other listing types
    }
    return z.NEVER;
  }),

  // Media validation
  mediaValidation: z.any().optional(),
  
  // Catch-all for additional fields
}).catchall(z.any());

/**
 * Helper function to migrate legacy data format to new schema format
 */
export const migrateListingData = (data) => {
  if (!data) return {};
  
  // Create new data object with all existing properties
  const newData = { ...data };
  
  // Ensure classifications is always an array
  if (!newData.classifications || !Array.isArray(newData.classifications) || newData.classifications.length === 0) {
    // Create classifications array
    newData.classifications = [];
    
    // If we have single industry data
    if (data.industry) {
      newData.classifications.push({
        industry: data.industry || '',
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
    } else {
      // Add a default empty classification if nothing exists
      newData.classifications.push({
        industry: '',
        industryName: '',
        category: '',
        categoryName: '',
        subCategories: [],
        subCategoryNames: []
      });
    }
  }
  
  // Ensure location object exists and has default values if needed
  if (!newData.location) {
    newData.location = {
      country: 'IN',
      countryName: 'India',
      state: '',
      city: '',
    };
  }
  
  // Ensure contactInfo object exists
  if (!newData.contactInfo) {
    newData.contactInfo = {
      email: '',
      phone: '',
    };
  }
  
  return newData;
}; 