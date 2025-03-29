import api from './api';

/**
 * Upload a profile image
 * @param file The file to upload
 * @param userId The user ID to use as the file name
 * @returns Promise containing the download URL
 */
export const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('profileImage', file);
    formData.append('userId', userId);
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/users/upload-profile-image`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};