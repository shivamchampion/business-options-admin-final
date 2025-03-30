import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ConfirmationDialogProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  extraContent?: React.ReactNode;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDestructive = false,
  extraContent
}) => {
  // Handle escape key to close the dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    
    // Prevent scrolling of the background
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [onCancel]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className={`text-lg font-medium ${isDestructive ? 'text-red-600' : 'text-gray-900'}`}>
            {title}
          </h3>
          <button 
            className="text-gray-400 hover:text-gray-600"
            onClick={onCancel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-start">
            {isDestructive && (
              <div className="flex-shrink-0 mr-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">{message}</p>
              
              {extraContent && (
                <div className="mt-4">
                  {extraContent}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex flex-row-reverse gap-3">
          <Button
            variant={isDestructive ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;