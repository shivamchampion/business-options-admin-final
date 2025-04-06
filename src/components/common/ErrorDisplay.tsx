import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  details?: string;
}

/**
 * Error display component for showing user-friendly error messages with optional retry action
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onRetry,
  details
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-red-100">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          
          {details && (
            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 font-mono mb-4">
              {details}
            </div>
          )}
          
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="primary"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay; 