import { toast } from "react-hot-toast";

/**
 * ToastIDs - Centralized management of toast notification IDs
 * This ensures all components use consistent toast IDs to prevent duplicates.
 */
export const TOAST_IDS = {
  // Image upload related
  IMAGE_UPLOAD_SUCCESS: "image-upload-success",
  IMAGE_UPLOAD_ERROR: "image-upload-error",
  IMAGE_VALIDATION_ERROR: "image-validation-error",
  IMAGE_TYPE_ERROR: "image-type-error",
  IMAGE_SIZE_ERROR: "image-size-error",
  
  // Image delete related
  IMAGE_DELETE_SUCCESS: "image-delete-success",
  IMAGE_DELETE_ERROR: "image-delete-error",
  
  // Image featured related
  IMAGE_FEATURED_SUCCESS: "image-featured-success",
  IMAGE_FEATURED_ERROR: "image-featured-error",
  
  // Document related
  DOCUMENT_UPLOAD_SUCCESS: "document-upload-success",
  DOCUMENT_UPLOAD_ERROR: "document-upload-error",
  DOCUMENT_DELETE_SUCCESS: "document-delete-success",
  DOCUMENT_DELETE_ERROR: "document-delete-error",
  
  // Form related
  FORM_SAVE_SUCCESS: "form-save-success",
  FORM_SAVE_ERROR: "form-save-error",
  FORM_SUBMIT_SUCCESS: "form-submit-success",
  FORM_SUBMIT_ERROR: "form-submit-error",
  
  // Generic
  GENERIC_ERROR: "generic-error",
  GENERIC_SUCCESS: "generic-success",
  GENERIC_INFO: "generic-info",
  GENERIC_WARNING: "generic-warning",
  
  // Processing states
  LOADING: "loading-toast"
};

/**
 * ToastManager - Professional utility to manage toast notifications
 * This class provides a consistent interface for showing toast notifications
 * while preventing duplicates and managing toast IDs.
 */
class ToastManager {
  constructor() {
    // Default configuration
    this.defaultConfig = {
      duration: 5000,
      position: "top-right",
    };
    
    // Store active toast IDs
    this.activeToasts = new Set();
    
    // Toast debounce timeouts
    this.toastDebounceTimeouts = {};
    
    // Last toast timestamp for deduplication
    this.lastToastTime = 0;
  }

  /**
   * Clear all active toasts
   */
  dismissAll() {
    toast.dismiss();
    this.activeToasts.clear();
  }

  /**
   * Dismiss all loading toasts
   * This is useful when loading toasts get stuck
   */
  dismissAllLoading() {
    // Dismiss all active toasts that might be loading toasts
    Array.from(this.activeToasts).forEach(id => {
      if (id === TOAST_IDS.LOADING || 
          id.startsWith('loading-') || 
          id.includes('loading') || 
          id.includes('process') ||
          id.includes('delete') ||
          id.includes('upload')) {
        this.dismiss(id);
      }
    });
    
    // Also try to dismiss any loading toasts by their type
    const loadingToasts = document.querySelectorAll('[data-loading="true"]');
    if (loadingToasts.length > 0) {
      toast.dismiss();
    }
  }

  /**
   * Forcefully clear all toasts
   * This is a stronger version of dismissAll that handles edge cases
   */
  purgeAllToasts() {
    // First try normal dismiss
    toast.dismiss();
    
    // Then handle any that might be stuck
    this.dismissAllLoading();
    
    // Clear active toast tracking
    this.activeToasts.clear();
    
    // Safety measure - force dismiss any toast that might still be visible
    document.querySelectorAll('[role="status"]').forEach(el => {
      try {
        // Try to find and remove toast elements if they exist
        const toastEl = el.closest('[role="alert"], [data-toast-id]');
        if (toastEl && toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
      } catch (e) {
        console.error('Error removing toast element:', e);
      }
    });
  }

  /**
   * Dismiss a specific toast by ID
   * @param {string} toastId - ID of the toast to dismiss
   */
  dismiss(toastId) {
    if (toastId) {
      toast.dismiss(toastId);
      this.activeToasts.delete(toastId);
    }
  }

  /**
   * Show a success toast
   * @param {string} message - Toast message
   * @param {string} toastId - Optional toast ID
   * @param {object} config - Optional toast configuration
   * @returns {string} - Toast ID
   */
  success(message, toastId = TOAST_IDS.GENERIC_SUCCESS, config = {}) {
    // Clear any stuck loading toasts before showing success
    this.dismissAllLoading();
    return this._showToast(message, "success", toastId, config);
  }

  /**
   * Show an error toast
   * @param {string} message - Toast message
   * @param {string} toastId - Optional toast ID
   * @param {object} config - Optional toast configuration
   * @returns {string} - Toast ID
   */
  error(message, toastId = TOAST_IDS.GENERIC_ERROR, config = {}) {
    // Clear any stuck loading toasts before showing error
    this.dismissAllLoading();
    return this._showToast(message, "error", toastId, config);
  }

  /**
   * Show a warning toast
   * @param {string} message - Toast message
   * @param {string} toastId - Optional toast ID
   * @param {object} config - Optional toast configuration
   * @returns {string} - Toast ID
   */
  warning(message, toastId = TOAST_IDS.GENERIC_WARNING, config = {}) {
    const options = {
      ...this.defaultConfig,
      ...config,
      id: toastId,
      icon: '⚠️'
    };
    return this._showToast(message, "custom", toastId, options);
  }

  /**
   * Show an info toast
   * @param {string} message - Toast message
   * @param {string} toastId - Optional toast ID
   * @param {object} config - Optional toast configuration
   * @returns {string} - Toast ID
   */
  info(message, toastId = TOAST_IDS.GENERIC_INFO, config = {}) {
    const options = {
      ...this.defaultConfig,
      ...config,
      id: toastId,
      icon: 'ℹ️'
    };
    return this._showToast(message, "custom", toastId, options);
  }

  /**
   * Show a loading toast
   * @param {string} message - Toast message
   * @param {string} toastId - Optional toast ID
   * @param {object} config - Optional toast configuration
   * @returns {string} - Toast ID
   */
  loading(message, toastId = TOAST_IDS.LOADING, config = {}) {
    // First dismiss any previous toast with this ID
    if (toastId) {
      this.dismiss(toastId);
    }
    
    const defaultLoadingConfig = {
      ...this.defaultConfig,
      duration: 30000, // Set default to 30 seconds max instead of Infinity
    };
    
    const finalConfig = {
      ...defaultLoadingConfig,
      ...config,
      id: toastId
    };
    
    // Safety measure: never allow truly infinite toasts
    // If duration is Infinity or greater than 60 seconds, cap it
    if (finalConfig.duration === Infinity || finalConfig.duration > 60000) {
      finalConfig.duration = 30000; // 30 seconds maximum
    }
    
    const id = toast.loading(message, finalConfig);
    if (toastId) {
      this.activeToasts.add(toastId);
      
      // Always set a fallback timeout to ensure the toast is eventually removed
      // This is a safety measure for stuck toasts
      setTimeout(() => {
        this.dismiss(toastId);
      }, finalConfig.duration + 1000);
    }
    
    return id;
  }

  /**
   * Show a toast message with debouncing to prevent duplicates
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, info, warning, custom)
   * @param {string} toastId - Toast ID for tracking
   * @param {object} config - Optional toast configuration
   * @returns {string} - Toast ID
   */
  _showToast(message, type, toastId, config = {}) {
    // Check if we should skip showing duplicate toasts
    const now = Date.now();
    if (now - this.lastToastTime < 300) {
      // Skip if last toast was shown less than 300ms ago
      return toastId;
    }
    this.lastToastTime = now;
    
    // Clear any existing debounce timeout for this toast ID
    if (this.toastDebounceTimeouts[toastId]) {
      clearTimeout(this.toastDebounceTimeouts[toastId]);
    }
    
    // Dismiss existing toast with this ID
    if (toastId && this.activeToasts.has(toastId)) {
      this.dismiss(toastId);
    }
    
    // Create merged configuration
    const finalConfig = {
      ...this.defaultConfig,
      ...config,
      id: toastId
    };
    
    // Show the toast
    let id;
    switch (type) {
      case "success":
        id = toast.success(message, finalConfig);
        break;
      case "error":
        id = toast.error(message, finalConfig);
        break;
      case "custom":
        id = toast(message, finalConfig);
        break;
      default:
        id = toast(message, finalConfig);
    }
    
    // Track the active toast
    if (toastId) {
      this.activeToasts.add(toastId);
      
      // Set a timeout to remove the toast from tracking after it closes
      this.toastDebounceTimeouts[toastId] = setTimeout(() => {
        this.activeToasts.delete(toastId);
        delete this.toastDebounceTimeouts[toastId];
      }, (config.duration || this.defaultConfig.duration) + 500);
    }
    
    return id;
  }

  /**
   * Update an existing toast
   * @param {string} toastId - ID of the toast to update
   * @param {object} options - Update options
   * @returns {string} - Toast ID
   */
  update(toastId, options) {
    if (toastId) {
      toast.dismiss(toastId);
      return toast(options.message || '', { ...options, id: toastId });
    }
    return toastId;
  }

  /**
   * Create a debounced toast function
   * @param {string} type - Toast type (success, error, info, warning)
   * @param {number} delay - Debounce delay in ms
   * @returns {Function} - Debounced toast function
   */
  createDebouncedToast(type = "error", delay = 300) {
    let timeoutId = null;
    let lastToastId = null;
    
    return (message, toastId, config = {}) => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Dismiss existing toast
      if (lastToastId) {
        this.dismiss(lastToastId);
      }
      
      // Set new timeout
      timeoutId = setTimeout(() => {
        switch (type) {
          case "success":
            lastToastId = this.success(message, toastId, config);
            break;
          case "error":
            lastToastId = this.error(message, toastId, config);
            break;
          case "warning":
            lastToastId = this.warning(message, toastId, config);
            break;
          case "info":
            lastToastId = this.info(message, toastId, config);
            break;
          default:
            lastToastId = this._showToast(message, type, toastId, config);
        }
        
        timeoutId = null;
      }, delay);
      
      return lastToastId;
    };
  }
}

// Create and export a singleton instance
const toastManager = new ToastManager();
export default toastManager; 