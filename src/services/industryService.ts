/**
 * Industry service
 * Handles operations related to industries for the Business Options Platform
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
    orderBy
  } from 'firebase/firestore';
  import { auth, db } from '@/lib/firebase';
  
  // Collection name
  const INDUSTRIES_COLLECTION = 'industries';
  
  // Industry interface
  export interface Industry {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    isActive: boolean;
    listingCount?: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
/**
 * Get all industries
 */
export const getAllIndustries = async (): Promise<Industry[]> => {
    try {
      // Verify authentication
      if (!auth.currentUser) {
        throw new Error('Authentication required to fetch industries');
      }
      
      const industriesQuery = query(
        collection(db, INDUSTRIES_COLLECTION),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(industriesQuery);
      
      // Convert documents to industry objects
      const industries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          parentId: data.parentId,
          isActive: data.isActive,
          listingCount: data.listingCount || 0,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Industry;
      });
      
      return industries;
    } catch (error) {
      console.error('Error getting industries:', error);
      // Return empty array on error to avoid breaking the UI
      return [];
    }
  };
  
  /**
   * Get industry by ID
   */
  export const getIndustryById = async (id: string): Promise<Industry> => {
    try {
      const industryRef = doc(db, INDUSTRIES_COLLECTION, id);
      const industrySnap = await getDoc(industryRef);
      
      if (!industrySnap.exists()) {
        throw new Error(`Industry with ID ${id} not found`);
      }
      
      const data = industrySnap.data();
      return {
        id: industrySnap.id,
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        isActive: data.isActive,
        listingCount: data.listingCount || 0,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Industry;
    } catch (error) {
      console.error('Error getting industry by ID:', error);
      throw new Error(`Failed to fetch industry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Create a new industry
   */
  export const createIndustry = async (
    industryData: Partial<Industry>
  ): Promise<string> => {
    try {
      // Validate required fields
      if (!industryData.name) {
        throw new Error('Industry name is required');
      }
      
      // Create a new document reference
      const industryRef = doc(collection(db, INDUSTRIES_COLLECTION));
      const industryId = industryRef.id;
      
      // Set industry data
      await setDoc(industryRef, {
        id: industryId,
        name: industryData.name,
        description: industryData.description || '',
        parentId: industryData.parentId || null,
        isActive: industryData.isActive !== undefined ? industryData.isActive : true,
        listingCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return industryId;
    } catch (error) {
      console.error('Error creating industry:', error);
      throw new Error(`Failed to create industry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Update an existing industry
   */
  export const updateIndustry = async (
    id: string,
    industryData: Partial<Industry>
  ): Promise<void> => {
    try {
      const industryRef = doc(db, INDUSTRIES_COLLECTION, id);
      
      // Update data
      await updateDoc(industryRef, {
        ...industryData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating industry:', error);
      throw new Error(`Failed to update industry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Delete an industry (soft delete)
   */
  export const deleteIndustry = async (id: string): Promise<void> => {
    try {
      const industryRef = doc(db, INDUSTRIES_COLLECTION, id);
      
      // Soft delete by setting isActive to false
      await updateDoc(industryRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting industry:', error);
      throw new Error(`Failed to delete industry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Seed initial industries if none exist
   * This is used for initial setup
   */
  export const seedInitialIndustries = async (): Promise<void> => {
    try {
      // Check if industries already exist
      const snapshot = await getDocs(collection(db, INDUSTRIES_COLLECTION));
      if (snapshot.size > 0) {
        return; // Industries already exist, no need to seed
      }
      
      // Default industries
      const defaultIndustries = [
        { name: 'Retail' },
        { name: 'Food & Beverage' },
        { name: 'Technology' },
        { name: 'Manufacturing' },
        { name: 'Healthcare' },
        { name: 'Education' },
        { name: 'Services' },
        { name: 'Hospitality' },
        { name: 'Real Estate' },
        { name: 'Automotive' },
        { name: 'Construction' },
        { name: 'Financial Services' },
        { name: 'E-commerce' },
        { name: 'Transportation & Logistics' },
        { name: 'Entertainment & Media' }
      ];
      
      // Create each industry
      const promises = defaultIndustries.map(industry => createIndustry(industry));
      await Promise.all(promises);
      
      console.log('Successfully seeded initial industries');
    } catch (error) {
      console.error('Error seeding initial industries:', error);
    }
  };
  
  /**
   * Get top industries by listing count
   */
  export const getTopIndustries = async (limit: number = 10): Promise<Industry[]> => {
    try {
      const industriesQuery = query(
        collection(db, INDUSTRIES_COLLECTION),
        where('isActive', '==', true),
        orderBy('listingCount', 'desc'),
        orderBy('name', 'asc'),
        limit
      );
      
      const snapshot = await getDocs(industriesQuery);
      
      // Convert documents to industry objects
      const industries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          parentId: data.parentId,
          isActive: data.isActive,
          listingCount: data.listingCount || 0,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Industry;
      });
      
      return industries;
    } catch (error) {
      console.error('Error getting top industries:', error);
      throw new Error(`Failed to fetch top industries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };