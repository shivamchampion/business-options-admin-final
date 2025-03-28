import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  fullScreen = false,
  text
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

  // Full screen wrapper
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <div className={spinnerClasses}></div>
        {text && (
          <p className="mt-4 text-sm font-medium text-gray-700">{text}</p>
        )}
      </div>
    );
  }

  // Inline spinner
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={spinnerClasses}></div>
      {text && (
        <p className="mt-2 text-sm font-medium text-gray-700">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;