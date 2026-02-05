import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';

// GET - Get sprints for a board
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
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json(
        { error: 'boardId parameter required' },
        { status: 400 }
      );
    }

    const client = new JiraClient(
      connection.jiraHost,
      connection.authMethod,
      connection.credentials
    );

    const sprints = await client.getSprints(parseInt(boardId));

    return NextResponse.json({ sprints });
  } catch (error) {
    console.error('Error fetching sprints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sprints' },
      { status: 500 }
    );
  }
}
