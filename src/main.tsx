import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// IMPORTANT: Global toast styles - only use one Toaster instance in the entire app
const toastStyles = {
  duration: 4000,
  className: 'toast-custom',
  style: {
    background: '#FFFFFF',
    color: '#111827',
    maxWidth: '380px',
    padding: '12px 16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
  },
  success: {
    iconTheme: {
      primary: '#00A651',
      secondary: '#FFFFFF',
    },
    style: {
      borderLeft: '4px solid #00A651',
    }
  },
  error: {
    iconTheme: {
      primary: '#DC3545',
      secondary: '#FFFFFF',
    },
    style: {
      borderLeft: '4px solid #DC3545',
    },
    // Longer duration for errors
    duration: 5000,
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Toaster component is here at the root, don't add another one in App.tsx */}
    <Toaster 
      position="top-right"
      toastOptions={toastStyles}
    />
    <App />
  </React.StrictMode>,
);