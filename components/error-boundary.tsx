'use client';

import React, { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    // Log to error reporting service here
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm font-mono text-destructive/80 break-words">
                  {this.state.error?.message || 'An unknown error occurred'}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                We've encountered an unexpected error. Please try one of the following:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Refresh the page</li>
                <li>Check your internet connection</li>
                <li>Clear browser cache</li>
                <li>Try again in a few moments</li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
