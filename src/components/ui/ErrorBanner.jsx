import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorBanner = ({ message }) => {
  if (!message) return null;
  
  // Format the message to remove "Expected string, received number" type validation errors
  let formattedMessage = message;
  if (message.includes("Expected string, received number")) {
    formattedMessage = "Please enter a valid phone number";
  }
  
  return (
    <div className="mt-1 text-sm text-red-600 flex items-center">
      <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
      {formattedMessage}
    </div>
  );
};

export default ErrorBanner; 
 