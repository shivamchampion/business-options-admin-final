// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoadingProvider, useLoading } from "@/context/LoadingContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Login from "@/pages/Login";
import Unauthorized from "@/pages/Unauthorized";
import MainLayout from "@/components/layout/MainLayout";
import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import React from 'react';

// Use React.lazy for code splitting
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const AllUsers = React.lazy(() => import("@/pages/users/AllUsers"));
const UserRoles = React.lazy(() => import("@/pages/users/UserRoles"));
const AllListings = React.lazy(() => import("@/pages/listings/AllListings"));
const ListingCreate = React.lazy(() => import("@/pages/listings/ListingCreate"));
const ListingDetail = React.lazy(() => import("@/pages/listings/ListingDetail"));
const ListingEdit = React.lazy(() => import("@/pages/listings/ListingEdit"));

// Lazy load advisor-related pages
const AllAdvisors = React.lazy(() => import("@/pages/advisors/AllAdvisors"));
const CommissionStructure = React.lazy(() => import("@/pages/advisors/CommissionStructure"));
const AdvisorLeads = React.lazy(() => import("@/pages/advisors/Leads"));
const AdvisorPayments = React.lazy(() => import("@/pages/advisors/Payments"));

// Root-level authentication component
const RootAuth: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: globalLoading } = useLoading();
  const [showInitialLoading, setShowInitialLoading] = useState(false);
  
  // Check if this is the first load of the app
  useEffect(() => {
    const isInitialized = sessionStorage.getItem('appInitialized');
    if (!isInitialized) {
      setShowInitialLoading(true);
      sessionStorage.setItem('appInitialized', 'true');
    }
  }, []);
  
  // Handle initial loading completion
  useEffect(() => {
    if (!authLoading && !globalLoading && showInitialLoading) {
      setShowInitialLoading(false);
    }
  }, [authLoading, globalLoading, showInitialLoading]);
  
  // Show full-page loading only during initial app load
  if (showInitialLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            Establishing secure connection...
          </p>
        </div>
      </div>
    );
  }
  
  return null; // This component doesn't render anything
};

// Auth verification component that runs at the root level
const AuthVerifier: React.FC = () => {
  const { isAuthenticated, refreshToken, signOut } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [verifyingAuth, setVerifyingAuth] = useState(false);
  const refreshAttemptRef = useRef(0);
  const maxRefreshAttempts = 3;

  // Handle Firebase auth error
  const handleAuthError = useCallback(async (event: CustomEvent) => {
    // Skip if not authenticated
    if (!isAuthenticated) return;
    
    // Skip if already verifying
    if (verifyingAuth) return;
    
    const error = event.detail?.error;
    if (!error) return;
    
    console.warn('Auth error detected by AuthVerifier:', error);
    
    const errorCode = error?.code;
    const errorMessage = error?.message || '';
    
    // Authentication/token errors that require refresh or logout
    const isAuthError = 
      errorMessage.includes('auth/network-request-failed') ||
      errorMessage.includes('permission-denied') || 
      errorMessage.includes('unauthenticated') ||
      errorMessage.includes('invalid-argument') ||
      errorMessage.includes('deadline-exceeded') ||
      errorMessage.includes('failed-precondition') ||
      errorCode === 'auth/user-token-expired' ||
      errorCode === 'auth/id-token-expired' ||
      errorCode === 'auth/requires-recent-login';
    
    // If not authentication related, ignore
    if (!isAuthError) return;
    
    // Start verification process
    setVerifyingAuth(true);
    startLoading("Verifying authentication...");
    
    // Attempt to refresh token (if fewer than max attempts)
    if (refreshAttemptRef.current < maxRefreshAttempts) {
      refreshAttemptRef.current += 1;
      console.log(`Attempting to refresh token (${refreshAttemptRef.current}/${maxRefreshAttempts})`);
      
      try {
        const success = await refreshToken();
        
        if (success) {
          console.log("Token refreshed successfully");
          toast.success("Authentication refreshed", { id: "auth-refresh-toast" });
          refreshAttemptRef.current = 0; // Reset on success
        } else {
          console.error("Token refresh failed");
          
          // Only log out if we've maxed out attempts
          if (refreshAttemptRef.current >= maxRefreshAttempts) {
            toast.error("Authentication expired. Please log in again.", { id: "auth-expired-toast" });
            await signOut();
          }
        }
      } catch (error) {
        console.error("Error during token refresh:", error);
        
        // If max attempts reached, log out
        if (refreshAttemptRef.current >= maxRefreshAttempts) {
          toast.error("Authentication expired. Please log in again.", { id: "auth-expired-toast" });
          await signOut();
        }
      } finally {
        setVerifyingAuth(false);
        stopLoading();
      }
    } else {
      // Max attempts reached, just logout
      toast.error("Authentication issues detected. Please login again.", { id: "auth-expired-toast" });
      try {
        await signOut();
      } finally {
        setVerifyingAuth(false);
        stopLoading();
      }
    }
  }, [isAuthenticated, verifyingAuth, refreshToken, signOut, startLoading, stopLoading]);
  
  // Listen for Firebase auth error events
  useEffect(() => {
    // Reset refresh attempts when component mounts or auth changes
    refreshAttemptRef.current = 0;
    
    // Listen for auth errors with proper type casting
    window.addEventListener('firebase-auth-error', handleAuthError as unknown as EventListener);
    
    return () => {
      window.removeEventListener('firebase-auth-error', handleAuthError as unknown as EventListener);
    };
  }, [handleAuthError]);
  
  // Render loading spinner when verifying auth
  if (verifyingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-700 font-medium">
            Verifying authentication...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Refreshing your secure connection
          </p>
        </div>
      </div>
    );
  }
  
  return null;
};

// Simple fallback for non-existent pages
const PageNotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-6">The page you are looking for doesn't exist or has been moved.</p>
      <a 
        href="/" 
        className="inline-flex items-center px-4 py-2 bg-[#0031ac] text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        Back to Dashboard
      </a>
    </div>
  </div>
);

export default function App() {
  // Set up global Firebase error handling
  useEffect(() => {
    // Configure global error handling for Firebase/Firestore errors
    const originalConsoleError = console.error;
    
    // Override console.error to detect Firebase/Firestore issues
    console.error = (...args) => {
      // Log original error
      originalConsoleError.apply(console, args);
      
      // Check if this is a Firebase/Firestore error to dispatch
      const errorString = args.join(' ');
      if (
        errorString.includes('firebase') || 
        errorString.includes('firestore') ||
        errorString.includes('permission-denied') ||
        errorString.includes('unauthenticated') ||
        errorString.includes('PERMISSION_DENIED') ||
        errorString.includes('failed to get document') ||
        errorString.includes('Missing or insufficient permissions') ||
        errorString.includes('WebChannelConnection RPC') ||
        errorString.includes('transport errored')
      ) {
        // Dispatch custom error event for AuthVerifier to handle
        const errorEvent = new CustomEvent('firebase-auth-error', { 
          detail: { error: args[0] || errorString } 
        });
        window.dispatchEvent(errorEvent);
      }
    };
    
    // Restore original console.error on cleanup
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <LoadingProvider>
        <Router>
          <AuthProvider>
            {/* Root-level authentication loading */}
            <RootAuth />
            
            {/* Auth verification at root level */}
            <AuthVerifier />
            
            <Routes>
              {/* Public routes - wrapped with PublicRoute to redirect if already authenticated */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
               {/* Protected routes with layout */}
               <Route element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'moderator', 'advisor']}>
                  <MainLayout />
                </ProtectedRoute>
              }>
                {/* Dashboard with suspense for code splitting example */}
                <Route index element={
                  <Suspense fallback={<LoadingSpinner size="lg" text="Loading dashboard..." />}>
                    <Dashboard />
                  </Suspense>
                } />
                
                {/* User Management Routes */}
                <Route path="/users" element={
                  <Suspense fallback={<LoadingSpinner size="lg" text="Loading users..." />}>
                    <AllUsers />
                  </Suspense>
                } />
                <Route path="/users/roles" element={
                  <Suspense fallback={<LoadingSpinner size="lg" text="Loading user roles..." />}>
                    <UserRoles />
                  </Suspense>
                } />
                
                {/* Listings Routes */}
                <Route path="/listings" element={
                  <Suspense fallback={<LoadingSpinner size="lg" text="Loading listings..." />}>
                    <AllListings />
                  </Suspense>
                } />
                <Route path="/listings/create" element={
                  <Suspense fallback={<LoadingSpinner size="lg" text="Loading new listing form..." />}>
                    <ListingCreate />
                  </Suspense>
                } />
                <Route path="/listings/:id" element={
                  <Suspense fallback={<LoadingSpinner size="lg" text="Loading listing details..." />}>
                    <ListingDetail />
                  </Suspense>
                } />
                <Route path="/listings/:id/edit" element={
                  <Suspense fallback={<LoadingSpinner size="lg" text="Loading listing editor..." />}>
                    <ListingEdit />
                  </Suspense>
                } />
                  {/* Advisor Routes */}
                  <Route path="/advisors" element={
                  <Suspense fallback={<LoadingSpinner size="lg" text="Loading advisors..." />}>
                    <AllAdvisors />
                  </Suspense>
                } />
                <Route path="/advisors/commission" element={
                  <Suspense fallback={<LoadingSpinner size="lg" text="Loading commission structure..." />}>
                    <CommissionStructure />
                  </Suspense>
                } />
                <Route path="/advisors/leads" element={
                  <Suspense fallback={<LoadingSpinner size="lg" text="Loading advisor leads..." />}>
                    <AdvisorLeads />
                  </Suspense>
                } />
                <Route path="/advisors/payments" element={
                  <Suspense fallback={<LoadingSpinner size="lg" text="Loading advisor payments..." />}>
                    <AdvisorPayments />
                  </Suspense>
                } />
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </AuthProvider>
        </Router>
      </LoadingProvider>
    </ErrorBoundary>
  );
}