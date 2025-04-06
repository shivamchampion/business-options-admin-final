import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/context/AuthContext';
import { useLoading } from '@/context/LoadingContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const { isLoading, loadingMessage } = useLoading();
  const location = useLocation();
  
  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('scroll', handleScroll);
    checkScreenSize();
    handleScroll();

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 bg-gray-900/50 z-20 lg:hidden transition-opacity duration-300 ${
          sidebarOpen && isMobile ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:inset-auto lg:z-auto`}
      >
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col w-0 overflow-hidden">
        <Header 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={sidebarOpen} 
          isScrolled={isScrolled} 
        />
        
        <main className="flex-1 overflow-y-auto relative">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-none">
            {/* Page loading overlay - only covers the main content area */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                <LoadingSpinner 
                  size="lg" 
                  text={loadingMessage || "Loading..."} 
                />
              </div>
            )}
            
            {/* Page content */}
            <div className={`bg-white rounded-lg shadow border border-gray-100 p-6 min-h-[calc(100vh-8rem)] ${isLoading ? "opacity-50 transition-opacity duration-300" : ""}`}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;