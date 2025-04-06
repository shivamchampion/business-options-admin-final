import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

/**
 * Loading spinner component
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'text-blue-600'
}) => {
  const sizeMap = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const sizeClass = sizeMap[size];

  return (
    <div className="inline-block">
      <div className={`${sizeClass} ${color} animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]`} role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner; 