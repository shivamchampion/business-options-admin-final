import React, { useState } from 'react';
import { File, FileText, Download, Eye, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { DocumentObject } from '@/types/listings';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface DocumentListProps {
  documents: DocumentObject[];
}

const DocumentList: React.FC<DocumentListProps> = ({ documents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDocument, setPreviewDocument] = useState<DocumentObject | null>(null);
  
  if (!documents || documents.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
        <FileText className="h-10 w-10 mx-auto text-gray-400 mb-3" />
        <h4 className="text-gray-600 font-medium mb-1">No Documents Available</h4>
        <p className="text-sm text-gray-500">This listing does not have any documents uploaded.</p>
      </div>
    );
  }
  
  // Filter documents by search term
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Group documents by type
  const documentsByType: Record<string, DocumentObject[]> = {};
  
  filteredDocuments.forEach(doc => {
    if (!documentsByType[doc.type]) {
      documentsByType[doc.type] = [];
    }
    documentsByType[doc.type].push(doc);
  });
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="badge badge-success flex items-center text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="badge badge-danger flex items-center text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="badge badge-warning flex items-center text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
    }
  };
  
  // Get icon for document type
  const getDocumentIcon = (format: string) => {
    if (format.includes('pdf')) {
      return <File className="h-8 w-8 text-red-500" />;
    } else if (format.includes('word') || format.includes('doc')) {
      return <File className="h-8 w-8 text-blue-500" />;
    } else if (format.includes('sheet') || format.includes('excel') || format.includes('csv')) {
      return <File className="h-8 w-8 text-green-500" />;
    } else if (format.includes('image') || format.includes('png') || format.includes('jpg') || format.includes('jpeg')) {
      return <File className="h-8 w-8 text-purple-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };
  
  return (
    <div>
      {/* Search input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search documents by name or type..."
          className="pl-10 pr-4 py-2 w-full form-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Display message if no documents match the search */}
      {filteredDocuments.length === 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
          <Search className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <h4 className="text-gray-600 font-medium mb-1">No Documents Found</h4>
          <p className="text-sm text-gray-500">No documents match your search criteria. Try different keywords.</p>
        </div>
      )}
      
      {/* Documents list by type */}
      {Object.keys(documentsByType).map(type => (
        <div key={type} className="mb-8">
          <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-gray-500" />
            {type}
            <span className="ml-2 text-sm text-gray-500 font-normal">
              ({documentsByType[type].length} document{documentsByType[type].length !== 1 ? 's' : ''})
            </span>
          </h3>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documentsByType[type].map((doc) => (
                    <tr key={doc.id} className="table-row-hover">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                            {getDocumentIcon(doc.format)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {doc.name}
                            </div>
                            {doc.description && (
                              <div className="text-xs text-gray-500 max-w-xs truncate">
                                {doc.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatFileSize(doc.size)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(doc.uploadedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(doc.verificationStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye className="h-4 w-4" />}
                            onClick={() => setPreviewDocument(doc)}
                          >
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Download className="h-4 w-4" />}
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
      
      {/* Document preview modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Document Preview</h3>
                <p className="text-sm text-gray-500">{previewDocument.name}</p>
              </div>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => window.open(previewDocument.url, '_blank')}
                  className="mr-2"
                >
                  Download
                </Button>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setPreviewDocument(null)}
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Modal body */}
            <div className="flex-1 overflow-auto p-4">
              {previewDocument.format.includes('pdf') ? (
                <iframe
                  src={`${previewDocument.url}#toolbar=0`}
                  className="w-full h-full min-h-[400px] border border-gray-200 rounded"
                  title={previewDocument.name}
                ></iframe>
              ) : previewDocument.format.includes('image') ? (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={previewDocument.url}
                    alt={previewDocument.name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="mb-4">
                    {getDocumentIcon(previewDocument.format)}
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{previewDocument.name}</h4>
                  <p className="text-gray-500 mb-4">
                    This file type cannot be previewed directly. Please download the file to view its contents.
                  </p>
                  <Button
                    variant="primary"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => window.open(previewDocument.url, '_blank')}
                  >
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;