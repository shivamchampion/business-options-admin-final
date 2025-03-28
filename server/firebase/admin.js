import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file path (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine which environment file to load
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

// Load specific environment file
const envPath = join(__dirname, '../../', envFile);

// Check if file exists
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn(`Error loading environment from ${envFile}:`, result.error);
  } else {
    console.log(`Loaded environment from ${envFile}`);
  }
} else {
  console.warn(`Environment file ${envFile} not found, using existing env vars`);
}

// Debug: Log environment variables if debug is enabled
if (process.env.VITE_ENABLE_DEBUG_LOGS === 'true') {
  console.log('Firebase Env Vars:', {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKeyExists: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
  });
}

// Fix for the private key format in environment variables
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

// Validate required credentials
const validateCredentials = () => {
  const requiredVars = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing Firebase Admin SDK environment variables: ${missingVars.join(', ')}`);
  }
};

// Initialize Firebase Admin SDK if it hasn't been initialized yet
try {
  // Validate credentials first
  validateCredentials();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: process.env.FIREBASE_ADMIN_STORAGE_BUCKET,
    });
    
    console.log('Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  console.error('Firebase Admin SDK Initialization Error:', error.message);
  console.error('Please check your environment file and Firebase Admin SDK credentials');
  process.exit(1); // Exit the process if initialization fails
}

// Export as default in ES Modules
export default admin;