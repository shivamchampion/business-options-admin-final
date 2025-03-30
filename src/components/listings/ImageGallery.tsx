import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { ImageObject } from '@/types/listings';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: ImageObject[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  
  // Reset selected index when images change
  useEffect(() => {
    setSelectedIndex(0);
  }, [images]);
  
  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
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
  
  return (
    <div>
      {/* Main image display */}
      <div className="relative mb-4">
        <div 
          className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center h-[400px] cursor-pointer relative"
          onClick={() => openModal(selectedIndex)}
        >
          <img 
            src={images[selectedIndex].url} 
            alt={images[selectedIndex].alt || `Image ${selectedIndex + 1}`}
            className="max-h-full max-w-full object-contain"
          />
          
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
              <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src={image.url}
                  alt={image.alt || `Thumbnail ${index + 1}`}
                  className="max-h-full max-w-full object-cover"
                />
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
            <img
              src={images[modalIndex].url}
              alt={images[modalIndex].alt || `Image ${modalIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain"
            />
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