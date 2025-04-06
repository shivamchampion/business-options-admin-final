import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ImageOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { ImageObject } from '@/types/listings';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: ImageObject[];
  fallbackImage?: string;
  className?: string;
  isOffline?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  images, 
  fallbackImage = '/placeholder-image.jpg',
  className,
  isOffline = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});
  const [isLoading, setIsLoading] = useState<{ [key: number]: boolean }>({});
  const [loadTimeouts, setLoadTimeouts] = useState<{ [key: number]: NodeJS.Timeout }>({});
  
  // Reset selected index when images change
  useEffect(() => {
    setSelectedIndex(0);
    setImageErrors({});
    setIsLoading({});
    
    // Clear all timeouts when images change
    Object.values(loadTimeouts).forEach(timeout => clearTimeout(timeout));
    setLoadTimeouts({});
  }, [images]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(loadTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [loadTimeouts]);
  
  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <ImageOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images available</p>
        </div>
      </div>
    );
  }
  
  const handlePrevImage = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNextImage = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  const openModal = (index: number) => {
    setModalIndex(index);
    setShowModal(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };
  
  const closeModal = () => {
    setShowModal(false);
    // Restore body scrolling
    document.body.style.overflow = 'auto';
  };
  
  const handleModalPrev = () => {
    setModalIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleModalNext = () => {
    setModalIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  const handleImageError = (index: number) => {
    // Clear any loading timeout for this image
    if (loadTimeouts[index]) {
      clearTimeout(loadTimeouts[index]);
      
      const newLoadTimeouts = {...loadTimeouts};
      delete newLoadTimeouts[index];
      setLoadTimeouts(newLoadTimeouts);
    }
    
    setIsLoading(prev => ({
      ...prev,
      [index]: false
    }));
    
    setImageErrors(prev => ({
      ...prev,
      [index]: true
    }));
  };
  
  const handleImageLoad = (index: number) => {
    // Clear any loading timeout for this image
    if (loadTimeouts[index]) {
      clearTimeout(loadTimeouts[index]);
      
      const newLoadTimeouts = {...loadTimeouts};
      delete newLoadTimeouts[index];
      setLoadTimeouts(newLoadTimeouts);
    }
    
    setIsLoading(prev => ({
      ...prev,
      [index]: false
    }));
  };
  
  const startImageLoad = (index: number) => {
    // Set loading state
    setIsLoading(prev => ({
      ...prev,
      [index]: true
    }));
    
    // Set a timeout to handle images that never trigger onLoad/onError
    const timeout = setTimeout(() => {
      if (isLoading[index]) {
        console.warn(`Image ${index} load timed out`);
        handleImageError(index);
      }
    }, 10000); // 10 second timeout
    
    setLoadTimeouts(prev => ({
      ...prev,
      [index]: timeout
    }));
  };
  
  const getImageUrl = (index: number) => {
    if (imageErrors[index] || isOffline) {
      return fallbackImage;
    }
    return images[index].url;
  };
  
  const retryImage = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setImageErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[index];
      return newErrors;
    });
    startImageLoad(index);
  };
  
  // Start loading the selected image
  useEffect(() => {
    if (!imageErrors[selectedIndex] && !isLoading[selectedIndex]) {
      startImageLoad(selectedIndex);
    }
  }, [selectedIndex]);
  
  return (
    <div className={className}>
      {/* Main image display */}
      <div className="relative mb-4">
        <div 
          className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center h-[400px] cursor-pointer relative"
          onClick={() => openModal(selectedIndex)}
        >
          {isLoading[selectedIndex] && !imageErrors[selectedIndex] && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                <p className="text-gray-500 text-sm">Loading image...</p>
              </div>
            </div>
          )}
          
          <img 
            src={getImageUrl(selectedIndex)} 
            alt={images[selectedIndex].alt || `Image ${selectedIndex + 1}`}
            className="max-h-full max-w-full object-contain"
            onError={() => handleImageError(selectedIndex)}
            onLoad={() => handleImageLoad(selectedIndex)}
            style={{ display: isLoading[selectedIndex] && !imageErrors[selectedIndex] ? 'none' : 'block' }}
          />
          
          {imageErrors[selectedIndex] && (
            <div className="absolute inset-0 flex items-center justify-center flex-col bg-gray-100 bg-opacity-80">
              <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
              <p className="text-gray-700 text-sm font-medium">Image failed to load</p>
              <p className="text-gray-500 text-xs mt-1 mb-3">This may be due to connection issues</p>
              <button 
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full text-xs flex items-center"
                onClick={(e) => retryImage(selectedIndex, e)}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </button>
            </div>
          )}
          
          <button
            className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              openModal(selectedIndex);
            }}
            aria-label="Zoom In"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>
        
        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors"
              onClick={handlePrevImage}
              aria-label="Previous Image"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors"
              onClick={handleNextImage}
              aria-label="Next Image"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {images.map((image, index) => (
            <div
              key={index}
              className={cn(
                "rounded-md overflow-hidden cursor-pointer border-2",
                selectedIndex === index
                  ? "border-[#0031ac]"
                  : "border-transparent hover:border-gray-300"
              )}
              onClick={() => setSelectedIndex(index)}
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
                {isLoading[index] && !imageErrors[index] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                  </div>
                )}
                
                <img
                  src={getImageUrl(index)}
                  alt={image.alt || `Thumbnail ${index + 1}`}
                  className="max-h-full max-w-full object-cover"
                  onError={() => handleImageError(index)}
                  onLoad={() => handleImageLoad(index)}
                  style={{ display: isLoading[index] && !imageErrors[index] ? 'none' : 'block' }}
                />
                {imageErrors[index] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-80">
                    <ImageOff className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Full-screen modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={closeModal}
            aria-label="Close"
          >
            <X className="h-8 w-8" />
          </button>
          
          <div className="w-full h-full flex items-center justify-center">
            {isLoading[modalIndex] && !imageErrors[modalIndex] && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="flex flex-col items-center">
                  <RefreshCw className="h-12 w-12 text-white animate-spin mb-3" />
                  <p className="text-gray-200 text-base">Loading image...</p>
                </div>
              </div>
            )}
            
            <img
              src={getImageUrl(modalIndex)}
              alt={images[modalIndex].alt || `Image ${modalIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain"
              onError={() => handleImageError(modalIndex)}
              onLoad={() => handleImageLoad(modalIndex)}
              style={{ display: isLoading[modalIndex] && !imageErrors[modalIndex] ? 'none' : 'block' }}
            />
            
            {imageErrors[modalIndex] && (
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
                <p className="text-white text-xl font-medium">Image failed to load</p>
                <p className="text-gray-300 mt-2 mb-4">This may be due to connection issues</p>
                <button 
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white flex items-center"
                  onClick={(e) => retryImage(modalIndex, e)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Loading
                </button>
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                onClick={handleModalPrev}
                aria-label="Previous Image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                onClick={handleModalNext}
                aria-label="Next Image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
                {modalIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;