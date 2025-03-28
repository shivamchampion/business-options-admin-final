import React, { Suspense, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const SuspenseBoundary: React.FC<SuspenseBoundaryProps> = ({ 
  children, 
  fallback 
}) => {
  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[200px] w-full">
      <LoadingSpinner size="md" color="primary" text="Loading..." />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default SuspenseBoundary;