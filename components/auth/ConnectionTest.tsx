'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ConnectionTestProps {
  status: 'idle' | 'testing' | 'success' | 'error';
  user?: {
    displayName: string;
    email: string;
  };
  error?: string;
}

export function ConnectionTest({ status, user, error }: ConnectionTestProps) {
  if (status === 'idle') return null;

  if (status === 'testing') {
    return (
      <Alert>
        <AlertTitle className="flex items-center gap-2">
          <span className="animate-spin">🔄</span>
          Testing connection...
        </AlertTitle>
        <AlertDescription>
          Please wait while we verify your credentials.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'success' && user) {
    return (
      <Alert>
        <AlertTitle className="flex items-center gap-2">
          <span>✅</span>
          Connection successful!
        </AlertTitle>
        <AlertDescription>
          Logged in as: {user.displayName} ({user.email})
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'error') {
    return (
      <Alert variant="destructive">
        <AlertTitle className="flex items-center gap-2">
          <span>❌</span>
          Connection failed
        </AlertTitle>
        <AlertDescription>
          {error || 'Unable to connect to Jira. Please check your credentials and try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
