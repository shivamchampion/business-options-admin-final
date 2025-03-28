import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

/**
 * Upload a profile image to Firebase Storage
 * @param file The file to upload
 * @param userId The user ID to use as the file name
 * @returns Promise containing the download URL
 */
export const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
  try {
    // Create storage reference
    const storageRef = ref(storage, `profile_images/${userId}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};