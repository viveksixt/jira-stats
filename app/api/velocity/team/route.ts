import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';
import { calculateVelocity } from '@/lib/metrics/velocity';
import type { VelocitySprintData } from '@/types/jira';

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest) {
  try {
    const connection = await getActiveConnection();
    if (!connection) {
      return NextResponse.json({ error: 'No active Jira connection' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardIdParam = searchParams.get('boardId');
    const mode = searchParams.get('mode') || 'sprint-count';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 50);
    const startDate = parseDateParam(searchParams.get('startDate'));
    const endDate = parseDateParam(searchParams.get('endDate'));

    if (!boardIdParam) {
      return NextResponse.json({ error: 'boardId parameter required' }, { status: 400 });
    }

    const sprintNameRegexParam = searchParams.get('sprintNameRegex') || '';
    let regexFilter: RegExp | null = null;
    if (sprintNameRegexParam) {
      try {
        regexFilter = new RegExp(sprintNameRegexParam, 'i');
      } catch {
        return NextResponse.json({ error: 'Invalid sprintNameRegex' }, { status: 400 });
      }
    }

    const boardId = parseInt(boardIdParam, 10);
    const client = new JiraClient(connection.jiraHost, connection.authMethod, connection.credentials);

    const allSprints = await client.getSprints(boardId);
    let closed = (allSprints || []).filter((s) => s.state === 'closed' && s.completeDate);

    if (regexFilter) {
      closed = closed.filter((s) => regexFilter!.test(s.name));
    }

    let target = closed;
    if (mode === 'date-range' && startDate && endDate) {
      target = closed.filter((s) => {
        const cd = new Date(s.completeDate!);
        return cd >= startDate && cd <= endDate;
      });
    } else {
      // sprint-count: take latest N by completeDate
      target = [...closed]
        .sort((a, b) => new Date(b.completeDate!).getTime() - new Date(a.completeDate!).getTime())
        .slice(0, limit);
    }

    // Oldest -> newest for chart display
    target.sort((a, b) => new Date(a.completeDate!).getTime() - new Date(b.completeDate!).getTime());

    const result: VelocitySprintData[] = [];
    for (const sprint of target) {
      const issues = await client.getSprintIssues(sprint.id);
      const completed = issues.filter((issue) => {
        const status = issue.fields.status?.name?.toLowerCase() || '';
        return status === 'done' || status === 'closed' || status === 'resolved';
      });

      result.push({
        sprintId: sprint.id,
        sprintName: sprint.name,
        completeDate: sprint.completeDate!,
        velocity: calculateVelocity(completed),
        completedIssueCount: completed.length,
        issues: completed,
      });
    }

    return NextResponse.json({ sprints: result });
  } catch (error) {
    console.error('Error fetching team velocity:', error);
    return NextResponse.json({ error: 'Failed to fetch team velocity' }, { status: 500 });
  }
}

