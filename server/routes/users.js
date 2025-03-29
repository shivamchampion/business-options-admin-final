import express from 'express';
import multer from 'multer';
import firestoreService from '../services/firestore.js';
import storageService from '../services/storage.js';
import admin from '../firebase/admin.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all admin panel users
router.get('/admin', async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize) || 10;
    const lastDoc = req.query.lastDoc ? JSON.parse(req.query.lastDoc) : null;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    
    const result = await firestoreService.getAdminPanelUsers(pageSize, lastDoc, filters);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all website users
router.get('/website', async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize) || 10;
    const lastDoc = req.query.lastDoc ? JSON.parse(req.query.lastDoc) : null;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    
    const result = await firestoreService.getWebsiteUsers(pageSize, lastDoc, filters);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching website users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await firestoreService.getUserById(userId);
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
  }
});

// Update user status
router.put('/:id/status', async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    await firestoreService.updateUserStatus(userId, status);
    
    res.status(200).json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk update user status
router.put('/bulk-status', async (req, res) => {
  try {
    const { userIds, status } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || !status) {
      return res.status(400).json({ error: 'User IDs array and status are required' });
    }
    
    // Update each user's status
    const updatePromises = userIds.map(userId => 
      firestoreService.updateUserStatus(userId, status)
    );
    
    await Promise.all(updatePromises);
    
    res.status(200).json({ message: 'User statuses updated successfully' });
  } catch (error) {
    console.error('Error bulk updating user statuses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get the user first to check if they have a loginEmail
    const user = await firestoreService.getUserById(userId);
    
    // If user has a loginEmail, delete the auth user
    if (user.loginEmail) {
      try {
        // Find the user by email first
        const authUser = await admin.auth().getUserByEmail(user.loginEmail);
        
        // Delete the auth user
        await admin.auth().deleteUser(authUser.uid);
      } catch (authError) {
        // Only log auth deletion errors, don't fail the request
        console.error('Error deleting auth user:', authError);
      }
    }
    
    // Delete the Firestore document
    await firestoreService.deleteUserDocument(userId);
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload profile image
router.post('/upload-profile-image', upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    
    const downloadUrl = await storageService.uploadProfileImage(fileBuffer, fileName, userId);
    
    res.status(200).json({ 
      url: downloadUrl,
      message: 'Profile image uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;