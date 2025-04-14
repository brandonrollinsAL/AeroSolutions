import React from 'react';
import { AlertCircle, AlertTriangle, Info, HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';

export interface ErrorDetails {
  errorCode: string;
  errorMessage: string;
  userFriendlyMessage: string;
  troubleshootingSteps: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  potentialCauses: string[];
}

interface ErrorHandlerProps {
  error: Error | null;
  context?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  context,
  onDismiss,
  onRetry,
  showDetails = false
}) => {
  const { t } = useTranslation();
  const [errorDetails, setErrorDetails] = React.useState<ErrorDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (error) {
      fetchErrorDetails();
    } else {
      setErrorDetails(null);
    }
  }, [error, context]);

  const fetchErrorDetails = async () => {
    if (!error) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/errors/analyze', {
        error: error.message || String(error),
        stack: error.stack,
        context
      });
      
      const data = await response.json();
      setErrorDetails(data);
    } catch (err) {
      console.error('Failed to fetch error details:', err);
      // Create a fallback error response
      setErrorDetails({
        errorCode: 'ERR_UNKNOWN',
        errorMessage: error.message || String(error),
        userFriendlyMessage: t('errors.somethingWentWrong'),
        troubleshootingSteps: [
          t('errors.troubleshooting.refresh'),
          t('errors.troubleshooting.checkInternet'),
          t('errors.troubleshooting.tryLater')
        ],
        severity: 'medium',
        potentialCauses: [t('errors.causes.temporaryIssue')]
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!error || !errorDetails) {
    return null;
  }

  const severityIcon = () => {
    switch (errorDetails.severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/10 shadow-md mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {severityIcon()}
            <CardTitle>{t('errors.errorOccurred')}</CardTitle>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="icon" onClick={onDismiss}>
              <X className="h-4 w-4" />
              <span className="sr-only">{t('common.close')}</span>
            </Button>
          )}
        </div>
        <CardDescription>{errorDetails.userFriendlyMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="troubleshooting">
            <AccordionTrigger>
              {t('errors.troubleshootingSteps')}
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1">
                {errorDetails.troubleshootingSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          {showDetails && (
            <AccordionItem value="technical">
              <AccordionTrigger>
                {t('errors.technicalDetails')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto">
                  <p><strong>{t('errors.code')}:</strong> {errorDetails.errorCode}</p>
                  <p><strong>{t('errors.message')}:</strong> {errorDetails.errorMessage}</p>
                  <p><strong>{t('errors.possibleCauses')}:</strong></p>
                  <ul className="list-disc pl-5">
                    {errorDetails.potentialCauses.map((cause, index) => (
                      <li key={index}>{cause}</li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
      {onRetry && (
        <CardFooter className="pt-0">
          <Button onClick={onRetry} disabled={isLoading}>
            {isLoading ? t('common.loading') : t('errors.tryAgain')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

// Global error boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorHandler error={this.state.error} showDetails={true} />;
    }

    return this.props.children;
  }
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  const [context, setContext] = React.useState<string | undefined>(undefined);

  const handleError = React.useCallback((error: Error | unknown, context?: string) => {
    if (error instanceof Error) {
      setError(error);
    } else {
      setError(new Error(String(error)));
    }
    
    if (context) {
      setContext(context);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setContext(undefined);
  }, []);

  return {
    error,
    context,
    handleError,
    clearError,
    ErrorDisplay: error ? (
      <ErrorHandler 
        error={error} 
        context={context} 
        onDismiss={clearError} 
        onRetry={clearError} 
      />
    ) : null
  };
}