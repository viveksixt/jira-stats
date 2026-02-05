import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection, saveConnection, deleteConnection } from '@/lib/jira/auth/storage';

// GET - Get active connection info (without credentials)
export async function GET() {
  try {
    const connection = await getActiveConnection();

    if (!connection) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    return NextResponse.json({
      connected: true,
      jiraHost: connection.jiraHost,
      authMethod: connection.authMethod,
      lastTestedAt: connection.lastTestedAt,
      lastTestedBy: connection.lastTestedBy,
    });
  } catch (error) {
    console.error('Error fetching connection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connection' },
      { status: 500 }
    );
  }
}

// POST - Save new connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jiraHost, authMethod, credentials, userEmail } = body;

    if (!jiraHost || !authMethod || !credentials || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const connection = await saveConnection(
      jiraHost,
      authMethod,
      credentials,
      userEmail
    );

    return NextResponse.json({
      success: true,
      connectionId: connection.id,
    });
  } catch (error) {
    console.error('Error saving connection:', error);
    return NextResponse.json(
      { error: 'Failed to save connection' },
      { status: 500 }
    );
  }
}

// DELETE - Delete connection
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Connection ID required' },
        { status: 400 }
      );
    }

    await deleteConnection(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
