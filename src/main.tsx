import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: '#FFFFFF',
          color: '#111827',
        },
        success: {
          iconTheme: {
            primary: '#00A651',
            secondary: '#FFFFFF',
          },
        },
        error: {
          iconTheme: {
            primary: '#DC3545',
            secondary: '#FFFFFF',
          },
        },
      }}
    />
  </React.StrictMode>,
);
