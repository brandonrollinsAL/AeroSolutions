import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Star, StarHalf, AlertTriangle } from 'lucide-react';

interface PostSentimentIndicatorProps {
  engagement?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PostSentimentIndicator({
  engagement,
  likes,
  comments,
  shares,
  size = 'md'
}: PostSentimentIndicatorProps) {
  // Default to neutral if no data is provided
  if (!engagement && !likes && !comments && !shares) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100">
                <Minus
                  className="h-3 w-3 text-gray-500"
                  strokeWidth={2}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>No engagement data available</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Calculate an engagement score if not provided directly
  let calculatedEngagement = engagement;
  if (!calculatedEngagement && (likes || comments || shares)) {
    const totalLikes = likes || 0;
    const totalComments = comments || 0;
    const totalShares = shares || 0;
    
    // Simple weighted formula - can be adjusted
    calculatedEngagement = (totalLikes * 1 + totalComments * 2 + totalShares * 3) / 100;
  }
  
  // Define sizing based on the size prop
  const sizeClasses = {
    sm: {
      container: 'h-4 w-4',
      icon: 'h-2.5 w-2.5'
    },
    md: {
      container: 'h-5 w-5',
      icon: 'h-3 w-3'
    },
    lg: {
      container: 'h-6 w-6',
      icon: 'h-4 w-4'
    }
  };
  
  // Determine sentiment level based on engagement
  let SentimentIcon = Minus;
  let iconColor = 'text-gray-500';
  let bgColor = 'bg-gray-100';
  let tooltipText = 'Average engagement';
  
  if (calculatedEngagement) {
    if (calculatedEngagement >= 0.2) {
      SentimentIcon = TrendingUp;
      iconColor = 'text-green-600';
      bgColor = 'bg-green-100';
      tooltipText = 'High engagement';
    } else if (calculatedEngagement >= 0.1) {
      SentimentIcon = StarHalf;
      iconColor = 'text-blue-600';
      bgColor = 'bg-blue-100';
      tooltipText = 'Good engagement';
    } else if (calculatedEngagement >= 0.05) {
      SentimentIcon = Minus;
      iconColor = 'text-amber-600';
      bgColor = 'bg-amber-100';
      tooltipText = 'Moderate engagement';
    } else if (calculatedEngagement >= 0.01) {
      SentimentIcon = AlertTriangle;
      iconColor = 'text-orange-600';
      bgColor = 'bg-orange-100';
      tooltipText = 'Low engagement';
    } else {
      SentimentIcon = AlertCircle;
      iconColor = 'text-red-600';
      bgColor = 'bg-red-100';
      tooltipText = 'Very low engagement';
    }
  }
  
  // Format as percentage
  const formattedEngagement = calculatedEngagement 
    ? `${(calculatedEngagement * 100).toFixed(1)}%` 
    : 'N/A';
  
  const containerSize = sizeClasses[size].container;
  const iconSize = sizeClasses[size].icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <div className={`flex ${containerSize} items-center justify-center rounded-full ${bgColor}`}>
              <SentimentIcon
                className={`${iconSize} ${iconColor}`}
                strokeWidth={2}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{tooltipText}</p>
            <p className="text-sm text-muted-foreground">Engagement rate: {formattedEngagement}</p>
            {likes !== undefined && <p className="text-xs">Likes: {likes}</p>}
            {comments !== undefined && <p className="text-xs">Comments: {comments}</p>}
            {shares !== undefined && <p className="text-xs">Shares: {shares}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Add default export to maintain compatibility with components that import this
export default PostSentimentIndicator;