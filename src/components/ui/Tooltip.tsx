import React, { useState, Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 100,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  // Arrow position classes
  const arrowClasses = {
    top: 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1',
    bottom: 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-1',
    left: 'right-0 top-1/2 transform translate-x-1 -translate-y-1/2 rotate-45',
    right: 'left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 rotate-45'
  };
  
  // Add touch support
  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onTouchStart={handleTouch}
    >
      {children}
      
      <Transition
        as={Fragment}
        show={isOpen}
        enter={`transition duration-${delay} ease-out`}
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave={`transition duration-${delay} ease-in`}
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className={cn(
          "absolute z-[9999] min-w-max whitespace-nowrap",
          positionClasses[position],
          className
        )}>
          <div className="relative bg-gray-800 text-white text-xs rounded py-1 px-2">
            {content}
            <div className={cn(
              "border-t border-r border-gray-800 absolute w-2 h-2 bg-gray-800 transform rotate-45",
              arrowClasses[position]
            )}></div>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default Tooltip;