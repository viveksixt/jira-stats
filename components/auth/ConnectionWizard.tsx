'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthMethodCard } from './AuthMethodCard';
import { ConnectionTest } from './ConnectionTest';

type Step = 'url' | 'method' | 'credentials';

interface AuthMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  recommended: boolean;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
  }>;
  helpUrl: string | null;
}

export function ConnectionWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('url');
  const [jiraHost, setJiraHost] = useState('');
  const [methods, setMethods] = useState<AuthMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testUser, setTestUser] = useState<any>(null);
  const [testError, setTestError] = useState<string>('');

  useEffect(() => {
    // Fetch available auth methods
    fetch('/api/auth/methods')
      .then(res => res.json())
      .then(data => setMethods(data.methods))
      .catch(console.error);
  }, []);

  const handleUrlSubmit = () => {
    if (jiraHost.trim()) {
      setStep('method');
    }
  };

  const handleMethodSelect = (methodId: string) => {
    const method = methods.find(m => m.id === methodId);
    if (method) {
      setSelectedMethod(method);
      setCredentials({});
      setStep('credentials');
    }
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestError('');
    setTestUser(null);

    try {
      const response = await fetch('/api/auth/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jiraHost,
          authMethod: selectedMethod?.id,
          credentials,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestStatus('success');
        setTestUser(result.user);
      } else {
        setTestStatus('error');
        setTestError(result.error || 'Connection failed');
      }
    } catch (error) {
      setTestStatus('error');
      setTestError('Network error. Please try again.');
    }
  };

  const handleSaveConnection = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jiraHost,
          authMethod: selectedMethod?.id,
          credentials,
          userEmail: testUser?.email || 'unknown',
        }),
      });

      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to save connection:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Step 1: Jira URL */}
        {step === 'url' && (
          <Card>
            <CardHeader>
              <CardTitle>Connect to Jira</CardTitle>
              <CardDescription>Step 1 of 3</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jiraHost">Enter your Jira instance URL:</Label>
                <Input
                  id="jiraHost"
                  placeholder="https://yourcompany.atlassian.net"
                  value={jiraHost}
                  onChange={(e) => setJiraHost(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
                <p className="text-sm text-muted-foreground">
                  ℹ️ For self-hosted: https://jira.yourcompany.com
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUrlSubmit} disabled={!jiraHost.trim()}>
                Continue
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Auth Method Selection */}
        {step === 'method' && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Authentication Method</CardTitle>
              <CardDescription>Step 2 of 3</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Select how you'd like to connect:
              </p>
              <div className="grid gap-4">
                {methods.map((method) => (
                  <AuthMethodCard
                    key={method.id}
                    {...method}
                    onSelect={handleMethodSelect}
                  />
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setStep('url')}>
                Back
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Credentials */}
        {step === 'credentials' && selectedMethod && (
          <Card>
            <CardHeader>
              <CardTitle>Configure {selectedMethod.name}</CardTitle>
              <CardDescription>Step 3 of 3</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedMethod.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}:</Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    required={field.required}
                    value={credentials[field.name] || ''}
                    onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                  />
                </div>
              ))}

              {selectedMethod.helpUrl && (
                <p className="text-sm text-muted-foreground">
                  📋 Generate token:{' '}
                  <a
                    href={selectedMethod.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {selectedMethod.helpUrl}
                  </a>
                </p>
              )}

              <ConnectionTest
                status={testStatus}
                user={testUser}
                error={testError}
              />
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('method')}>
                Back
              </Button>
              <Button
                onClick={handleTestConnection}
                disabled={testStatus === 'testing' || !Object.values(credentials).every(v => v)}
              >
                Test Connection
              </Button>
              {testStatus === 'success' && (
                <Button onClick={handleSaveConnection}>
                  Save & Continue to Dashboard
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
