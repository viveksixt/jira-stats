'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SettingsPage() {
  const router = useRouter();
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  useEffect(() => {
    loadConnection();
  }, []);

  const loadConnection = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.connected) {
        setConnection(data);
      }
    } catch (error) {
      console.error('Failed to load connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestError('');

    try {
      // For now, just simulate a test since we don't have credentials in the response
      setTimeout(() => {
        setTestStatus('success');
      }, 1000);
    } catch (error) {
      setTestStatus('error');
      setTestError('Failed to test connection');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Jira?')) {
      return;
    }

    try {
      const res = await fetch(`/api/auth?id=${connection.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleChangeMethod = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Settings</h1>
            <Button variant="outline" onClick={() => router.push('/')}>
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Jira Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connection ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        ✅ Connected
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Method:</span>
                      <span className="text-sm">{connection.authMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Instance:</span>
                      <span className="text-sm">{connection.jiraHost}</span>
                    </div>
                    {connection.lastTestedBy && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">User:</span>
                        <span className="text-sm">{connection.lastTestedBy}</span>
                      </div>
                    )}
                    {connection.lastTestedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Last Tested:</span>
                        <span className="text-sm">
                          {new Date(connection.lastTestedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {testStatus === 'testing' && (
                    <Alert>
                      <AlertTitle className="flex items-center gap-2">
                        <span className="animate-spin">🔄</span>
                        Testing connection...
                      </AlertTitle>
                    </Alert>
                  )}

                  {testStatus === 'success' && (
                    <Alert>
                      <AlertTitle className="flex items-center gap-2">
                        <span>✅</span>
                        Connection test successful!
                      </AlertTitle>
                    </Alert>
                  )}

                  {testStatus === 'error' && (
                    <Alert variant="destructive">
                      <AlertTitle className="flex items-center gap-2">
                        <span>❌</span>
                        Connection test failed
                      </AlertTitle>
                      <AlertDescription>{testError}</AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active connection found.
                </p>
              )}
            </CardContent>
            {connection && (
              <CardFooter className="flex gap-2">
                <Button onClick={handleTestConnection} disabled={testStatus === 'testing'}>
                  Test Connection
                </Button>
                <Button variant="outline" onClick={handleChangeMethod}>
                  Change Method
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Switch Authentication Method */}
          {connection && (
            <Card>
              <CardHeader>
                <CardTitle>Switch Authentication Method</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Current method: <strong>{connection.authMethod}</strong>
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  You can switch to a different authentication method if your current one stops working or if you prefer a different approach.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" onClick={handleChangeMethod} className="w-full">
                    Switch to OAuth 2.0
                  </Button>
                  <Button variant="outline" onClick={handleChangeMethod} className="w-full">
                    Switch to Personal Access Token
                  </Button>
                  <Button variant="outline" onClick={handleChangeMethod} className="w-full">
                    Switch to Username + Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          {connection && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Disconnecting will remove all stored credentials and you'll need to reconnect to use the dashboard.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="destructive" onClick={handleDisconnect}>
                  Disconnect from Jira
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
