import { NextResponse } from 'next/server';

// GET - List all available auth methods
export async function GET() {
  const methods = [
    {
      id: 'api-token',
      name: 'API Token',
      description: 'Email + API Token for Jira Cloud',
      icon: '🔑',
      recommended: true,
      fields: [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'apiToken', label: 'API Token', type: 'password', required: true },
      ],
      helpUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
    },
    {
      id: 'oauth',
      name: 'OAuth 2.0',
      description: 'Best for production, shared access',
      icon: '🔐',
      recommended: false,
      fields: [
        { name: 'clientId', label: 'Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      ],
      helpUrl: 'https://developer.atlassian.com/console/myapps/',
    },
    {
      id: 'pat',
      name: 'Personal Access Token',
      description: 'For Jira Server/Data Center',
      icon: '🎫',
      recommended: false,
      fields: [
        { name: 'token', label: 'Personal Access Token', type: 'password', required: true },
      ],
      helpUrl: null,
    },
    {
      id: 'basic-auth',
      name: 'Username + Password',
      description: 'Legacy method (may not work)',
      icon: '👤',
      recommended: false,
      fields: [
        { name: 'username', label: 'Username', type: 'text', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
      ],
      helpUrl: null,
    },
    {
      id: 'session-cookie',
      name: 'Session Cookie',
      description: 'Quick test (not recommended)',
      icon: '🍪',
      recommended: false,
      fields: [
        { name: 'sessionId', label: 'JSESSIONID', type: 'password', required: true },
      ],
      helpUrl: null,
    },
    {
      id: 'api-token-user',
      name: 'API Token + Username',
      description: 'For Jira Server with API tokens',
      icon: '🔑',
      recommended: false,
      fields: [
        { name: 'username', label: 'Username', type: 'text', required: true },
        { name: 'apiToken', label: 'API Token', type: 'password', required: true },
      ],
      helpUrl: null,
    },
  ];

  return NextResponse.json({ methods });
}
