// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute"; // New import
import ErrorBoundary from "@/components/ErrorBoundary";
import SuspenseBoundary from "@/components/ui/SuspenseBoundary";
import { Toaster } from 'react-hot-toast';
import Login from "@/pages/Login";
import Unauthorized from "@/pages/Unauthorized";
import MainLayout from "@/components/layout/MainLayout";

// Use React.lazy for code splitting
import React from 'react';
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const AllUsers = React.lazy(() => import("@/pages/users/AllUsers"));
const UserRoles = React.lazy(() => import("@/pages/users/UserRoles"));
const AllListings = React.lazy(() => import("@/pages/listings/AllListings"));
const ListingCreate = React.lazy(() => import("@/pages/listings/ListingCreate"));
const ListingDetail = React.lazy(() => import("@/pages/listings/ListingDetail"));
const ListingEdit = React.lazy(() => import("@/pages/listings/ListingEdit"));

// Using placeholder components as requested
const AdvisorsPage = () => <div className="card"><h1 className="text-2xl font-bold">Advisors Page</h1></div>;

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
  return (
    <ErrorBoundary>
      <LoadingProvider>
        <Router>
          <AuthProvider>
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
                  <SuspenseBoundary>
                    <Dashboard />
                  </SuspenseBoundary>
                } />
                <Route path="/" element={
                  <SuspenseBoundary>
                    <Dashboard />
                  </SuspenseBoundary>
                } />
                
                {/* User Management Routes */}
                <Route path="/users" element={
                  <SuspenseBoundary>
                    <AllUsers />
                  </SuspenseBoundary>
                } />
                <Route path="/users/roles" element={
                  <SuspenseBoundary>
                    <UserRoles />
                  </SuspenseBoundary>
                } />
                
                {/* Listings Routes */}
                <Route path="/listings" element={
                  <SuspenseBoundary>
                    <AllListings />
                  </SuspenseBoundary>
                } />
                <Route path="/listings/create" element={
                  <SuspenseBoundary>
                    <ListingCreate />
                  </SuspenseBoundary>
                } />
                <Route path="/listings/:id" element={
                  <SuspenseBoundary>
                    <ListingDetail />
                  </SuspenseBoundary>
                } />
                <Route path="/listings/:id/edit" element={
                  <SuspenseBoundary>
                    <ListingEdit />
                  </SuspenseBoundary>
                } />
                
                {/* Regular components without code splitting */}
                <Route path="/advisors" element={<AdvisorsPage />} />
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </AuthProvider>
          
          {/* Enhanced Toast Container */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 5000,
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
                }
              },
            }}
          />
        </Router>
      </LoadingProvider>
    </ErrorBoundary>
  );
}