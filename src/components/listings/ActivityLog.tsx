import React, { useState } from 'react';
import { StatusHistory as StatusHistoryType } from '@/types/listings';
import StatusHistory from './StatusHistory';
import { Calendar } from 'lucide-react';

interface ActivityLogProps {
  statusHistory: StatusHistoryType[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ statusHistory }) => {
  const [filter, setFilter] = useState<'all' | '30days' | '7days'>('all');
  
  const applyFilter = (history: StatusHistoryType[]) => {
    if (filter === 'all') return history;
    
    const now = new Date();
    const filterDays = filter === '30days' ? 30 : 7;
    const cutoffDate = new Date(now.setDate(now.getDate() - filterDays));
    
    return history.filter(item => new Date(item.timestamp) >= cutoffDate);
  };
  
  const filteredHistory = applyFilter(statusHistory);
  
  return (
    <div>
      {/* Filter controls */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
          Status History
        </h4>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Show:</span>
          <div className="flex rounded-md shadow-sm">
            <button
              className={`px-3 py-1 text-sm font-medium rounded-l-md ${
                filter === 'all'
                  ? 'bg-[#0031ac] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 border'
              }`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-3 py-1 text-sm font-medium ${
                filter === '30days'
                  ? 'bg-[#0031ac] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 border-y'
              }`}
              onClick={() => setFilter('30days')}
            >
              30 Days
            </button>
            <button
              className={`px-3 py-1 text-sm font-medium rounded-r-md ${
                filter === '7days'
                  ? 'bg-[#0031ac] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 border'
              }`}
              onClick={() => setFilter('7days')}
            >
              7 Days
            </button>
          </div>
        </div>
      </div>
      
      {/* Render filtered status history */}
      <StatusHistory statusHistory={filteredHistory} />
      
      {/* Show message if no history matches the filter */}
      {filteredHistory.length === 0 && statusHistory.length > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center mt-4">
          <div className="text-sm text-gray-600">
            No status changes in the selected time period.
          </div>
          <button
            className="mt-2 text-sm text-[#0031ac] font-medium hover:underline"
            onClick={() => setFilter('all')}
          >
            Show all history
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;