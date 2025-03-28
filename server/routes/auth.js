const express = require('express');
const admin = require('../firebase/admin');
const router = express.Router();

// Create user with Firebase Auth
router.post('/createUser', async (req, res) => {
  try {
    const { name, email, role, loginEmail } = req.body;
    
    if (!name || !email || !role || !loginEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
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

module.exports = router;