import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';

// GET - Get issues for a sprint
export async function GET(
  request: NextRequest,
  { params }: { params: { sprintId: string } }
) {
  try {
    const connection = await getActiveConnection();

    if (!connection) {
      return NextResponse.json(
        { error: 'No active Jira connection' },
        { status: 401 }
      );
    }

    const sprintId = params.sprintId;
    const { searchParams } = new URL(request.url);
    const expand = searchParams.get('expand');

    const client = new JiraClient(
      connection.jiraHost,
      connection.authMethod,
      connection.credentials
    );

    const expandFields = expand ? expand.split(',') : ['changelog'];
    const issues = await client.getSprintIssues(parseInt(sprintId), expandFields);

    return NextResponse.json({ issues });
  } catch (error) {
    console.error('Error fetching sprint issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sprint issues' },
      { status: 500 }
    );
  }
}
