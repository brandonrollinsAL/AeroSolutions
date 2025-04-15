import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 rounded-lg border border-red-200 bg-light-gray">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-red-600 mb-2">Something went wrong</h3>
              <p className="text-slate-600 mb-4">
                We encountered an error while rendering this component.
              </p>
              {this.state.error && (
                <div className="mb-4 p-3 bg-red-50 rounded border border-red-100 text-sm text-red-700 font-mono overflow-auto max-h-40">
                  {this.state.error.toString()}
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <Button onClick={this.handleRetry} className="bg-slate-blue hover:bg-slate-blue/90">
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;