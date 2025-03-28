import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 bg-gray-900/50 z-20 lg:hidden transition-opacity duration-300 ${
          isSidebarOpen && isMobile ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:inset-auto lg:z-auto`}
      >
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col w-0 overflow-hidden">
        <Header 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen} 
          isScrolled={isScrolled} 
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-none">
            <div className="bg-white rounded-lg shadow border border-gray-100 p-6 min-h-[calc(100vh-8rem)]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}