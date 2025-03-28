import React from 'react';
import { UserCheck, UserX, Trash, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface UserBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}

const UserBulkActions: React.FC<UserBulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onActivate,
  onDeactivate,
  onDelete
}) => {
  if (selectedCount === 0) return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 py-3 px-4 flex items-center space-x-4 z-20">
      <div className="flex items-center">
        <span className="font-medium text-gray-700">{selectedCount}</span>
        <span className="ml-1 text-gray-500">users selected</span>
        <button
          onClick={onClearSelection}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="h-6 border-l border-gray-200"></div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<UserCheck className="h-4 w-4" />}
          onClick={onActivate}
        >
          Activate
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          leftIcon={<UserX className="h-4 w-4" />}
          onClick={onDeactivate}
        >
          Deactivate
        </Button>
        
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Trash className="h-4 w-4" />}
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default UserBulkActions;