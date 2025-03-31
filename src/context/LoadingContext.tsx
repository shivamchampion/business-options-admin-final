import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface LoadingContextType {
  isLoading: boolean;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setLoadingMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);
  const [isVisible, setIsVisible] = useState(false);
  
  // Use refs to track timers and prevent memory leaks
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minimumDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track when loading started
  const loadingStartTimeRef = useRef<number>(0);
  
  // Constants for timing
  const MINIMUM_DISPLAY_TIME = 800; // Minimum time to show loading spinner (ms)
  const FADE_IN_DELAY = 100;        // Slight delay before showing spinner to prevent flashing (ms)
  const FADE_OUT_DURATION = 300;    // Duration of fade-out animation (ms)
  
  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);
  
  // Helper to clear all timers
  const clearAllTimers = () => {
    [loadingTimerRef, fadeTimerRef, minimumDisplayTimerRef].forEach(timerRef => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    });
  };

  const startLoading = (message?: string) => {
    // Clear any existing timers
    clearAllTimers();
    
    // Record start time
    loadingStartTimeRef.current = Date.now();
    
    // Set the message immediately
    setLoadingMessage(message);
    
    // Set loading state
    setIsLoading(true);
    
    // Show the spinner with a slight delay to avoid flashing for very quick operations
    fadeTimerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, FADE_IN_DELAY);
  };

  const stopLoading = () => {
    // Calculate how long loading has been visible
    const elapsedTime = Date.now() - loadingStartTimeRef.current;
    const remainingTime = Math.max(0, MINIMUM_DISPLAY_TIME - elapsedTime);
    
    // Clear any existing minimum display timer
    if (minimumDisplayTimerRef.current) {
      clearTimeout(minimumDisplayTimerRef.current);
    }
    
    // If loading hasn't been visible long enough, keep it visible for the minimum time
    minimumDisplayTimerRef.current = setTimeout(() => {
      // Start fade out animation
      setIsVisible(false);
      
      // After fade-out animation completes, reset the state
      loadingTimerRef.current = setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage(undefined);
      }, FADE_OUT_DURATION);
    }, remainingTime);
  };

  return (
    <LoadingContext.Provider value={{ 
      isLoading, 
      startLoading, 
      stopLoading,
      setLoadingMessage: (message: string) => setLoadingMessage(message)
    }}>
      {children}
      {isLoading && (
        <div 
          className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-live="polite"
          role="status"
          aria-hidden={!isVisible}
        >
          <LoadingSpinner 
            fullScreen 
            size="lg" 
            color="primary" 
            text={loadingMessage} 
          />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};