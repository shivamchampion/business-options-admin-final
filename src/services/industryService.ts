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
  limit,
  Timestamp,
  DocumentReference
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

/**
 * Seed initial industries, categories, and subcategories
 * This function ensures there's at least some data to populate the form
 */
export const seedIndustriesData = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      console.warn('Authentication not established for seeding industries data');
      return;
    }
    
    // Check if industries already exist
    const industriesSnapshot = await getDocs(collection(db, INDUSTRIES_COLLECTION));
    if (industriesSnapshot.size > 0) {
      console.log('Industries already exist, checking for categories and subcategories');
      
      // Check if each industry has categories
      for (const industryDoc of industriesSnapshot.docs) {
        const industryId = industryDoc.id;
        const categoriesQuery = query(
          collection(db, CATEGORIES_COLLECTION),
          where('industryId', '==', industryId)
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        
        if (categoriesSnapshot.size === 0) {
          console.log(`No categories found for industry ${industryId}, seeding categories`);
          await seedCategoriesForIndustry(industryId, industryDoc.data().name);
        } else {
          // Check if each category has subcategories
          for (const categoryDoc of categoriesSnapshot.docs) {
            const categoryId = categoryDoc.id;
            const subCategoriesQuery = query(
              collection(db, SUBCATEGORIES_COLLECTION),
              where('categoryId', '==', categoryId)
            );
            const subCategoriesSnapshot = await getDocs(subCategoriesQuery);
            
            if (subCategoriesSnapshot.size === 0) {
              console.log(`No subcategories found for category ${categoryId}, seeding subcategories`);
              await seedSubCategoriesForCategory(categoryId, categoryDoc.data().name, industryId);
            }
          }
        }
      }
      
      return;
    }
    
    // If no industries exist, create initial industries
    console.log('No industries found, seeding initial industries, categories, and subcategories');
    
    // Default industries with categories and subcategories
    const industriesData = [
      {
        name: 'Retail',
        categories: [
          {
            name: 'Clothing & Apparel',
            subcategories: ['Fashion Boutique', 'Footwear', 'Accessories', 'Children\'s Clothing']
          },
          {
            name: 'Electronics',
            subcategories: ['Mobile Phones', 'Computers & Laptops', 'Home Appliances', 'Audio & Visual']
          },
          {
            name: 'Grocery & Convenience',
            subcategories: ['Supermarket', 'Convenience Store', 'Specialty Foods', 'Organic & Natural']
          }
        ]
      },
      {
        name: 'Food & Beverage',
        categories: [
          {
            name: 'Restaurants',
            subcategories: ['Fine Dining', 'Casual Dining', 'Fast Food', 'Cafes', 'Food Trucks']
          },
          {
            name: 'Bars & Nightclubs',
            subcategories: ['Pub', 'Wine Bar', 'Nightclub', 'Cocktail Bar', 'Sports Bar']
          },
          {
            name: 'Food Production',
            subcategories: ['Bakery', 'Brewery', 'Dairy Products', 'Packaged Foods', 'Catering']
          }
        ]
      },
      {
        name: 'Technology',
        categories: [
          {
            name: 'Software Development',
            subcategories: ['Mobile Apps', 'Web Development', 'Enterprise Software', 'Game Development']
          },
          {
            name: 'IT Services',
            subcategories: ['Managed IT Services', 'Cloud Computing', 'Cybersecurity', 'IT Consulting']
          },
          {
            name: 'Hardware & Electronics',
            subcategories: ['Computer Hardware', 'IoT Devices', 'Telecommunications', 'Electronic Components']
          }
        ]
      },
      {
        name: 'Manufacturing',
        categories: [
          {
            name: 'Textiles',
            subcategories: ['Clothing Manufacturing', 'Fabric Production', 'Technical Textiles']
          },
          {
            name: 'Automotive',
            subcategories: ['Vehicle Assembly', 'Auto Parts', 'Aftermarket Components']
          },
          {
            name: 'Electronics Manufacturing',
            subcategories: ['Consumer Electronics', 'Industrial Electronics', 'Electronic Components']
          }
        ]
      },
      {
        name: 'Healthcare',
        categories: [
          {
            name: 'Medical Services',
            subcategories: ['Hospitals', 'Clinics', 'Diagnostic Centers', 'Telemedicine']
          },
          {
            name: 'Pharmaceutical',
            subcategories: ['Drug Manufacturing', 'R&D', 'Distribution', 'Retail Pharmacy']
          },
          {
            name: 'Wellness & Fitness',
            subcategories: ['Gyms', 'Yoga Studios', 'Spas', 'Nutrition Services']
          }
        ]
      }
    ];
    
    // Create each industry with its categories and subcategories
    for (const industry of industriesData) {
      // Create industry
      const industryId = await createIndustry({ 
        name: industry.name,
        description: `${industry.name} businesses and services`,
        isActive: true
      });
      
      // Create categories for this industry
      for (const category of industry.categories) {
        const categoryId = await createCategory({
          name: category.name,
          description: `${category.name} in the ${industry.name} industry`,
          industryId,
          isActive: true
        });
        
        // Create subcategories for this category
        for (const subcategoryName of category.subcategories) {
          await createSubCategory({
            name: subcategoryName,
            description: `${subcategoryName} businesses in ${category.name}`,
            categoryId,
            industryId,
            isActive: true
          });
        }
      }
    }
    
    console.log('Successfully seeded initial industries, categories, and subcategories');
  } catch (error) {
    console.error('Error seeding industries data:', error);
  }
};

/**
 * Seed categories for a specific industry
 */
const seedCategoriesForIndustry = async (industryId: string, industryName: string): Promise<void> => {
  try {
    // Default categories based on industry name
    let categories: Array<{name: string, subcategories: string[]}> = [];
    
    switch (industryName) {
      case 'Retail':
        categories = [
          {
            name: 'Clothing & Apparel',
            subcategories: ['Fashion Boutique', 'Footwear', 'Accessories', 'Children\'s Clothing']
          },
          {
            name: 'Electronics',
            subcategories: ['Mobile Phones', 'Computers & Laptops', 'Home Appliances', 'Audio & Visual']
          },
          {
            name: 'Grocery & Convenience',
            subcategories: ['Supermarket', 'Convenience Store', 'Specialty Foods', 'Organic & Natural']
          }
        ];
        break;
      
      case 'Food & Beverage':
        categories = [
          {
            name: 'Restaurants',
            subcategories: ['Fine Dining', 'Casual Dining', 'Fast Food', 'Cafes', 'Food Trucks']
          },
          {
            name: 'Bars & Nightclubs',
            subcategories: ['Pub', 'Wine Bar', 'Nightclub', 'Cocktail Bar', 'Sports Bar']
          },
          {
            name: 'Food Production',
            subcategories: ['Bakery', 'Brewery', 'Dairy Products', 'Packaged Foods', 'Catering']
          }
        ];
        break;
        
      case 'Technology':
        categories = [
          {
            name: 'Software Development',
            subcategories: ['Mobile Apps', 'Web Development', 'Enterprise Software', 'Game Development']
          },
          {
            name: 'IT Services',
            subcategories: ['Managed IT Services', 'Cloud Computing', 'Cybersecurity', 'IT Consulting']
          },
          {
            name: 'Hardware & Electronics',
            subcategories: ['Computer Hardware', 'IoT Devices', 'Telecommunications', 'Electronic Components']
          }
        ];
        break;
      
      // Add more mappings for other industries
      
      default:
        categories = [
          {
            name: 'General',
            subcategories: ['General Services', 'Products', 'Consulting']
          },
          {
            name: 'Specialized Services',
            subcategories: ['Professional Services', 'Technical Services', 'Support Services']
          }
        ];
    }
    
    // Create categories for this industry
    for (const category of categories) {
      const categoryId = await createCategory({
        name: category.name,
        description: `${category.name} in the ${industryName} industry`,
        industryId,
        isActive: true
      });
      
      // Create subcategories for this category
      for (const subcategoryName of category.subcategories) {
        await createSubCategory({
          name: subcategoryName,
          description: `${subcategoryName} businesses in ${category.name}`,
          categoryId,
          industryId,
          isActive: true
        });
      }
    }
    
    console.log(`Successfully seeded categories and subcategories for industry ${industryName}`);
  } catch (error) {
    console.error(`Error seeding categories for industry ${industryId}:`, error);
  }
};

/**
 * Seed subcategories for a specific category
 */
const seedSubCategoriesForCategory = async (
  categoryId: string, 
  categoryName: string, 
  industryId: string
): Promise<void> => {
  try {
    // Default subcategories based on category name
    let subcategories: string[] = [];
    
    // These are just examples - in reality, you'd want to tailor these to each specific category
    switch (categoryName) {
      case 'Clothing & Apparel':
        subcategories = ['Fashion Boutique', 'Footwear', 'Accessories', 'Children\'s Clothing'];
        break;
        
      case 'Restaurants':
        subcategories = ['Fine Dining', 'Casual Dining', 'Fast Food', 'Cafes', 'Food Trucks'];
        break;
        
      case 'Software Development':
        subcategories = ['Mobile Apps', 'Web Development', 'Enterprise Software', 'Game Development'];
        break;
      
      // Add more mappings for other categories
      
      default:
        subcategories = ['General', 'Specialized', 'Premium', 'Budget'];
    }
    
    // Create subcategories for this category
    for (const subcategoryName of subcategories) {
      await createSubCategory({
        name: subcategoryName,
        description: `${subcategoryName} businesses in ${categoryName}`,
        categoryId,
        industryId,
        isActive: true
      });
    }
    
    console.log(`Successfully seeded subcategories for category ${categoryName}`);
  } catch (error) {
    console.error(`Error seeding subcategories for category ${categoryId}:`, error);
  }
};