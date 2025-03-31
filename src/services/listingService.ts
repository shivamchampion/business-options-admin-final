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

/**
 * Converts a Firestore timestamp to Date
 */
const convertTimestampToDate = (timestamp: Timestamp | undefined): Date | undefined => {
  return timestamp ? timestamp.toDate() : undefined;
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
      // Filter by type
      if (filters.type && filters.type.length > 0) {
        conditions.push(where('type', 'in', filters.type));
      }

      // Filter by status
      if (filters.status && filters.status.length > 0) {
        conditions.push(where('status', 'in', filters.status));
      }

      // Filter by owner
      if (filters.ownerId) {
        conditions.push(where('ownerId', '==', filters.ownerId));
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

      // For new schema (as we transition):
      // This would be a client-side filter as classifications is an array of objects
      let filteredListings = listings;
      if (filters?.industries && filters.industries.length > 0) {
        filteredListings = filteredListings.filter(listing =>
          listing.classifications &&
          listing.classifications.some(c =>
            filters.industries.includes(c.industry)
          )
        );
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
    const listings = snapshot.docs.map(doc => convertDocToListing(doc));

    // Apply client-side filtering for search (if needed)
    let filteredListings = listings;
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredListings = listings.filter(listing =>
        listing.name.toLowerCase().includes(searchTerm) ||
        listing.description.toLowerCase().includes(searchTerm) ||
        (listing.shortDescription && listing.shortDescription.toLowerCase().includes(searchTerm))
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

        // Apply min and max filters
        const passesMin = filters.priceRange.min ? price >= filters.priceRange.min : true;
        const passesMax = filters.priceRange.max ? price <= filters.priceRange.max : true;

        return passesMin && passesMax;
      });
    }

    return {
      listings: filteredListings,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error('Error getting listings:', error);
    return { listings: [], lastDoc: null };
  }
};

/**
 * Get a listing by ID
 */
export const getListingById = async (id: string): Promise<Listing> => {
  try {
    const listingRef = doc(db, LISTINGS_COLLECTION, id);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) {
      throw new Error(`Listing with ID ${id} not found`);
    }

    return convertDocToListing(listingSnap);
  } catch (error) {
    console.error('Error getting listing by ID:', error);
    throw new Error(`Failed to fetch listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Upload an image to Firebase Storage for a listing
 */
export const uploadListingImage = async (
  file: File,
  listingId: string,
  index: number = 0
): Promise<ImageObject> => {
  try {
    // Create storage reference
    const storageRef = ref(storage, `listings/${listingId}/images/${index}_${file.name}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Get image dimensions (browser only)
    let width = 0;
    let height = 0;

    if (typeof window !== 'undefined') {
      const img = new Image();
      img.src = downloadURL;
      await new Promise<void>((resolve) => {
        img.onload = () => {
          width = img.width;
          height = img.height;
          resolve();
        };
      });
    }

    // Create image object
    const imageObject: ImageObject = {
      url: downloadURL,
      path: storageRef.fullPath,
      alt: file.name,
      width,
      height
    };

    return imageObject;
  } catch (error) {
    console.error('Error uploading listing image:', error);
    throw error;
  }
};

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
 * Create a new listing
 */
export const createListing = async (
  listingData: Partial<Listing>,
  images?: File[],
  documents?: Array<{ file: File, type: string, description?: string, isPublic?: boolean }>
): Promise<string> => {
  try {
    // Validate required fields
    if (!listingData.name || !listingData.type || !listingData.description) {
      throw new Error('Listing name, type, and description are required');
    }

    // Get current user for ownership information
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to create a listing');
    }

    // Create a slug from the name
    const slug = generateSlug(listingData.name);

    // Create a new document reference
    const listingRef = doc(collection(db, LISTINGS_COLLECTION));
    const listingId = listingRef.id;

    // Upload images if provided
    let galleryImages: ImageObject[] = [];
    let featuredImage: ImageObject | undefined;

    if (images && images.length > 0) {
      // Upload each image
      const imagePromises = images.map((file, index) =>
        uploadListingImage(file, listingId, index)
      );

      galleryImages = await Promise.all(imagePromises);

      // Set the first image as featured image
      featuredImage = galleryImages[0];
    }

    // Upload documents if provided
    let documentObjects: DocumentObject[] = [];

    if (documents && documents.length > 0) {
      // Upload each document
      const documentPromises = documents.map(({ file, type, description, isPublic }) =>
        uploadListingDocument(file, listingId, type, description, isPublic)
      );

      documentObjects = await Promise.all(documentPromises);
    }

    // Calculate initial system rating
    const systemRating = calculateSystemRating(listingData, galleryImages.length, documentObjects.length);

    // In createListing function
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

    // Merge base data with type-specific details
    const listingDataToSave = {
      ...baseListingData,
      // Add type-specific details based on the listing type
      ...(listingData.type === ListingType.BUSINESS && { businessDetails: listingData.businessDetails }),
      ...(listingData.type === ListingType.FRANCHISE && { franchiseDetails: listingData.franchiseDetails }),
      ...(listingData.type === ListingType.STARTUP && { startupDetails: listingData.startupDetails }),
      ...(listingData.type === ListingType.INVESTOR && { investorDetails: listingData.investorDetails }),
      ...(listingData.type === ListingType.DIGITAL_ASSET && { digitalAssetDetails: listingData.digitalAssetDetails })
    };

    // Save the listing to Firestore
    await setDoc(listingRef, listingDataToSave);

    // Update user's listings array
    const userRef = doc(db, 'users', currentUser.id);
    await updateDoc(userRef, {
      listings: arrayUnion(listingId),
      listingRefs: arrayUnion(listingRef)
    });

    return listingId;
  } catch (error) {
    console.error('Error creating listing:', error);
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

    // Update the listing in Firestore
    await updateDoc(listingRef, updateData);
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
    // Get the listing to verify ownership
    const listing = await getListingById(id);

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