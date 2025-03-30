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
  orderBy,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { IndustryObject, CategoryObject, SubCategoryObject } from '@/types/listings';

// Collection names
const INDUSTRIES_COLLECTION = 'industries';
const CATEGORIES_COLLECTION = 'categories';
const SUBCATEGORIES_COLLECTION = 'subCategories';

/**
* Get all industries
*/
export const getAllIndustries = async (currentUserId?: string): Promise<IndustryObject[]> => {
  try {
    // Check authentication without throwing
    if (!auth.currentUser && !currentUserId) {
      console.warn('Authentication not established for fetching industries');
      return []; // Return empty array instead of throwing
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
        slug: data.slug,
        isActive: data.isActive,
        listingCount: data.listingCount || 0,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as IndustryObject;
    });
    
    return industries;
  } catch (error) {
    console.error('Error getting industries:', error);
    // Return empty array on error to avoid breaking the UI
    return [];
  }
};


/**
* Get categories by industry ID
*/
export const getCategoriesByIndustry = async (industryId: string, currentUserId?: string): Promise<CategoryObject[]> => {
try {
  if (!auth.currentUser && !currentUserId) {
    console.warn('Authentication not established for fetching categories');
    return [];
  }
  
  const categoriesQuery = query(
    collection(db, CATEGORIES_COLLECTION),
    where('industryId', '==', industryId),
    where('isActive', '==', true),
    orderBy('name', 'asc')
  );
  
  const snapshot = await getDocs(categoriesQuery);
  
  const categories = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      slug: data.slug,
      industryId: data.industryId,
      industryRef: data.industryRef,
      isActive: data.isActive,
      listingCount: data.listingCount || 0,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as CategoryObject;
  });
  
  return categories;
} catch (error) {
  console.error('Error getting categories:', error);
  return [];
}
};

/**
* Get subcategories by category ID
*/
export const getSubCategoriesByCategory = async (categoryId: string, currentUserId?: string): Promise<SubCategoryObject[]> => {
try {
  if (!auth.currentUser && !currentUserId) {
    console.warn('Authentication not established for fetching subcategories');
    return [];
  }
  
  const subCategoriesQuery = query(
    collection(db, SUBCATEGORIES_COLLECTION),
    where('categoryId', '==', categoryId),
    where('isActive', '==', true),
    orderBy('name', 'asc')
  );
  
  const snapshot = await getDocs(subCategoriesQuery);
  
  const subCategories = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      slug: data.slug,
      categoryId: data.categoryId,
      categoryRef: data.categoryRef,
      industryId: data.industryId,
      industryRef: data.industryRef,
      isActive: data.isActive,
      listingCount: data.listingCount || 0,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as SubCategoryObject;
  });
  
  return subCategories;
} catch (error) {
  console.error('Error getting subcategories:', error);
  return [];
}
};

/**
* Get all categories
*/
export const getAllCategories = async (currentUserId?: string): Promise<CategoryObject[]> => {
try {
  if (!auth.currentUser && !currentUserId) {
    console.warn('Authentication not established for fetching categories');
    return [];
  }
  
  const categoriesQuery = query(
    collection(db, CATEGORIES_COLLECTION),
    where('isActive', '==', true),
    orderBy('name', 'asc')
  );
  
  const snapshot = await getDocs(categoriesQuery);
  
  const categories = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      slug: data.slug,
      industryId: data.industryId,
      industryRef: data.industryRef,
      isActive: data.isActive,
      listingCount: data.listingCount || 0,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as CategoryObject;
  });
  
  return categories;
} catch (error) {
  console.error('Error getting all categories:', error);
  return [];
}
};

/**
* Get all subcategories
*/
export const getAllSubCategories = async (currentUserId?: string): Promise<SubCategoryObject[]> => {
try {
  if (!auth.currentUser && !currentUserId) {
    console.warn('Authentication not established for fetching subcategories');
    return [];
  }
  
  const subCategoriesQuery = query(
    collection(db, SUBCATEGORIES_COLLECTION),
    where('isActive', '==', true),
    orderBy('name', 'asc')
  );
  
  const snapshot = await getDocs(subCategoriesQuery);
  
  const subCategories = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      slug: data.slug,
      categoryId: data.categoryId,
      categoryRef: data.categoryRef,
      industryId: data.industryId,
      industryRef: data.industryRef,
      isActive: data.isActive,
      listingCount: data.listingCount || 0,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as SubCategoryObject;
  });
  
  return subCategories;
} catch (error) {
  console.error('Error getting all subcategories:', error);
  return [];
}
};

/**
 * Get industry by ID
 */
export const getIndustryById = async (id: string, currentUserId?: string): Promise<IndustryObject> => {
  try {
    if (!auth.currentUser && !currentUserId) {
      console.warn('Authentication not established for fetching industry');
      throw new Error('Authentication required to fetch industry');
    }
    
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
      slug: data.slug,
      isActive: data.isActive,
      listingCount: data.listingCount || 0,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as IndustryObject;
  } catch (error) {
    console.error('Error getting industry by ID:', error);
    throw new Error(`Failed to fetch industry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
* Get category by ID
*/
export const getCategoryById = async (id: string, currentUserId?: string): Promise<CategoryObject> => {
try {
  if (!auth.currentUser && !currentUserId) {
    console.warn('Authentication not established for fetching category');
    throw new Error('Authentication required to fetch category');
  }
  
  const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
  const categorySnap = await getDoc(categoryRef);
  
  if (!categorySnap.exists()) {
    throw new Error(`Category with ID ${id} not found`);
  }
  
  const data = categorySnap.data();
  return {
    id: categorySnap.id,
    name: data.name,
    description: data.description,
    slug: data.slug,
    industryId: data.industryId,
    industryRef: data.industryRef,
    isActive: data.isActive,
    listingCount: data.listingCount || 0,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate()
  } as CategoryObject;
} catch (error) {
  console.error('Error getting category by ID:', error);
  throw new Error(`Failed to fetch category: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
};

/**
* Get subcategory by ID
*/
export const getSubCategoryById = async (id: string, currentUserId?: string): Promise<SubCategoryObject> => {
try {
  if (!auth.currentUser && !currentUserId) {
    console.warn('Authentication not established for fetching subcategory');
    throw new Error('Authentication required to fetch subcategory');
  }
  
  const subCategoryRef = doc(db, SUBCATEGORIES_COLLECTION, id);
  const subCategorySnap = await getDoc(subCategoryRef);
  
  if (!subCategorySnap.exists()) {
    throw new Error(`SubCategory with ID ${id} not found`);
  }
  
  const data = subCategorySnap.data();
  return {
    id: subCategorySnap.id,
    name: data.name,
    description: data.description,
    slug: data.slug,
    categoryId: data.categoryId,
    categoryRef: data.categoryRef,
    industryId: data.industryId,
    industryRef: data.industryRef,
    isActive: data.isActive,
    listingCount: data.listingCount || 0,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate()
  } as SubCategoryObject;
} catch (error) {
  console.error('Error getting subcategory by ID:', error);
  throw new Error(`Failed to fetch subcategory: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
};

/**
 * Create a new industry
 */
export const createIndustry = async (
  industryData: Partial<IndustryObject>
): Promise<string> => {
  try {
    // Validate required fields
    if (!industryData.name) {
      throw new Error('Industry name is required');
    }
    
    if (!auth.currentUser) {
      throw new Error('Authentication required to create industry');
    }
    
    // Create a new document reference
    const industryRef = doc(collection(db, INDUSTRIES_COLLECTION));
    const industryId = industryRef.id;
    
    // Set industry data
    await setDoc(industryRef, {
      id: industryId,
      name: industryData.name,
      description: industryData.description || '',
      slug: industryData.slug || industryData.name.toLowerCase().replace(/\s+/g, '-'),
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
* Create a new category
*/
export const createCategory = async (
categoryData: Partial<CategoryObject>
): Promise<string> => {
try {
  // Validate required fields
  if (!categoryData.name || !categoryData.industryId) {
    throw new Error('Category name and industry ID are required');
  }
  
  if (!auth.currentUser) {
    throw new Error('Authentication required to create category');
  }
  
  // Get industry reference
  const industryRef = doc(db, INDUSTRIES_COLLECTION, categoryData.industryId);
  
  // Create a new document reference
  const categoryRef = doc(collection(db, CATEGORIES_COLLECTION));
  const categoryId = categoryRef.id;
  
  // Set category data
  await setDoc(categoryRef, {
    id: categoryId,
    name: categoryData.name,
    description: categoryData.description || '',
    slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
    industryId: categoryData.industryId,
    industryRef: industryRef,
    isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
    listingCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return categoryId;
} catch (error) {
  console.error('Error creating category:', error);
  throw new Error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
};

/**
* Create a new subcategory
*/
export const createSubCategory = async (
subCategoryData: Partial<SubCategoryObject>
): Promise<string> => {
try {
  // Validate required fields
  if (!subCategoryData.name || !subCategoryData.categoryId || !subCategoryData.industryId) {
    throw new Error('Subcategory name, category ID, and industry ID are required');
  }
  
  if (!auth.currentUser) {
    throw new Error('Authentication required to create subcategory');
  }
  
  // Get references
  const industryRef = doc(db, INDUSTRIES_COLLECTION, subCategoryData.industryId);
  const categoryRef = doc(db, CATEGORIES_COLLECTION, subCategoryData.categoryId);
  
  // Create a new document reference
  const subCategoryRef = doc(collection(db, SUBCATEGORIES_COLLECTION));
  const subCategoryId = subCategoryRef.id;
  
  // Set subcategory data
  await setDoc(subCategoryRef, {
    id: subCategoryId,
    name: subCategoryData.name,
    description: subCategoryData.description || '',
    slug: subCategoryData.slug || subCategoryData.name.toLowerCase().replace(/\s+/g, '-'),
    industryId: subCategoryData.industryId,
    industryRef: industryRef,
    categoryId: subCategoryData.categoryId,
    categoryRef: categoryRef,
    isActive: subCategoryData.isActive !== undefined ? subCategoryData.isActive : true,
    listingCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return subCategoryId;
} catch (error) {
  console.error('Error creating subcategory:', error);
  throw new Error(`Failed to create subcategory: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
};

/**
 * Update an existing industry
 */
export const updateIndustry = async (
  id: string,
  industryData: Partial<IndustryObject>
): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to update industry');
    }
    
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
* Update an existing category
*/
export const updateCategory = async (
id: string,
categoryData: Partial<CategoryObject>
): Promise<void> => {
try {
  if (!auth.currentUser) {
    throw new Error('Authentication required to update category');
  }
  
  const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
  
  // If industry ID is changing, update the reference
  let updateData: any = { ...categoryData };
  if (categoryData.industryId) {
    const industryRef = doc(db, INDUSTRIES_COLLECTION, categoryData.industryId);
    updateData.industryRef = industryRef;
  }
  
  // Update data
  await updateDoc(categoryRef, {
    ...updateData,
    updatedAt: serverTimestamp()
  });
} catch (error) {
  console.error('Error updating category:', error);
  throw new Error(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
};

/**
* Update an existing subcategory
*/
export const updateSubCategory = async (
id: string,
subCategoryData: Partial<SubCategoryObject>
): Promise<void> => {
try {
  if (!auth.currentUser) {
    throw new Error('Authentication required to update subcategory');
  }
  
  const subCategoryRef = doc(db, SUBCATEGORIES_COLLECTION, id);
  
  // If references are changing, update them
  let updateData: any = { ...subCategoryData };
  if (subCategoryData.industryId) {
    const industryRef = doc(db, INDUSTRIES_COLLECTION, subCategoryData.industryId);
    updateData.industryRef = industryRef;
  }
  
  if (subCategoryData.categoryId) {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, subCategoryData.categoryId);
    updateData.categoryRef = categoryRef;
  }
  
  // Update data
  await updateDoc(subCategoryRef, {
    ...updateData,
    updatedAt: serverTimestamp()
  });
} catch (error) {
  console.error('Error updating subcategory:', error);
  throw new Error(`Failed to update subcategory: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
};

/**
 * Delete an industry (soft delete)
 */
export const deleteIndustry = async (id: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to delete industry');
    }
    
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
* Delete a category (soft delete)
*/
export const deleteCategory = async (id: string): Promise<void> => {
try {
  if (!auth.currentUser) {
    throw new Error('Authentication required to delete category');
  }
  
  const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
  
  // Soft delete by setting isActive to false
  await updateDoc(categoryRef, {
    isActive: false,
    updatedAt: serverTimestamp()
  });
} catch (error) {
  console.error('Error deleting category:', error);
  throw new Error(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
};

/**
* Delete a subcategory (soft delete)
*/
export const deleteSubCategory = async (id: string): Promise<void> => {
try {
  if (!auth.currentUser) {
    throw new Error('Authentication required to delete subcategory');
  }
  
  const subCategoryRef = doc(db, SUBCATEGORIES_COLLECTION, id);
  
  // Soft delete by setting isActive to false
  await updateDoc(subCategoryRef, {
    isActive: false,
    updatedAt: serverTimestamp()
  });
} catch (error) {
  console.error('Error deleting subcategory:', error);
  throw new Error(`Failed to delete subcategory: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
};

/**
 * Seed initial industries if none exist
 * This is used for initial setup
 */
export const seedInitialIndustries = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Authentication required to seed industries');
    }
    
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
* Seed initial categories for an industry if none exist
*/
export const seedInitialCategories = async (industryId: string): Promise<void> => {
try {
  if (!auth.currentUser) {
    throw new Error('Authentication required to seed categories');
  }
  
  // Check if categories already exist for this industry
  const catSnapshot = await getDocs(
    query(collection(db, CATEGORIES_COLLECTION), where('industryId', '==', industryId))
  );
  
  if (catSnapshot.size > 0) {
    return; // Categories already exist, no need to seed
  }
  
  // Get industry name
  const industryDoc = await getDoc(doc(db, INDUSTRIES_COLLECTION, industryId));
  if (!industryDoc.exists()) {
    throw new Error(`Industry with ID ${industryId} not found`);
  }
  
  const industryName = industryDoc.data().name;
  
  // Default categories based on industry
  let defaultCategories = [];
  
  switch (industryName) {
    case 'Retail':
      defaultCategories = [
        { name: 'Clothing & Apparel', industryId },
        { name: 'Electronics', industryId },
        { name: 'Furniture', industryId },
        { name: 'Grocery & Convenience', industryId },
        { name: 'Specialty Retail', industryId }
      ];
      break;
      
    case 'Food & Beverage':
      defaultCategories = [
        { name: 'Restaurants', industryId },
        { name: 'Cafes & Bakeries', industryId },
        { name: 'Bars & Nightclubs', industryId },
        { name: 'Food Production', industryId },
        { name: 'Beverage Manufacturing', industryId }
      ];
      break;
      
    case 'Technology':
      defaultCategories = [
        { name: 'Software Development', industryId },
        { name: 'IT Services', industryId },
        { name: 'Hardware & Electronics', industryId },
        { name: 'Cloud Services', industryId },
        { name: 'Telecommunications', industryId }
      ];
      break;
      
    // Add more industries as needed
    default:
      defaultCategories = [
        { name: 'General', industryId },
        { name: 'Specialized Services', industryId },
        { name: 'Products', industryId }
      ];
  }
  
  // Create each category
  const promises = defaultCategories.map(category => createCategory(category));
  await Promise.all(promises);
  
  console.log(`Successfully seeded initial categories for ${industryName}`);
} catch (error) {
  console.error('Error seeding initial categories:', error);
}
};

/**
 * Get top industries by listing count
 */
export const getTopIndustries = async (limit: number = 10, currentUserId?: string): Promise<IndustryObject[]> => {
  try {
    if (!auth.currentUser && !currentUserId) {
      console.warn('Authentication not established for fetching top industries');
      return []; // Return empty array instead of throwing
    }
    
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
        slug: data.slug,
        isActive: data.isActive,
        listingCount: data.listingCount || 0,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as IndustryObject;
    });
    
    return industries;
  } catch (error) {
    console.error('Error getting top industries:', error);
    return []; // Return empty array on error
  }
};



/**
* Get display names for classifications (multiple industry-category-subcategory sets)
*/
export const getClassificationNames = async (
  classifications: Array<{
    industry: string,
    category: string,
    subCategories: string[]
  }>
): Promise<Array<{
  industryName: string,
  categoryName: string,
  subCategoryNames: string[]
}>> => {
  try {
    // Process classifications in batches to avoid too many parallel requests
    const results = await Promise.all(
      classifications.map(async (classification) => {
        const result = {
          industryName: '',
          categoryName: '',
          subCategoryNames: [] as string[]
        };
        
        // Get industry name
        try {
          const industryDoc = await getDoc(doc(db, 'industries', classification.industry));
          if (industryDoc.exists()) {
            result.industryName = industryDoc.data().name;
          }
        } catch (err) {
          console.error(`Error fetching industry name:`, err);
        }
        
        // Get category name
        try {
          const categoryDoc = await getDoc(doc(db, 'categories', classification.category));
          if (categoryDoc.exists()) {
            result.categoryName = categoryDoc.data().name;
          }
        } catch (err) {
          console.error(`Error fetching category name:`, err);
        }
        
        // Get subcategory names
        if (classification.subCategories.length > 0) {
          const subCategoryNames = await Promise.all(
            classification.subCategories.map(async (id) => {
              try {
                const subCategoryDoc = await getDoc(doc(db, 'subCategories', id));
                return subCategoryDoc.exists() ? subCategoryDoc.data().name : null;
              } catch (err) {
                console.error(`Error fetching subcategory name:`, err);
                return null;
              }
            })
          );
          
          result.subCategoryNames = subCategoryNames.filter(name => name !== null) as string[];
        }
        
        return result;
      })
    );
    
    return results;
  } catch (error) {
    console.error('Error getting classification names:', error);
    return [];
  }
};

/**
 * Legacy function for getting classification names (single industry)
 * Kept for backward compatibility
 */
export const getClassificationNamesSingle = async (
  industryId?: string,
  categoryId?: string,
  subCategoryIds: string[] = []
): Promise<{
  industryName?: string,
  categoryName?: string,
  subCategoryNames: string[]
}> => {
  try {
    const result = {
      industryName: undefined,
      categoryName: undefined,
      subCategoryNames: [] as string[]
    };
    
    // Get industry name if ID provided
    if (industryId) {
      try {
        const industryDoc = await getDoc(doc(db, INDUSTRIES_COLLECTION, industryId));
        if (industryDoc.exists()) {
          result.industryName = industryDoc.data().name;
        }
      } catch (err) {
        console.error('Error fetching industry name:', err);
      }
    }
    
    // Get category name if ID provided
    if (categoryId) {
      try {
        const categoryDoc = await getDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
        if (categoryDoc.exists()) {
          result.categoryName = categoryDoc.data().name;
        }
      } catch (err) {
        console.error('Error fetching category name:', err);
      }
    }
    
    // Get subcategory names if IDs provided
    if (subCategoryIds.length > 0) {
      const subCategoryNames: string[] = [];
      
      // Process subcategories in batches to avoid too many parallel requests
      const batchSize = 5;
      for (let i = 0; i < subCategoryIds.length; i += batchSize) {
        const batch = subCategoryIds.slice(i, i + batchSize);
        const promises = batch.map(async (id) => {
          try {
            const subCategoryDoc = await getDoc(doc(db, SUBCATEGORIES_COLLECTION, id));
            if (subCategoryDoc.exists()) {
              return subCategoryDoc.data().name;
            }
            return null;
          } catch (err) {
            console.error(`Error fetching subcategory name for ID ${id}:`, err);
            return null;
          }
        });
        
        const batchResults = await Promise.all(promises);
        subCategoryNames.push(...batchResults.filter(name => name !== null) as string[]);
      }
      
      result.subCategoryNames = subCategoryNames;
    }
    
    return result;
  } catch (error) {
    console.error('Error getting classification names:', error);
    return {
      industryName: undefined,
      categoryName: undefined,
      subCategoryNames: []
    };
  }
};
