import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  File,
  FileText,
  FilePlus,
  Trash2,
  AlertTriangle,
  Check,
  Info,
  Eye,
  EyeOff,
  Clock,
  Download,
  BadgeCheck,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  X,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { ListingType } from '@/types/listings';
import { enhancedStorage } from '@/lib';
import { formPersistenceService } from '@/services/formPersistenceService';
import ToastManager, { TOAST_IDS } from "@/utils/ToastManager";
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { DOCUMENT_CATEGORIES } from './DocumentCategoryMapper';

/**
 * Document Upload Component - Step 4 of the listing form
 * 
 * Handles document uploads for listings with:
 * - Category-based document organization
 * - Document description fields
 * - Public/private visibility toggle
 * - Document previews
 * - Delete functionality
 * - Listing type-specific document requirements
 */

// Comprehensive industry-standard upload tracking system
const useUploadTracker = () => {
  const [uploadingFiles, setUploadingFiles] = useState(new Map());
  const [failedUploads, setFailedUploads] = useState(new Set());
  
  // Add a file to track
  const trackUpload = (fileId, metadata = {}) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      newMap.set(fileId, {
        startTime: Date.now(),
        status: 'uploading', // 'uploading', 'completed', 'failed', 'timeout'
        progress: 0,
        metadata
      });
      return newMap;
    });
  };
  
  // Update progress
  const updateProgress = (fileId, progress) => {
    setUploadingFiles(prev => {
      if (!prev.has(fileId)) return prev;
      const newMap = new Map(prev);
      const record = newMap.get(fileId);
      newMap.set(fileId, { ...record, progress });
      return newMap;
    });
  };
  
  // Mark as completed
  const markCompleted = (fileId) => {
    setUploadingFiles(prev => {
      if (!prev.has(fileId)) return prev;
      const newMap = new Map(prev);
      const record = newMap.get(fileId);
      newMap.set(fileId, { 
        ...record, 
        status: 'completed',
    progress: 100,
        completedTime: Date.now()
      });
      return newMap;
    });
    
    // Remove from failed uploads if it was there
    if (failedUploads.has(fileId)) {
      setFailedUploads(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };
  
  // Mark as failed
  const markFailed = (fileId, error) => {
    setUploadingFiles(prev => {
      if (!prev.has(fileId)) return prev;
      const newMap = new Map(prev);
      const record = newMap.get(fileId);
      newMap.set(fileId, { 
        ...record, 
        status: 'failed',
        error: error || 'Upload failed',
        failedTime: Date.now()
      });
      return newMap;
    });
    
    // Add to failed uploads set
    setFailedUploads(prev => {
      const newSet = new Set(prev);
      newSet.add(fileId);
      return newSet;
    });
  };
  
  // Check for timeouts (files stuck in uploading state)
  const checkTimeouts = (timeoutMs = 20000) => {
    const now = Date.now();
    const timedOutFiles = [];
    
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      
      for (const [fileId, record] of prev.entries()) {
        if (record.status === 'uploading') {
          const elapsed = now - record.startTime;
          
          if (elapsed > timeoutMs) {
            record.status = 'timeout';
            record.error = `Upload timed out after ${Math.round(elapsed/1000)}s`;
            record.failedTime = now;
            timedOutFiles.push(fileId);
            
            // Add to failed uploads
            setFailedUploads(failed => {
              const newSet = new Set(failed);
              newSet.add(fileId);
              return newSet;
            });
          }
        }
      }
      
      return newMap;
    });
    
    return timedOutFiles;
  };
  
  // Get upload status
  const getUploadStatus = (fileId) => {
    if (!uploadingFiles.has(fileId)) return null;
    return uploadingFiles.get(fileId);
  };
  
  // Check if file is currently uploading
  const isUploading = (fileId) => {
    const record = uploadingFiles.get(fileId);
    return record && record.status === 'uploading';
  };
  
  // Check if file has failed
  const hasFailed = (fileId) => {
    return failedUploads.has(fileId);
  };
  
  // Clear a specific file from tracking
  const clearFile = (fileId) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
    
    setFailedUploads(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };
  
  // Clear all tracked files
  const clearAll = () => {
    setUploadingFiles(new Map());
    setFailedUploads(new Set());
  };
  
  return {
    uploadingFiles,
    failedUploads,
    trackUpload,
    updateProgress,
    markCompleted,
    markFailed,
    checkTimeouts,
    getUploadStatus,
    isUploading,
    hasFailed,
    clearFile,
    clearAll
  };
};

const Documents = ({
  documents = [],
  onChange,
  onError,
  isEdit = false,
  isLoading = false,
  listingType,
  formId = 'default' // Form ID (can be listing ID when in edit mode)
}) => {
  // State management
  const [uploadedDocuments, setUploadedDocuments] = useState(documents);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [activeCategory, setActiveCategory] = useState('essential');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newDocVisibility, setNewDocVisibility] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replacingDocId, setReplacingDocId] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [needsReupload, setNeedsReupload] = useState(false);
  const [lastUploadStartTime, setLastUploadStartTime] = useState(0);

  // New upload tracking system
  const {
    uploadingFiles,
    trackUpload,
    updateProgress,
    markCompleted,
    markFailed,
    checkTimeouts,
    isUploading: isFileUploading,
    hasFailed,
    clearFile
  } = useUploadTracker();
  
  // Refs
  const isMounted = useRef(true);
  const uploadFormRef = useRef(null);
  const dropzoneRef = useRef(null);
  const documentsHandled = useRef(false); // Reference for tracking document changes
  const isInitialLoadRef = useRef(true); // Reference for tracking initial visibility change

  // Initialize documents from props
  useEffect(() => {
    if (documents && documents.length > 0) {
      setUploadedDocuments([...documents]);
    }
  }, [documents]);
  
  // Check for timeout uploads every 5 seconds
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (!isMounted.current) {
        clearInterval(checkInterval);
        return;
      }
      
      // Check for timeouts (files stuck in uploading state for > 20 seconds)
      const timedOutFiles = checkTimeouts(20000);
      
      if (timedOutFiles.length > 0) {
        console.warn(`${timedOutFiles.length} document uploads timed out`);
        
        // Update document objects to reflect timeout status
        setUploadedDocuments(prevDocs => {
          const updatedDocs = [...prevDocs];
          
          for (const doc of updatedDocs) {
            if (timedOutFiles.includes(doc.id)) {
              doc.uploading = false;
              doc.error = "Upload timed out";
              doc.isPlaceholder = true; // Mark as placeholder so user can try again
            }
          }
          
          // Save to storage
          enhancedStorage.saveDocumentMetadata(updatedDocs, formId);
          return updatedDocs;
        });
        
        // Show error toast to user
        ToastManager.error(
          'Some uploads timed out. Please try again.', 
          TOAST_IDS.UPLOAD_TIMEOUT
        );
      }
    }, 5000);
    
    return () => clearInterval(checkInterval);
  }, [checkTimeouts, formId]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Add a cleanup effect for any stale upload progress
  useEffect(() => {
    // Clear any stale upload progress on mount
    setUploadProgress({});
    
    // Any document that's still marked as uploading but isn't in uploadProgress
    // should be updated to show as failed
    setUploadedDocuments(prevDocs => {
      const updatedDocs = prevDocs.map(doc => {
        if (doc.uploading && !doc.completed) {
          return {
            ...doc,
            uploading: false,
            error: "Upload interrupted",
            isPlaceholder: true
          };
        }
        return doc;
      });
      
      // Only update storage if there were changes
      if (JSON.stringify(updatedDocs) !== JSON.stringify(prevDocs)) {
        enhancedStorage.saveDocumentMetadata(updatedDocs, formId);
      }
      
      return updatedDocs;
    });
    
    // Clear isUploading state
    setIsUploading(false);
    
    // Additional check after a short delay to make sure UI is updated
    const cleanupTimer = setTimeout(() => {
      if (isMounted.current) {
        // Force another check in case state updates didn't properly clean up
        setUploadProgress({});
        setIsUploading(false);
      }
    }, 500);
    
    return () => clearTimeout(cleanupTimer);
  }, [formId]);

  // Forward changes to parent component
  useEffect(() => {
    if (typeof onChange === 'function') {
      // Filter out incomplete/placeholder documents for parent component
      const completedDocs = uploadedDocuments.filter(doc => 
        !doc.isPlaceholder && (!doc.uploading || doc.completed)
      );
      
      onChange({ documents: completedDocs });
    }
  }, [uploadedDocuments, onChange]);

  // Load saved documents when component mounts
  useEffect(() => {
    if (formId) {
      try {
        console.log(`[DEBUG] Documents: Checking for saved documents for form ${formId}`);
        
        // Check localStorage directly first for immediate feedback
        const localStorageKey = `listing_form_documents_${formId || 'default'}`;
        const rawLocalStorageData = localStorage.getItem(localStorageKey);
        console.log('[DEBUG] Documents: Direct localStorage check:', 
          rawLocalStorageData ? 'Data found' : 'No data found', 
          rawLocalStorageData ? `(${rawLocalStorageData.length} chars)` : ''
        );
        
        if (rawLocalStorageData) {
          try {
            // Try to parse the localStorage data directly as a backup
            const parsedLocalDocs = JSON.parse(rawLocalStorageData);
            console.log(`[DEBUG] Documents: Successfully parsed localStorage data, found ${parsedLocalDocs.length} documents`);
            
            if (parsedLocalDocs && Array.isArray(parsedLocalDocs) && parsedLocalDocs.length > 0) {
              // Process documents and update state
              const processedLocalDocs = parsedLocalDocs.map(doc => ({
                ...doc,
                // Convert string date back to Date object if needed
                uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
                // Ensure these flags are set correctly
                uploading: false,
                completed: true,
                // Add any missing fields with defaults
                verificationStatus: doc.verificationStatus || 'pending',
                isPublic: !!doc.isPublic
              }));
              
              // Update state with localStorage documents
              setUploadedDocuments(processedLocalDocs);
              
              // Call onChange to update parent form
              if (typeof onChange === 'function') {
                onChange({ documents: processedLocalDocs });
              }
              
              console.log(`[DEBUG] Documents: Successfully loaded ${processedLocalDocs.length} documents from localStorage`);
              return; // Exit early since we've successfully loaded from localStorage
            }
          } catch (localParseError) {
            console.error('[DEBUG] Documents: Error parsing localStorage data:', localParseError);
          }
        }
        
        // Fall back to the storage service method if direct localStorage failed
        const savedDocuments = enhancedStorage.getDocumentMetadata(formId);
        console.log(`[DEBUG] Documents: Storage service returned:`, savedDocuments);
        
        if (savedDocuments && Array.isArray(savedDocuments) && savedDocuments.length > 0) {
          console.log(`[DEBUG] Documents: Found ${savedDocuments.length} saved documents for form ${formId}`);
          
          // Process documents to ensure all required fields are present
          const processedDocuments = savedDocuments.map(doc => ({
            ...doc,
            // Convert string date back to Date object if needed
            uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
            // Ensure these flags are set correctly
            uploading: false,
            completed: true,
            // Add any missing fields with defaults
            verificationStatus: doc.verificationStatus || 'pending',
            isPublic: !!doc.isPublic
          }));
          
          // Update state with saved documents
          setUploadedDocuments(processedDocuments);
          
          // Call onChange to update parent form
          if (typeof onChange === 'function') {
            onChange({ documents: processedDocuments });
          }
        } else {
          // If storage service didn't find anything, try Firestore as a last resort
          console.log(`[DEBUG] Documents: No saved documents found, checking Firestore...`);
          
          enhancedStorage.getDocumentsFromFirestore(formId || 'default')
            .then(firestoreDocs => {
              console.log(`[DEBUG] Documents: Firestore returned:`, firestoreDocs);
              
              if (firestoreDocs && Array.isArray(firestoreDocs) && firestoreDocs.length > 0) {
                console.log(`[DEBUG] Documents: Found ${firestoreDocs.length} documents in Firestore`);
                
                // Process documents
                const processedFirestoreDocs = firestoreDocs.map(doc => ({
                  ...doc,
                  // Ensure these flags are set correctly
                  uploading: false,
                  completed: true,
                  // Add any missing fields with defaults
                  verificationStatus: doc.verificationStatus || 'pending',
                  isPublic: !!doc.isPublic
                }));
                
                // Update state
                setUploadedDocuments(processedFirestoreDocs);
                
                // Save to localStorage for next time
                const jsonData = JSON.stringify(processedFirestoreDocs);
                localStorage.setItem(`listing_form_documents_${formId || 'default'}`, jsonData);
                
                // Call onChange to update parent form
                if (typeof onChange === 'function') {
                  onChange({ documents: processedFirestoreDocs });
                }
                
                console.log(`[DEBUG] Documents: Successfully recovered ${processedFirestoreDocs.length} documents from Firestore`);
              } else {
                console.log(`[DEBUG] Documents: No documents found in Firestore either`);
              }
            })
            .catch(firestoreError => {
              console.error('[DEBUG] Documents: Error getting documents from Firestore:', firestoreError);
            });
        }
      } catch (error) {
        console.error("[DEBUG] Documents: Error loading saved documents:", error);
        ToastManager.error(
          "Error loading saved documents. You may need to re-upload.", 
          TOAST_IDS.DOCUMENT_UPLOAD_ERROR
        );
      }
    }
  }, [formId, onChange]);

  // Document upload handler
  const handleFiles = async (acceptedFiles, rejectedFiles) => {
    if (acceptedFiles.length === 0) {
      console.warn('[DEBUG] No files accepted for upload');
      return;
    }

    // Show loading state
    setIsUploading(true);
    
    // Dismiss any existing toasts
    ToastManager.dismiss();
    
    // Create loading toast that will be updated
    const loadingToastId = ToastManager.loadingToast(`Uploading ${acceptedFiles.length} document${acceptedFiles.length > 1 ? 's' : ''}...`);
    
    const lastUploadTime = Date.now();
    setLastUploadStartTime(lastUploadTime);
    
    // Filter files for valid types and size
    const validFiles = acceptedFiles.filter(file => {
      // Size check (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => [...prev, `File "${file.name}" exceeds maximum size of 10MB`]);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) {
      ToastManager.dismiss(loadingToastId);
      ToastManager.error("No valid files to upload");
      setIsUploading(false);
      return;
    }
    
    // Generate temp upload IDs for tracking
    const uploadPromises = [];
    
    console.log('[DEBUG] Selected document type:', selectedDocType);
    console.log('[DEBUG] Active category:', activeCategory);
    
    for (const file of validFiles) {
      try {
        const tempId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Ensure the correct category is being used
        const documentCategory = activeCategory;
        console.log('[DEBUG] Using category for upload:', documentCategory);
        
        // Create temporary document to show in UI
        const tempDocument = {
          id: tempId,
          name: file.name,
          description: newDocDescription || file.name,
          size: file.size,
          format: file.type,
          category: documentCategory,
          type: selectedDocType,
          isPublic: newDocVisibility,
          verificationStatus: 'pending',
          uploadedAt: new Date(),
          progress: 0,
          uploading: true,
          completed: false,
          uploadTime: Date.now()
        };
        
        console.log('[DEBUG] Created temporary document with category:', tempDocument.category);
        
        // Handle replacements
        if (isReplacing && replacingDocId) {
          // Update UI immediately with temp data
          setUploadedDocuments(prev =>
            prev.map(doc => doc.id === replacingDocId ? {
              ...tempDocument,
              id: replacingDocId
            } : doc)
          );
          
          // Set initial progress
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 0
          }));
          
          // DIRECTLY START THE FIREBASE UPLOAD - no simulation
          const uploadPromise = (async () => {
            try {
              console.log('[DEBUG] Documents: Starting direct Firebase upload for file:', file.name);
              
              // Create a unique file path to avoid collisions
              const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
              const docPath = `documents/${formId}/${fileName}`;
              
              console.log('[DEBUG] Documents: Upload path:', docPath);
              
              // Create a reference to the storage location
              const storageRef = ref(enhancedStorage.storage, docPath);
              
              // Create and start the upload task
              const uploadTask = uploadBytesResumable(storageRef, file);
              
              // Track progress manually
              uploadTask.on('state_changed', 
                (snapshot) => {
                  // Calculate and report progress
                  const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                  console.log(`[DEBUG] Documents: Upload progress for ${file.name}: ${progress}%`);
                  
                  // Update progress in state
                  setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: progress
                  }));
                },
                (error) => {
                  // Handle errors
                  console.error(`[DEBUG] Documents: Upload error for ${file.name}:`, error);
                  throw error;
                }
              );
              
              // Wait for the upload to complete
              const snapshot = await uploadTask;
              console.log(`[DEBUG] Documents: Upload completed for ${file.name}`);
              
              // Get the download URL
              const downloadURL = await getDownloadURL(snapshot.ref);
              console.log(`[DEBUG] Documents: Download URL obtained for ${file.name}`);
              
              // Create the document object
              const finalDoc = {
                id: replacingDocId,
                name: file.name,
                path: docPath,
                url: downloadURL,
                size: file.size,
                format: file.type,
                description: newDocDescription || file.name,
                category: activeCategory,
                type: selectedDocType,
                isPublic: newDocVisibility,
                verificationStatus: 'pending',
                uploadedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                uploading: false,
                completed: true
              };
              
              console.log('[DEBUG] Documents: Created document object:', finalDoc);
              
              // Update in state
              setUploadedDocuments(prevDocs => {
                const newDocs = prevDocs.map(doc =>
                  doc.id === replacingDocId ? finalDoc : doc
                );
                
                // Save to storage
                saveDocuments(newDocs);
                
                // Set final progress
                setUploadProgress(prev => ({
                  ...prev,
                  [file.name]: 100
                }));
                
                return newDocs;
              });
              
              // We'll show a single success toast after all uploads complete
              // instead of one per file to avoid toast overload
              
              // Remove this file from upload progress after success
              setTimeout(() => {
                setUploadProgress(prev => {
                  const newProgress = { ...prev };
                  delete newProgress[file.name];
                  return newProgress;
                });
              }, 1000);
              
              return finalDoc;
            } catch (error) {
              console.error("[DEBUG] Documents: Error uploading to Firebase:", error);
              
              // Update document to show error
              setUploadedDocuments(prevDocs => {
                const newDocs = prevDocs.map(doc =>
                  doc.id === replacingDocId ? {
                    ...doc,
                    uploading: false,
                    completed: false,
                    error: error.message || "Upload failed",
                    isPlaceholder: true
                  } : doc
                );
                
                // Save to storage
                saveDocuments(newDocs);
                return newDocs;
              });
              
              // Show error toast for this file
              ToastManager.error(
                `Error uploading ${file.name}: ${error.message}`, 
                TOAST_IDS.DOCUMENT_UPLOAD_ERROR
              );
              
              // Remove this file from upload progress after error
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[file.name];
                return newProgress;
              });
              
              throw error;
            }
          })();
          
          uploadPromises.push(uploadPromise);
          
        } else {
          // Add to state for immediate feedback
          setUploadedDocuments(prev => [...prev, tempDocument]);
          
          // Set initial progress
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 0
          }));
          
          // DIRECTLY START THE FIREBASE UPLOAD - no simulation
          const uploadPromise = (async () => {
            try {
              console.log('[DEBUG] Documents: Starting direct Firebase upload for file:', file.name);
              
              // Create a unique file path to avoid collisions
              const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
              const docPath = `documents/${formId}/${fileName}`;
              
              console.log('[DEBUG] Documents: Upload path:', docPath);
              
              // Create a reference to the storage location
              const storageRef = ref(enhancedStorage.storage, docPath);
              
              // Create and start the upload task
              const uploadTask = uploadBytesResumable(storageRef, file);
              
              // Track progress manually
              uploadTask.on('state_changed', 
                (snapshot) => {
                  // Calculate and report progress
                  const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                  console.log(`[DEBUG] Documents: Upload progress for ${file.name}: ${progress}%`);
                  
                  // Update progress in state
                  setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: progress
                  }));
                },
                (error) => {
                  // Handle errors
                  console.error(`[DEBUG] Documents: Upload error for ${file.name}:`, error);
                  throw error;
                }
              );
              
              // Wait for the upload to complete
              const snapshot = await uploadTask;
              console.log(`[DEBUG] Documents: Upload completed for ${file.name}`);
              
              // Get the download URL
              const downloadURL = await getDownloadURL(snapshot.ref);
              console.log(`[DEBUG] Documents: Download URL obtained for ${file.name}`);
              
              // Create the document object
              const finalDoc = {
                id: uuidv4(),
                name: file.name,
                path: docPath,
                url: downloadURL,
                size: file.size,
                format: file.type,
                description: newDocDescription || file.name,
                category: activeCategory,
                type: selectedDocType,
                isPublic: newDocVisibility,
                verificationStatus: 'pending',
                uploadedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                uploading: false,
                completed: true
              };
              
              console.log('[DEBUG] Documents: Created document object:', finalDoc);
              
              // Update in state
              setUploadedDocuments(prevDocs => {
                // Filter out the temp document and add the real one
                const newDocs = prevDocs.filter(doc => doc.id !== tempId);
                newDocs.push(finalDoc);
                
                // Save to storage
                saveDocuments(newDocs);
                
                // Set final progress
                setUploadProgress(prev => ({
                  ...prev,
                  [file.name]: 100
                }));
                
                return newDocs;
              });
              
              // We'll show a single success toast after all uploads complete
              // instead of one per file to avoid toast overload
              
              // Remove this file from upload progress after success
              setTimeout(() => {
                setUploadProgress(prev => {
                  const newProgress = { ...prev };
                  delete newProgress[file.name];
                  return newProgress;
                });
              }, 1000);
              
              return finalDoc;
            } catch (error) {
              console.error("[DEBUG] Documents: Error uploading to Firebase:", error);
              
              // Update document to show error
              setUploadedDocuments(prevDocs => {
                const newDocs = prevDocs.map(doc =>
                  doc.id === tempId ? {
                    ...doc,
                    uploading: false,
                    completed: false,
                    error: error.message || "Upload failed",
                    isPlaceholder: true
                  } : doc
                );
                
                // Save to storage
                saveDocuments(newDocs);
                return newDocs;
              });
              
              // Show error toast for this file
              ToastManager.error(
                `Error uploading ${file.name}: ${error.message}`, 
                TOAST_IDS.DOCUMENT_UPLOAD_ERROR
              );
            }
          })();
          
          uploadPromises.push(uploadPromise);
        }
      } catch (error) {
        console.error("Error processing document:", error);
        newErrors.push(`${file.name}: ${error.message}`);
      }
    }
    
    // Reset form fields after all uploads are initiated
    setNewDocDescription('');
    setSelectedDocType(null);
    setShowUploadForm(false);
    setIsReplacing(false);
    setReplacingDocId(null);
    
    // Wait for all uploads to complete
    Promise.allSettled(uploadPromises)
      .then(results => {
        const failedCount = results.filter(r => r.status === 'rejected').length;
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        
        // All done, dismiss loading toast
        ToastManager.dismiss(loadingToastId);
        
        // Show overall status
        if (successCount > 0 && failedCount === 0) {
          ToastManager.success(
            `${successCount} document${successCount > 1 ? 's' : ''} uploaded successfully`, 
            TOAST_IDS.DOCUMENT_UPLOAD_SUCCESS
          );
        } else if (successCount > 0 && failedCount > 0) {
          ToastManager.success(
            `${successCount} document${successCount > 1 ? 's' : ''} uploaded, ${failedCount} failed`, 
            TOAST_IDS.DOCUMENT_UPLOAD_SUCCESS
          );
        }
        
        // Set uploading to false
        setIsUploading(false);
        
        // Verify documents are actually saved in localStorage after upload
        setTimeout(() => {
          const localStorageKey = `listing_form_documents_${formId || 'default'}`;
          const rawData = localStorage.getItem(localStorageKey);
          console.log('[DEBUG] Documents: After upload localStorage check:', 
            rawData ? 'Data found' : 'No data found', 
            rawData ? `(${rawData.length} chars)` : '');
          
          if (rawData) {
            try {
              const parsedDocs = JSON.parse(rawData);
              console.log(`[DEBUG] Documents: Found ${parsedDocs.length} documents in localStorage after upload`);
            } catch (e) {
              console.error('[DEBUG] Documents: Error parsing localStorage data after upload:', e);
            }
          }
        }, 500);
        
        // Call onChange to update parent form only if it's a function
        if (typeof onChange === 'function') {
          const completedDocs = uploadedDocuments.filter(doc => 
            !doc.isPlaceholder && (!doc.uploading || doc.completed)
          );
          
          onChange({ documents: completedDocs });
        }
      })
      .catch(error => {
        console.error("Error in upload promises:", error);
        ToastManager.dismiss(loadingToastId);
        ToastManager.error(
          "An error occurred during document upload", 
          TOAST_IDS.DOCUMENT_UPLOAD_ERROR
        );
        setIsUploading(false);
      });
  };

  // Count of already uploaded documents by type
  const getDocumentTypeCount = (type) => {
    return uploadedDocuments.filter(doc =>
      doc.type === type && doc.category === activeCategory && !doc.isPlaceholder
    ).length;
  };

  // Tooltip component
  const Tooltip = ({ content, children }) => {
    return (
      <div className="group relative inline-block">
        {children}
        <div className="absolute z-50 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible 
          transform -translate-x-1/2 left-1/2 bottom-full mb-2 transition-all duration-200 ease-in-out pointer-events-none">
          <div className="relative bg-gray-800 text-white text-xs rounded-md p-2 text-center shadow-lg">
            {content}
            <div className="absolute w-2.5 h-2.5 bg-gray-800 transform rotate-45 -bottom-[5px] left-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </div>
    );
  };

  // Get document categories based on listing type
  const getDocumentCategories = () => {
    console.log("[DEBUG] Getting document categories for listing type:", listingType);
    
    const essentialDocs = {
      id: DOCUMENT_CATEGORIES.ESSENTIAL,
      name: 'Essential Documents',
      description: 'Required documents that verify your listing'
    };

    const financialDocs = {
      id: DOCUMENT_CATEGORIES.FINANCIAL,
      name: 'Financial Documents',
      description: 'Documents that demonstrate financial performance'
    };

    const operationalDocs = {
      id: DOCUMENT_CATEGORIES.OPERATIONAL,
      name: 'Operational Documents',
      description: 'Documents related to day-to-day operations'
    };

    const verificationDocs = {
      id: DOCUMENT_CATEGORIES.VERIFICATION,
      name: 'Verification Documents',
      description: 'Documents that verify business details and claims'
    };

    // Add type-specific categories
    switch (listingType) {
      case ListingType.BUSINESS:
        return [
          essentialDocs,
          financialDocs,
          operationalDocs,
          {
            id: DOCUMENT_CATEGORIES.SALE,
            name: 'Sale Documents',
            description: 'Documents related to the sale of the business'
          }
        ];
      case ListingType.FRANCHISE:
        return [
          essentialDocs,
          {
            id: DOCUMENT_CATEGORIES.FRANCHISE,
            name: 'Franchise Documents',
            description: 'Franchise disclosure and agreement documents'
          },
          financialDocs,
          {
            id: DOCUMENT_CATEGORIES.TRAINING,
            name: 'Training & Support',
            description: 'Documents related to franchise training and support'
          }
        ];
      case ListingType.STARTUP:
        return [
          essentialDocs,
          {
            id: DOCUMENT_CATEGORIES.PITCH,
            name: 'Pitch Documents',
            description: 'Pitch deck and executive summary'
          },
          financialDocs,
          {
            id: DOCUMENT_CATEGORIES.PRODUCT,
            name: 'Product Documents',
            description: 'Product specifications, roadmap and technical details'
          },
          {
            id: DOCUMENT_CATEGORIES.MARKET,
            name: 'Market Research',
            description: 'Market analysis and traction metrics'
          }
        ];
      case ListingType.INVESTOR:
        return [
          essentialDocs,
          {
            id: DOCUMENT_CATEGORIES.INVESTMENT,
            name: 'Investment Thesis',
            description: 'Investment philosophy and criteria'
          },
          {
            id: DOCUMENT_CATEGORIES.PORTFOLIO,
            name: 'Portfolio Documents',
            description: 'Past investments and success cases'
          },
          {
            id: DOCUMENT_CATEGORIES.PROCESS,
            name: 'Process Documents',
            description: 'Investment process and due diligence materials'
          }
        ];
      case ListingType.DIGITAL_ASSET:
        return [
          essentialDocs,
          verificationDocs,
          financialDocs,
          {
            id: DOCUMENT_CATEGORIES.TECHNICAL,
            name: 'Technical Documents',
            description: 'Technical specifications and infrastructure details'
          }
        ];
      default:
        return [essentialDocs, financialDocs, operationalDocs];
    }
  };

  // Get recommended document types based on listing type and category
  const getRecommendedDocuments = (category) => {
    const essentialDocs = [
      { type: 'business_registration', name: 'Business Registration Certificate' },
      { type: 'id_proof', name: 'Identity Proof' },
      { type: 'address_proof', name: 'Address Proof' }
    ];

    const financialDocs = [
      { type: 'financial_summary', name: 'Financial Summary' },
      { type: 'profit_loss', name: 'Profit & Loss Statement' },
      { type: 'balance_sheet', name: 'Balance Sheet' },
      { type: 'tax_returns', name: 'Tax Returns' }
    ];

    const operationalDocs = [
      { type: 'business_overview', name: 'Business Overview' },
      { type: 'inventory_list', name: 'Inventory List' },
      { type: 'equipment_list', name: 'Equipment List' },
      { type: 'operations_manual', name: 'Operations Manual' }
    ];

    let result = [];

    switch (listingType) {
      case ListingType.BUSINESS:
        if (category === 'essential') result = essentialDocs;
        if (category === 'financial') result = financialDocs;
        if (category === 'operational') result = operationalDocs;
        if (category === 'sale') {
          result = [
            { type: 'sale_memorandum', name: 'Sale Memorandum' },
            { type: 'asset_list', name: 'Asset List' },
            { type: 'lease_agreement', name: 'Lease Agreement' }
          ];
        }
        break;

      case ListingType.FRANCHISE:
        if (category === 'essential') result = essentialDocs;
        if (category === 'franchise') {
          result = [
            { type: 'franchise_disclosure', name: 'Franchise Disclosure Document (FDD)' },
            { type: 'franchise_agreement', name: 'Franchise Agreement Sample' },
            { type: 'brand_guidelines', name: 'Brand Guidelines' }
          ];
        }
        if (category === 'financial') {
          result = [
            { type: 'unit_economics', name: 'Unit Economics Model' },
            { type: 'investment_breakdown', name: 'Investment Breakdown' }
          ];
        }
        if (category === 'training') {
          result = [
            { type: 'training_overview', name: 'Training Program Overview' },
            { type: 'support_structure', name: 'Support Structure' },
            { type: 'marketing_materials', name: 'Marketing Materials' }
          ];
        }
        break;

      case ListingType.STARTUP:
        if (category === 'essential') result = essentialDocs;
        if (category === 'pitch') {
          result = [
            { type: 'pitch_deck', name: 'Pitch Deck' },
            { type: 'executive_summary', name: 'Executive Summary' },
            { type: 'business_plan', name: 'Business Plan' }
          ];
        }
        if (category === 'financial') {
          result = [
            { type: 'financial_projections', name: 'Financial Projections' },
            { type: 'cap_table', name: 'Cap Table' },
            { type: 'use_of_funds', name: 'Use of Funds' }
          ];
        }
        if (category === 'product') {
          result = [
            { type: 'product_demo', name: 'Product Demo' },
            { type: 'technical_architecture', name: 'Technical Architecture' },
            { type: 'product_roadmap', name: 'Product Roadmap' }
          ];
        }
        if (category === 'market') {
          result = [
            { type: 'market_research', name: 'Market Research' },
            { type: 'competitor_analysis', name: 'Competitor Analysis' },
            { type: 'traction_metrics', name: 'Traction Metrics' }
          ];
        }
        break;

      case ListingType.INVESTOR:
        if (category === 'essential') {
          result = [
            { type: 'investor_profile', name: 'Investor Profile' },
            { type: 'credentials', name: 'Credentials & Certifications' }
          ];
        }
        if (category === 'investment') {
          result = [
            { type: 'investment_thesis', name: 'Investment Thesis' },
            { type: 'investment_criteria', name: 'Investment Criteria' }
          ];
        }
        if (category === 'portfolio') {
          result = [
            { type: 'portfolio_summary', name: 'Portfolio Summary' },
            { type: 'case_studies', name: 'Success Case Studies' }
          ];
        }
        if (category === 'process') {
          result = [
            { type: 'due_diligence', name: 'Due Diligence Checklist' },
            { type: 'term_sheet', name: 'Term Sheet Template' },
            { type: 'investment_process', name: 'Investment Process' }
          ];
        }
        break;

      case ListingType.DIGITAL_ASSET:
        if (category === 'essential') {
          result = [
            { type: 'ownership_proof', name: 'Ownership Proof' },
            { type: 'asset_overview', name: 'Asset Overview' }
          ];
        }
        if (category === 'verification') {
          result = [
            { type: 'traffic_analytics', name: 'Traffic Analytics' },
            { type: 'revenue_proof', name: 'Revenue Proof' },
            { type: 'account_access', name: 'Account Access Details' }
          ];
        }
        if (category === 'financial') {
          result = [
            { type: 'revenue_breakdown', name: 'Revenue Breakdown' },
            { type: 'expense_report', name: 'Expense Report' }
          ];
        }
        if (category === 'technical') {
          result = [
            { type: 'technical_specs', name: 'Technical Specifications' },
            { type: 'codebase_overview', name: 'Codebase Overview' },
            { type: 'content_inventory', name: 'Content Inventory' }
          ];
        }
        break;

      default:
        result = [];
    }

    // Always add "Other" document type as the last option
    return [
      ...result,
      { type: 'other', name: 'Other Document' }
    ];
  };

  // Get icon for document type
  const getDocumentIcon = (format) => {
    if (format.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (format.includes('excel') || format.includes('spreadsheet') || format.includes('csv')) {
      return <FileText className="h-6 w-6 text-green-600" />;
    } else if (format.includes('word') || format.includes('document')) {
      return <FileText className="h-6 w-6 text-blue-600" />;
    } else if (format.includes('image')) {
      return <FileText className="h-6 w-6 text-purple-600" />;
    }
    return <File className="h-6 w-6 text-gray-500" />;
  };

  // Get formatted file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Replace a placeholder document
  const replacePlaceholderDocument = async (newDocument) => {
    if (!isReplacing || !replacingDocId) {
      return false;
    }

    const updatedDocs = uploadedDocuments.map(doc => {
      if (doc.id === replacingDocId) {
        return {
          ...newDocument,
          id: replacingDocId // Keep the original ID
        };
      }
      return doc;
    });

    setUploadedDocuments(updatedDocs);
    formPersistenceService.saveDocumentMetadata(formId, updatedDocs);

    // Reset replacement state
    setIsReplacing(false);
    setReplacingDocId(null);

    return true;
  };

  // Configure dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open
  } = useDropzone({
    onDrop: handleFiles,
    disabled: isLoading || !selectedDocType,
    maxSize: 20 * 1024 * 1024, // 20MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    noClick: true,
    noKeyboard: true
  });

  // Handle document type selection
  const handleDocumentTypeSelect = (type, name) => {
    setSelectedDocType(type);
    setShowUploadForm(true);

    // Scroll to upload form
    setTimeout(() => {
      if (uploadFormRef.current) {
        uploadFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Clear any replacing state if selecting a new document type
    if (!isReplacing) {
      setIsReplacing(false);
      setReplacingDocId(null);
    }
  };

  // Handle deletion of a document
  const handleDeleteDocument = async (id, name) => {
    // Always dismiss existing toasts first
    ToastManager.dismissAll();
    
    // Show loading toast
    const loadingToastId = ToastManager.loading(
      `Deleting document...`, 
      TOAST_IDS.LOADING
    );
    
    try {
      // Find the document
      const docToDelete = uploadedDocuments.find(doc => doc.id === id);

      if (!docToDelete) {
        console.warn("No document found with ID:", id);
        ToastManager.dismiss(loadingToastId);
        return;
      }

      // Delete from Firebase Storage if it has a path
      if (docToDelete.path && !docToDelete.isPlaceholder) {
        try {
          await enhancedStorage.deleteFile(docToDelete.path);
        } catch (storageError) {
          // Check if it's a "not found" error and log but continue
          if (storageError.code === 'storage/object-not-found') {
            console.log(`[DEBUG] Documents: File ${docToDelete.path} not found in storage, but continuing with document deletion`);
            // We can continue with document deletion even if the file doesn't exist
          } else {
            // For other storage errors, log but don't throw to allow document deletion to proceed
            console.error("Error deleting file from storage:", storageError);
          }
        }
      }

      // If it has a temp URL, revoke it
      if (docToDelete.tempUrl) {
        enhancedStorage.revokeTempUrl(docToDelete.id);
      }

      // Remove from uploadingFiles tracking if present
      if (uploadingFiles.has(id)) {
        const newUploadingFiles = new Map(uploadingFiles);
        newUploadingFiles.delete(id);
        setUploadingFiles(newUploadingFiles);
      }

      // Remove from state
      const newDocs = uploadedDocuments.filter(doc => doc.id !== id);
      setUploadedDocuments(newDocs);

      // Save to storage
      saveDocuments(newDocs);

      // Dismiss loading toast
      ToastManager.dismiss(loadingToastId);
      
      // Show success toast
      ToastManager.success(
        `Document "${name}" deleted`, 
        TOAST_IDS.DOCUMENT_DELETE_SUCCESS
      );
    } catch (error) {
      console.error("Error deleting document:", error);
      
      // Dismiss loading toast
      ToastManager.dismiss(loadingToastId);
      
      // Show error toast
      ToastManager.error(
        `Error deleting document: ${error.message}`, 
        TOAST_IDS.DOCUMENT_DELETE_ERROR
      );
    }
  };

  // Handle replacing a document
  const handleReplaceDocument = (id, type, name) => {
    // Always dismiss existing toasts first
    ToastManager.dismissAll();
    
    setIsReplacing(true);
    setReplacingDocId(id);
    setSelectedDocType(type);
    setShowUploadForm(true);

    // Scroll to upload form
    setTimeout(() => {
      if (uploadFormRef.current) {
        uploadFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Show toast message with instruction
        ToastManager.info(
          `Select a file to replace: ${name}`, 
          TOAST_IDS.DOCUMENT_REPLACE_INFO
        );
      }
    }, 100);
  };

  // Filter documents by category with robust error handling
  const filteredDocuments = uploadedDocuments.filter(doc => {
    // Check if document matches current category
    const matchesCategory = doc.category === activeCategory;
    return matchesCategory;
  });

  // Get progress color
  const getProgressColor = (progress) => {
    if (progress < 30) return 'bg-amber-500';
    if (progress < 70) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // Get verification status badge
  const getVerificationBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
            <BadgeCheck className="h-3 w-3 mr-1" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  // Document categories
  const documentCategories = getDocumentCategories();

  // Get document name from type for display
  const getDocumentTypeName = (type) => {
    const allCategories = documentCategories.map(category =>
      getRecommendedDocuments(category.id)
    ).flat();

    const docType = allCategories.find(doc => doc.type === type);
    return docType ? docType.name : 'Unknown Document Type';
  };

  // Find if a document type is already uploaded
  const isDocumentTypeUploaded = (type) => {
    return uploadedDocuments.some(doc =>
      doc.type === type &&
      doc.category === activeCategory &&
      !doc.isPlaceholder
    );
  };

  // Find if document type has a placeholder
  const hasPlaceholderDocument = (type) => {
    return uploadedDocuments.some(doc =>
      doc.isPlaceholder &&
      doc.type === type &&
      doc.category === activeCategory
    );
  };

  // Improved document status check function
  const isDocumentStuck = (doc) => {
    if (!doc.uploading || doc.completed) return false;
    
    const currentTime = new Date().getTime();
    // Check both tracking methods
    const uploadStartTime = uploadingFiles.get(doc.id) || doc.uploadStartTime;
    if (!uploadStartTime) return false;
    
    // Show as stuck after 10 seconds (before actually timing out) to give user early feedback
    return (currentTime - uploadStartTime > 10000); 
  };

  // Add the enhanced document status indicator component
  const DocumentStatusIndicator = ({ document }) => {
    const isStuck = isDocumentStuck(document);
    
    if (isStuck) {
  return (
        <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Upload stuck
        </span>
      );
    }
    
    if (document.uploading && !document.completed) {
      return (
        <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Uploading
        </span>
      );
    }
    
    if (document.error) {
      return (
        <span className="ml-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Upload failed
        </span>
      );
    }
    
    if (document.completed || (!document.uploading && !document.error)) {
      return (
        <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
          <Check className="h-3 w-3 mr-1" />
          Uploaded
        </span>
      );
    }
    
    return null;
  };

  // Periodically clean up stale upload states every 30 seconds after mount
  useEffect(() => {
    // Schedule a periodic cleanup
    const periodicCleanup = setInterval(() => {
      if (!isMounted.current) return;
      
      // Check if there are any active uploads according to state
      const hasActiveUploads = Object.keys(uploadProgress).length > 0 || isUploading;
      
      // Check if any documents are still marked as uploading
      const hasUploadingDocs = uploadedDocuments.some(doc => doc.uploading && !doc.completed);
      
      // If upload states are inconsistent, clean them up
      if ((hasActiveUploads && !hasUploadingDocs) || 
          (!hasActiveUploads && hasUploadingDocs) ||
          // Or if uploads have been "active" for too long (more than 5 minutes)
          (hasActiveUploads && Date.now() - lastUploadStartTime > 5 * 60 * 1000)) {
        // Clear upload progress
        setUploadProgress({});
        
        // Clear isUploading state
        setIsUploading(false);
        
        console.log('[Documents] Auto-cleaned stale upload states');
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(periodicCleanup);
  }, [uploadProgress, isUploading, uploadedDocuments]);

  // Document card with improved status indication for stuck uploads
  const renderDocumentCard = (document) => {
    const docName = document.name || 'Document';
    const docSize = formatFileSize(document.size);
    const isStuck = isDocumentStuck(document);
    const isPlaceholder = document.isPlaceholder;
    
    return (
      <div 
        id={`document-${document.id}`}
        className={`p-4 border rounded-md shadow-sm bg-white hover:bg-gray-50 transition-colors ${
          isStuck ? 'border-orange-300 bg-orange-50' :
          document.uploading && !document.completed ? 'border-blue-200' : 
          document.error ? 'border-red-200' : 
          isPlaceholder ? 'border-orange-200' : 
          'border-gray-200'
        }`}
      >
        <div className="flex items-start mb-2">
          <div className="flex-shrink-0 mr-3">
            {getDocumentIcon(document.format || document.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h3 className="text-sm font-medium text-gray-900 truncate mr-1">
                {docName}
              </h3>
              
              {/* Use the enhanced status indicator */}
              <DocumentStatusIndicator document={document} />
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <span className="truncate">{getDocumentTypeName(document.type)}</span>
              <span className="mx-1.5">•</span>
              <span>{docSize}</span>
            </div>
          </div>
        </div>
        
        {/* Show progress bar during upload */}
        {document.uploading && !document.completed && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={isStuck ? "text-orange-600 font-medium" : "text-gray-500"}>
                {isStuck ? "Upload appears stuck" : "Uploading..."}
              </span>
              <span className="text-gray-700 font-medium">
                {uploadProgress[document.name] || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${
                  isStuck ? "bg-orange-500" : 
                  getProgressColor(uploadProgress[document.name] || 0)
                }`} 
                style={{ width: `${uploadProgress[document.name] || 0}%` }}
              ></div>
            </div>
            
            {/* Add clear button for stuck uploads */}
            {isStuck && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Mark as failed and clear upload progress
                    setUploadedDocuments(prevDocs => {
                      const updatedDocs = prevDocs.map(doc => 
                        doc.id === document.id ? {
                          ...doc,
                          uploading: false,
                          error: "Upload cancelled",
                          isPlaceholder: true
                        } : doc
                      );
                      enhancedStorage.saveDocumentMetadata(updatedDocs, formId);
                      return updatedDocs;
                    });
                    
                    // Clear from upload progress
                    setUploadProgress(prev => {
                      const newProgress = { ...prev };
                      delete newProgress[document.name];
                      return newProgress;
                    });
                  }}
                  className="text-xs px-2 py-1 bg-white text-orange-600 hover:text-orange-800 border border-orange-200 rounded-md"
                >
                  Cancel upload
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs">
            {document.isPublic ? (
              <span className="inline-flex items-center text-green-600">
                <Eye className="h-3 w-3 mr-1" />
                Public
              </span>
            ) : (
              <span className="inline-flex items-center text-gray-500">
                <EyeOff className="h-3 w-3 mr-1" />
                Private
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            {/* Only show buttons for completed documents or placeholders */}
            {(!document.uploading || document.completed || isPlaceholder) && (
              <>
                {document.isPlaceholder ? (
                  <button
                    type="button"
                    onClick={() => handleDocumentTypeSelect(document.type, getDocumentTypeName(document.type))}
                    className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700"
                  >
                    <Upload className="h-3 w-3 mr-1 inline-block" />
                    Retry
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleReplaceDocument(document.id, document.type, docName)}
                    className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700"
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-3 w-3 mr-1 inline-block" />
                    Replace
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => handleDeleteDocument(document.id, docName)}
                  className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                  disabled={isLoading}
                >
                  <Trash2 className="h-3 w-3 mr-1 inline-block" />
                  Delete
                </button>
              </>
            )}
            
            {/* Show cancel button for in-progress uploads */}
            {document.uploading && !document.completed && (
              <button
                type="button"
                onClick={() => handleDeleteDocument(document.id, docName)}
                className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                disabled={isLoading}
              >
                <X className="h-3 w-3 mr-1 inline-block" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add a function to force cleanup of any stale uploads
  const forceCleanupStaleUploads = () => {
    // Clear upload progress
    setUploadProgress({});
    
    // Clear isUploading state
    setIsUploading(false);
    
    // Update any documents still showing as uploading
    setUploadedDocuments(prevDocs => {
      const updatedDocs = prevDocs.map(doc => {
        if (doc.uploading && !doc.completed) {
          return {
            ...doc,
            uploading: false,
            error: "Upload interrupted",
            isPlaceholder: true
          };
        }
        return doc;
      });
      
      // Save to storage if changes were made
      if (JSON.stringify(updatedDocs) !== JSON.stringify(prevDocs)) {
        enhancedStorage.saveDocumentMetadata(updatedDocs, formId);
      }
      
      return updatedDocs;
    });
    
    ToastManager.success(
      'Upload state cleared', 
      TOAST_IDS.GENERIC_SUCCESS
    );
  };

  // Sanitize document for Firestore storage - deep clean all undefined values
  const sanitizeDocumentForFirestore = (doc) => {
    console.log('[DEBUG] Sanitizing document for Firestore with category:', doc.category);
    
    // Handle null or undefined input
    if (!doc) {
      console.log('[DEBUG] Documents: Null document provided, creating empty object');
      return { 
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, 
        type: 'other', 
        name: 'Unnamed Document', 
        category: 'essential',
        createdAt: new Date().toISOString(),
        uploading: false,
        completed: true,
        isPublic: false,
        verificationStatus: 'pending',
        size: 0
      };
    }
    
    // Store original category for preservation
    const originalCategory = doc.category || 'other';
    console.log('[DEBUG] Original document category before cleaning:', originalCategory);
    
    // Function to recursively clean objects
    const cleanObject = (obj) => {
      // Handle non-objects
      if (!obj || typeof obj !== 'object') {
        return obj;
      }
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => typeof item === 'object' ? cleanObject(item) : item)
                  .filter(item => item !== undefined);
      }
      
      // Create a new clean object
      const cleaned = {};
      
      // Process each key
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          
          // Skip undefined values
          if (value === undefined) {
            console.log(`[DEBUG] Documents: Removing undefined value for key: ${key}`);
            continue;
          }
          
          // Handle nested objects (including arrays)
          if (value !== null && typeof value === 'object') {
            const cleanedValue = cleanObject(value);
            // Only add non-empty objects
            if (cleanedValue !== null && 
               (typeof cleanedValue !== 'object' || 
                Object.keys(cleanedValue).length > 0 || 
                Array.isArray(cleanedValue))) {
              cleaned[key] = cleanedValue;
            }
          } else {
            // For primitive values, add directly
            cleaned[key] = value;
          }
        }
      }
      
      return cleaned;
    };
    
    // Create a clean copy of the document
    let sanitized = cleanObject(doc);
    
    // Make sure we return at least an empty object
    if (!sanitized || typeof sanitized !== 'object') {
      sanitized = {};
    }
    
    // Make sure required fields are present with valid values (not undefined)
    if (!sanitized.id) {
      sanitized.id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      console.log('[DEBUG] Documents: Added missing id:', sanitized.id);
    } else if (typeof sanitized.id === 'string' && sanitized.id.length < 10) {
      // If ID is too short, append uniqueness to it
      sanitized.id = `${sanitized.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      console.log('[DEBUG] Documents: Enhanced existing id for uniqueness:', sanitized.id);
    }
    
    if (!sanitized.type) {
      sanitized.type = 'other';
      console.log('[DEBUG] Documents: Added missing type: other');
    }
    
    if (!sanitized.name) {
      sanitized.name = 'Unnamed Document';
      console.log('[DEBUG] Documents: Added missing name: Unnamed Document');
    }
    
    // Always ensure we keep the original category
    sanitized.category = originalCategory;
    console.log('[DEBUG] Documents: Restored original category:', originalCategory);
    
    // Ensure Date objects are converted to ISO strings
    if (sanitized.uploadedAt) {
      if (sanitized.uploadedAt instanceof Date) {
        sanitized.uploadedAt = sanitized.uploadedAt.toISOString();
      } else if (typeof sanitized.uploadedAt !== 'string') {
        sanitized.uploadedAt = new Date().toISOString();
      }
    } else {
      sanitized.uploadedAt = new Date().toISOString();
    }
    
    if (sanitized.createdAt) {
      if (sanitized.createdAt instanceof Date) {
        sanitized.createdAt = sanitized.createdAt.toISOString();
      } else if (typeof sanitized.createdAt !== 'string') {
        sanitized.createdAt = new Date().toISOString();
      }
    } else {
      sanitized.createdAt = new Date().toISOString();
    }
    
    // Format for Firestore - handle specific properties that might cause issues
    sanitized.format = sanitized.format || 'application/octet-stream';
    sanitized.size = typeof sanitized.size === 'number' ? sanitized.size : 0;
    sanitized.path = sanitized.path || '';
    sanitized.url = sanitized.url || '';
    
    // Make sure boolean properties are actual booleans
    sanitized.isPublic = sanitized.isPublic === true;
    sanitized.completed = sanitized.completed === true;
    sanitized.uploading = sanitized.uploading === true;
    sanitized.isPlaceholder = sanitized.isPlaceholder === true;
    
    // Ensure verification status is valid
    if (!['pending', 'verified', 'rejected'].includes(sanitized.verificationStatus)) {
      sanitized.verificationStatus = 'pending';
    }
    
    console.log('[DEBUG] Documents: Final sanitized document category:', sanitized.category);
    return sanitized;
  };

  // Save documents to localStorage and Firestore
  const saveDocuments = async (documents) => {
    console.log('[DEBUG] Documents: saveDocuments called with documents count:', documents?.length);
    
    try {
      if (!documents || !Array.isArray(documents)) {
        console.error('[DEBUG] Documents: Invalid documents data:', documents);
        return;
      }
      
      // Sanitize documents before saving - using our enhanced deep cleaner
      const sanitizedDocs = documents.map(sanitizeDocumentForFirestore);
      console.log('[DEBUG] Documents: All documents sanitized for storage');
      
      // First save to localStorage directly to ensure data is definitely stored
      try {
        const localStorageKey = `listing_form_documents_${formId || 'default'}`;
        const jsonData = JSON.stringify(sanitizedDocs);
        localStorage.setItem(localStorageKey, jsonData);
        console.log(`[DEBUG] Documents: Successfully saved directly to localStorage - ${jsonData.length} chars`);
        
        // Also use the storage service as a backup
        const storageResult = enhancedStorage.saveDocumentMetadata(sanitizedDocs, formId || 'default');
        console.log('[DEBUG] Documents: Storage service result:', storageResult);
      } catch (localStorageError) {
        console.error('[DEBUG] Documents: Error saving to localStorage:', localStorageError);
      }
      
      // Then save to Firestore if formId exists
      if (formId) {
        try {
          await enhancedStorage.saveDocumentsToFirestore(sanitizedDocs, formId);
          console.log('[DEBUG] Documents: Successfully saved to Firestore');
          
          // Verify documents are actually in Firestore 
          setTimeout(async () => {
            try {
              const firestoreDocs = await enhancedStorage.getDocumentsFromFirestore(formId || 'default');
              console.log('[DEBUG] Documents: Verification check - Firestore contains', 
                firestoreDocs?.length || 0, 'documents');
            } catch (error) {
              console.error('[DEBUG] Documents: Error verifying Firestore documents:', error);
            }
          }, 1000);
        } catch (firestoreError) {
          console.error('[DEBUG] Documents: Error saving to Firestore:', firestoreError);
          ToastManager.error(`Error saving documents: ${firestoreError.message}`);
        }
      } else {
        console.log('[DEBUG] Documents: No formId provided, skipping Firestore save');
      }
      
      // Call onChange with the sanitized documents
      if (typeof onChange === 'function') {
        const validDocs = sanitizedDocs.filter(doc => !doc.isPlaceholder && (!doc.uploading || doc.completed));
        console.log('[DEBUG] Documents: Calling onChange with valid documents count:', validDocs.length);
        onChange({ documents: validDocs });
      }
      
      return sanitizedDocs;
    } catch (error) {
      console.error('[DEBUG] Documents: General error in saveDocuments function:', error);
      ToastManager.error(`Error saving documents: ${error.message}`);
      return [];
    }
  };

  // Reload documents from localStorage and Firestore
  const reloadDocuments = useCallback(async () => {
    console.log('[DEBUG] Documents: Manually reloading documents for formId', formId);
    
    if (!formId) {
      console.log('[DEBUG] Documents: No formId provided, cannot reload');
      return;
    }
    
    // First try localStorage direct access
    try {
      const localStorageKey = `listing_form_documents_${formId || 'default'}`;
      const rawData = localStorage.getItem(localStorageKey);
      console.log('[DEBUG] Documents: Manual reload - localStorage check:', 
        rawData ? 'Data found' : 'No data found', 
        rawData ? `(${rawData.length} chars)` : '');
      
      if (rawData) {
        try {
          const parsedDocs = JSON.parse(rawData);
          console.log(`[DEBUG] Documents: Found ${parsedDocs.length} documents in localStorage during manual reload`);
          
          if (parsedDocs && Array.isArray(parsedDocs) && parsedDocs.length > 0) {
            // Process and set documents
            const processedDocs = parsedDocs.map(doc => ({
              ...doc,
              uploading: false,
              completed: true,
              verificationStatus: doc.verificationStatus || 'pending'
            }));
            
            setUploadedDocuments(processedDocs);
            
            // Call onChange
            if (typeof onChange === 'function') {
              onChange({ documents: processedDocs });
            }
            
            console.log('[DEBUG] Documents: Successfully restored documents from localStorage');
            return true;
          }
        } catch (parseError) {
          console.error('[DEBUG] Documents: Error parsing localStorage during manual reload:', parseError);
        }
      }
      
      // If localStorage fails, try Firestore
      console.log('[DEBUG] Documents: No valid localStorage data, trying Firestore...');
      const firestoreDocs = await enhancedStorage.getDocumentsFromFirestore(formId || 'default');
      
      if (firestoreDocs && Array.isArray(firestoreDocs) && firestoreDocs.length > 0) {
        console.log(`[DEBUG] Documents: Found ${firestoreDocs.length} documents in Firestore during manual reload`);
        
        // Process and update
        const processedDocs = firestoreDocs.map(doc => ({
          ...doc,
          uploading: false,
          completed: true,
          verificationStatus: doc.verificationStatus || 'pending'
        }));
        
        setUploadedDocuments(processedDocs);
        
        // Save to localStorage for next time
        const jsonData = JSON.stringify(processedDocs);
        localStorage.setItem(`listing_form_documents_${formId || 'default'}`, jsonData);
        
        // Call onChange
        if (typeof onChange === 'function') {
          onChange({ documents: processedDocs });
        }
        
        console.log('[DEBUG] Documents: Successfully restored documents from Firestore');
        return true;
      }
      
      console.log('[DEBUG] Documents: No documents found during manual reload');
      return false;
    } catch (error) {
      console.error('[DEBUG] Documents: Error during manual document reload:', error);
      return false;
    }
  }, [formId, onChange]);

  // Expose reload function to parent through ref if provided
  useEffect(() => {
    if (formId) {
      // Attach the reload function to the window for manual triggering if needed
      window.reloadDocumentsFor = window.reloadDocumentsFor || {};
      window.reloadDocumentsFor[formId] = reloadDocuments;
      
      // Cleanup
      return () => {
        if (window.reloadDocumentsFor && window.reloadDocumentsFor[formId]) {
          delete window.reloadDocumentsFor[formId];
        }
      };
    }
  }, [formId, reloadDocuments]);

  // Attempt to reload documents when returning to this component
  useEffect(() => {
    // This effect runs when the component becomes visible after being hidden
    const handleVisibilityChange = () => {
      if (!document.hidden && !isInitialLoadRef.current) {
        console.log('[DEBUG] Documents: Tab became visible, reloading documents');
        reloadDocuments();
      }
      isInitialLoadRef.current = false;
    };
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [reloadDocuments]);

  // Detect when the component becomes active in a multi-step form
  useEffect(() => {
    // Create a MutationObserver to detect when this component becomes visible
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check if our component's parent element style changed from display:none to block/flex
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' && 
            mutation.target.style.display !== 'none') {
          console.log('[DEBUG] Documents: Component became visible in form, reloading documents');
          // Component became visible, reload documents
          reloadDocuments();
        }
      }
    });

    // Start observing with a delay to ensure DOM is ready
    setTimeout(() => {
      const element = document.getElementById('form-step-documents');
      if (element) {
        observer.observe(element, { attributes: true, attributeFilter: ['style'] });
        console.log('[DEBUG] Documents: Started observing visibility changes');
      }
    }, 1000);

    // Clean up observer
    return () => {
      observer.disconnect();
    };
  }, [reloadDocuments]);

  // Also reload on parent data changes that might indicate step navigation
  useEffect(() => {
    // Use the ref defined at the component scope
    if (documents && documents.length === 0 && uploadedDocuments.length > 0 && !documentsHandled.current) {
      console.log('[DEBUG] Documents: Detected potential step change, documents array was cleared');
      // Mark as handled to prevent infinite loops
      documentsHandled.current = true;
      // This might indicate a step change - try reloading to get our documents back
      reloadDocuments();
      
      // Also explicitly call onChange to pass documents to parent
      if (typeof onChange === 'function' && uploadedDocuments.length > 0) {
        console.log('[DEBUG] Documents: Explicitly calling onChange with documents:', uploadedDocuments.length);
        onChange({ documents: uploadedDocuments });
      }
    }
    
    // Reset the handled flag if documents actually has content
    if (documents && documents.length > 0) {
      documentsHandled.current = false;
    }
    
    // Only include documents in dependency array, not uploadedDocuments.length
  }, [documents, reloadDocuments, onChange, uploadedDocuments]);

  return (
    <div className="grid grid-cols-1 gap-4 relative">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Supporting Documents</h2>
        <p className="text-sm text-gray-600">
          Add documents to verify your listing information and increase your credibility with potential buyers.
        </p>
      </div>

      {/* Re-upload Warning */}
      {needsReupload && (
        <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg animate-pulse">
          <div className="flex items-start">
            <RefreshCw className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0 animate-spin" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">Some documents need to be re-uploaded</p>
              <p>Due to page refresh, {uploadedDocuments.filter(doc => doc.isPlaceholder).length} document(s) need to be re-uploaded. Please click on the document type to restore them.</p>
            </div>
          </div>
        </div>
      )}

      {/* Display errors if any */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">The following issues were found:</p>
              <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Document tabs */}
      <div className="border-b border-gray-200 w-full">
        <nav className="-mb-px flex space-x-1 overflow-x-auto hide-scrollbar">
          {documentCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setSelectedDocType(null);
                setShowUploadForm(false);
              }}
              className={cn(
                "whitespace-nowrap py-3 px-4 text-sm font-medium border-b-2 focus:outline-none",
                activeCategory === category.id
                  ? "border-[#0031ac] text-[#0031ac]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {category.name}
              {uploadedDocuments.filter(doc => doc.category === category.id && !doc.isPlaceholder).length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                  {uploadedDocuments.filter(doc => doc.category === category.id && !doc.isPlaceholder).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Active category description and guidance */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              {documentCategories.find(cat => cat.id === activeCategory)?.name}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {documentCategories.find(cat => cat.id === activeCategory)?.description}.
              Click on a document below to upload it.
            </p>
          </div>
        </div>
      </div>

      {/* Main content container with fixed height */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative" style={{ minHeight: '400px', maxHeight: '90vh', overflow: 'visible' }}>
        {/* Left column: Recommended documents & form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended documents - Optimized for action */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-800 flex items-center">
                <FileText className="h-4 w-4 text-[#0031ac] mr-2" />
                Recommended Documents
              </h3>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getRecommendedDocuments(activeCategory).map((doc, index) => {
                  const isUploaded = isDocumentTypeUploaded(doc.type);
                  const count = getDocumentTypeCount(doc.type);
                  const hasPlaceholder = hasPlaceholderDocument(doc.type);

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start border rounded p-3 cursor-pointer transition-all duration-200",
                        hasPlaceholder
                          ? "bg-amber-50 border-amber-200" // Has placeholder
                          : isUploaded && doc.type !== 'other'
                            ? "bg-green-50 border-green-200" // Fully uploaded
                            : "bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                      )}
                      onClick={() => {
                        if (hasPlaceholder) {
                          // If has placeholder, start replacement process
                          const placeholder = uploadedDocuments.find(
                            d => d.isPlaceholder && d.type === doc.type && d.category === activeCategory
                          );
                          if (placeholder) {
                            handleReplaceDocument(placeholder.id, doc.type, doc.name);
                          }
                        } else if (isUploaded && doc.type !== 'other') {
                          // Find the document to highlight
                          const docToHighlight = uploadedDocuments.find(
                            d => d.type === doc.type && d.category === activeCategory && !d.isPlaceholder
                          );
                          if (docToHighlight) {
                            const docElement = document.getElementById(`document-${docToHighlight.id}`);
                            if (docElement) {
                              docElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              docElement.classList.add('bg-blue-50');
                              setTimeout(() => docElement.classList.remove('bg-blue-50'), 2000);
                            }
                          }
                        } else {
                          // Select document type to upload
                          handleDocumentTypeSelect(doc.type, doc.name);
                        }
                      }}
                    >
                      <FileText className={cn(
                        "h-5 w-5 mt-0.5 mr-3 flex-shrink-0",
                        hasPlaceholder ? "text-amber-600" :
                          (isUploaded && doc.type !== 'other') ? "text-green-600" : "text-[#0031ac]"
                      )} />
                      <div>
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                          {count > 0 && doc.type === 'other' && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {count}
                            </span>
                          )}
                          {hasPlaceholder && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center">
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Re-upload
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {hasPlaceholder ? (
                            <span className="text-amber-600 flex items-center">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Needs re-upload
                            </span>
                          ) : isUploaded && doc.type !== 'other' ? (
                            <span className="text-green-600 flex items-center">
                              <Check className="h-3 w-3 mr-1" />
                              Uploaded
                            </span>
                          ) : (
                            <span className="text-blue-600 flex items-center">
                              <FilePlus className="h-3 w-3 mr-1" />
                              {doc.type === 'other' && count > 0 ? 'Add another' : 'Upload now'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upload form - Only show when a type is selected */}
          {showUploadForm && (
            <div
              ref={uploadFormRef}
              id="upload-form"
              className="bg-white border border-[#0031ac] rounded-lg overflow-hidden shadow-md transition-all"
              style={{ position: 'relative', maxHeight: '600px' }}
            >
              <div className="p-4 bg-blue-50 border-b border-[#0031ac] flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#0031ac] flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  {isReplacing ? 'Replace' : 'Upload'}: {getDocumentTypeName(selectedDocType)}
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDocType(null);
                    setIsReplacing(false);
                    setReplacingDocId(null);
                    setNewDocDescription('');
                    setShowUploadForm(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close upload form"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
                <div className="space-y-4">
                  {/* Description field - For ALL document types, but only required for "Other" */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <label htmlFor="doc-description" className="block text-sm font-semibold text-gray-800 mr-2">
                        Document Description {selectedDocType === 'other' ? <span className="text-red-500">*</span> : <span className="text-gray-500">(Optional)</span>}
                      </label>
                      <Tooltip content="Add a description to help identify this document.">
                        <HelpCircle className="h-4 w-4 text-gray-500" />
                      </Tooltip>
                    </div>

                    <input
                      type="text"
                      id="doc-description"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                      placeholder={selectedDocType === 'other' ? "E.g., Employee Handbook" : "Add optional description"}
                      value={newDocDescription}
                      onChange={(e) => setNewDocDescription(e.target.value)}
                      required={selectedDocType === 'other'}
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      {selectedDocType === 'other'
                        ? "Please provide a clear description for this document."
                        : "A description helps buyers understand what's in the document."}
                    </p>
                  </div>

                  {/* Document visibility */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="doc-visibility"
                        className="h-4 w-4 text-[#0031ac] rounded border-gray-300 focus:ring-[#0031ac]"
                        checked={newDocVisibility}
                        onChange={(e) => setNewDocVisibility(e.target.checked)}
                      />
                      <label htmlFor="doc-visibility" className="ml-2 block text-sm font-medium text-gray-700">
                        Make document publicly visible to potential buyers
                      </label>
                      <Tooltip content="Public documents are visible to all users browsing your listing. Private documents are only shared with verified buyers after your approval.">
                        <HelpCircle className="h-4 w-4 text-gray-500 ml-2" />
                      </Tooltip>
                    </div>
                  </div>

                  {/* Upload area - maintain proper height even when error is visible */}
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-200 mt-4",
                      isDragActive ? "border-[#0031ac] bg-blue-50" : "border-[#0031ac] hover:bg-blue-50",
                      isDragAccept ? "border-green-500 bg-green-50" : "",
                      isDragReject ? "border-red-500 bg-red-50" : "",
                      (isLoading || (selectedDocType === 'other' && !newDocDescription)) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    )}
                    ref={dropzoneRef}
                    onClick={() => {
                      if (!(selectedDocType === 'other' && !newDocDescription) && !isLoading) {
                        open();
                      }
                    }}
                    style={{ minHeight: '160px' }}
                  >
                    <input {...getInputProps()} />

                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="bg-blue-100 rounded-full p-3 mb-4">
                        <FilePlus className="h-6 w-6 text-[#0031ac]" />
                      </div>

                      {isDragActive ? (
                        <p className="text-sm font-medium text-[#0031ac]">Drop the file here...</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {selectedDocType === 'other' && !newDocDescription ? (
                              <span className="text-red-600">Please provide a description first</span>
                            ) : (
                              <span>
                                {isReplacing ? 'Drop file to replace' : 'Drop file to upload'}, or
                                <button
                                  className="ml-1 text-[#0031ac] hover:text-blue-700 focus:outline-none underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!(selectedDocType === 'other' && !newDocDescription)) {
                                      open();
                                    }
                                  }}
                                  id="upload-button"
                                  disabled={selectedDocType === 'other' && !newDocDescription}
                                >
                                  browse files
                                </button>
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF, Word, Excel, CSV, images (max 20MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Uploaded documents list - improved mobile responsiveness */}
        <div className="lg:col-span-1">
          {/* Uploaded documents list */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 flex items-center justify-between">
                <span className="flex items-center">
                  <File className="h-4 w-4 text-[#0031ac] mr-2" />
                  Uploaded Documents ({filteredDocuments.filter(doc => !doc.isPlaceholder).length})
                </span>

                {!showUploadForm && (
                  <button
                    onClick={() => {
                      setSelectedDocType('other');
                      setShowUploadForm(true);
                      setTimeout(() => {
                        if (uploadFormRef.current) {
                          uploadFormRef.current.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                    className="text-xs flex items-center text-[#0031ac] hover:text-blue-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Other Document
                  </button>
                )}
              </h3>
            </div>

            {filteredDocuments.length > 0 ? (
              <div className="divide-y divide-gray-200 overflow-y-auto" style={{ maxHeight: showUploadForm ? '400px' : '600px' }}>
                {filteredDocuments.map((document) => (
                  <div key={document.id || `doc-${document.name}-${Date.now()}`}>
                    {renderDocumentCard(document)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 border border-gray-200 rounded-md bg-gray-50">
                <File className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">No documents in this category</p>
                <p className="text-xs text-gray-500">Click the upload button to add documents</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document requirements - Kept at the bottom as reference information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Document Requirements & Guidelines</p>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Supported file types: PDF, Word, Excel, CSV, Image files</li>
              <li>Maximum file size: 20MB per document</li>
              <li>All documents must be legible and complete</li>
              <li>Documents must be in English or include an English translation</li>
              <li>Sensitive information should be redacted as appropriate</li>
              <li>Verified documents receive higher credibility scores and improved listing visibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;