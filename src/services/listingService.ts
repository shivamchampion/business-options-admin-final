/**
 * Listing service
 * Handles CRUD operations for business listings
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  DocumentReference,
  DocumentSnapshot,
  Timestamp,
  runTransaction,
  arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import {
  Listing,
  ListingType,
  ListingStatus,
  ListingFilters,
  ListingPlan,
  ImageObject,
  DocumentObject,
  LocationInfo
} from '@/types/listings';
import { generateSlug, getCurrentUser } from '@/lib/utils';

// Collection name
const LISTINGS_COLLECTION = 'listings';

// Extended interface for listing input with optional featuredImageIndex
interface ListingInput extends Partial<Listing> {
  featuredImageIndex?: number;
}

/**
 * Sanitizes data before saving to Firestore by converting undefined values to null
 * and handling special cases like Dates and nested arrays
 * @param data Object to sanitize
 * @returns Sanitized object safe for Firestore
 */
const sanitizeForFirestore = (data: any): any => {
  // Use a non-recursive approach to avoid stack overflow
  const seen = new WeakMap();
  
  function sanitize(value: any, path: string = ''): any {
    // Handle null/undefined
    if (value === undefined || value === null) {
      return null;
    }
    
    // Handle primitives
    if (typeof value !== 'object') {
      if (typeof value === 'function') {
        // Skip functions - not supported by Firestore
        console.warn(`Skipping function at ${path}`);
        return null;
      }
      return value;
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value;
    }
    
    // Special handling for Firebase types
    if (value && typeof value === 'object') {
      // DocumentReference has path and id
      if ('path' in value && 'id' in value && typeof value.path === 'string') {
        return value;
      }
      
      // Handle FieldValue like serverTimestamp()
      const constructorName = value?.constructor?.name;
      if (constructorName === 'FieldValue' || 
          constructorName === 'DocumentReference' || 
          constructorName === 'GeoPoint') {
        return value;
      }
    }
    
    // Special deep-copy handling for known problematic paths
    if (path === 'subCategories' || path.includes('.subCategories') || 
        path.includes('media.galleryImages') || path.includes('classifications')) {
      // For known problematic objects, create a flattened copy without circular references
      if (Array.isArray(value)) {
        // For arrays of strings or primitive values, just return a copy
        if (value.length === 0 || typeof value[0] !== 'object') {
          return [...value];
        }
        
        // For arrays of objects, do a simplified copy of core properties
        console.log(`Special handling for problematic array at ${path}`);
        return value.map((item, idx) => {
          if (item === null || item === undefined) return null;
          
          // If it's a primitive, just return it
          if (typeof item !== 'object') return item;
          
          // Make a simple copy with just core fields
          const simplified: Record<string, any> = {};
          
          // Copy only essential primitive properties
          for (const [k, v] of Object.entries(item)) {
            if (v === null || v === undefined) {
              simplified[k] = null;
              continue;
            }
            
            // Only include primitive values and simple objects
            if (typeof v !== 'object' || v instanceof Date) {
              simplified[k] = v;
            } else if (typeof v === 'object' && !Array.isArray(v)) {
              // If it's an object but not array, include a flattened version
              // with only primitive properties
              const flatObj: Record<string, any> = {};
              for (const [subKey, subVal] of Object.entries(v)) {
                if (typeof subVal !== 'object' || subVal instanceof Date) {
                  flatObj[subKey] = subVal;
                }
              }
              simplified[k] = flatObj;
            }
          }
          return simplified;
        });
      }
    }
    
    // Handle circular references
    if (seen.has(value)) {
      console.warn(`Circular reference detected at ${path}`);
      return null;
    }
    
    // Add to seen objects
    seen.set(value, true);
    
    // Handle arrays - Firestore doesn't support nested arrays
    if (Array.isArray(value)) {
      const result = [];
      
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        const itemPath = `${path}[${i}]`;
        
        // For arrays, we need to be careful about nested arrays
        if (Array.isArray(item)) {
          // Convert nested arrays to objects with numeric keys
          // e.g., [1, 2, 3] becomes { "0": 1, "1": 2, "2": 3 }
          console.warn(`Converting nested array at ${itemPath} to object with numeric keys`);
          const objFromArray: Record<string, any> = {};
          
          for (let j = 0; j < item.length; j++) {
            const sanitizedValue = sanitize(item[j], `${itemPath}[${j}]`);
            if (sanitizedValue !== undefined) {
              objFromArray[j.toString()] = sanitizedValue;
            }
          }
          
          result.push(objFromArray);
        } else {
          const sanitizedItem = sanitize(item, itemPath);
          if (sanitizedItem !== undefined) {
            result.push(sanitizedItem);
          }
        }
      }
      
      return result;
    }
    
    // Handle objects
    const result: Record<string, any> = {};
    
    for (const [key, val] of Object.entries(value)) {
      // Skip __typename and other special GraphQL fields
      if (key === '__typename') continue;
      
      // Skip functions
      if (typeof val === 'function') {
        console.warn(`Skipping function property "${key}"`);
        continue;
      }
      
      const sanitizedValue = sanitize(val, path ? `${path}.${key}` : key);
      
      // Only add the property if it's not undefined
      if (sanitizedValue !== undefined) {
        result[key] = sanitizedValue;
      }
    }
    
    return result;
  }
  
  return sanitize(data);
};

/**
 * Converts a Firestore timestamp to Date
 */
const convertTimestampToDate = (timestamp: Timestamp | unknown | undefined): Date | undefined => {
  // Check if timestamp exists and has a toDate method (valid Firestore Timestamp)
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      console.warn('Error converting timestamp to date:', error);
      return undefined;
    }
  }
  
  // Handle case where timestamp is already a Date
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Handle case where timestamp is a number (unix timestamp in milliseconds)
  if (typeof timestamp === 'number' && !isNaN(timestamp)) {
    return new Date(timestamp);
  }
  
  // Handle case where timestamp is a string (ISO date string)
  if (typeof timestamp === 'string' && timestamp.trim() !== '') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  return undefined;
};

/**
 * Converts a Firestore listing document to a Listing object
 */
const convertDocToListing = (doc: DocumentSnapshot): Listing => {
  const data = doc.data();
  if (!data) throw new Error(`Listing document ${doc.id} not found or empty`);

  return {
    ...data,
    id: doc.id,
    createdAt: convertTimestampToDate(data.createdAt),
    updatedAt: convertTimestampToDate(data.updatedAt),
    publishedAt: convertTimestampToDate(data.publishedAt),
    expiresAt: convertTimestampToDate(data.expiresAt),
    featuredUntil: convertTimestampToDate(data.featuredUntil),
    deletedAt: convertTimestampToDate(data.deletedAt),
    statusHistory: data.statusHistory ? data.statusHistory.map((history: any) => ({
      ...history,
      timestamp: convertTimestampToDate(history.timestamp)
    })) : [],
    documents: data.documents ? data.documents.map((doc: any) => ({
      ...doc,
      uploadedAt: convertTimestampToDate(doc.uploadedAt)
    })) : [],
    businessDetails: data.businessDetails ? {
      ...data.businessDetails,
      operations: {
        ...data.businessDetails.operations,
        leaseInformation: data.businessDetails.operations.leaseInformation ? {
          ...data.businessDetails.operations.leaseInformation,
          expiryDate: convertTimestampToDate(data.businessDetails.operations.leaseInformation.expiryDate)
        } : undefined
      }
    } : undefined,
    franchiseDetails: data.franchiseDetails,
    startupDetails: data.startupDetails ? {
      ...data.startupDetails,
      foundedDate: convertTimestampToDate(data.startupDetails.foundedDate),
      launchDate: convertTimestampToDate(data.startupDetails.launchDate)
    } : undefined,
    investorDetails: data.investorDetails,
    digitalAssetDetails: data.digitalAssetDetails ? {
      ...data.digitalAssetDetails,
      creationDate: convertTimestampToDate(data.digitalAssetDetails.creationDate)
    } : undefined,
    analytics: data.analytics ? {
      ...data.analytics,
      lastViewed: convertTimestampToDate(data.analytics.lastViewed),
      viewsTimeline: data.analytics.viewsTimeline ? data.analytics.viewsTimeline.map((item: any) => ({
        ...item,
        date: convertTimestampToDate(item.date)
      })) : []
    } : undefined
  } as Listing;
};

/**
 * Generate a display location string from country, state, city
 */
const generateDisplayLocation = (
  cityName?: string,
  stateName?: string,
  countryName?: string
): string => {
  const parts = [];
  if (cityName) parts.push(cityName);
  if (stateName) parts.push(stateName);
  // Only include country if it's not India (the default)
  if (countryName && countryName !== 'India') parts.push(countryName);
  return parts.join(', ');
};

/**
 * Get listings with pagination and filtering
 */
export const getListings = async (
  pageSize: number = 10,
  lastDoc: DocumentSnapshot | null = null,
  filters?: ListingFilters,
  currentUserId?: string
): Promise<{ listings: Listing[], lastDoc: DocumentSnapshot | null }> => {
  try {
    // Verify authentication
    if (!auth.currentUser && !currentUserId) {
      console.warn('Authentication not established for fetching listings');
      return { listings: [], lastDoc: null };
    }
    
    // Start with a base query
    let baseQuery = collection(db, LISTINGS_COLLECTION);

    // Create an array to hold conditions
    let conditions: any[] = [];

    // Add standard condition to exclude deleted listings
    conditions.push(where('isDeleted', '==', false));

    // Apply filters
    if (filters) {
      // Filter by owner first (most important filter)
      if (filters.ownerId) {
        conditions.push(where('ownerId', '==', filters.ownerId));
      }

      // Filter by status
      if (filters.status && filters.status.length > 0) {
        // If there's only one status, use a simple equality check
        if (filters.status.length === 1) {
          conditions.push(where('status', '==', filters.status[0]));
        } else {
          // For multiple statuses, use 'in' operator
          conditions.push(where('status', 'in', filters.status));
        }
      }

      // Filter by type
      if (filters.type && filters.type.length > 0) {
        conditions.push(where('type', 'in', filters.type));
      }

      // Filter by featured status
      if (filters.isFeatured !== undefined) {
        conditions.push(where('isFeatured', '==', filters.isFeatured));
      }

      // Filter by verification status
      if (filters.isVerified !== undefined) {
        conditions.push(where('isVerified', '==', filters.isVerified));
      }

      // Filter by plan
      if (filters.plan && filters.plan.length > 0) {
        conditions.push(where('plan', 'in', filters.plan));
      }

      // Filter by industries (multiple selections support)
      if (filters.industries && filters.industries.length > 0) {
        // Use array-contains-any - supports up to 10 values
        const industryFilters = filters.industries.slice(0, 10); // Limit to 10 for Firestore
        conditions.push(where('industries', 'array-contains-any', industryFilters));
      }

      // Update filters for location (country, state, city)
      if (filters.location) {
        if (filters.location.country) {
          conditions.push(where('location.country', '==', filters.location.country));
        }
        if (filters.location.state) {
          conditions.push(where('location.state', '==', filters.location.state));
        }
        if (filters.location.city) {
          conditions.push(where('location.city', '==', filters.location.city));
        }
      }
    }

    // Create the query with conditions and ordering
    // Use a simpler ordering to avoid index issues
    let finalQuery = query(baseQuery, ...conditions, orderBy('createdAt', 'desc'));

    // Apply pagination
    if (lastDoc) {
      finalQuery = query(finalQuery, startAfter(lastDoc), limit(pageSize));
    } else {
      finalQuery = query(finalQuery, limit(pageSize));
    }

    // Execute the query
    const snapshot = await getDocs(finalQuery);

    // Convert documents to listings
    const fetchedListings = snapshot.docs.map(doc => convertDocToListing(doc));

    // Apply client-side filtering for search (if needed)
    let filteredListings = fetchedListings;
    
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredListings = fetchedListings.filter(listing =>
        listing.name.toLowerCase().includes(searchTerm) ||
        listing.description.toLowerCase().includes(searchTerm) ||
        (listing.shortDescription && listing.shortDescription.toLowerCase().includes(searchTerm))
      );
    }

    // For new schema (classifications is an array of objects)
    if (filters?.industries && filters.industries.length > 0) {
      filteredListings = filteredListings.filter(listing =>
        listing.classifications &&
        listing.classifications.some(c =>
          filters.industries?.includes(c.industry)
        )
      );
    }

    // Additional client-side filtering for price range if needed
    if (filters?.priceRange) {
      filteredListings = filteredListings.filter(listing => {
        let price = 0;

        // Extract price based on listing type
        if (listing.type === ListingType.BUSINESS && listing.businessDetails) {
          price = listing.businessDetails.sale.askingPrice.value;
        } else if (listing.type === ListingType.FRANCHISE && listing.franchiseDetails) {
          price = listing.franchiseDetails.investment.totalInitialInvestment.value;
        } else if (listing.type === ListingType.STARTUP && listing.startupDetails) {
          price = listing.startupDetails.funding.currentRaisingAmount.value;
        } else if (listing.type === ListingType.DIGITAL_ASSET && listing.digitalAssetDetails) {
          price = listing.digitalAssetDetails.sale.askingPrice.value;
        }

        // Apply min and max filters with safe access
        const passesMin = filters.priceRange?.min !== undefined ? price >= filters.priceRange.min : true;
        const passesMax = filters.priceRange?.max !== undefined ? price <= filters.priceRange.max : true;

        return passesMin && passesMax;
      });
    }

    return {
      listings: filteredListings,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error('Error getting listings:', error);
    
    // If we get an index error, try a simpler query
    if (error instanceof Error && error.message.includes('index')) {
      console.log('Trying a simpler query without complex filters...');
      
      try {
        // Create a simpler query with just the essential filters
        let simpleQuery = collection(db, LISTINGS_COLLECTION);
        let simpleConditions: any[] = [];
        
        // Add standard condition to exclude deleted listings
        simpleConditions.push(where('isDeleted', '==', false));
        
        // Add owner filter if available
        if (filters?.ownerId) {
          simpleConditions.push(where('ownerId', '==', filters.ownerId));
        }
        
        // Create a simple query with just these conditions
        let finalSimpleQuery = query(simpleQuery, ...simpleConditions, orderBy('createdAt', 'desc'));
        
        // Apply pagination
        if (lastDoc) {
          finalSimpleQuery = query(finalSimpleQuery, startAfter(lastDoc), limit(pageSize));
        } else {
          finalSimpleQuery = query(finalSimpleQuery, limit(pageSize));
        }
        
        // Execute the simple query
        const simpleSnapshot = await getDocs(finalSimpleQuery);
        
        // Convert documents to listings
        const simpleListings = simpleSnapshot.docs.map(doc => convertDocToListing(doc));
        
        // Apply client-side filtering for status
        let filteredSimpleListings = simpleListings;
        
        if (filters?.status && filters.status.length > 0) {
          filteredSimpleListings = simpleListings.filter(listing => 
            filters.status?.includes(listing.status)
          );
        }
        
        return {
          listings: filteredSimpleListings,
          lastDoc: simpleSnapshot.docs[simpleSnapshot.docs.length - 1] || null
        };
      } catch (simpleError) {
        console.error('Error with simple query:', simpleError);
        return { listings: [], lastDoc: null };
      }
    }
    
    return { listings: [], lastDoc: null };
  }
};

/**
 * Get a listing by ID
 */
export const getListingById = async (id: string, signal?: AbortSignal): Promise<Listing> => {
  try {
    // Check if request has been aborted
    if (signal?.aborted) {
      throw new Error('Request was aborted');
    }
    
    // First check if we're online
    if (!navigator.onLine) {
      console.log('Device is offline, checking for cached listing data');
      
      // Try to get from local storage first
      const cachedListingJSON = localStorage.getItem(`listing_${id}`);
      if (cachedListingJSON) {
        console.log('Found cached listing data');
        const cachedListing = JSON.parse(cachedListingJSON);
        return cachedListing;
      }
      
      // If we're offline and no cache is available
      throw new Error('Failed to get document because the client is offline.');
    }
    
    // Proceed with Firestore query if online
    console.log(`Fetching listing with ID: ${id} from Firestore`);
    const listingRef = doc(db, LISTINGS_COLLECTION, id);
    
    // Create options object with abort signal if provided
    const options: any = {};
    if (signal) {
      options.signal = signal;
    }
    
    // Set a timeout for the Firestore query
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Firestore query timed out'));
      }, 10000); // 10 second timeout
      
      // If signal is provided, listen for abort event to clear timeout
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Request was aborted'));
        });
      }
    });
    
    // Race the query against the timeout
    const listingSnap = await Promise.race([
      getDoc(listingRef),
      timeoutPromise
    ]) as DocumentSnapshot;
    
    // Check if request has been aborted after query completed
    if (signal?.aborted) {
      throw new Error('Request was aborted');
    }

    if (!listingSnap.exists()) {
      throw new Error(`Listing with ID ${id} not found`);
    }

    // Convert to listing object
    const listing = convertDocToListing(listingSnap);
    
    // Cache the result
    try {
      const dataToCache = {
        ...listing,
        _cacheTimestamp: new Date().toISOString()
      };
      localStorage.setItem(`listing_${id}`, JSON.stringify(dataToCache));
      console.log('Cached listing data to localStorage');
    } catch (e) {
      console.warn('Failed to cache listing data:', e);
    }
    
    // Final check for abort
    if (signal?.aborted) {
      throw new Error('Request was aborted');
    }
    
    return listing;
  } catch (error) {
    // If request was aborted, don't try to recover
    if (error instanceof Error && error.message === 'Request was aborted') {
      throw error;
    }
    
    console.error('Error getting listing by ID:', error);
    
    // Check for offline errors specifically
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isOfflineError = 
      errorMessage.includes('offline') || 
      errorMessage.includes('network') || 
      errorMessage.includes('timeout') ||
      errorMessage.includes('unavailable') ||
      !navigator.onLine;
    
    if (isOfflineError) {
      // Try to get from local storage as fallback
      try {
        const cachedListingJSON = localStorage.getItem(`listing_${id}`);
        if (cachedListingJSON) {
          console.log('Found cached listing data as fallback after online failure');
          const cachedListing = JSON.parse(cachedListingJSON);
          return cachedListing;
        }
      } catch (e) {
        console.error('Error accessing cached listing data:', e);
      }
      
      // If still no cached data
      throw new Error('Failed to get document because the client is offline.');
    }
    
    throw new Error(`Failed to fetch listing: ${errorMessage}`);
  }
};

export const uploadListingImage = async (
  file: File,
  listingId: string,
  index: number = 0
): Promise<ImageObject> => {
  try {
    console.log(`Starting upload for image: ${file.name} (${file.size} bytes)`);
    
    // Create storage reference with unique name to avoid collisions
    const fileName = `${index}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `listings/${listingId}/images/${fileName}`);

    // Upload the file with explicit content type
    const metadata = {
      contentType: file.type || 'image/jpeg'
    };
    console.log(`Uploading to Firebase Storage: ${storageRef.fullPath}`);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log(`Upload complete for: ${file.name}`);

    // Get download URL
    console.log(`Getting download URL for: ${storageRef.fullPath}`);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`Download URL obtained: ${downloadURL.substring(0, 50)}...`);

    // Create image object WITHOUT waiting for dimension calculation
    // This is critical - dimension calculation was causing hangs
    const imageObject: ImageObject = {
      url: downloadURL,
      path: storageRef.fullPath,
      alt: file.name || `Listing image ${index + 1}`,
      width: 0,  // Default dimensions - will be updated by client
      height: 0
    };

    console.log(`Successfully processed image: ${file.name}`);
    return imageObject;
  } catch (error: any) {
    console.error(`Error uploading image ${file.name}:`, error);
    throw new Error(`Failed to upload image ${file.name}: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Upload a document to Firebase Storage for a listing
 */
export const uploadListingDocument = async (
  file: File,
  listingId: string,
  type: string,
  description?: string,
  isPublic: boolean = false
): Promise<DocumentObject> => {
  try {
    // Create storage reference
    const storageRef = ref(storage, `listings/${listingId}/documents/${file.name}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Create document object
    const documentObject: DocumentObject = {
      id: crypto.randomUUID(), // Generate unique ID
      type,
      name: file.name,
      description: description || '',
      url: downloadURL,
      path: storageRef.fullPath,
      format: file.type,
      size: file.size,
      isPublic,
      uploadedAt: new Date(),
      verificationStatus: 'pending'
    };

    return documentObject;
  } catch (error) {
    console.error('Error uploading listing document:', error);
    throw error;
  }
};

/**
 * Enhanced createListing function with better error handling and document processing
 */
export const createListing = async (
  listingData: Partial<Listing>,
  images?: File[],
  documents?: Array<{ file: File, type: string, description?: string, isPublic?: boolean }>
): Promise<string> => {
  console.log(`createListing service called with type: ${listingData.type}`);
  let listingId = ''; // Store ID for error handling
  let uploadedImages: ImageObject[] = [];
  let uploadedDocs: DocumentObject[] = [];
  
  try {
    // Validate required fields
    if (!listingData.name || !listingData.type || !listingData.description) {
      throw new Error('Listing name, type, and description are required');
    }

    // Validate current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to create a listing');
    }
    console.log('Current user verified:', currentUser.id);

    // Create a slug from the name
    const slug = generateSlug(listingData.name);

    // Create a new document reference for the listing
    const listingRef = doc(collection(db, LISTINGS_COLLECTION));
    listingId = listingRef.id;
    console.log(`Created listing document reference with ID: ${listingId}`);

    // Upload images with robust error handling
    let galleryImages: ImageObject[] = [];
    let featuredImage: ImageObject | undefined;

    if (images && images.length > 0) {
      console.log(`Uploading ${images.length} images...`);
      
      // Process images one at a time to avoid any potential issues
      // This is more reliable than batch processing for production
      for (let i = 0; i < images.length; i++) {
        try {
          console.log(`Processing image ${i+1}/${images.length}`);
          const file = images[i];
          
          // Add timeout protection for each image
          const uploadPromise = uploadListingImage(file, listingId, i);
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Image upload timeout for ${file.name}`)), 30000) // 30 second timeout
          );
          
          // Race against timeout
          const imageObject = await Promise.race([uploadPromise, timeoutPromise]) as ImageObject;
          
          // Add to gallery
          galleryImages.push(imageObject);
          uploadedImages.push(imageObject); // For cleanup in case of errors
          console.log(`Successfully uploaded image ${i+1}/${images.length}: ${file.name}`);
        } catch (imageError) {
          console.error(`Error uploading image ${i+1}/${images.length}:`, imageError);
          // Continue with other images instead of failing completely
        }
      }
      
      // Check if we managed to upload at least 3 images
      if (galleryImages.length < 3) {
        throw new Error(`Not enough images uploaded successfully. Need at least 3, got ${galleryImages.length}.`);
      }
      
      console.log(`Successfully uploaded ${galleryImages.length} out of ${images.length} images`);

      // Fix for featuredImageIndex handling
      // Cast listingData to ListingInput to access the featuredImageIndex property safely
      const listingInputData = listingData as ListingInput;
      if (listingInputData.featuredImageIndex !== undefined && 
          typeof listingInputData.featuredImageIndex === 'number' && 
          listingInputData.featuredImageIndex >= 0 && 
          listingInputData.featuredImageIndex < galleryImages.length) {
        featuredImage = galleryImages[listingInputData.featuredImageIndex];
      } else if (galleryImages.length > 0) {
        featuredImage = galleryImages[0];
      }
    } else {
      throw new Error('At least 3 images are required for a listing');
    }

    // Upload documents
    let documentObjects: DocumentObject[] = [];

    if (documents && documents.length > 0) {
      console.log(`Uploading ${documents.length} documents...`);
      
      try {
        // Process documents in sequence to avoid errors
        for (const doc of documents) {
          try {
            // Verify the document has required properties
            if (!doc.file) {
              console.warn('Document missing file property:', doc);
              continue; // Skip invalid documents
            }
            
            // Ensure document type is valid
            const docType = doc.type || 'document';
            const docDescription = doc.description || doc.file.name || 'Document';
            const isPublic = !!doc.isPublic;
            
            console.log(`Uploading document: ${docDescription} (${docType})`);
            const uploadedDoc = await uploadListingDocument(
              doc.file, 
              listingId, 
              docType, 
              docDescription, 
              isPublic
            );
            
            documentObjects.push(uploadedDoc);
            uploadedDocs.push(uploadedDoc); // For cleanup in case of errors
          } catch (docError) {
            console.error(`Error uploading document ${doc?.file?.name}:`, docError);
            // Continue with other documents instead of failing completely
          }
        }
        
        console.log(`Successfully uploaded ${documentObjects.length} documents out of ${documents.length} attempts`);
      } catch (docsError: any) {
        console.error('Error in document batch processing:', docsError);
        throw new Error(`Failed to process documents: ${docsError.message || 'Unknown error'}`);
      }
    }

    // Calculate initial system rating
    const systemRating = calculateSystemRating(listingData, galleryImages.length, documentObjects.length);

    // Prepare location data
    const locationData: LocationInfo = {
      country: listingData.location?.country || 'IN',
      countryName: listingData.location?.countryName || 'India',
      state: listingData.location?.state || '',
      stateName: listingData.location?.stateName || '',
      city: listingData.location?.city || '',
      cityName: listingData.location?.cityName || '',
      address: listingData.location?.address || '',
      pincode: listingData.location?.pincode || '',
      displayLocation: generateDisplayLocation(
        listingData.location?.cityName || listingData.location?.city,
        listingData.location?.stateName || listingData.location?.state,
        listingData.location?.countryName
      )
    };
    
    // Handle classifications and backward compatibility
    const classifications = listingData.classifications || [];
    console.log(`Processing ${classifications.length} industry classifications`);

    // For backward compatibility, add legacy fields
    const industries = classifications.map(c => c.industry);
    const industryRefs = classifications.map(c => doc(db, 'industries', c.industry));

    // Use first classification for single industry/category fields if needed
    const industry = classifications.length > 0 ? classifications[0].industry : '';
    const industryName = classifications.length > 0 ? classifications[0].industryName : '';
    const category = classifications.length > 0 ? classifications[0].category : '';
    const categoryName = classifications.length > 0 ? classifications[0].categoryName : '';
    const subCategories = classifications.length > 0 ? classifications[0].subCategories : [];
    const subCategoryNames = classifications.length > 0 ? classifications[0].subCategoryNames : [];

    // Set basic fields common to all listing types
    const baseListingData = {
      id: listingId,
      name: listingData.name,
      slug,
      type: listingData.type,
      description: listingData.description,
      shortDescription: listingData.shortDescription || listingData.description.substring(0, 150) + '...',
      location: locationData,
      classifications,

      // Legacy fields for backward compatibility
      industry,
      industryName,
      category,
      categoryName,
      subCategories,
      industries,
      industryRefs,

      // Media
      media: {
        featuredImage,
        galleryImages,
        totalImages: galleryImages.length
      },

      contactInfo: listingData.contactInfo || {
        email: currentUser.email // Default to user's email
      },

      // Status & verification
      isVerified: false,
      isFeatured: false,
      rating: {
        average: 0,
        count: 0,
        systemRating,
        ratingComponents: {
          completeness: calculateCompletenessScore(listingData),
          verification: 0, // Starts at 0 until verified
          documentation: documentObjects.length > 0 ? 7 : 0,
          engagement: 0, // Starts at 0
          longevity: 0, // Starts at 0
          financials: calculateFinancialsScore(listingData)
        },
        distribution: {
          "0": 0, "1": 0, "2": 0, "3": 0, "4": 0,
          "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0
        }
      },
      reviewCount: 0,

      // Subscription
      plan: listingData.plan || ListingPlan.FREE,
      status: listingData.status || ListingStatus.DRAFT,
      statusHistory: [{
        status: listingData.status || ListingStatus.DRAFT,
        timestamp: new Date(),
        updatedBy: currentUser.id
      }],

      // Ownership
      ownerId: currentUser.id,
      ownerRef: doc(db, 'users', currentUser.id),
      ownerName: currentUser.name,

      // Documents
      documents: documentObjects,

      // Analytics
      analytics: {
        viewCount: 0,
        uniqueViewCount: 0,
        contactCount: 0,
        favoriteCount: 0,
        conversionRate: 0,
        viewsTimeline: []
      },

      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

      // Deletion
      isDeleted: false
    };

    // Add type-specific details based on the listing type
    console.log(`Adding type-specific details for listing type: ${listingData.type}`);
    let typeSpecificDetails = {};
    
    switch(listingData.type) {
      case ListingType.BUSINESS:
        if (listingData.businessDetails) {
          typeSpecificDetails = { businessDetails: listingData.businessDetails };
          console.log("Added business details to listing data");
        } else {
          console.warn("Business type selected but no businessDetails provided");
        }
        break;
        
      case ListingType.FRANCHISE:
        if (listingData.franchiseDetails) {
          typeSpecificDetails = { franchiseDetails: listingData.franchiseDetails };
          console.log("Added franchise details to listing data");
        } else {
          console.warn("Franchise type selected but no franchiseDetails provided");
        }
        break;
        
      case ListingType.STARTUP:
        if (listingData.startupDetails) {
          // Ensure dates are properly formatted for Firebase
          const startupDetails = {
            ...listingData.startupDetails,
            foundedDate: listingData.startupDetails.foundedDate || new Date(),
            launchDate: listingData.startupDetails.launchDate || null
          };
          typeSpecificDetails = { startupDetails };
          console.log("Added startup details to listing data");
        } else {
          console.warn("Startup type selected but no startupDetails provided");
        }
        break;
        
      case ListingType.INVESTOR:
        if (listingData.investorDetails) {
          typeSpecificDetails = { investorDetails: listingData.investorDetails };
          console.log("Added investor details to listing data");
        } else {
          console.warn("Investor type selected but no investorDetails provided");
        }
        break;
        
      case ListingType.DIGITAL_ASSET:
        if (listingData.digitalAssetDetails) {
          typeSpecificDetails = { digitalAssetDetails: listingData.digitalAssetDetails };
          console.log("Added digital asset details to listing data");
        } else {
          console.warn("Digital asset type selected but no digitalAssetDetails provided");
        }
        break;
        
      default:
        console.warn(`Unknown listing type: ${listingData.type}`);
    }

    // Merge base data with type-specific details
    const listingDataToSave = {
      ...baseListingData,
      ...typeSpecificDetails
    };

    console.log(`Saving listing data to Firestore with ID: ${listingId}`);
    
    // Sanitize the data before saving to Firestore
    const sanitizedData = sanitizeForFirestore(listingDataToSave);
    
    // Save the listing to Firestore
    await setDoc(listingRef, sanitizedData);
    console.log(`Successfully saved listing to Firestore`);

    // Update user's listings array
    try {
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        listings: arrayUnion(listingId),
        listingRefs: arrayUnion(listingRef)
      });
      console.log(`Updated user's listings array`);
    } catch (userUpdateError) {
      console.error('Error updating user listings array:', userUpdateError);
      // Continue even if this fails as the listing is already created
    }

    return listingId;
  } catch (error) {
    console.error('Error creating listing:', error);
    
    // Cleanup: Remove any uploaded images and documents in case of error
    try {
      if (listingId) {
        console.log(`Cleaning up uploads due to error for listing ${listingId}`);
        
        // Delete uploaded images 
        for (const image of uploadedImages) {
          if (image.path) {
            try {
              const imageRef = ref(storage, image.path);
              await deleteObject(imageRef);
            } catch (deleteError) {
              console.warn(`Failed to delete image: ${image.path}`, deleteError);
            }
          }
        }
        
        // Delete uploaded documents
        for (const doc of uploadedDocs) {
          if (doc.path) {
            try {
              const docRef = ref(storage, doc.path);
              await deleteObject(docRef);
            } catch (deleteError) {
              console.warn(`Failed to delete document: ${doc.path}`, deleteError);
            }
          }
        }
        
        console.log('Cleanup completed');
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    throw new Error(`Failed to create listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update an existing listing
 */
export const updateListing = async (
  id: string,
  listingData: Partial<Listing>,
  newImages?: File[],
  newDocuments?: Array<{ file: File, type: string, description?: string, isPublic?: boolean }>,
  imagesToDelete?: string[],
  documentsToDelete?: string[]
): Promise<void> => {
  try {
    // Get the existing listing
    const existingListing = await getListingById(id);

    // Verify ownership or admin access
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to update a listing');
    }

    // Only the owner or admin can update the listing
    if (existingListing.ownerId !== currentUser.id && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      throw new Error('You do not have permission to update this listing');
    }

    // Get reference to the listing
    const listingRef = doc(db, LISTINGS_COLLECTION, id);

    // Handle image updates
    let galleryImages = [...(existingListing.media.galleryImages || [])];
    let featuredImage = existingListing.media.featuredImage;

    // Delete images if specified
    if (imagesToDelete && imagesToDelete.length > 0) {
      // Delete from storage
      for (const path of imagesToDelete) {
        try {
          const imageRef = ref(storage, path);
          await deleteObject(imageRef);
        } catch (error) {
          console.error(`Error deleting image ${path}:`, error);
          // Continue with other deletions even if one fails
        }
      }

      // Remove from gallery
      galleryImages = galleryImages.filter(img => !imagesToDelete.includes(img.path));

      // Check if featured image was deleted
      if (featuredImage && imagesToDelete.includes(featuredImage.path)) {
        featuredImage = galleryImages.length > 0 ? galleryImages[0] : undefined;
      }
    }

    // Upload new images
    if (newImages && newImages.length > 0) {
      const imagePromises = newImages.map((file, index) =>
        uploadListingImage(file, id, galleryImages.length + index)
      );

      const newImageObjects = await Promise.all(imagePromises);
      galleryImages = [...galleryImages, ...newImageObjects];

      // Set featured image if none exists
      if (!featuredImage && newImageObjects.length > 0) {
        featuredImage = newImageObjects[0];
      }
    }

    // Handle document updates
    let documents = [...(existingListing.documents || [])];

    // Delete documents if specified
    if (documentsToDelete && documentsToDelete.length > 0) {
      // Get paths of documents to delete
      const docsToDelete = documents.filter(doc => documentsToDelete.includes(doc.id));

      // Delete from storage
      for (const doc of docsToDelete) {
        try {
          const docRef = ref(storage, doc.path);
          await deleteObject(docRef);
        } catch (error) {
          console.error(`Error deleting document ${doc.path}:`, error);
          // Continue with other deletions even if one fails
        }
      }

      // Remove from documents array
      documents = documents.filter(doc => !documentsToDelete.includes(doc.id));
    }

    // Upload new documents
    if (newDocuments && newDocuments.length > 0) {
      const documentPromises = newDocuments.map(({ file, type, description, isPublic }) =>
        uploadListingDocument(file, id, type, description, isPublic)
      );

      const newDocumentObjects = await Promise.all(documentPromises);
      documents = [...documents, ...newDocumentObjects];
    }

    // Check for status change
    let statusHistory = [...existingListing.statusHistory];
    if (listingData.status && listingData.status !== existingListing.status) {
      // Add status change to history
      statusHistory.push({
        status: listingData.status,
        timestamp: new Date(),
        updatedBy: currentUser.id,
        reason: listingData.statusReason
      });

      // If status changed to published, set publishedAt
      if (listingData.status === ListingStatus.PUBLISHED && !existingListing.publishedAt) {
        listingData.publishedAt = new Date();
      }
    }

    // Check if it's being featured and wasn't before
    if (listingData.isFeatured && !existingListing.isFeatured) {
      // Set featured expiry date (30 days by default)
      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + 30);
      listingData.featuredUntil = featuredUntil;
    }

    // Recalculate system rating
    const updatedListing = {
      ...existingListing,
      ...listingData,
      media: {
        featuredImage,
        galleryImages,
        totalImages: galleryImages.length
      },
      documents
    };

    const systemRating = calculateSystemRating(updatedListing, galleryImages.length, documents.length);

    // Construct the update object
    const updateData: any = {
      ...listingData,
      media: {
        featuredImage,
        galleryImages,
        totalImages: galleryImages.length
      },
      documents,
      statusHistory,
      updatedAt: serverTimestamp(),
      rating: {
        ...existingListing.rating,
        systemRating,
        ratingComponents: {
          ...existingListing.rating?.ratingComponents,
          completeness: calculateCompletenessScore(updatedListing),
          documentation: documents.length > 0 ? Math.min(10, documents.length + 3) : 0,
          financials: calculateFinancialsScore(updatedListing)
        }
      }
    };
    
    // Sanitize data before updating in Firestore
    const sanitizedData = sanitizeForFirestore(updateData);
    
    // Update the listing in Firestore
    await updateDoc(listingRef, sanitizedData);
    
    console.log(`Successfully updated listing ${id}`);
    return;
  } catch (error) {
    console.error('Error updating listing:', error);
    throw new Error(`Failed to update listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete a listing (soft delete)
 */
export const deleteListing = async (id: string): Promise<void> => {
  try {
    // Check if we have a cached listing in localStorage
    let listing;
    try {
      const cachedData = localStorage.getItem(`listing_${id}`);
      if (cachedData) {
        listing = JSON.parse(cachedData);
      } else {
        // Get the listing to verify ownership
        listing = await getListingById(id);
      }
    } catch (e) {
      // Fallback to fetch if cache access fails
      listing = await getListingById(id);
    }

    // Check user permissions
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to delete a listing');
    }

    // Only the owner or admin can delete the listing
    if (listing.ownerId !== currentUser.id && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      throw new Error('You do not have permission to delete this listing');
    }

    // Perform soft delete
    const listingRef = doc(db, LISTINGS_COLLECTION, id);
    await updateDoc(listingRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      status: ListingStatus.ARCHIVED
    });
    
    // Clear the cache for this listing
    try {
      localStorage.removeItem(`listing_${id}`);
    } catch (e) {
      console.warn('Failed to clear listing cache:', e);
    }
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw new Error(`Failed to delete listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Hard delete a listing (admin only)
 * This will delete the listing document and all associated files
 */
export const hardDeleteListing = async (id: string): Promise<void> => {
  try {
    // Check if user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      throw new Error('Only administrators can perform hard delete');
    }

    // Get the listing to get file paths
    const listing = await getListingById(id);

    // Delete all images from storage
    const imagePromises = listing.media.galleryImages.map(async (image) => {
      try {
        const imageRef = ref(storage, image.path);
        await deleteObject(imageRef);
      } catch (error) {
        console.error(`Error deleting image ${image.path}:`, error);
        // Continue with other deletions even if one fails
      }
    });

    // Delete all documents from storage
    const documentPromises = listing.documents.map(async (document) => {
      try {
        const docRef = ref(storage, document.path);
        await deleteObject(docRef);
      } catch (error) {
        console.error(`Error deleting document ${document.path}:`, error);
        // Continue with other deletions even if one fails
      }
    });

    // Wait for all deletions to complete
    await Promise.all([...imagePromises, ...documentPromises]);

    // Remove listing reference from user's listings array
    const userRef = doc(db, 'users', listing.ownerId);
    await updateDoc(userRef, {
      listings: arrayUnion(id)
    });

    // Delete the listing document
    const listingRef = doc(db, LISTINGS_COLLECTION, id);
    await deleteDoc(listingRef);
  } catch (error) {
    console.error('Error hard deleting listing:', error);
    throw new Error(`Failed to hard delete listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update a listing's status
 */
export const updateListingStatus = async (
  id: string,
  status: ListingStatus,
  reason?: string
): Promise<void> => {
  try {
    // Check user permissions
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to update a listing status');
    }

    // Moderators and admins can update status
    if (currentUser.role !== 'admin' && currentUser.role !== 'moderator' && currentUser.role !== 'super_admin') {
      throw new Error('You do not have permission to update listing status');
    }

    // Get the listing
    const listing = await getListingById(id);

    // Update status in a transaction
    await runTransaction(db, async (transaction) => {
      const listingRef = doc(db, LISTINGS_COLLECTION, id);

      // Add to status history
      const statusHistory = [
        ...(listing.statusHistory || []),
        {
          status,
          timestamp: new Date(),
          updatedBy: currentUser.id,
          reason
        }
      ];

      // Set published date if status is changing to published
      let publishedAt = listing.publishedAt;
      if (status === ListingStatus.PUBLISHED && !listing.publishedAt) {
        publishedAt = new Date();
      }

      // Update the listing
      transaction.update(listingRef, {
        status,
        statusReason: reason,
        statusHistory,
        publishedAt,
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Error updating listing status:', error);
    throw new Error(`Failed to update listing status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Feature or unfeature a listing
 */
export const toggleListingFeature = async (
  id: string,
  isFeatured: boolean,
  durationDays: number = 30
): Promise<void> => {
  try {
    // Check user permissions
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      throw new Error('Only administrators can feature listings');
    }

    const listingRef = doc(db, LISTINGS_COLLECTION, id);

    if (isFeatured) {
      // Set featured expiry date
      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + durationDays);

      await updateDoc(listingRef, {
        isFeatured: true,
        featuredUntil,
        updatedAt: serverTimestamp()
      });
    } else {
      // Remove featured status
      await updateDoc(listingRef, {
        isFeatured: false,
        featuredUntil: null,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error toggling listing feature status:', error);
    throw new Error(`Failed to update listing feature status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Verify a listing
 */
export const verifyListing = async (id: string): Promise<void> => {
  try {
    // Check user permissions
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'moderator' && currentUser.role !== 'super_admin')) {
      throw new Error('Only administrators and moderators can verify listings');
    }

    const listingRef = doc(db, LISTINGS_COLLECTION, id);

    await updateDoc(listingRef, {
      isVerified: true,
      'rating.ratingComponents.verification': 10, // Max verification score
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error verifying listing:', error);
    throw new Error(`Failed to verify listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get featured listings
 */
export const getFeaturedListings = async (
  pageSize: number = 10,
  lastDoc: DocumentSnapshot | null = null
): Promise<{ listings: Listing[], lastDoc: DocumentSnapshot | null }> => {
  try {
    let featuredQuery = query(
      collection(db, LISTINGS_COLLECTION),
      where('isFeatured', '==', true),
      where('isDeleted', '==', false),
      where('status', '==', ListingStatus.PUBLISHED),
      orderBy('createdAt', 'desc')
    );

    if (lastDoc) {
      featuredQuery = query(featuredQuery, startAfter(lastDoc), limit(pageSize));
    } else {
      featuredQuery = query(featuredQuery, limit(pageSize));
    }

    const snapshot = await getDocs(featuredQuery);

    const listings = snapshot.docs.map(doc => convertDocToListing(doc));

    return {
      listings,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error('Error getting featured listings:', error);
    throw new Error(`Failed to fetch featured listings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
* Get listings by status
*/
export const getListingsByStatus = async (
  status: ListingStatus,
  pageSize: number = 10,
  lastDoc: DocumentSnapshot | null = null,
  currentUserId?: string
): Promise<{ listings: Listing[], lastDoc: DocumentSnapshot | null }> => {
  try {
    // Verify authentication
    if (!auth.currentUser && !currentUserId) {
      throw new Error('Authentication required to fetch listings');
    }

    let statusQuery = query(
      collection(db, LISTINGS_COLLECTION),
      where('status', '==', status),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    if (lastDoc) {
      statusQuery = query(statusQuery, startAfter(lastDoc), limit(pageSize));
    } else {
      statusQuery = query(statusQuery, limit(pageSize));
    }

    const snapshot = await getDocs(statusQuery);

    const listings = snapshot.docs.map(doc => convertDocToListing(doc));

    return {
      listings,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error(`Error getting listings with status ${status}:`, error);
    // Return empty results on error to avoid breaking the UI
    return {
      listings: [],
      lastDoc: null
    };
  }
};

/**
 * Get recent listings (for dashboard)
 */
export const getRecentListings = async (count: number = 5): Promise<Listing[]> => {
  try {
    const recentQuery = query(
      collection(db, LISTINGS_COLLECTION),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(count)
    );

    const snapshot = await getDocs(recentQuery);

    return snapshot.docs.map(doc => convertDocToListing(doc));
  } catch (error) {
    console.error('Error getting recent listings:', error);
    throw new Error(`Failed to fetch recent listings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
* Get listing counts by status
*/
export const getListingCountsByStatus = async (currentUserId?: string): Promise<{ [key in ListingStatus]: number }> => {
  try {
    // Verify authentication
    if (!auth.currentUser && !currentUserId) {
      console.warn('Authentication not established for fetching listing counts');
      return {
        [ListingStatus.DRAFT]: 0,
        [ListingStatus.PENDING]: 0,
        [ListingStatus.PUBLISHED]: 0,
        [ListingStatus.REJECTED]: 0,
        [ListingStatus.ARCHIVED]: 0
      };
    }

    const statusCounts: { [key in ListingStatus]: number } = {
      [ListingStatus.DRAFT]: 0,
      [ListingStatus.PENDING]: 0,
      [ListingStatus.PUBLISHED]: 0,
      [ListingStatus.REJECTED]: 0,
      [ListingStatus.ARCHIVED]: 0
    };

    // Run queries for each status
    for (const status of Object.values(ListingStatus)) {
      const statusQuery = query(
        collection(db, LISTINGS_COLLECTION),
        where('status', '==', status),
        where('isDeleted', '==', false)
      );

      const snapshot = await getDocs(statusQuery);
      statusCounts[status as ListingStatus] = snapshot.size;
    }

    return statusCounts;
  } catch (error) {
    console.error('Error getting listing counts by status:', error);
    // Return default counts on error
    return {
      [ListingStatus.DRAFT]: 0,
      [ListingStatus.PENDING]: 0,
      [ListingStatus.PUBLISHED]: 0,
      [ListingStatus.REJECTED]: 0,
      [ListingStatus.ARCHIVED]: 0
    };
  }
};

/**
 * Get listing counts by type
 */
export const getListingCountsByType = async (currentUserId?: string): Promise<{ [key in ListingType]: number }> => {
  try {
    // Verify authentication
    if (!auth.currentUser && !currentUserId) {
      console.warn('Authentication not established for fetching listing type counts');
      return {
        [ListingType.BUSINESS]: 0,
        [ListingType.FRANCHISE]: 0,
        [ListingType.STARTUP]: 0,
        [ListingType.INVESTOR]: 0,
        [ListingType.DIGITAL_ASSET]: 0
      };
    }

    const typeCounts: { [key in ListingType]: number } = {
      [ListingType.BUSINESS]: 0,
      [ListingType.FRANCHISE]: 0,
      [ListingType.STARTUP]: 0,
      [ListingType.INVESTOR]: 0,
      [ListingType.DIGITAL_ASSET]: 0
    };

    // Run queries for each type
    for (const type of Object.values(ListingType)) {
      const typeQuery = query(
        collection(db, LISTINGS_COLLECTION),
        where('type', '==', type),
        where('isDeleted', '==', false)
      );

      const snapshot = await getDocs(typeQuery);
      typeCounts[type as ListingType] = snapshot.size;
    }

    return typeCounts;
  } catch (error) {
    console.error('Error getting listing counts by type:', error);
    // Return default counts on error
    return {
      [ListingType.BUSINESS]: 0,
      [ListingType.FRANCHISE]: 0,
      [ListingType.STARTUP]: 0,
      [ListingType.INVESTOR]: 0,
      [ListingType.DIGITAL_ASSET]: 0
    };
  }
};

// Helper Functions

/**
 * Calculate a system rating score for a listing (0-10)
 */
const calculateSystemRating = (listing: Partial<Listing>, imageCount: number, documentCount: number): number => {
  // Start with a base score
  let score = 0;

  // Add up component scores
  const completeness = calculateCompletenessScore(listing);
  const verification = listing.isVerified ? 10 : 0;
  const documentation = documentCount > 0 ? Math.min(10, documentCount + 3) : 0;
  const engagement = 0; // Initially 0, will be updated based on user interaction
  const longevity = 0; // Initially 0, will increase over time
  const financials = calculateFinancialsScore(listing);

  // Weighted average of component scores
  score = (completeness * 0.35) + (verification * 0.2) + (documentation * 0.15) +
    (engagement * 0.1) + (longevity * 0.1) + (financials * 0.1);

  // Ensure score is between 0-10
  return Math.min(10, Math.max(0, score));
};

/**
 * Calculate a completeness score for a listing (0-10)
 */
const calculateCompletenessScore = (listing: Partial<Listing>): number => {
  let score = 0;
  let maxScore = 0;

  // Check basic fields (up to 5 points)
  if (listing.name) score++; maxScore++;
  if (listing.description && listing.description.length >= 100) score++; maxScore++;
  if (listing.media?.galleryImages && listing.media.galleryImages.length >= 3) score++; maxScore++;
  if (listing.location?.city && listing.location.state) score++; maxScore++;
  if (listing.contactInfo?.email) score++; maxScore++;

  // Check type-specific fields (up to 5 points)
  if (listing.type === ListingType.BUSINESS && listing.businessDetails) {
    const bd = listing.businessDetails;
    if (bd.businessType) score++; maxScore++;
    if (bd.establishedYear) score++; maxScore++;
    if (bd.operations?.employees?.count) score++; maxScore++;
    if (bd.financials?.annualRevenue?.value) score++; maxScore++;
    if (bd.sale?.askingPrice?.value) score++; maxScore++;
  }
  else if (listing.type === ListingType.FRANCHISE && listing.franchiseDetails) {
    const fd = listing.franchiseDetails;
    if (fd.franchiseBrand) score++; maxScore++;
    if (fd.franchiseType) score++; maxScore++;
    if (fd.franchiseSince) score++; maxScore++;
    if (fd.investment?.franchiseFee?.value) score++; maxScore++;
    if (fd.support?.initialTraining) score++; maxScore++;
  }
  else if (listing.type === ListingType.STARTUP && listing.startupDetails) {
    const sd = listing.startupDetails;
    if (sd.developmentStage) score++; maxScore++;
    if (sd.team?.founders?.length) score++; maxScore++;
    if (sd.market?.targetMarket) score++; maxScore++;
    if (sd.funding?.currentRaisingAmount?.value) score++; maxScore++;
    if (sd.funding?.equityOffered) score++; maxScore++;
    if (sd.funding?.preMoneyValuation?.value > 0) score += 2;
    if (sd.market?.marketSize?.value > 0) score += 2;
    if (sd.market?.monthlyRevenue?.value && sd.market.monthlyRevenue.value > 0) score += 2;
  }
  else if (listing.type === ListingType.INVESTOR && listing.investorDetails) {
    const id = listing.investorDetails;
    if (id.investorType) score++; maxScore++;
    if (id.investment?.preferredRounds?.length) score++; maxScore++;
    if (id.focus?.primaryIndustries?.length) score++; maxScore++;
    if (id.focus?.investmentCriteria) score++; maxScore++;
    if (id.portfolio?.investmentProcess) score++; maxScore++;
  }
  else if (listing.type === ListingType.DIGITAL_ASSET && listing.digitalAssetDetails) {
    const dd = listing.digitalAssetDetails;
    if (dd.assetType) score++; maxScore++;
    if (dd.technical?.domainName) score++; maxScore++;
    if (dd.traffic?.monthlyVisitors) score++; maxScore++;
    if (dd.financials?.monthlyRevenue?.value) score++; maxScore++;
    if (dd.sale?.askingPrice?.value) score++; maxScore++;
  }

  // If maxScore is 0, return 0 to avoid division by zero
  if (maxScore === 0) return 0;

  // Convert to 0-10 scale
  return (score / maxScore) * 10;
};

// Fixed calculateFinancialsScore function
const calculateFinancialsScore = (listing: Partial<Listing>): number => {
  let score = 0;

  if (listing.type === ListingType.BUSINESS && listing.businessDetails) {
    const bd = listing.businessDetails;

    // Give points for financial detail
    if (bd.financials?.annualRevenue?.value > 0) score += 3;
    if (bd.financials?.profitMargin?.percentage > 0) score += 2;

    // Check revenue trend - fixed enum reference
    if (bd.financials?.revenueTrend === 'growing') score += 3;
    else if (bd.financials?.revenueTrend === 'stable') score += 2;

    // Check for reasonable pricing
    if (bd.sale?.askingPrice?.value > 0 && bd.financials?.annualRevenue?.value > 0) {
      const priceToRevenue = bd.sale.askingPrice.value / bd.financials.annualRevenue.value;
      // Reasonable price-to-revenue ratio is 1-3x
      if (priceToRevenue > 0.5 && priceToRevenue < 5) score += 2;
    }
  }
  else if (listing.type === ListingType.FRANCHISE && listing.franchiseDetails) {
    const fd = listing.franchiseDetails;

    // Points for financial transparency
    if (fd.investment?.franchiseFee?.value > 0) score += 2;
    if (fd.investment?.totalInitialInvestment?.value > 0) score += 2;
    if (fd.investment?.royaltyFee > 0) score += 2;
    if (fd.performance?.averageUnitSales?.value > 0) score += 2;
    if (fd.performance?.averageBreakeven) score += 2;
  }
  else if (listing.type === ListingType.STARTUP && listing.startupDetails) {
    const sd = listing.startupDetails;

    // Startup financial scoring
    if (sd.funding?.currentRaisingAmount?.value > 0) score += 2;
    if (sd.funding?.equityOffered > 0) score += 2;
    if (sd.funding?.preMoneyValuation?.value > 0) score += 2;
    if (sd.market?.marketSize?.value > 0) score += 2;
    if (sd.market?.monthlyRevenue?.value > 0) score += 2;
  }
  else if (listing.type === ListingType.INVESTOR && listing.investorDetails) {
    // Investors aren't scored on financials as strictly
    score = 8; // Default good score
  }
  else if (listing.type === ListingType.DIGITAL_ASSET && listing.digitalAssetDetails) {
    const dd = listing.digitalAssetDetails;

    // Digital asset financial transparency
    if (dd.financials?.monthlyRevenue?.value > 0) score += 2;
    if (dd.financials?.annualRevenue?.value > 0) score += 2;
    if (dd.financials?.profitMargin > 0) score += 2;
    if (dd.traffic?.monthlyVisitors > 0) score += 2;
    if (dd.sale?.askingPrice?.value > 0) score += 2;
  }

  // Ensure score is between 0-10
  return Math.min(10, score);
};