import React from 'react';
import { CheckCircle, XCircle, Clock, FileDown, AlertCircle } from 'lucide-react';
import { StatusHistory as StatusHistoryType } from '@/types/listings';
import { formatDate } from '@/lib/utils';

interface StatusHistoryProps {
  statusHistory: StatusHistoryType[];
}

const StatusHistory: React.FC<StatusHistoryProps> = ({ statusHistory }) => {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
        <Clock className="h-10 w-10 mx-auto text-gray-400 mb-3" />
        <h4 className="text-gray-600 font-medium mb-1">No Status History</h4>
        <p className="text-sm text-gray-500">This listing doesn't have any status changes recorded.</p>
      </div>
    );
  }
  
  // Sort history by timestamp (newest first)
  const sortedHistory = [...statusHistory].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Get icon for status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-amber-500" />;
      case 'draft':
        return <Clock className="h-6 w-6 text-gray-500" />;
      case 'archived':
        return <FileDown className="h-6 w-6 text-gray-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-500" />;
    }
  };
  
  // Format status label
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  return (
    <div className="space-y-8">
      <div className="flow-root">
        <ul className="-mb-8">
          {sortedHistory.map((event, index) => (
            <li key={index}>
              <div className="relative pb-8">
                {index !== sortedHistory.length - 1 ? (
                  <span
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  ></span>
                ) : null}
                
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center ring-8 ring-white">
                      {getStatusIcon(event.status)}
                    </div>
                  </div>
                  
                  <div className="min-w-0 flex-1 py-1.5">
                    <div className="text-sm text-gray-500 mb-0.5">
                      Status changed to{' '}
                      <span className="font-medium text-gray-900">
                        {formatStatus(event.status)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {formatDate(event.timestamp)}
                    </div>
                    
                    {event.updatedBy && (
                      <div className="text-xs text-gray-500">
                        By: {event.updatedBy}
                      </div>
                    )}
                    
                    {event.reason && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{event.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StatusHistory;