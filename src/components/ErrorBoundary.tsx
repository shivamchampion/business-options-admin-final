import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Helper function to check if a value is a function
export function isFunction(value: any): boolean {
  return typeof value === 'function';
}

// Helper to safely call cleanup functions with error handling
export function safelyCallCleanup(cleanup: any): void {
  if (!cleanup) return;
  
  try {
    if (isFunction(cleanup)) {
      cleanup();
    } else {
      console.warn('Cleanup is not a function:', cleanup);
    }
  } catch (error) {
    console.error('Error calling cleanup function:', error);
  }
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo
    });
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // If there are any global loading indicators active, clear them
    if (window.__clearGlobalLoadingStates) {
      window.__clearGlobalLoadingStates();
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Force reload the current page to get a fresh state
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render a custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 text-center mb-6">
              We've encountered an unexpected error. You can try refreshing the page or contact support if the problem persists.
            </p>
            <div className="text-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center px-4 py-2 bg-[#0031ac] text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-gray-100 rounded overflow-auto max-h-48 text-xs">
                <p className="font-semibold text-red-600">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-gray-700">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add global utility for clearing loading states
declare global {
  interface Window {
    __clearGlobalLoadingStates?: () => void;
  }
}

export default ErrorBoundary;