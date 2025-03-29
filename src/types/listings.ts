/**
 * Listings-related TypeScript interfaces
 * Provides type safety for listings management operations
 */

/**
 * Listing types in the system
 */
export enum ListingType {
    BUSINESS = 'business',
    FRANCHISE = 'franchise',
    STARTUP = 'startup',
    INVESTOR = 'investor',
    DIGITAL_ASSET = 'digital_asset'
  }
  
  /**
   * Listing status options
   */
  export enum ListingStatus {
    DRAFT = 'draft',
    PENDING = 'pending',
    PUBLISHED = 'published',
    REJECTED = 'rejected',
    ARCHIVED = 'archived'
  }
  
  /**
   * Listing plan types
   */
  export enum ListingPlan {
    FREE = 'free',
    BASIC = 'basic',
    ADVANCED = 'advanced',
    PREMIUM = 'premium',
    PLATINUM = 'platinum'
  }
  
  /**
   * Business specific enums
   */
  export enum BusinessType {
    RETAIL = 'retail',
    MANUFACTURING = 'manufacturing',
    SERVICE = 'service',
    DISTRIBUTION = 'distribution',
    F_AND_B = 'f_and_b',
    IT = 'it',
    HEALTHCARE = 'healthcare',
    OTHER = 'other'
  }
  
  export enum EntityType {
    SOLE_PROPRIETORSHIP = 'sole_proprietorship',
    PARTNERSHIP = 'partnership',
    LLC = 'llc',
    PRIVATE_LIMITED = 'private_limited',
    LLP = 'llp',
    CORPORATION = 'corporation'
  }
  
  export enum LocationType {
    LEASED_COMMERCIAL = 'leased_commercial',
    OWNED_PROPERTY = 'owned_property',
    HOME_BASED = 'home_based',
    VIRTUAL = 'virtual',
    MOBILE = 'mobile'
  }
  
  export enum RevenueTrend {
    GROWING = 'growing',
    STABLE = 'stable',
    DECLINING = 'declining'
  }
  
  /**
   * Franchise specific enums
   */
  export enum FranchiseType {
    FOOD_AND_BEVERAGE = 'food_and_beverage',
    RETAIL = 'retail',
    SERVICE = 'service',
    EDUCATION = 'education',
    WELLNESS = 'wellness',
    OTHER = 'other'
  }
  
  /**
   * Startup specific enums
   */
  export enum DevelopmentStage {
    IDEA = 'idea',
    MVP = 'mvp',
    PRE_SEED = 'pre_seed',
    SEED = 'seed',
    SERIES_A = 'series_a',
    SERIES_B_PLUS = 'series_b_plus'
  }
  
  export enum ProductStage {
    CONCEPT = 'concept',
    PROTOTYPE = 'prototype',
    MVP = 'mvp',
    BETA = 'beta',
    LAUNCHED = 'launched',
    SCALING = 'scaling'
  }
  
  export enum FundingStage {
    PRE_SEED = 'pre_seed',
    SEED = 'seed',
    SERIES_A = 'series_a',
    SERIES_B = 'series_b',
    SERIES_C_PLUS = 'series_c_plus'
  }
  
  /**
   * Investor specific enums
   */
  export enum InvestorType {
    ANGEL = 'angel',
    VENTURE_CAPITAL = 'venture_capital',
    PRIVATE_EQUITY = 'private_equity',
    FAMILY_OFFICE = 'family_office',
    CORPORATE = 'corporate',
    INDIVIDUAL = 'individual'
  }
  
  export enum BoardInvolvement {
    OBSERVER = 'observer',
    MEMBER = 'member',
    CHAIRMAN = 'chairman',
    NONE = 'none'
  }
  
  /**
   * Digital Asset specific enums
   */
  export enum AssetType {
    WEBSITE = 'website',
    E_COMMERCE = 'e_commerce',
    BLOG = 'blog',
    MOBILE_APP = 'mobile_app',
    SAAS = 'saas',
    ONLINE_COMMUNITY = 'online_community',
    DOMAIN_PORTFOLIO = 'domain_portfolio'
  }
  
  export enum ManagementEase {
    PASSIVE = 'passive',
    SEMI_PASSIVE = 'semi_passive',
    ACTIVE = 'active'
  }
  
  /**
   * Common interfaces
   */
  export interface CurrencyValue {
    value: number;
    currency: string;
    formatted: string;
  }
  
  export interface ImageObject {
    url: string;
    path: string;
    alt?: string;
    width?: number;
    height?: number;
  }
  
  export interface DocumentObject {
    id: string;
    type: string;
    name: string;
    description?: string;
    url: string;
    path: string;
    format: string;
    size: number;
    isPublic: boolean;
    uploadedAt: Date;
    verificationStatus: 'pending' | 'verified' | 'rejected';
  }
  
  export interface LocationInfo {
    country: string;
    state: string;
    city: string;
    address?: string;
    pincode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    displayLocation: string;
    locationRef?: any; // Document reference
  }
  
  export interface ContactInfo {
    email: string;
    phone?: string;
    alternatePhone?: string;
    website?: string;
    contactName?: string;
    preferredContactMethod?: string;
    socialMedia?: {
      facebook?: {
        url?: string;
        handle?: string;
        isVerified?: boolean;
      };
      twitter?: {
        url?: string;
        handle?: string;
        isVerified?: boolean;
      };
      instagram?: {
        url?: string;
        handle?: string;
        isVerified?: boolean;
      };
      linkedin?: {
        url?: string;
        handle?: string;
        isVerified?: boolean;
      };
    };
  }
  
  export interface Rating {
    average: number;
    count: number;
    systemRating: number;
    ratingComponents: {
      completeness: number;
      verification: number;
      documentation: number;
      engagement: number;
      longevity: number;
      financials: number;
    };
    distribution: {
      [key: string]: number;
    };
  }
  
  export interface StatusHistory {
    status: ListingStatus;
    reason?: string;
    timestamp: Date;
    updatedBy: string;
  }
  
  export interface AnalyticsData {
    viewCount: number;
    uniqueViewCount: number;
    contactCount: number;
    favoriteCount: number;
    lastViewed?: Date;
    conversionRate: number;
    viewsTimeline: {
      date: Date;
      count: number;
    }[];
  }
  
  /**
   * Business specific interfaces
   */
  export interface BusinessOperations {
    employees: {
      count: number;
      fullTime: number;
      partTime?: number;
    };
    locationType: LocationType;
    leaseInformation?: {
      expiryDate: Date;
      monthlyCost: CurrencyValue;
      isTransferable: boolean;
    };
    operationDescription: string;
  }
  
  export interface BusinessFinancials {
    annualRevenue: CurrencyValue;
    monthlyRevenue: CurrencyValue;
    profitMargin: {
      percentage: number;
      trend: string;
    };
    revenueTrend: RevenueTrend;
    inventory?: {
      isIncluded: boolean;
      value: CurrencyValue;
      description: string;
    };
    equipment: {
      isIncluded: boolean;
      value: CurrencyValue;
      description: string;
    };
    customerConcentration: number;
  }
  
  export interface BusinessSale {
    askingPrice: {
      value: number;
      currency: string;
      formatted: string;
      priceMultiple?: number;
      isNegotiable: boolean;
    };
    reasonForSelling: string;
    sellerFinancing?: {
      isAvailable: boolean;
      details?: string;
      downPaymentPercentage?: number;
    };
    transitionPeriod: number;
    trainingIncluded: string;
    assetsIncluded: string;
    priceMultiple?: number;
  }
  
  export interface BusinessDetails {
    businessType: BusinessType;
    entityType: EntityType;
    establishedYear: number;
    registrationNumber: string;
    gstNumber?: string;
    panNumber?: string;
    operations: BusinessOperations;
    financials: BusinessFinancials;
    sale: BusinessSale;
  }
  
  /**
   * Franchise specific interfaces
   */
  export interface FranchiseInvestment {
    franchiseFee: CurrencyValue;
    royaltyFee: number;
    royaltyStructure: string;
    marketingFee: number;
    totalInitialInvestment: CurrencyValue;
    recurringFees: string;
  }
  
  export interface FranchiseSupport {
    initialTraining: string;
    trainingDuration: string;
    trainingLocation: string;
    ongoingSupport: string;
    fieldSupport: string;
    marketingSupport: string;
    technologySystems: string;
    siteSelection: boolean;
  }
  
  export interface FranchisePerformance {
    averageUnitSales: CurrencyValue;
    salesGrowth: string;
    averageBreakeven: string;
    successRate?: number;
    franchiseeRequirements: string;
    netWorthRequirement: CurrencyValue;
    liquidCapitalRequired: CurrencyValue;
  }
  
  export interface FranchiseDetails {
    franchiseBrand: string;
    franchiseType: FranchiseType;
    franchiseSince: number;
    brandEstablished: number;
    totalUnits: number;
    franchiseeCount: number;
    companyOwnedUnits: number;
    availableTerritories: string[];
    investment: FranchiseInvestment;
    support: FranchiseSupport;
    performance: FranchisePerformance;
  }
  
  /**
   * Startup specific interfaces
   */
  export interface StartupTeam {
    teamSize: number;
    founders: {
      name: string;
      role: string;
      experience: string;
      linkedinProfile?: string;
    }[];
    productStage: ProductStage;
    intellectualProperty?: string[];
    technologyStack?: string;
    uniqueSellingPoints: string;
  }
  
  export interface StartupMarketTraction {
    totalUsers?: number;
    activeUsers?: number;
    revenueModel: string;
    monthlyRevenue?: CurrencyValue;
    growthRate?: number;
    targetMarket: string;
    marketSize: CurrencyValue;
    competitiveAnalysis: string;
  }
  
  export interface StartupFunding {
    fundingStage: FundingStage;
    totalRaisedToDate?: CurrencyValue;
    currentRaisingAmount: CurrencyValue;
    equityOffered: number;
    preMoneyValuation: CurrencyValue;
    useOfFunds: string;
    previousInvestors?: string;
    burnRate?: CurrencyValue;
    runway?: number;
  }
  
  export interface StartupDetails {
    developmentStage: DevelopmentStage;
    registeredName: string;
    foundedDate: Date;
    launchDate?: Date;
    missionStatement: string;
    problemStatement: string;
    solutionDescription: string;
    team: StartupTeam;
    market: StartupMarketTraction;
    funding: StartupFunding;
  }
  
  /**
   * Investor specific interfaces
   */
  export interface InvestmentCapacity {
    annualInvestmentTarget?: CurrencyValue;
    preferredRounds: string[];
    isLeadInvestor: boolean;
    preferredEquityStake?: {
      min: number;
      max: number;
    };
    decisionTimeline: string;
  }
  
  export interface InvestmentFocus {
    primaryIndustries: string[];
    secondaryIndustries?: string[];
    businessStagePreference: string[];
    geographicFocus: string[];
    investmentCriteria: string;
    minimumRevenue?: CurrencyValue;
    minimumTraction?: string;
  }
  
  export interface InvestorPortfolioProcess {
    portfolioSize?: number;
    activeInvestments?: number;
    successStories?: string;
    investmentProcess: string;
    postInvestmentSupport: string;
    reportingRequirements?: string;
    boardInvolvement?: BoardInvolvement;
  }
  
  export interface InvestorDetails {
    investorType: InvestorType;
    yearsOfExperience: number;
    investmentPhilosophy: string;
    backgroundSummary: string;
    keyAchievements?: string;
    investmentTeamSize?: number;
    investment: InvestmentCapacity;
    focus: InvestmentFocus;
    portfolio: InvestorPortfolioProcess;
  }
  
  /**
   * Digital Asset specific interfaces
   */
  export interface DigitalAssetTechnical {
    domainName: string;
    domainAuthority?: number;
    domainAge?: number;
    hostingProvider: string;
    monthlyHostingCost: CurrencyValue;
    technologyStack: string;
    mobileResponsiveness: boolean;
    contentManagement: string;
    sslSecurity: boolean;
  }
  
  export interface DigitalAssetTraffic {
    monthlyVisitors: number;
    monthlyPageviews: number;
    trafficTrend: RevenueTrend;
    organicTrafficPercentage: number;
    directTrafficPercentage: number;
    referralTrafficPercentage: number;
    socialTrafficPercentage: number;
    otherTrafficPercentage: number;
    analyticsVerification: boolean;
    emailSubscribers?: number;
    socialMediaAccounts?: string;
  }
  
  export interface DigitalAssetFinancials {
    monthlyRevenue: CurrencyValue;
    annualRevenue: CurrencyValue;
    expenseBreakdown: {
      hosting: CurrencyValue;
      content: CurrencyValue;
      marketing: CurrencyValue;
      other: CurrencyValue;
    };
    profitMargin: number;
    revenueBreakdown: {
      advertising: number;
      affiliates: number;
      productSales: number;
      subscriptions: number;
      other: number;
    };
    monetizationDetails: string;
  }
  
  export interface DigitalAssetSale {
    askingPrice: CurrencyValue;
    priceMultiple?: number;
    reasonForSelling: string;
    assetsIncluded: string;
    trainingSupport: string;
    transitionPeriod: number;
  }
  
  export interface DigitalAssetDetails {
    assetType: AssetType;
    platformFramework: string;
    nicheIndustry: string;
    creationDate: Date;
    businessModel: string;
    easeOfManagement: ManagementEase;
    ownerTimeRequired: number;
    technical: DigitalAssetTechnical;
    traffic: DigitalAssetTraffic;
    financials: DigitalAssetFinancials;
    sale: DigitalAssetSale;
  }
  
  /**
   * Main Listing interface
   */
  export interface Listing {
    // Core Fields
    id: string;
    type: ListingType;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    
    // Media & Visuals
    media: {
      featuredImage?: ImageObject;
      galleryImages: ImageObject[];
      totalImages: number;
    };
    
    // Location Information
    location: LocationInfo;
    
    // Contact Information
    contactInfo: ContactInfo;
    
    // Industries & Classification
    industries: string[];
    industryRefs?: any[]; // Document references
    tags?: string[];
    tagRefs?: any[]; // Document references
    
    // Ratings and Verification
    rating?: Rating;
    reviewCount?: number;
    isVerified: boolean;
    isFeatured: boolean;
    featuredUntil?: Date;
    
    // Subscription and Status
    plan: ListingPlan;
    planRef?: any; // Document reference
    status: ListingStatus;
    statusReason?: string;
    statusHistory: StatusHistory[];
    
    // Ownership
    ownerId: string;
    ownerRef?: any; // Document reference
    ownerName: string;
    
    // Documents
    documents: DocumentObject[];
    
    // Analytics
    analytics?: AnalyticsData;
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    expiresAt?: Date;
    
    // Deletion
    isDeleted: boolean;
    deletedAt?: Date;
    
    // Type-specific details - only one of these will be populated based on the listing type
    businessDetails?: BusinessDetails;
    franchiseDetails?: FranchiseDetails;
    startupDetails?: StartupDetails;
    investorDetails?: InvestorDetails;
    digitalAssetDetails?: DigitalAssetDetails;
  }
  
  /**
   * Filter options for listings
   */
  export interface ListingFilters {
    search?: string;
    type?: ListingType[];
    status?: ListingStatus[];
    industries?: string[];
    location?: {
      country?: string;
      state?: string;
      city?: string;
    };
    isFeatured?: boolean;
    isVerified?: boolean;
    plan?: ListingPlan[];
    ownerId?: string;
    priceRange?: {
      min?: number;
      max?: number;
    };
    dateRange?: {
      from?: Date;
      to?: Date;
    };
  }