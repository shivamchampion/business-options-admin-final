import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import SuspenseBoundary from "@/components/ui/SuspenseBoundary";
import { Toaster } from 'react-hot-toast';
import Login from "@/pages/Login";
import Unauthorized from "@/pages/Unauthorized";
import MainLayout from "@/components/layout/MainLayout";

// Use React.lazy only for Dashboard as an example of code splitting
import React from 'react';
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));

// Using placeholder components as requested
const UsersPage = () => <div className="card"><h1 className="text-2xl font-bold">Users Page</h1></div>;
const UserRolesPage = () => <div className="card"><h1 className="text-2xl font-bold">User Roles Page</h1></div>;
const AdvisorsPage = () => <div className="card"><h1 className="text-2xl font-bold">Advisors Page</h1></div>;
const ListingsPage = () => <div className="card"><h1 className="text-2xl font-bold">Listings Page</h1></div>;

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
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected routes with layout */}
              <Route element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'moderator', 'advisor']}>
                  <MainLayout />
                </ProtectedRoute>
              }>
                {/* Dashboard with suspense for code splitting example */}
                <Route path="/" element={
                  <SuspenseBoundary>
                    <Dashboard />
                  </SuspenseBoundary>
                } />
                
                {/* Regular components without code splitting */}
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/roles" element={<UserRolesPage />} />
                <Route path="/advisors" element={<AdvisorsPage />} />
                <Route path="/listings" element={<ListingsPage />} />
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </AuthProvider>
          
          {/* Toast Container */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#FFFFFF',
                color: '#111827',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
              },
            }}
          />
        </Router>
      </LoadingProvider>
    </ErrorBoundary>
  );
}