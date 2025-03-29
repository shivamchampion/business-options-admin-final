import axios from 'axios';
import { UserFilters, UserStatus } from '@/types/firebase';

// Create base axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API

export const loginUser = async (
  email: string, 
  password: string
): Promise<{ user: any, token: string }> => {
  // For Firebase authentication, we still need to use client-side auth
  // The server will verify the token after client-side auth
  try {
    // Import Firebase auth dynamically only when needed
    const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
    const { default: firebaseApp } = await import('./firebaseClient');
    
    const auth = getAuth(firebaseApp);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get the ID token
    const token = await userCredential.user.getIdToken();
    
    // Store token in appropriate storage
    if (password) { // Use as proxy for "remember me"
      localStorage.setItem('authToken', token);
    } else {
      sessionStorage.setItem('authToken', token);
    }
    
    // Call server to verify token and get user data
    const response = await apiClient.post('/auth/verify-token', { idToken: token });
    
    return { 
      user: response.data,
      token
    };
  } catch (error: any) {
    console.error('Login error:', error);
    
    let errorMessage = 'Login failed. Please check your credentials.';
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Account not found. Please check your email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
        // ... other Firebase error cases
      }
    }
    
    throw new Error(errorMessage);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    // Import Firebase auth dynamically
    const { getAuth, signOut } = await import('firebase/auth');
    const { default: firebaseApp } = await import('./firebaseClient');
    
    const auth = getAuth(firebaseApp);
    await signOut(auth);
    
    // Clear tokens
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    
    return;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const verifyToken = async (token: string): Promise<any> => {
  const response = await apiClient.post('/auth/verify-token', { idToken: token });
  return response.data;
};

// Users API

export const getAdminPanelUsers = async (
  pageSize: number = 10,
  lastDoc: any = null,
  filters?: UserFilters
): Promise<{ users: any[], lastDoc: any }> => {
  const params = new URLSearchParams();
  params.append('pageSize', pageSize.toString());
  
  if (lastDoc) {
    params.append('lastDoc', JSON.stringify(lastDoc));
  }
  
  if (filters) {
    params.append('filters', JSON.stringify(filters));
  }
  
  const response = await apiClient.get(`/users/admin?${params.toString()}`);
  return response.data;
};

export const getWebsiteUsers = async (
  pageSize: number = 10,
  lastDoc: any = null,
  filters?: UserFilters
): Promise<{ users: any[], lastDoc: any }> => {
  const params = new URLSearchParams();
  params.append('pageSize', pageSize.toString());
  
  if (lastDoc) {
    params.append('lastDoc', JSON.stringify(lastDoc));
  }
  
  if (filters) {
    params.append('filters', JSON.stringify(filters));
  }
  
  const response = await apiClient.get(`/users/website?${params.toString()}`);
  return response.data;
};

export const getUserById = async (userId: string): Promise<any> => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

export const updateUserStatus = async (
  userId: string,
  status: UserStatus
): Promise<boolean> => {
  const response = await apiClient.put(`/users/${userId}/status`, { status });
  return response.status === 200;
};

export const bulkUpdateUserStatus = async (
  userIds: string[],
  status: UserStatus
): Promise<boolean> => {
  const response = await apiClient.put('/users/bulk-status', { userIds, status });
  return response.status === 200;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const response = await apiClient.delete(`/users/${userId}`);
  return response.status === 200;
};

export const createAdminPanelUser = async (
  userData: any,
  profileImage?: File
): Promise<{ userId: string, loginEmail: string, password: string }> => {
  // Step 1: Generate login email
  const namePart = userData.name.toLowerCase().replace(/\s+/g, '.').substring(0, 15);
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const loginEmail = `${namePart}.${randomPart}@businessoptions.in`;
  
  // Step 2: Create the user in Firebase Auth through our API
  const authResponse = await apiClient.post('/auth/createUser', {
    name: userData.name,
    email: userData.email,
    role: userData.role,
    loginEmail
  });
  
  const { uid, password } = authResponse.data;
  
  if (!uid || !password) {
    throw new Error('Invalid response from server: Missing user credentials');
  }
  
  // Step 3: Create a Firestore record for our user (handled by the server)
  // If profileImage exists, upload it
  
  const userId = uid; // Use the same ID for simplicity
  
  if (profileImage) {
    // Upload profile image
    const formData = new FormData();
    formData.append('profileImage', profileImage);
    formData.append('userId', userId);
    
    const response = await fetch(`${apiClient.defaults.baseURL}/users/upload-profile-image`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Error uploading profile image');
      // Continue anyway - not a critical error
    }
  }
  
  return {
    userId,
    loginEmail,
    password
  };
};

export const resetUserPassword = async (loginEmail: string): Promise<string> => {
  const response = await apiClient.post('/auth/resetPassword', { loginEmail });
  return response.data.password;
};

export default {
  loginUser,
  logoutUser,
  verifyToken,
  getAdminPanelUsers,
  getWebsiteUsers,
  getUserById,
  updateUserStatus,
  bulkUpdateUserStatus,
  deleteUser,
  createAdminPanelUser,
  resetUserPassword
};