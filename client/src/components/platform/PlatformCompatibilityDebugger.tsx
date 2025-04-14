import React, { useEffect, useState } from 'react';
import { usePlatformCompatibility } from './PlatformCompatibilityProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PlatformCompatibilityDebugger = () => {
  const { 
    platform, 
    platformIssues, 
    isAnalyzing, 
    lastAnalyzed, 
    analyzePlatformIssues,
    getSolutionForComponent
  } = usePlatformCompatibility();
  
  const [testError, setTestError] = useState<Error | null>(null);
  
  // Log platform details on mount
  useEffect(() => {
    console.log('Platform detected:', platform);
  }, [platform]);
  
  // Trigger a test error to demonstrate error logging
  const triggerTestError = () => {
    try {
      // This will cause an error that gets logged to our platform
      throw new Error('This is a test error for platform compatibility testing');
    } catch (err) {
      platform.handleComponentError(err as Error, 'PlatformCompatibilityDebugger');
      setTestError(err as Error);
      setTimeout(() => setTestError(null), 3000);
    }
  };
  
  // Format the date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };
  
  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Platform Compatibility
          <Badge variant={platform.isTouch ? 'default' : 'outline'}>
            {platform.isTouch ? 'Touch Device' : 'Non-Touch Device'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Detected: {platform.type} {platform.os} {platform.browser}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">Platform Details</h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <span className="font-medium">Type:</span> {platform.type}
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">OS:</span> {platform.os || 'Unknown'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">Browser:</span> {platform.browser || 'Unknown'} {platform.version || ''}
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">Viewport:</span> {platform.viewportWidth}×{platform.viewportHeight}
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">Pixel Ratio:</span> {platform.devicePixelRatio}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Device Classification</h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <span className="font-medium">Mobile:</span> {platform.isMobile ? 'Yes' : 'No'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">Tablet:</span> {platform.isTablet ? 'Yes' : 'No'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">Desktop:</span> {platform.isDesktop ? 'Yes' : 'No'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">Touch:</span> {platform.isTouch ? 'Yes' : 'No'}
                </li>
              </ul>
            </div>
          </div>
          
          {testError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Test Error Generated</AlertTitle>
              <AlertDescription>
                {testError.message}
              </AlertDescription>
            </Alert>
          )}
          
          {platformIssues.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Detected Platform Issues</h4>
              {platformIssues.map((issue, index) => (
                <Alert 
                  key={index} 
                  variant={issue.priority === 'high' ? 'destructive' : 'default'}
                  className="mb-2"
                >
                  <div className="flex items-start">
                    {issue.priority === 'high' ? (
                      <AlertTriangle className="h-4 w-4 mr-2 mt-0.5" />
                    ) : issue.priority === 'medium' ? (
                      <Info className="h-4 w-4 mr-2 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5" />
                    )}
                    <div>
                      <AlertTitle className="mb-1">
                        {issue.issueType} Issue on {issue.platform}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {issue.occurrences} {issue.occurrences === 1 ? 'occurrence' : 'occurrences'}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="text-sm">
                        <p className="mb-1">{issue.description}</p>
                        <details className="text-xs mt-1">
                          <summary className="cursor-pointer font-medium">Recommended Fix</summary>
                          <p className="mt-1 whitespace-pre-line">{issue.recommendedFix}</p>
                        </details>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-4">
        <div className="text-xs text-muted-foreground">
          Last analyzed: {formatDate(lastAnalyzed)}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={triggerTestError}
            disabled={!!testError}
          >
            Generate Test Error
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={analyzePlatformIssues}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Analyze Platform Issues
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PlatformCompatibilityDebugger;