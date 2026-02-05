import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/jira/auth/validator';
import type { AuthMethod, Credentials } from '@/lib/jira/auth/types';

// POST - Test a connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jiraHost, authMethod, credentials } = body;

    if (!jiraHost || !authMethod || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields: jiraHost, authMethod, credentials' },
        { status: 400 }
      );
    }

    const result = await testConnection(
      jiraHost,
      authMethod as AuthMethod,
      credentials as Credentials
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
