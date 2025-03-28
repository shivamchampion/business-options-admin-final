import { useEffect } from 'react';

/**
 * Hook to set page title dynamically
 * @param title The title to set for the page
 * @param prefix Optional prefix to add before the title (defaults to "Business Options Admin - ")
 */
const usePageTitle = (title: string, prefix: string = 'Business Options Admin - '): void => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${prefix}${title}`;
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = previousTitle;
    };
  }, [title, prefix]);
};

export default usePageTitle;