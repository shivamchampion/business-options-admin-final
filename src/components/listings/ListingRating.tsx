import React from 'react';
import { Rating } from '@/types/listings';
import { CheckCircle, FileText, DollarSign, Users, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingRatingProps {
  rating?: Rating;
}

const ListingRating: React.FC<ListingRatingProps> = ({ rating }) => {
  if (!rating) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
        <Star className="h-10 w-10 mx-auto text-gray-400 mb-3" />
        <h4 className="text-gray-600 font-medium mb-1">No Rating Available</h4>
        <p className="text-sm text-gray-500">This listing does not have a system rating yet.</p>
      </div>
    );
  }
  
  // Get color for rating value
  const getRatingColor = (value: number) => {
    if (value >= 9) return 'text-green-600';
    if (value >= 7) return 'text-blue-600';
    if (value >= 5) return 'text-amber-600';
    if (value >= 3) return 'text-orange-600';
    return 'text-red-600';
  };
  
  // Get background color for rating value
  const getRatingBgColor = (value: number) => {
    if (value >= 9) return 'bg-green-100';
    if (value >= 7) return 'bg-blue-100';
    if (value >= 5) return 'bg-amber-100';
    if (value >= 3) return 'bg-orange-100';
    return 'bg-red-100';
  };
  
  // Get progress bar width and color
  const getProgressBar = (value: number) => {
    // Ensure value is between 0 and 10
    const normalizedValue = Math.max(0, Math.min(10, value));
    const percentage = (normalizedValue / 10) * 100;
    
    let bgColor = 'bg-gray-200';
    if (value >= 9) bgColor = 'bg-green-500';
    else if (value >= 7) bgColor = 'bg-blue-500';
    else if (value >= 5) bgColor = 'bg-amber-500';
    else if (value >= 3) bgColor = 'bg-orange-500';
    else bgColor = 'bg-red-500';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${bgColor} h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };
  
  // Format rating value to 1 decimal place
  const formatRating = (value: number) => {
    return Math.round(value * 10) / 10;
  };
  
  return (
    <div>
      {/* Main system rating */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center mb-2",
          getRatingBgColor(rating.systemRating)
        )}>
          <span className={cn(
            "text-3xl font-bold",
            getRatingColor(rating.systemRating)
          )}>
            {formatRating(rating.systemRating)}
          </span>
        </div>
        <div className="text-sm text-gray-600 mb-1">System Rating</div>
        <div className="text-xs text-gray-500">Scale of 0-10</div>
      </div>
      
      {/* Rating components */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-600 mb-3">Rating Components</h4>
        
        {/* Completeness */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
              <span>Completeness</span>
            </div>
            <span className={cn(
              "text-sm font-medium",
              getRatingColor(rating.ratingComponents.completeness)
            )}>
              {formatRating(rating.ratingComponents.completeness)}
            </span>
          </div>
          {getProgressBar(rating.ratingComponents.completeness)}
          <div className="text-xs text-gray-500">
            How complete the listing information is
          </div>
        </div>
        
        {/* Verification */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>Verification</span>
            </div>
            <span className={cn(
              "text-sm font-medium",
              getRatingColor(rating.ratingComponents.verification)
            )}>
              {formatRating(rating.ratingComponents.verification)}
            </span>
          </div>
          {getProgressBar(rating.ratingComponents.verification)}
          <div className="text-xs text-gray-500">
            Verification status of the listing
          </div>
        </div>
        
        {/* Documentation */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-700">
              <FileText className="h-4 w-4 text-purple-500 mr-2" />
              <span>Documentation</span>
            </div>
            <span className={cn(
              "text-sm font-medium",
              getRatingColor(rating.ratingComponents.documentation)
            )}>
              {formatRating(rating.ratingComponents.documentation)}
            </span>
          </div>
          {getProgressBar(rating.ratingComponents.documentation)}
          <div className="text-xs text-gray-500">
            Quality and completeness of supporting documents
          </div>
        </div>
        
        {/* Engagement */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-700">
              <Users className="h-4 w-4 text-amber-500 mr-2" />
              <span>Engagement</span>
            </div>
            <span className={cn(
              "text-sm font-medium",
              getRatingColor(rating.ratingComponents.engagement)
            )}>
              {formatRating(rating.ratingComponents.engagement)}
            </span>
          </div>
          {getProgressBar(rating.ratingComponents.engagement)}
          <div className="text-xs text-gray-500">
            Level of user interest and interaction
          </div>
        </div>
        
        {/* Longevity */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-700">
              <Clock className="h-4 w-4 text-indigo-500 mr-2" />
              <span>Longevity</span>
            </div>
            <span className={cn(
              "text-sm font-medium",
              getRatingColor(rating.ratingComponents.longevity)
            )}>
              {formatRating(rating.ratingComponents.longevity)}
            </span>
          </div>
          {getProgressBar(rating.ratingComponents.longevity)}
          <div className="text-xs text-gray-500">
            Time the listing has been active
          </div>
        </div>
        
        {/* Financials */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-700">
              <DollarSign className="h-4 w-4 text-emerald-500 mr-2" />
              <span>Financials</span>
            </div>
            <span className={cn(
              "text-sm font-medium",
              getRatingColor(rating.ratingComponents.financials)
            )}>
              {formatRating(rating.ratingComponents.financials)}
            </span>
          </div>
          {getProgressBar(rating.ratingComponents.financials)}
          <div className="text-xs text-gray-500">
            Financial transparency and reasonableness
          </div>
        </div>
      </div>
      
      {/* System rating explanation */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 italic">
          <p>
            System Rating is a composite score that measures the overall quality, 
            completeness, and transparency of the listing based on multiple factors. 
            Higher ratings typically indicate more comprehensive and verified listings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ListingRating;