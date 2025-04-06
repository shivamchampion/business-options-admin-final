# Form Persistence Service

The Form Persistence Service provides robust form state management with persistence across page refreshes, navigation, and browser sessions. It handles both form data and file uploads with Firebase Storage integration.

## Features

- **Form State Persistence**: Maintains form state across page refreshes, step changes, and navigation
- **File Storage**: Uses Firebase Storage for reliable cloud storage of images and documents
- **Data Compression**: Compresses form data to stay within localStorage limits
- **Automatic Backup**: Provides periodic form state backup
- **Error Handling**: Comprehensive error handling with user-friendly feedback
- **Progress Tracking**: Simulated upload progress for better UX
- **Cleanup Utilities**: Resource cleanup to prevent memory leaks

## Usage

### Basic Usage

```jsx
import formPersistence from '@/services/formPersistenceService';

// Save form data
formPersistence.saveFormData(data, formId);

// Load form data
const savedData = formPersistence.loadFormData(formId);

// Save/load current form step
formPersistence.saveStep(currentStep, formId);
const step = formPersistence.loadStep(formId);

// Clean up when form is submitted successfully
formPersistence.clearFormData(formId);
```

### File Upload

```jsx
// Upload a file
const fileMetadata = await formPersistence.uploadFile(
  file,
  'images', // or 'documents'
  formId,
  null, // optional file ID
  (progress) => console.log(`Upload progress: ${progress.progress}%`)
);

// Delete a file
await formPersistence.deleteFile(path);
```

### Image Management

```jsx
// Save image metadata
formPersistence.saveImages(images, formId);

// Load saved images
const savedImages = formPersistence.loadImages(formId);

// Save featured image index
formPersistence.saveFeaturedImage(index, formId);
```

### Document Management

```jsx
// Save document metadata
formPersistence.saveDocuments(documents, formId);

// Load saved documents
const savedDocuments = formPersistence.loadDocuments(formId);
```

### Automatic Backup

```jsx
// Start periodic backup with form data getter function
formPersistence.startPeriodicBackup(
  () => getValues(), // function to get current form data
  formId,
  30000 // backup interval in ms (default: 30000)
);

// Stop periodic backup (on form submit or unmount)
formPersistence.stopPeriodicBackup();
```

### Cleanup

```jsx
// Clean up resources on unmount
useEffect(() => {
  return () => {
    formPersistence.cleanup();
  };
}, []);
```

## Implementation Notes

- Uses LZ-String for data compression to handle larger form states
- Firebase Storage is used for file uploads with proper error handling
- All operations include error handling with user feedback via toast notifications
- Temporary object URLs are properly managed to prevent memory leaks
- Session IDs are used to prevent conflicts if multiple tabs are open 