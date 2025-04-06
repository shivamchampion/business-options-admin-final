import React from 'react';
import ToastManager, { TOAST_IDS } from '@/utils/ToastManager';
import Button from '@/components/ui/Button';

const ToastTest = () => {
  const showSuccessToast = () => {
    ToastManager.success('Success message', TOAST_IDS.GENERIC_SUCCESS);
  };

  const showErrorToast = () => {
    ToastManager.error('Error message', TOAST_IDS.GENERIC_ERROR);
  };

  const showInfoToast = () => {
    ToastManager.info('Info message', TOAST_IDS.GENERIC_INFO);
  };

  const showWarningToast = () => {
    ToastManager.warning('Warning message', TOAST_IDS.GENERIC_WARNING);
  };

  const showDuplicateToast = () => {
    // Show two toasts with the same ID in quick succession
    ToastManager.success('First toast', 'duplicate-test');
    
    // The second one should replace the first one
    setTimeout(() => {
      ToastManager.success('Second toast - should replace first', 'duplicate-test');
    }, 100);
  };

  const showLoadingToast = () => {
    ToastManager.loading('Loading...', 'loading-test');
    
    // Update the loading toast after 2 seconds
    setTimeout(() => {
      ToastManager.success('Loading complete!', 'loading-test');
    }, 2000);
  };
  
  const showStuckLoadingToast = () => {
    // Show a loading toast that won't auto-complete
    ToastManager.loading('This is a stuck loading toast...', 'stuck-loading-test');
  };
  
  const dismissAllLoadingToasts = () => {
    // Dismiss all loading toasts
    ToastManager.dismissAllLoading();
    ToastManager.success('All loading toasts dismissed', 'dismiss-loading-success');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Toast Notification Test</h2>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={showSuccessToast}>Show Success</Button>
          <Button onClick={showErrorToast}>Show Error</Button>
          <Button onClick={showInfoToast}>Show Info</Button>
          <Button onClick={showWarningToast}>Show Warning</Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={showDuplicateToast}>Test Duplicate Prevention</Button>
          <Button onClick={showLoadingToast}>Test Loading Toast</Button>
          <Button onClick={showStuckLoadingToast}>Create Stuck Loading</Button>
          <Button onClick={dismissAllLoadingToasts}>Dismiss All Loading</Button>
        </div>
      </div>
    </div>
  );
};

export default ToastTest; 