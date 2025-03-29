import React from 'react';
import { X, Trash, CheckCircle, XCircle, Clock, Star, FileArchive, BadgeCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ListingStatus } from '@/types/listings';
import { cn } from '@/lib/utils';

interface ListingBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onStatusChange: (status: ListingStatus) => void;
  onDelete: () => void;
  onFeature?: () => void;
  onUnfeature?: () => void;
  onVerify?: () => void;
}

const ListingBulkActions: React.FC<ListingBulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onStatusChange,
  onDelete,
  onFeature,
  onUnfeature,
  onVerify
}) => {
  if (selectedCount === 0) return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 py-3 px-4 flex items-center space-x-2 md:space-x-4 z-20 overflow-x-auto max-w-[calc(100vw-2rem)]">
      <div className="flex items-center whitespace-nowrap">
        <span className="font-medium text-gray-700">{selectedCount}</span>
        <span className="ml-1 text-gray-500">listings selected</span>
        <button
          onClick={onClearSelection}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="h-6 border-l border-gray-200 hidden sm:block"></div>
      
      <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<CheckCircle className="h-4 w-4 text-green-500" />}
          onClick={() => onStatusChange(ListingStatus.PUBLISHED)}
          className="whitespace-nowrap"
        >
          Publish
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Clock className="h-4 w-4 text-amber-500" />}
          onClick={() => onStatusChange(ListingStatus.PENDING)}
          className="whitespace-nowrap"
        >
          Mark Pending
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          leftIcon={<XCircle className="h-4 w-4 text-red-500" />}
          onClick={() => onStatusChange(ListingStatus.REJECTED)}
          className="whitespace-nowrap"
        >
          Reject
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          leftIcon={<FileArchive className="h-4 w-4 text-gray-500" />}
          onClick={() => onStatusChange(ListingStatus.ARCHIVED)}
          className="whitespace-nowrap"
        >
          Archive
        </Button>
        
        {onVerify && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BadgeCheck className="h-4 w-4 text-green-500" />}
            onClick={onVerify}
            className="whitespace-nowrap"
          >
            Verify
          </Button>
        )}
        
        {onFeature && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Star className="h-4 w-4 text-amber-500" />}
            onClick={onFeature}
            className="whitespace-nowrap"
          >
            Feature
          </Button>
        )}
        
        {onUnfeature && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Star className="h-4 w-4 text-gray-400" />}
            onClick={onUnfeature}
            className="whitespace-nowrap"
          >
            Unfeature
          </Button>
        )}
        
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Trash className="h-4 w-4" />}
          onClick={onDelete}
          className="whitespace-nowrap"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default ListingBulkActions;