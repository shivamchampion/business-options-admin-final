// src/services/advisorService.ts
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp, 
    orderBy, 
    limit, 
    startAfter,
    Timestamp
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  import { 
    UserDetails, 
    UserRole, 
    UserStatus, 
    AdvisorFilters,
    CommissionTier, 
    CommissionStructure,
    LeadStatus,
    Lead,
    Payment,
    PaymentStatus
  } from '@/types/firebase';
  import { uploadProfileImage } from './storageService';
  
  const USERS_COLLECTION = 'users';
  const COMMISSION_COLLECTION = 'commission_structures';
  const LEADS_COLLECTION = 'leads';
  const PAYMENTS_COLLECTION = 'payments';
  
  /**
   * Get advisors with pagination and filtering
   */
  export const getAdvisors = async (
    pageSize: number = 10,
    lastDoc: any = null,
    filters?: AdvisorFilters
  ): Promise<{advisors: UserDetails[], lastDoc: any}> => {
    try {
      // Start with the basic query for advisors
      let conditions = [where('role', '==', UserRole.ADVISOR)];
      
      // Apply additional filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          conditions.push(where('status', 'in', filters.status));
        }
        
        if (filters.isVerified !== undefined) {
          conditions.push(where('emailVerified', '==', filters.isVerified));
        }
        
        if (filters.commissionTier && filters.commissionTier.length > 0) {
          conditions.push(where('commissionTier', 'in', filters.commissionTier));
        }
        
        if (filters.currency) {
          conditions.push(where('currency', '==', filters.currency));
        }
        
        // Note: Complex filters like country, state, city arrays and commission rate ranges
        // will be applied client-side after data fetch
      }
      
      // Create the query with conditions
      let finalQuery = query(
        collection(db, USERS_COLLECTION),
        ...conditions,
        orderBy('createdAt', 'desc')
      );
      
      // Apply pagination
      if (lastDoc) {
        finalQuery = query(finalQuery, startAfter(lastDoc), limit(pageSize));
      } else {
        finalQuery = query(finalQuery, limit(pageSize));
      }
      
      // Execute the query
      const snapshot = await getDocs(finalQuery);
      
      // Process the results
      let advisors = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          lastLogin: data.lastLogin?.toDate(),
          verificationCodeExpiry: data.verificationCodeExpiry?.toDate()
        } as UserDetails;
      });
      
      // Apply client-side filtering
      if (filters) {
        // Search text filtering
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          advisors = advisors.filter(advisor => 
            advisor.name.toLowerCase().includes(searchTerm) || 
            advisor.email.toLowerCase().includes(searchTerm) ||
            (advisor.loginEmail && advisor.loginEmail.toLowerCase().includes(searchTerm)) ||
            (advisor.city && advisor.city.toLowerCase().includes(searchTerm)) ||
            (advisor.state && advisor.state.toLowerCase().includes(searchTerm)) ||
            (advisor.country && advisor.country.toLowerCase().includes(searchTerm))
          );
        }
        
        // Country filtering
        if (filters.country && filters.country.length > 0) {
          advisors = advisors.filter(advisor => 
            advisor.country && filters.country?.includes(advisor.country)
          );
        }
        
        // State filtering
        if (filters.state && filters.state.length > 0) {
          advisors = advisors.filter(advisor => 
            advisor.state && filters.state?.includes(advisor.state)
          );
        }
        
        // City filtering
        if (filters.city && filters.city.length > 0) {
          advisors = advisors.filter(advisor => 
            advisor.city && filters.city?.includes(advisor.city)
          );
        }
        
        // Commission rate range filtering
        if (filters.minCommissionRate !== undefined) {
          advisors = advisors.filter(advisor => 
            advisor.commissionRate !== undefined && 
            advisor.commissionRate >= (filters.minCommissionRate || 0)
          );
        }
        
        if (filters.maxCommissionRate !== undefined) {
          advisors = advisors.filter(advisor => 
            advisor.commissionRate !== undefined && 
            advisor.commissionRate <= (filters.maxCommissionRate || 100)
          );
        }
      }
      
      return {
        advisors,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error getting advisors:', error);
      throw new Error(`Failed to fetch advisors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Get a single advisor by ID
   */
  export const getAdvisor = async (advisorId: string): Promise<UserDetails> => {
    try {
      const advisorRef = doc(db, USERS_COLLECTION, advisorId);
      const snapshot = await getDoc(advisorRef);
      
      if (!snapshot.exists()) {
        throw new Error('Advisor not found');
      }
      
      const data = snapshot.data();
      return {
        ...data,
        id: snapshot.id,
        createdAt: data.createdAt?.toDate(),
        lastLogin: data.lastLogin?.toDate(),
        verificationCodeExpiry: data.verificationCodeExpiry?.toDate()
      } as UserDetails;
    } catch (error) {
      console.error('Error getting advisor:', error);
      throw new Error(`Failed to fetch advisor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Create a new advisor
   */
  export const createAdvisor = async (
    advisorData: Partial<UserDetails>,
    profileImage?: File
  ): Promise<{advisorId: string, loginEmail: string, password: string}> => {
    try {
      // Validation checks
      if (!advisorData.name || !advisorData.email || !advisorData.phone || 
          !advisorData.country || !advisorData.state || !advisorData.city) {
        throw new Error('Name, email, phone, and location are required');
      }
      
      // Check if a user with this email already exists
      const emailQuery = query(
        collection(db, USERS_COLLECTION),
        where('email', '==', advisorData.email)
      );
      const existingUserSnapshot = await getDocs(emailQuery);
      
      if (!existingUserSnapshot.empty) {
        throw new Error('A user with this email already exists. Please use a different email.');
      }
      
      // Generate a random login email for admin panel
      const namePart = advisorData.name.toLowerCase().replace(/\s+/g, '.').substring(0, 15);
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const loginEmail = `${namePart}.${randomPart}@businessoptions.in`;
      
      // Create user document in Firestore first (without uid)
      const advisorRef = doc(collection(db, USERS_COLLECTION));
      const advisorId = advisorRef.id;
      
      // Upload profile image if provided
      let profileImageUrl = advisorData.profileImageUrl || null;
      if (profileImage) {
        try {
          profileImageUrl = await uploadProfileImage(profileImage, advisorId);
        } catch (imageError) {
          console.error('Error uploading profile image:', imageError);
          // Continue with user creation even if image upload fails
        }
      }
      
      // Call the backend API to create the Firebase Auth user
      const API_URL = getApiUrl();
      let response;
      try {
        response = await fetch(`${API_URL}/api/auth/createUser`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: advisorData.name,
            email: advisorData.email,
            role: UserRole.ADVISOR,
            loginEmail: loginEmail
          }),
          credentials: 'include'
        });
      } catch (networkError) {
        throw new Error(`Network error: Could not connect to server. Please check your internet connection and try again.`);
      }
      
      if (!response.ok) {
        let errorMessage = 'Failed to create advisor account';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      const { uid, password } = data;
      
      if (!uid || !password) {
        throw new Error('Invalid response from server: Missing user credentials');
      }
      
      // Prepare advisor data with default values for advisor-specific fields
      const newAdvisorData = {
        id: advisorId,
        uid: uid,
        name: advisorData.name,
        email: advisorData.email,
        loginEmail: loginEmail,
        role: UserRole.ADVISOR,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        isWebsiteUser: false,
        createdAt: serverTimestamp(),
        profileImageUrl,
        phone: advisorData.phone || '',
        commissionTier: advisorData.commissionTier || CommissionTier.BRONZE,
        commissionRate: advisorData.commissionRate || 5, // Default 5%
        currency: advisorData.currency || 'USD',
        totalCommissionEarned: 0,
        assignedLeads: 0,
        activeLeads: 0,
        successRate: 0,
        country: advisorData.country || '',
        state: advisorData.state || '',
        city: advisorData.city || '',
        bio: advisorData.bio || ''
      };
      
      // Now save the advisor document with the uid
      try {
        await setDoc(advisorRef, newAdvisorData);
      } catch (firestoreError) {
        // If Firestore save fails, attempt to clean up auth user
        try {
          await fetch(`${API_URL}/api/auth/deleteAuthUser`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ loginEmail }),
            credentials: 'include'
          });
        } catch (cleanupError) {
          console.error('Failed to clean up auth user after Firestore error:', cleanupError);
        }
        
        throw new Error(`Database error: Failed to save advisor data. Please try again later.`);
      }
      
      return {
        advisorId,
        loginEmail,
        password
      };
    } catch (error) {
      console.error('Error creating advisor:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Unknown error occurred while creating advisor');
      }
    }
  };
  
  /**
   * Update an existing advisor
   */
  export const updateAdvisor = async (
    advisorId: string,
    advisorData: Partial<UserDetails>,
    profileImage?: File
  ): Promise<UserDetails> => {
    try {
      const advisorRef = doc(db, USERS_COLLECTION, advisorId);
      const advisorSnap = await getDoc(advisorRef);
      
      if (!advisorSnap.exists()) {
        throw new Error('Advisor not found');
      }
      
      let updateData: any = { ...advisorData };
      delete updateData.id; // Don't update the ID
      delete updateData.uid; // Don't update the UID
      delete updateData.loginEmail; // Don't update the login email
      delete updateData.email; // Don't update the email
      delete updateData.role; // Don't update the role
      delete updateData.createdAt; // Don't update creation timestamp
      
      // Upload new profile image if provided
      if (profileImage) {
        try {
          updateData.profileImageUrl = await uploadProfileImage(profileImage, advisorId);
        } catch (imageError) {
          console.error('Error uploading profile image:', imageError);
          // Continue with update even if image upload fails
        }
      }
      
      // Add updated timestamp
      updateData.updatedAt = serverTimestamp();
      
      await updateDoc(advisorRef, updateData);
      
      // Get the updated advisor data
      const updatedAdvisorSnap = await getDoc(advisorRef);
      const updatedData = updatedAdvisorSnap.data();
      
      return {
        ...updatedData,
        id: updatedAdvisorSnap.id,
        createdAt: updatedData.createdAt?.toDate(),
        lastLogin: updatedData.lastLogin?.toDate(),
        updatedAt: updatedData.updatedAt?.toDate()
      } as UserDetails;
    } catch (error) {
      console.error('Error updating advisor:', error);
      throw new Error(`Failed to update advisor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Update advisor status
   */
  export const updateAdvisorStatus = async (
    advisorId: string,
    status: UserStatus
  ): Promise<boolean> => {
    try {
      const advisorRef = doc(db, USERS_COLLECTION, advisorId);
      await updateDoc(advisorRef, { status });
      return true;
    } catch (error) {
      console.error('Error updating advisor status:', error);
      throw new Error(`Failed to update advisor status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Delete an advisor
   */
  export const deleteAdvisor = async (advisorId: string): Promise<boolean> => {
    try {
      // First, get the advisor document to find the loginEmail
      const advisorRef = doc(db, USERS_COLLECTION, advisorId);
      const advisorSnap = await getDoc(advisorRef);
      
      if (!advisorSnap.exists()) {
        throw new Error('Advisor not found');
      }
      
      const advisorData = advisorSnap.data() as UserDetails;
      
      // Delete the Firebase Auth user if loginEmail exists
      if (advisorData.loginEmail) {
        try {
          const API_URL = getApiUrl();
          const response = await fetch(`${API_URL}/api/auth/deleteAuthUser`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ loginEmail: advisorData.loginEmail }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error deleting auth user:', errorData.error);
          }
        } catch (authError) {
          console.error('Error deleting Firebase Auth user:', authError);
        }
      }
      
      // Delete the Firestore document
      await deleteDoc(advisorRef);
      return true;
    } catch (error) {
      console.error('Error deleting advisor:', error);
      throw new Error(`Failed to delete advisor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Reset advisor password
   */
  export const resetAdvisorPassword = async (loginEmail: string): Promise<string> => {
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/auth/resetPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loginEmail }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
      
      const { password } = await response.json();
      return password;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
    }
  };
  
  /****************************
   * Commission Structure CRUD
   ****************************/
  
  /**
   * Get all commission structures
   */
  export const getCommissionStructures = async (): Promise<CommissionStructure[]> => {
    try {
      const commissionsQuery = query(
        collection(db, COMMISSION_COLLECTION),
        orderBy('tier', 'asc')
      );
      
      const snapshot = await getDocs(commissionsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as CommissionStructure;
      });
    } catch (error) {
      console.error('Error getting commission structures:', error);
      throw new Error(`Failed to fetch commission structures: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Create or update a commission structure
   */
  export const saveCommissionStructure = async (
    commission: Partial<CommissionStructure> & { tier: CommissionTier }
  ): Promise<CommissionStructure> => {
    try {
      // Check if a structure with this tier already exists
      const commissionQuery = query(
        collection(db, COMMISSION_COLLECTION),
        where('tier', '==', commission.tier)
      );
      
      const existingDocs = await getDocs(commissionQuery);
      
      let commissionRef;
      let isNew = true;
      
      if (!existingDocs.empty) {
        // Update existing structure
        commissionRef = doc(db, COMMISSION_COLLECTION, existingDocs.docs[0].id);
        isNew = false;
      } else {
        // Create new structure
        commissionRef = doc(collection(db, COMMISSION_COLLECTION));
      }
      
      const commissionData = {
        ...commission,
        updatedAt: serverTimestamp(),
        ...(isNew && { createdAt: serverTimestamp() })
      };
      
      if (isNew) {
        await setDoc(commissionRef, commissionData);
      } else {
        await updateDoc(commissionRef, commissionData);
      }
      
      // Get the updated data
      const updatedDoc = await getDoc(commissionRef);
      const data = updatedDoc.data();
      
      return {
        ...data,
        id: updatedDoc.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as CommissionStructure;
    } catch (error) {
      console.error('Error saving commission structure:', error);
      throw new Error(`Failed to save commission structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Delete a commission structure
   */
  export const deleteCommissionStructure = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, COMMISSION_COLLECTION, id));
      return true;
    } catch (error) {
      console.error('Error deleting commission structure:', error);
      throw new Error(`Failed to delete commission structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /****************************
   * Leads Management
   ****************************/
  
  /**
   * Get leads with pagination and filtering
   */
  export const getLeads = async (
    pageSize: number = 10,
    lastDoc: any = null,
    filters?: any
  ): Promise<{leads: Lead[], lastDoc: any}> => {
    try {
      let conditions: any[] = [];
      
      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          conditions.push(where('status', 'in', filters.status));
        }
        
        if (filters.advisorId) {
          conditions.push(where('advisorId', '==', filters.advisorId));
        }
        
        if (filters.type && filters.type.length > 0) {
          conditions.push(where('type', 'in', filters.type));
        }
      }
      
      // Create query
      let finalQuery;
      if (conditions.length > 0) {
        finalQuery = query(
          collection(db, LEADS_COLLECTION),
          ...conditions,
          orderBy('createdAt', 'desc')
        );
      } else {
        finalQuery = query(
          collection(db, LEADS_COLLECTION),
          orderBy('createdAt', 'desc')
        );
      }
      
      // Apply pagination
      if (lastDoc) {
        finalQuery = query(finalQuery, startAfter(lastDoc), limit(pageSize));
      } else {
        finalQuery = query(finalQuery, limit(pageSize));
      }
      
      // Execute query
      const snapshot = await getDocs(finalQuery);
      
      // Process results
      let leads = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          assignedDate: data.assignedDate?.toDate(),
          lastContactDate: data.lastContactDate?.toDate()
        } as Lead;
      });
      
      // Apply client-side filtering
      if (filters) {
        // Search filtering
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          leads = leads.filter(lead => 
            lead.clientName.toLowerCase().includes(searchTerm) ||
            lead.clientEmail.toLowerCase().includes(searchTerm) ||
            lead.businessDetails.name.toLowerCase().includes(searchTerm)
          );
        }
        
        // Value range filtering
        if (filters.minValue !== undefined) {
          leads = leads.filter(lead => lead.value >= filters.minValue);
        }
        
        if (filters.maxValue !== undefined) {
          leads = leads.filter(lead => lead.value <= filters.maxValue);
        }
        
        // Date range filtering
        if (filters.dateRange?.from) {
          const fromDate = new Date(filters.dateRange.from);
          leads = leads.filter(lead => lead.createdAt >= fromDate);
        }
        
        if (filters.dateRange?.to) {
          const toDate = new Date(filters.dateRange.to);
          leads = leads.filter(lead => lead.createdAt <= toDate);
        }
      }
      
      return {
        leads,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error getting leads:', error);
      throw new Error(`Failed to fetch leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Get a single lead
   */
  export const getLead = async (leadId: string): Promise<Lead> => {
    try {
      const leadRef = doc(db, LEADS_COLLECTION, leadId);
      const snapshot = await getDoc(leadRef);
      
      if (!snapshot.exists()) {
        throw new Error('Lead not found');
      }
      
      const data = snapshot.data();
      return {
        ...data,
        id: snapshot.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        assignedDate: data.assignedDate?.toDate(),
        lastContactDate: data.lastContactDate?.toDate()
      } as Lead;
    } catch (error) {
      console.error('Error getting lead:', error);
      throw new Error(`Failed to fetch lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Create a new lead
   */
  export const createLead = async (leadData: Partial<Lead>): Promise<Lead> => {
    try {
      // Validate required fields
      if (!leadData.clientName || !leadData.type) {
        throw new Error('Client name and lead type are required');
      }
      
      // Create the lead document
      const leadRef = doc(collection(db, LEADS_COLLECTION));
      const leadId = leadRef.id;
      
      const newLeadData = {
        ...leadData,
        id: leadId,
        status: leadData.status || LeadStatus.NEW,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(leadRef, newLeadData);
      
      // If the lead is assigned to an advisor, update their stats
      if (leadData.advisorId) {
        await updateAdvisorLeadStats(leadData.advisorId);
      }
      
      // Get the created lead
      const leadSnap = await getDoc(leadRef);
      const data = leadSnap.data();
      
      return {
        ...data,
        id: leadSnap.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        assignedDate: data.assignedDate?.toDate(),
        lastContactDate: data.lastContactDate?.toDate()
      } as Lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw new Error(`Failed to create lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Update a lead
   */
  export const updateLead = async (
    leadId: string,
    leadData: Partial<Lead>
  ): Promise<Lead> => {
    try {
      const leadRef = doc(db, LEADS_COLLECTION, leadId);
      
      // Get current lead data to check if advisor assignment changed
      const currentLeadSnap = await getDoc(leadRef);
      if (!currentLeadSnap.exists()) {
        throw new Error('Lead not found');
      }
      
      const currentLeadData = currentLeadSnap.data() as Lead;
      const previousAdvisorId = currentLeadData.advisorId;
      
      // Prepare update data
      const updateData = {
        ...leadData,
        updatedAt: serverTimestamp()
      };
      
      // If advisor is being assigned for the first time, set assigned date
      if (leadData.advisorId && !currentLeadData.advisorId) {
        updateData.assignedDate = serverTimestamp();
      }
      
      // Update the lead
      await updateDoc(leadRef, updateData);
      
      // If advisor assignment changed, update stats for both advisors
      if (previousAdvisorId !== leadData.advisorId) {
        if (previousAdvisorId) {
          await updateAdvisorLeadStats(previousAdvisorId);
        }
        if (leadData.advisorId) {
          await updateAdvisorLeadStats(leadData.advisorId);
        }
      }
      
      // Get the updated lead
      const updatedLeadSnap = await getDoc(leadRef);
      const data = updatedLeadSnap.data();
      
      return {
        ...data,
        id: updatedLeadSnap.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        assignedDate: data.assignedDate?.toDate(),
        lastContactDate: data.lastContactDate?.toDate()
      } as Lead;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw new Error(`Failed to update lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Delete a lead
   */
  export const deleteLead = async (leadId: string): Promise<boolean> => {
    try {
      // Get the lead to check for advisor assignment
      const leadRef = doc(db, LEADS_COLLECTION, leadId);
      const leadSnap = await getDoc(leadRef);
      
      if (!leadSnap.exists()) {
        throw new Error('Lead not found');
      }
      
      const leadData = leadSnap.data() as Lead;
      const advisorId = leadData.advisorId;
      
      // Delete the lead
      await deleteDoc(leadRef);
      
      // Update advisor stats if lead was assigned
      if (advisorId) {
        await updateAdvisorLeadStats(advisorId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw new Error(`Failed to delete lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Update an advisor's lead statistics
   */
  const updateAdvisorLeadStats = async (advisorId: string): Promise<void> => {
    try {
      // Query all leads assigned to this advisor
      const leadsQuery = query(
        collection(db, LEADS_COLLECTION),
        where('advisorId', '==', advisorId)
      );
      
      const leadsSnapshot = await getDocs(leadsQuery);
      const leads = leadsSnapshot.docs.map(doc => doc.data() as Lead);
      
      // Calculate statistics
      const assignedLeads = leads.length;
      const activeLeads = leads.filter(lead => 
        lead.status !== LeadStatus.CLOSED_WON && 
        lead.status !== LeadStatus.CLOSED_LOST
      ).length;
      
      const closedLeads = leads.filter(lead => 
        lead.status === LeadStatus.CLOSED_WON || 
        lead.status === LeadStatus.CLOSED_LOST
      ).length;
      
      const wonLeads = leads.filter(lead => 
        lead.status === LeadStatus.CLOSED_WON
      ).length;
      
      // Calculate success rate (avoid division by zero)
      const successRate = closedLeads > 0 
        ? Math.round((wonLeads / closedLeads) * 100) 
        : 0;
      
      // Update the advisor document
      const advisorRef = doc(db, USERS_COLLECTION, advisorId);
      await updateDoc(advisorRef, {
        assignedLeads,
        activeLeads,
        successRate,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating advisor lead stats:', error);
      // Don't throw here to prevent cascading failures
    }
  };
  
  /****************************
   * Payments Management
   ****************************/
  
  /**
   * Get payments with pagination and filtering
   */
  export const getPayments = async (
    pageSize: number = 10,
    lastDoc: any = null,
    filters?: any
  ): Promise<{payments: Payment[], lastDoc: any}> => {
    try {
      let conditions: any[] = [];
      
      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          conditions.push(where('status', 'in', filters.status));
        }
        
        if (filters.advisorId) {
          conditions.push(where('advisorId', '==', filters.advisorId));
        }
        
        if (filters.paymentMethod && filters.paymentMethod.length > 0) {
          conditions.push(where('paymentMethod', 'in', filters.paymentMethod));
        }
      }
      
      // Create query
      let finalQuery;
      if (conditions.length > 0) {
        finalQuery = query(
          collection(db, PAYMENTS_COLLECTION),
          ...conditions,
          orderBy('date', 'desc')
        );
      } else {
        finalQuery = query(
          collection(db, PAYMENTS_COLLECTION),
          orderBy('date', 'desc')
        );
      }
      
      // Apply pagination
      if (lastDoc) {
        finalQuery = query(finalQuery, startAfter(lastDoc), limit(pageSize));
      } else {
        finalQuery = query(finalQuery, limit(pageSize));
      }
      
      // Execute query
      const snapshot = await getDocs(finalQuery);
      
      // Process results
      let payments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: data.date?.toDate(),
          dueDate: data.dueDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Payment;
      });
      
      // Apply client-side filtering
      if (filters) {
        // Search filtering
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          payments = payments.filter(payment => 
            payment.description.toLowerCase().includes(searchTerm) ||
            (payment.referenceNumber && payment.referenceNumber.toLowerCase().includes(searchTerm))
          );
        }
        
        // Amount range filtering
        if (filters.minAmount !== undefined) {
          payments = payments.filter(payment => payment.amount >= filters.minAmount);
        }
        
        if (filters.maxAmount !== undefined) {
          payments = payments.filter(payment => payment.amount <= filters.maxAmount);
        }
        
        // Date range filtering
        if (filters.dateRange?.from) {
          const fromDate = new Date(filters.dateRange.from);
          payments = payments.filter(payment => payment.date >= fromDate);
        }
        
        if (filters.dateRange?.to) {
          const toDate = new Date(filters.dateRange.to);
          payments = payments.filter(payment => payment.date <= toDate);
        }
      }
      
      return {
        payments,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error getting payments:', error);
      throw new Error(`Failed to fetch payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Create a new payment
   */
  export const createPayment = async (paymentData: Partial<Payment>): Promise<Payment> => {
    try {
      // Validate required fields
      if (!paymentData.advisorId || !paymentData.amount || !paymentData.date) {
        throw new Error('Advisor ID, amount, and date are required');
      }
      
      // Create the payment document
      const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
      const paymentId = paymentRef.id;
      
      const dueDate = paymentData.dueDate || new Date();
      
      const newPaymentData = {
        ...paymentData,
        id: paymentId,
        status: paymentData.status || PaymentStatus.PENDING,
        date: Timestamp.fromDate(new Date(paymentData.date)),
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(paymentRef, newPaymentData);
      
      // Update advisor's total commission earned if payment is completed
      if (paymentData.status === PaymentStatus.COMPLETED) {
        await updateAdvisorCommissionTotal(paymentData.advisorId, paymentData.amount);
      }
      
      // Get the created payment
      const paymentSnap = await getDoc(paymentRef);
      const data = paymentSnap.data();
      
      return {
        ...data,
        id: paymentSnap.id,
        date: data.date.toDate(),
        dueDate: data.dueDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Update a payment
   */
  export const updatePayment = async (
    paymentId: string,
    paymentData: Partial<Payment>
  ): Promise<Payment> => {
    try {
      const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
      
      // Get current payment data to check if status changed to COMPLETED
      const currentPaymentSnap = await getDoc(paymentRef);
      if (!currentPaymentSnap.exists()) {
        throw new Error('Payment not found');
      }
      
      const currentPaymentData = currentPaymentSnap.data() as Payment;
      const wasCompleted = currentPaymentData.status === PaymentStatus.COMPLETED;
      const isNowCompleted = paymentData.status === PaymentStatus.COMPLETED;
      
      // Prepare update data
      let updateData: any = {
        ...paymentData,
        updatedAt: serverTimestamp()
      };
      
      // Convert date objects to Firestore timestamps
      if (paymentData.date) {
        updateData.date = Timestamp.fromDate(new Date(paymentData.date));
      }
      
      if (paymentData.dueDate) {
        updateData.dueDate = Timestamp.fromDate(new Date(paymentData.dueDate));
      }
      
      // Update the payment
      await updateDoc(paymentRef, updateData);
      
      // Update advisor's commission total if payment status changed to/from COMPLETED
      if (!wasCompleted && isNowCompleted) {
        // Payment was just completed, add to total
        await updateAdvisorCommissionTotal(
          currentPaymentData.advisorId,
          paymentData.amount || currentPaymentData.amount
        );
      } else if (wasCompleted && !isNowCompleted) {
        // Payment was un-completed, subtract from total
        await updateAdvisorCommissionTotal(
          currentPaymentData.advisorId,
          -(currentPaymentData.amount)
        );
      } else if (wasCompleted && isNowCompleted && paymentData.amount && paymentData.amount !== currentPaymentData.amount) {
        // Payment remained completed but amount changed
        const amountDifference = paymentData.amount - currentPaymentData.amount;
        await updateAdvisorCommissionTotal(currentPaymentData.advisorId, amountDifference);
      }
      
      // Get the updated payment
      const updatedPaymentSnap = await getDoc(paymentRef);
      const data = updatedPaymentSnap.data();
      
      return {
        ...data,
        id: updatedPaymentSnap.id,
        date: data.date.toDate(),
        dueDate: data.dueDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Payment;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw new Error(`Failed to update payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Delete a payment
   */
  export const deletePayment = async (paymentId: string): Promise<boolean> => {
    try {
      // Get the payment to check if it was completed
      const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
      const paymentSnap = await getDoc(paymentRef);
      
      if (!paymentSnap.exists()) {
        throw new Error('Payment not found');
      }
      
      const paymentData = paymentSnap.data() as Payment;
      
      // Delete the payment
      await deleteDoc(paymentRef);
      
      // If payment was completed, subtract amount from advisor's total
      if (paymentData.status === PaymentStatus.COMPLETED) {
        await updateAdvisorCommissionTotal(paymentData.advisorId, -paymentData.amount);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw new Error(`Failed to delete payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  /**
   * Update an advisor's total commission earned
   */
  const updateAdvisorCommissionTotal = async (
    advisorId: string,
    amountChange: number
  ): Promise<void> => {
    try {
      const advisorRef = doc(db, USERS_COLLECTION, advisorId);
      const advisorSnap = await getDoc(advisorRef);
      
      if (!advisorSnap.exists()) {
        throw new Error('Advisor not found');
      }
      
      const advisorData = advisorSnap.data() as UserDetails;
      const currentTotal = advisorData.totalCommissionEarned || 0;
      const newTotal = currentTotal + amountChange;
      
      await updateDoc(advisorRef, {
        totalCommissionEarned: newTotal,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating advisor commission total:', error);
      // Don't throw here to prevent cascading failures
    }
  };
  
  /**
   * Get API URL helper function
   */
  const getApiUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.warn('VITE_API_URL is not defined, using default localhost:5000');
      return process.env.NODE_ENV === 'production'
        ? 'https://api.businessoptions.in'
        : 'http://localhost:5000';
    }
    return apiUrl;
  };
  
  /**
   * Format currency with currency support
   */
  export const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };