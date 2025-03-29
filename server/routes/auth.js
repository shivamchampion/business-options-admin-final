import express from 'express';
import admin from '../firebase/admin.js'; // Note the .js extension
import firestoreService from '../services/firestore.js';
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Firebase doesn't provide an API to authenticate with email/password in the admin SDK
    // So this endpoint is just a placeholder - you'll need to use Firebase Auth in the client
    // and then validate the token on the server
    
    res.status(500).json({ 
      error: 'Server-side authentication is not supported. Please use Firebase Auth client-side.'
    });
  } catch (error) {
    console.error('Error during login:', error);
    
    let errorMessage = 'Login failed';
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Invalid password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        default:
          errorMessage = error.message;
      }
    }
    
    res.status(401).json({ error: errorMessage });
  }
});

// Verify token endpoint
router.post('/verify-token', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }
    
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get user info from Firestore
    const userSnapshot = await admin.firestore()
      .collection('users')
      .where('uid', '==', uid)
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const userData = userSnapshot.docs[0].data();
    const userId = userSnapshot.docs[0].id;
    
    // Update last login time
    await firestoreService.updateUserLastLogin(userId);
    
    // Return user data
    res.status(200).json({
      ...userData,
      id: userId,
      createdAt: userData.createdAt?.toDate(),
      lastLogin: new Date(),
      verificationCodeExpiry: userData.verificationCodeExpiry?.toDate()
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Create user with Firebase Auth
router.post('/createUser', async (req, res) => {
  try {
    const { name, email, role, loginEmail } = req.body;
    
    if (!name || !email || !role || !loginEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if email already exists in Firestore
    const emailExists = await firestoreService.checkUserEmailExists(email);
    if (emailExists) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    
    // Generate a memorable password
    const generatedPassword = generateMemorablePassword();
    
    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: loginEmail,
      password: generatedPassword,
      displayName: name,
      emailVerified: true // Mark as verified since we're skipping verification
    });
    
    console.log('User created successfully:', userRecord.uid);
    
    res.status(200).json({ 
      uid: userRecord.uid, 
      password: generatedPassword,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Better error responses
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'A user with this login email already exists' });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'The login email address is not valid' });
    }
    
    if (error.code === 'auth/operation-not-allowed') {
      return res.status(400).json({ error: 'Operation not allowed: Email/password accounts may be disabled' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Reset user password
router.post('/resetPassword', async (req, res) => {
  try {
    const { loginEmail } = req.body;
    
    if (!loginEmail) {
      return res.status(400).json({ error: 'Login email is required' });
    }
    
    // Generate a memorable password
    const newPassword = generateMemorablePassword();
    
    // Update the user's password
    await admin.auth().getUserByEmail(loginEmail)
      .then(userRecord => {
        return admin.auth().updateUser(userRecord.uid, {
          password: newPassword
        });
      });
    
    res.status(200).json({ 
      password: newPassword,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    
    // Better error responses
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'No user found with this login email' });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'The login email address is not valid' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Add new endpoint: Delete user from Firebase Auth
router.post('/deleteAuthUser', async (req, res) => {
  try {
    const { loginEmail } = req.body;
    
    if (!loginEmail) {
      return res.status(400).json({ error: 'Login email is required' });
    }
    
    // First get the user by email
    const userRecord = await admin.auth().getUserByEmail(loginEmail);
    
    // Then delete the user
    await admin.auth().deleteUser(userRecord.uid);
    
    res.status(200).json({ 
      message: 'Auth user deleted successfully',
      uid: userRecord.uid
    });
  } catch (error) {
    console.error('Error deleting auth user:', error);
    
    // Better error responses 
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ 
        error: 'No user found with this login email',
        code: 'user_not_found'
      });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ 
        error: 'The login email address is not valid',
        code: 'invalid_email'
      });
    }
    
    // Return successful even if user not found - idempotent deletion
    if (error.code === 'auth/user-not-found') {
      return res.status(200).json({ 
        message: 'User already deleted or does not exist',
        code: 'user_not_found'
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Generate memorable password (adjective + noun + number + special character)
function generateMemorablePassword() {
  // Common adjectives that are easy to remember
  const adjectives = ['happy', 'sunny', 'clever', 'bright', 'brave', 'calm', 'eager', 'gentle', 'kind', 'proud', 
                     'swift', 'wise', 'bold', 'fresh', 'grand', 'jolly', 'lucky', 'mighty', 'noble', 'quick'];
  
  // Common nouns that are easy to remember
  const nouns = ['tiger', 'river', 'mountain', 'garden', 'forest', 'ocean', 'sunset', 'morning', 'market', 'castle',
                'eagle', 'flower', 'island', 'journey', 'knight', 'legend', 'meadow', 'planet', 'valley', 'winter'];
  
  // Get random words
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  // Generate a random number between 10 and 99
  const number = Math.floor(10 + Math.random() * 90);
  
  // Special characters that are easy to type and remember
  const specialChars = ['!', '@', '#', '$', '%', '&'];
  const specialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Format: Adjective + Noun + Number + SpecialChar
  // Example: HappyTiger42!
  return adjective.charAt(0).toUpperCase() + adjective.slice(1) + 
         noun.charAt(0).toUpperCase() + noun.slice(1) + 
         number + 
         specialChar;
}

export default router;