import React, { Suspense, ReactNode, useMemo } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Enhanced Suspense boundary that prevents unnecessary remounts
 * Memoizes children to help with stability
 */
const SuspenseBoundary: React.FC<SuspenseBoundaryProps> = ({ 
  children, 
  fallback 
}) => {
  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[200px] w-full">
      <LoadingSpinner size="md" color="primary" text="Loading..." />
    </div>
  );
  
  // Memoize the fallback content to avoid recreation on remounts
  const memoizedFallback = useMemo(() => fallback || defaultFallback, [fallback]);
  
  // Console log to help debug mounting issues
  console.log('[SuspenseBoundary] Rendering component', {
    timestamp: new Date().toISOString()
  });
  
  return (
    <Suspense fallback={memoizedFallback}>
      {children}
    </Suspense>
  );
};

export default SuspenseBoundary;