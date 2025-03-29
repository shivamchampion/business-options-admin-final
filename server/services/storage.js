import admin from '../firebase/admin.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const bucket = admin.storage().bucket();

/**
 * Upload a file to Firebase Storage
 * @param {Buffer} fileBuffer - The file buffer
 * @param {String} fileName - Original filename
 * @param {String} userId - User ID to use in the path
 * @returns {Promise<String>} Download URL
 */
export const uploadProfileImage = async (fileBuffer, fileName, userId) => {
  try {
    // Create a temporary file
    const tempFilePath = path.join(os.tmpdir(), fileName);
    
    // Write the buffer to the temporary file
    fs.writeFileSync(tempFilePath, fileBuffer);
    
    // Create a storage path
    const storagePath = `profile_images/${userId}`;
    
    // Upload the file
    const fileUpload = await bucket.upload(tempFilePath, {
      destination: storagePath,
      metadata: {
        contentType: 'image/jpeg', // You might want to detect this dynamically
        metadata: {
          firebaseStorageDownloadTokens: userId, // Use userId as the token for simpler URLs
        }
      }
    });
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    // Get the download URL
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${userId}`;
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error(`Failed to upload profile image: ${error.message || 'Unknown error'}`);
  }
};

export default {
  uploadProfileImage
};