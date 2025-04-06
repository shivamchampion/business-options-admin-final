import React from 'react';
import { 
  File, FileText, Image, FileSpreadsheet, 
  FileCode, FileText as FilePdf, File as FilePresentation 
} from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import { getCategoryDisplayName } from './DocumentCategoryMapper';

/**
 * Document Card component for displaying document information
 * in a clean, professional card format with appropriate icons and tooltips.
 */
const DocumentCard = ({ document, index }) => {
  // Format document names properly
  const formatDocumentName = (name) => {
    if (!name) return 'Unnamed Document';
    
    // Remove file extensions for cleaner display
    let cleanName = name.replace(/\.[^/.]+$/, "");
    
    // Replace underscores and hyphens with spaces
    cleanName = cleanName.replace(/[_-]/g, " ");
    
    // Capitalize first letter of each word
    return cleanName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Get appropriate icon based on document type
  const getDocumentIcon = (doc) => {
    const type = doc.type?.toLowerCase() || '';
    const name = doc.name?.toLowerCase() || '';
    
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => name.endsWith(`.${ext}`))) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (type.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].some(ext => name.endsWith(`.${ext}`))) {
      return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
    } else if (type.includes('presentation') || ['ppt', 'pptx'].some(ext => name.endsWith(`.${ext}`))) {
      return <File className="h-4 w-4 text-orange-500" />;
    } else if (type.includes('code') || ['html', 'css', 'js', 'json', 'xml'].some(ext => name.endsWith(`.${ext}`))) {
      return <FileCode className="h-4 w-4 text-purple-500" />;
    } else if (type.includes('doc') || ['doc', 'docx', 'txt', 'rtf'].some(ext => name.endsWith(`.${ext}`))) {
      return <FileText className="h-4 w-4 text-blue-700" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get format badge style based on document type
  const getFormatBadgeStyle = (doc) => {
    const type = doc.type?.toLowerCase() || '';
    const name = doc.name?.toLowerCase() || '';
    
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return 'bg-red-100 text-red-800';
    } else if (type.includes('image')) {
      return 'bg-blue-100 text-blue-800';
    } else if (type.includes('spreadsheet')) {
      return 'bg-green-100 text-green-800';
    } else if (type.includes('presentation')) {
      return 'bg-orange-100 text-orange-800';
    } else if (type.includes('code')) {
      return 'bg-purple-100 text-purple-800';
    } else if (type.includes('doc')) {
      return 'bg-blue-100 text-blue-700';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get document format label
  const getFormatLabel = (doc) => {
    const type = doc.type?.toLowerCase() || '';
    const name = doc.name?.toLowerCase() || '';
    
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return 'PDF';
    } else if (type.includes('image')) {
      const ext = name.split('.').pop();
      return ext ? ext.toUpperCase() : 'Image';
    } else if (type.includes('spreadsheet')) {
      return 'Spreadsheet';
    } else if (type.includes('presentation')) {
      return 'Presentation';
    } else if (type.includes('doc')) {
      return 'Document';
    } else {
      return 'File';
    }
  };
  
  // Format document size
  const formatSize = (size) => {
    if (!size || size === 0) return '';
    const kb = size / 1024;
    if (kb < 1024) {
      return `${Math.round(kb)} KB`;
    } else {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
  };

  // Get formatted document name
  const formattedName = formatDocumentName(document.name);
  
  // Get file size if available
  const fileSize = formatSize(document.size);
  
  // Get document format
  const formatLabel = getFormatLabel(document);
  
  // Get document category display name
  const categoryName = getCategoryDisplayName(document.category);
  
  return (
    <div 
      className="border border-gray-200 rounded-md p-3 text-xs hover:shadow-sm transition-shadow bg-white flex flex-col"
      data-testid={`document-card-${index}`}
    >
      <div className="flex items-start space-x-2">
        {/* Document icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getDocumentIcon(document)}
        </div>
        
        {/* Document info */}
        <div className="flex-1 min-w-0">
          {/* Document name with tooltip for long names */}
          <Tooltip content={document.name} side="top">
            <h5 className="font-medium truncate" title={document.name}>
              {formattedName}
            </h5>
          </Tooltip>
          
          {/* Document description */}
          {document.description && document.description !== document.name && (
            <p className="text-gray-500 text-[10px] mt-0.5 line-clamp-2">
              {document.description}
            </p>
          )}
          
          {/* Document metadata */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {/* Format badge */}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getFormatBadgeStyle(document)}`}>
              {formatLabel}
            </span>
            
            {/* Size badge (if available) */}
            {fileSize && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {fileSize}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard; 