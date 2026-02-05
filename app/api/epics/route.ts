import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';

// GET - Fetch epics for a project and board
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
    const boardId = searchParams.get('boardId');

    if (!projectKey || !boardId) {
      return NextResponse.json(
        { error: 'projectKey and boardId parameters required' },
        { status: 400 }
      );
    }

    // Fetch epics from Jira using JQL
    const client = new JiraClient(
      connection.jiraHost,
      connection.authMethod,
      connection.credentials
    );

    // Query all epics in the project
    const jql = `type = Epic AND project = "${projectKey}" ORDER BY created DESC`;
    const epics = await client.searchIssues(jql, ['key', 'summary']);

    // Format the response
    const formattedEpics = epics.map(epic => ({
      key: epic.key,
      summary: epic.fields.summary,
    }));

    return NextResponse.json({ epics: formattedEpics });
  } catch (error) {
    console.error('Error fetching epics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch epics';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
