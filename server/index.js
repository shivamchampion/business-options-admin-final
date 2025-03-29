// Convert from CommonJS to ES Modules
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';

// Get current file path (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine environment and load proper env file
const environment = process.env.NODE_ENV || 'development';
const envFile = environment === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(__dirname, envFile);

// Check if environment file exists - MODIFIED TO MAKE OPTIONAL
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading environment variables:', result.error);
  } else {
    console.log(`Successfully loaded environment from ${envFile}`);
  }
} else {
  console.log(`Environment file ${envFile} not found, using existing env vars`);
}

// Set up backend-specific variables based on Vite variables
// This ensures variables work both in frontend and backend contexts
process.env.API_URL = process.env.API_URL || process.env.VITE_API_URL;
process.env.FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL;

// Initialize Express
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS based on environment
const allowedOrigins = environment === 'production'
  ? [process.env.FRONTEND_URL || 'https://admin.businessoptions.in']
  : [process.env.FRONTEND_URL || 'http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    environment: environment,
    version: process.env.npm_package_version || '1.0.0',
    api_url: process.env.API_URL,
    frontend_url: process.env.FRONTEND_URL
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: environment === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    stack: environment === 'production' ? undefined : err.stack
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${environment} mode`);
  console.log(`API URL: ${process.env.API_URL || 'http://localhost:' + PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});