import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';

// GET - Get all boards (optionally filtered by project and type)
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
    const projectKey = searchParams.get('projectKeyOrId');
    const type = searchParams.get('type');

    const client = new JiraClient(
      connection.jiraHost,
      connection.authMethod,
      connection.credentials
    );

    let boards;
    if (projectKey) {
      boards = await client.getBoardsForProject(projectKey, type || undefined);
    } else {
      boards = await client.getBoards();
    }

    return NextResponse.json({ boards });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
      { status: 500 }
    );
  }
}

