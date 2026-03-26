import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';
import { calculateCycleTime, computeCycleTimeStats } from '@/lib/metrics/cycletime';
import { getStoryPoints } from '@/lib/metrics/velocity';
import type { CycleTimeSprintData, CycleTimeIssueData } from '@/types/jira';

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isCompletedStatus(name: string): boolean {
  const s = name.toLowerCase();
  return s === 'done' || s === 'closed' || s === 'resolved';
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
    const sprintNameRegex = searchParams.get('sprintNameRegex') || '';
    const ignoreIssueKeysParam = searchParams.get('ignoreIssueKeys') || '';
    const ignoreSet = new Set(
      ignoreIssueKeysParam.split(',').map((k) => k.trim().toUpperCase()).filter(Boolean)
    );

    if (!boardIdParam) {
      return NextResponse.json({ error: 'boardId parameter required' }, { status: 400 });
    }

    // Validate regex early to return a useful error
    let regexFilter: RegExp | null = null;
    if (sprintNameRegex) {
      try {
        regexFilter = new RegExp(sprintNameRegex, 'i');
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
      target = [...closed]
        .sort((a, b) => new Date(b.completeDate!).getTime() - new Date(a.completeDate!).getTime())
        .slice(0, limit);
    }

    target.sort((a, b) => new Date(a.completeDate!).getTime() - new Date(b.completeDate!).getTime());

    const result: CycleTimeSprintData[] = [];

    for (const sprint of target) {
      const issues = await client.getSprintIssues(sprint.id, ['changelog']);
      const completed = issues.filter(
        (i) => isCompletedStatus(i.fields.status?.name || '') && !ignoreSet.has(i.key.toUpperCase())
      );

      const issueData: CycleTimeIssueData[] = [];
      const cycleTimes: number[] = [];

      for (const issue of completed) {
        const ct = calculateCycleTime(issue);
        if (ct === null) continue;
        cycleTimes.push(ct);
        issueData.push({
          key: issue.key,
          summary: issue.fields.summary,
          cycleTimeDays: ct,
          assignee: issue.fields.assignee
            ? { accountId: issue.fields.assignee.accountId, displayName: issue.fields.assignee.displayName }
            : null,
          issuetype: issue.fields.issuetype?.name || 'Unknown',
          created: issue.fields.created,
          resolutiondate: issue.fields.resolutiondate,
          storyPoints: getStoryPoints(issue),
        });
      }

      if (cycleTimes.length === 0) {
        result.push({
          sprintId: sprint.id,
          sprintName: sprint.name,
          completeDate: sprint.completeDate!,
          median: 0,
          average: 0,
          p85: 0,
          min: 0,
          max: 0,
          issueCount: 0,
          issues: [],
        });
        continue;
      }

      const stats = computeCycleTimeStats(cycleTimes);
      result.push({
        sprintId: sprint.id,
        sprintName: sprint.name,
        completeDate: sprint.completeDate!,
        ...stats,
        issueCount: cycleTimes.length,
        issues: issueData.sort((a, b) => b.cycleTimeDays - a.cycleTimeDays),
      });
    }

    return NextResponse.json({ sprints: result });
  } catch (error) {
    console.error('Error fetching team cycle time:', error);
    return NextResponse.json({ error: 'Failed to fetch team cycle time' }, { status: 500 });
  }
}
