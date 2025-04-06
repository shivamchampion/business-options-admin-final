import React from 'react';
import ImageTester from '@/components/dev/ImageTester';
import AdminLayout from '@/components/layouts/AdminLayout';

export default function ImageTesterPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Image Upload Diagnostics</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This is a developer tool for diagnosing image upload issues. It provides detailed information about image files and their upload process to Firebase Storage.
              </p>
            </div>
          </div>
        </div>
        
        <ImageTester />
      </div>
    </AdminLayout>
  );
}

// Only available in development environment
export async function getServerSideProps(context) {
  // Check if in development mode
  if (process.env.NODE_ENV !== 'development') {
    return {
      notFound: true, // Returns 404 page in production
    };
  }

  return {
    props: {}, // Pass props to the page
  };
} 