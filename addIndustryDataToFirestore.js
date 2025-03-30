import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ 
  path: path.resolve(process.cwd(), '.env.development') 
});

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};


// Utility function to create slug
const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Comprehensive Industry Data
const industryData = {
  "Food & Beverage": {
    "Restaurants & Dining": [
      "Fine Dining Restaurants", "Quick Service Restaurants (QSR)", "Casual Dining", 
      "Cafés & Coffee Shops", "Food Trucks", "Cloud Kitchens", "Bars, Pubs & Lounges", 
      "Bakeries & Confectioneries"
    ],
    "Food Manufacturing & Processing": [
      "Packaged Foods", "Dairy Products", "Meat & Seafood Processing", "Snack Foods", 
      "Ready-to-Eat Meals", "Food Ingredients & Additives", "Organic & Natural Foods"
    ],
    "Beverages": [
      "Coffee & Tea Products", "Soft Drinks & Juices", "Energy & Sports Drinks", 
      "Bottled Water", "Alcoholic Beverages", "Beverage Distribution"
    ],
    "Agricultural Products": [
      "Farming & Crop Production", "Agricultural Supplies", "Hydroponics & Vertical Farming", 
      "Organic Farming", "Agricultural Technology"
    ]
  },
  "Retail & Consumer Goods": {
    "Apparel & Fashion": [
      "Men's Clothing", "Women's Clothing", "Children's Clothing", "Footwear", 
      "Fashion Accessories", "Luxury Goods", "Ethnic Wear", "Sportswear & Athletic Apparel"
    ],
    "Specialty Retail": [
      "Jewelry & Watches", "Gift Shops", "Toy Stores", "Pet Supplies", "Hobby & Craft Stores", 
      "Home Décor & Furnishings", "Electronics Retail", "Specialty Food Stores"
    ],
    "General Retail": [
      "Department Stores", "Supermarkets & Grocery", "Convenience Stores", "Discount Retailers", 
      "Warehouse Clubs", "E-commerce Marketplaces", "Vending Operations"
    ],
    "Consumer Products": [
      "Personal Care Products", "Household Supplies", "Consumer Electronics", "Home Appliances", 
      "Beauty & Cosmetics", "Luxury Items", "Stationery & Office Supplies"
    ]
  },
  "Technology & Digital": {
    "Software & SaaS": [
      "Enterprise Software", "Mobile Applications", "Cloud Computing Services", 
      "Customer Relationship Management", "Project Management Solutions", "E-commerce Platforms", 
      "Educational Technology", "Financial Technology (FinTech)"
    ],
    "IT Services": [
      "IT Consulting", "Systems Integration", "Managed IT Services", "Data Center Services", 
      "Cybersecurity Services", "Technical Support", "Network Infrastructure"
    ],
    "Digital Assets & Platforms": [
      "Content Websites", "E-commerce Stores", "Online Marketplaces", "Mobile Applications", 
      "SaaS Platforms", "Online Communities & Forums", "Digital Media Properties", "Domain Portfolios"
    ],
    "Hardware & Manufacturing": [
      "Computer Hardware", "Networking Equipment", "Semiconductor Manufacturing", 
      "Electronic Components", "IoT Devices", "3D Printing & Additive Manufacturing", 
      "Robotics & Automation"
    ]
  },
  "Healthcare & Wellness": {
    "Healthcare Services": [
      "Hospitals & Clinics", "Diagnostic Centers", "Rehabilitation Services", "Ambulatory Services", 
      "Telemedicine", "Home Healthcare Services", "Mental Health Services", "Elder Care & Assisted Living"
    ],
    "Pharmaceutical & Biotechnology": [
      "Drug Manufacturing", "Biotechnology Research", "Clinical Trials", "Generic Pharmaceuticals", 
      "Medical Cannabis", "Pharmaceutical Distribution"
    ],
    "Medical Devices & Equipment": [
      "Diagnostic Equipment", "Surgical Equipment", "Patient Monitoring Devices", 
      "Prosthetics & Orthotics", "Medical Supplies", "Dental Equipment"
    ],
    "Wellness & Fitness": [
      "Fitness Centers & Gyms", "Yoga Studios", "Spas & Massage Centers", "Nutrition & Diet Services", 
      "Alternative Medicine", "Personal Training Services", "Wellness Products"
    ]
  },
  "Financial Services": {
    "Banking & Lending": [
      "Retail Banking", "Commercial Banking", "Investment Banking", "Mortgage Services", 
      "Microfinance", "Personal Lending", "Credit Unions"
    ],
    "Investment & Wealth Management": [
      "Financial Advisory", "Asset Management", "Wealth Management", "Retirement Planning", 
      "Stock Brokerage", "Venture Capital", "Private Equity", "Angel Investment Networks"
    ],
    "Insurance": [
      "Life Insurance", "Health Insurance", "Property & Casualty Insurance", "Auto Insurance", 
      "Commercial Insurance", "Insurance Brokerage"
    ],
    "Financial Technology (FinTech)": [
      "Digital Banking", "Payment Processing", "Blockchain & Cryptocurrency", "Robo-Advisory", 
      "Crowdfunding Platforms", "Personal Finance Management", "RegTech (Regulatory Technology)"
    ]
  },
  "Professional Services": {
    "Business Consulting": [
      "Management Consulting", "Strategy Consulting", "Operations Consulting", 
      "Human Resources Consulting", "Change Management", "Business Process Outsourcing"
    ],
    "Legal Services": [
      "Law Firms", "Intellectual Property Law", "Corporate Law", "Tax Law", 
      "Immigration Services", "Legal Process Outsourcing"
    ],
    "Accounting & Tax": [
      "Accounting Firms", "Tax Preparation Services", "Bookkeeping Services", 
      "Audit Services", "Payroll Services"
    ],
    "Marketing & Advertising": [
      "Digital Marketing Agencies", "Advertising Agencies", "Public Relations Firms", 
      "Market Research Services", "Brand Consulting", "SEO & Content Marketing", "Social Media Marketing"
    ]
  },
  "Education & Training": {
    "Educational Institutions": [
      "K-12 Schools", "Colleges & Universities", "Technical & Vocational Institutes", 
      "Preschools & Daycare Centers", "Special Education Services", "Language Schools"
    ],
    "Training & Development": [
      "Professional Development", "Corporate Training", "Skills Development", 
      "Test Preparation", "Certification Programs", "E-Learning Platforms", "Career Coaching"
    ],
    "Educational Support": [
      "Educational Consulting", "Tutoring Services", "Educational Technology", 
      "Student Services", "Curriculum Development", "Educational Assessment"
    ]
  },
  "Real Estate & Construction": {
    "Residential Real Estate": [
      "Single-Family Homes", "Multi-Family Residential", "Condominiums & Apartments", 
      "Residential Property Management", "Vacation Properties"
    ],
    "Commercial Real Estate": [
      "Office Space", "Retail Space", "Industrial Properties", "Hospitality Properties", 
      "Mixed-Use Developments", "Commercial Property Management"
    ],
    "Construction & Development": [
      "General Contracting", "Residential Construction", "Commercial Construction", 
      "Infrastructure Development", "Architecture & Design", "Construction Management", "Civil Engineering"
    ],
    "Real Estate Services": [
      "Real Estate Brokerage", "Property Valuation", "Real Estate Investment", 
      "Property Inspection", "Facility Management", "Real Estate Technology"
    ]
  },
  "Transportation & Logistics": {
    "Transportation Services": [
      "Passenger Transportation", "Fleet Management", "Taxi & Ride-sharing", 
      "Vehicle Rental", "Public Transportation", "Charter Services"
    ],
    "Logistics & Supply Chain": [
      "Freight Forwarding", "Warehousing & Storage", "Third-Party Logistics (3PL)", 
      "Supply Chain Management", "Inventory Management", "Last-Mile Delivery", "Cold Chain Logistics"
    ],
    "Automotive": [
      "Auto Dealerships", "Auto Repair & Maintenance", "Auto Parts & Accessories", 
      "Automotive Manufacturing", "Electric Vehicle Services", "Auto Detailing", "Car Wash Services"
    ]
  },
  "Manufacturing & Industrial": {
    "Industrial Manufacturing": [
      "Metal Fabrication", "Plastic & Rubber Products", "Machinery Manufacturing", 
      "Electronics Manufacturing", "Chemical Manufacturing", "Textile Manufacturing", "Paper & Packaging"
    ],
    "Heavy Industry": [
      "Steel Production", "Mining & Minerals", "Heavy Machinery", "Industrial Equipment", 
      "Aerospace & Defense", "Shipbuilding"
    ],
    "Specialized Manufacturing": [
      "Custom Fabrication", "Precision Engineering", "Contract Manufacturing", 
      "Additive Manufacturing", "Quality Control Services", "Industrial Automation"
    ],
    "Industrial Services": [
      "Maintenance & Repair", "Industrial Cleaning", "Waste Management", 
      "Environmental Services", "Safety Compliance", "Engineering Services"
    ]
  },
  "Energy & Utilities": {
    "Conventional Energy": [
      "Oil & Gas Exploration", "Oil & Gas Services", "Petroleum Distribution", 
      "Coal Mining & Processing", "Gas Stations & Convenience"
    ],
    "Renewable Energy": [
      "Solar Energy", "Wind Energy", "Hydroelectric Energy", "Geothermal Energy", 
      "Biomass Energy", "Energy Storage", "Green Energy Consulting"
    ],
    "Utilities & Infrastructure": [
      "Electricity Distribution", "Water & Wastewater", "Natural Gas Distribution", 
      "Power Generation", "Utility Management", "Smart Grid Technology", "Energy Efficiency Services"
    ]
  },
  "Entertainment & Media": {
    "Media Production": [
      "Film & Television Production", "Music Production", "Animation Studios", 
      "Gaming Development", "Podcast Production", "Content Creation"
    ],
    "Entertainment Venues": [
      "Movie Theaters", "Performance Venues", "Family Entertainment Centers", 
      "Gaming & eSports Arenas", "Amusement Parks", "Indoor Entertainment", "Event Spaces"
    ],
    "Media Distribution": [
      "Publishing Houses", "Broadcasting Networks", "Streaming Services", 
      "Digital Media Platforms", "Content Distribution Networks"
    ],
    "Arts & Culture": [
      "Art Galleries", "Museums", "Performing Arts", "Cultural Institutions", "Creative Studios"
    ]
  },
  "Travel & Hospitality": {
    "Accommodations": [
      "Hotels & Resorts", "Boutique Hotels", "Bed & Breakfasts", "Vacation Rentals", 
      "Hostels", "Service Apartments"
    ],
    "Food Service": [
      "Full-Service Restaurants", "Fast Food Chains", "Catering Services", 
      "Cloud Kitchens", "Food Courts", "Specialty Food Service"
    ],
    "Travel Services": [
      "Travel Agencies", "Tour Operators", "Destination Management", 
      "Tourism Technology", "Travel Insurance", "Concierge Services"
    ],
    "Recreation & Leisure": [
      "Adventure Tourism", "Eco-Tourism", "Leisure Activities", "Tourist Attractions", 
      "Recreational Facilities", "Sports & Recreation"
    ]
  },
  "Agriculture & Environment": {
    "Farming & Cultivation": [
      "Crop Farming", "Livestock & Dairy", "Aquaculture", "Horticulture", 
      "Organic Farming", "Precision Agriculture"
    ],
    "Agricultural Services": [
      "Agricultural Consulting", "Farm Management", "Agrochemicals", "Seed Production", 
      "Irrigation Systems", "Agricultural Technology"
    ],
    "Environmental Services": [
      "Environmental Consulting", "Waste Management", "Recycling Services", 
      "Environmental Remediation", "Conservation Services", "Sustainable Practices", "Carbon Offset Programs"
    ]
  }
};

// Function to populate Firestore with industry hierarchy
async function populateIndustryHierarchy() {
  try {
    // Create a batch for efficient writes
    const batch = writeBatch(db);

    // Track references to use in subcategory creation
    const industryRefs = {};
    const categoryRefs = {};

    // Iterate through industries
    for (const [industryName, categories] of Object.entries(industryData)) {
      // Create industry document
      const industrySlug = slugify(industryName);
      const industryRef = doc(collection(db, 'industries'));
      
      batch.set(industryRef, {
        name: industryName,
        slug: industrySlug,
        description: `Industry covering ${industryName}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        listingCount: 0,
        applicableListingTypes: [
          'business', 
          'franchise', 
          'startup', 
          'investor', 
          'digital_asset'
        ]
      });

      // Store reference for later use
      industryRefs[industryName] = industryRef;

      // Iterate through categories
      for (const [categoryName, subcategories] of Object.entries(categories)) {
        // Create category document
        const categorySlug = slugify(categoryName);
        const categoryRef = doc(collection(db, 'categories'));
        
        batch.set(categoryRef, {
          name: categoryName,
          industryId: industryRef.id,
          industryRef: industryRef,
          slug: categorySlug,
          description: `Category within ${industryName}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isActive: true,
          listingCount: 0,
          applicableListingTypes: [
            'business', 
            'franchise', 
            'startup', 
            'investor', 
            'digital_asset'
          ]
        });

        // Store reference for later use
        categoryRefs[`${industryName}-${categoryName}`] = categoryRef;

        // Iterate through subcategories
        for (const subcategoryName of subcategories) {
          // Create subcategory document
          const subcategorySlug = slugify(subcategoryName);
          const subcategoryRef = doc(collection(db, 'subCategories'));
          
          batch.set(subcategoryRef, {
            name: subcategoryName,
            categoryId: categoryRef.id,
            categoryRef: categoryRef,
            industryId: industryRef.id,
            industryRef: industryRef,
            slug: subcategorySlug,
            description: `Subcategory of ${categoryName} in ${industryName}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isActive: true,
            keywords: [
              subcategorySlug,
              slugify(categoryName),
              industrySlug
            ],
            listingCount: 0,
            applicableListingTypes: [
              'business', 
              'franchise', 
              'startup', 
              'investor', 
              'digital_asset'
            ]
          });
        }
      }
    }

    // Commit the batch
    await batch.commit();
    console.log('Successfully populated industry hierarchy');
    
    // Log industry, category, and subcategory counts
    let totalCategories = 0;
    let totalSubcategories = 0;
    
    for (const categories of Object.values(industryData)) {
      totalCategories += Object.keys(categories).length;
      for (const subcategories of Object.values(categories)) {
        totalSubcategories += subcategories.length;
      }
    }
    
    console.log('Total Industries:', Object.keys(industryData).length);
    console.log('Total Categories:', totalCategories);
    console.log('Total Subcategories:', totalSubcategories);
  } catch (error) {
    console.error('Error populating industry hierarchy:', error);
  }
}

// Run the population script
populateIndustryHierarchy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });