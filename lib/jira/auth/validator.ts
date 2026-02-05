import type { AuthMethod, Credentials, ConnectionTestResult } from './types';
import { AuthManager } from './index';

export async function testConnection(
  jiraHost: string,
  authMethod: AuthMethod,
  credentials: Credentials
): Promise<ConnectionTestResult> {
  try {
    // Validate credentials format
    if (!AuthManager.validateCredentials(authMethod, credentials)) {
      return {
        success: false,
        error: 'Invalid credentials format',
      };
    }

    // Create auth manager
    const authManager = new AuthManager(authMethod, credentials, jiraHost);
    const headers = authManager.getHeaders();

    // Normalize Jira host
    const baseUrl = jiraHost.startsWith('http') 
      ? jiraHost 
      : `https://${jiraHost}`;

    // Test connection by fetching current user
    const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Authentication failed: ${response.status} ${response.statusText}. ${errorText}`,
      };
    }

    const user = await response.json();

    return {
      success: true,
      user: {
        accountId: user.accountId,
        email: user.emailAddress || user.name,
        displayName: user.displayName,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
