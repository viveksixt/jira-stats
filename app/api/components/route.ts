import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';

export async function GET(request: NextRequest) {
  try {
    const connection = await getActiveConnection();
    
    if (!connection) {
      return NextResponse.json(
        { error: 'No active Jira connection' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectKey = searchParams.get('projectKey');

    if (!projectKey) {
      return NextResponse.json(
        { error: 'projectKey parameter required' },
        { status: 400 }
      );
    }

    const client = new JiraClient(
      connection.jiraHost,
      connection.authMethod,
      connection.credentials
    );

    // Get project components
    const components = await client.getProjectComponents(projectKey);

    return NextResponse.json({
      components,
      total: components.length,
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    return NextResponse.json(
      { error: 'Failed to fetch components' },
      { status: 500 }
    );
  }
}
