import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { FaSmile, FaMeh, FaFrown, FaInfoCircle } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';

interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  key_emotional_phrases: string[];
  tone_analysis: string;
  topic_sentiment: Record<string, 'positive' | 'neutral' | 'negative'>;
}

interface SentimentResponse {
  success: boolean;
  postId: string;
  title: string;
  sentimentAnalysis: SentimentAnalysis;
  timestamp: string;
}

interface PostSentimentIndicatorProps {
  postId: number;
  customLabel?: string;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PostSentimentIndicator = ({ 
  postId, 
  customLabel = 'Sentiment:', 
  showScore = false,
  size = 'md'
}: PostSentimentIndicatorProps) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  const iconSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const { data, isLoading, error, isError } = useQuery({
    queryKey: [`/api/content/post-sentiment/${postId}`],
    enabled: !!postId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <span className={`font-medium ${sizeClasses[size]}`}>{customLabel}</span>
        <Skeleton className="h-5 w-20" />
      </div>
    );
  }

  if (isError || !data?.success) {
    return null; // Don't show anything if there's an error
  }

  const { sentimentAnalysis } = data as SentimentResponse;
  const { overall_sentiment, sentiment_score, key_emotional_phrases, tone_analysis } = sentimentAnalysis;

  // Use sentiment score to calculate a color gradient
  const getColorFromScore = (score: number) => {
    // Red for negative, yellow for neutral, green for positive
    if (score <= -0.5) return 'text-red-500';
    if (score < 0) return 'text-red-400';
    if (score < 0.2) return 'text-amber-400';
    if (score < 0.5) return 'text-green-400';
    return 'text-green-500';
  };

  const getSentimentIcon = (sentiment: string, className: string) => {
    switch (sentiment) {
      case 'positive':
        return <FaSmile className={className} />;
      case 'neutral':
        return <FaMeh className={className} />;
      case 'negative':
        return <FaFrown className={className} />;
      default:
        return <FaInfoCircle className={className} />;
    }
  };

  const scoreColor = getColorFromScore(sentiment_score);
  const normalizedScore = Math.round((sentiment_score + 1) * 50); // Convert -1 to 1 scale to 0 to 100

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2 cursor-help">
            <span className={`font-medium ${sizeClasses[size]}`}>{customLabel}</span>
            <span className={`flex items-center ${scoreColor}`}>
              {getSentimentIcon(overall_sentiment, iconSizes[size])}
              {showScore && (
                <span className="ml-1 font-semibold">
                  {normalizedScore}%
                </span>
              )}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2">
            <p className="font-semibold">Content Sentiment Analysis</p>
            <p className="text-sm">
              <span className="font-medium">Tone:</span> {tone_analysis}
            </p>
            {key_emotional_phrases.length > 0 && (
              <div className="text-sm">
                <p className="font-medium mb-1">Key phrases:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {key_emotional_phrases.slice(0, 3).map((phrase, idx) => (
                    <li key={idx} className="text-xs">{phrase}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className={`h-1.5 rounded-full ${scoreColor.replace('text-', 'bg-')}`}
                style={{ width: `${normalizedScore}%` }}
              ></div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PostSentimentIndicator;