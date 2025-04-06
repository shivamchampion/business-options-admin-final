// src/components/ui/LoadingSpinner.tsx - Enhanced with animations and better error state
import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
  fullScreen?: boolean;
  text?: string;
  error?: string;
  onRetry?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  fullScreen = false,
  text,
  error,
  onRetry
}) => {
  // Size mappings
  const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };

  // Color mappings
  const colorMap = {
    primary: 'border-[#0031ac]/30 border-t-[#0031ac]',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 border-t-gray-600'
  };

  // Combined classes
  const spinnerClasses = cn(
    'animate-spin rounded-full',
    sizeMap[size],
    colorMap[color],
    className
  );

  // Full screen wrapper with improved backdrop
  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50"
        aria-modal="true"
        role="dialog"
      >
        {error ? (
          <div className="text-center max-w-md px-4 animate-fade-in-scale">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-base font-medium text-gray-900 mb-2">Error</p>
            <p className="text-sm text-gray-700 mb-4">{error}</p>
            {onRetry && (
              <button 
                onClick={onRetry}
                className="px-4 py-2 bg-[#0031ac] text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto focus:outline-none focus:ring-2 focus:ring-[#0031ac] focus:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center animate-fade-in-scale">
            <div className={spinnerClasses}></div>
            {text && (
              <p className="mt-4 text-sm font-medium text-gray-700 animate-pulse">{text}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Inline spinner or error with improved styling
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
      {error ? (
        <div className="text-center animate-fade-in">
          <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-2 text-xs text-[#0031ac] hover:underline flex items-center justify-center mx-auto focus:outline-none"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center animate-fade-in">
          <div className={spinnerClasses}></div>
          {text && (
            <p className="mt-2 text-sm font-medium text-gray-700">{text}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;