import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';
import { calculateCycleTime, computeCycleTimeStats } from '@/lib/metrics/cycletime';
import { getStoryPoints } from '@/lib/metrics/velocity';
import type { CycleTimeEngineerData, CycleTimeIssueData, AssigneeCycleTimeData } from '@/types/jira';

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
    const assigneeIdsParam = searchParams.get('assigneeIds') || '';
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

    const assigneeIds = assigneeIdsParam ? assigneeIdsParam.split(',').filter(Boolean) : [];
    if (assigneeIds.length === 0) {
      return NextResponse.json({ error: 'assigneeIds parameter required' }, { status: 400 });
    }

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

    // Track display names across sprints
    const nameByAccountId = new Map<string, string>();

    const result: CycleTimeEngineerData[] = [];

    for (const sprint of target) {
      const issues = await client.getSprintIssues(sprint.id, ['changelog']);
      const completed = issues.filter(
        (i) =>
          isCompletedStatus(i.fields.status?.name || '') &&
          !ignoreSet.has(i.key.toUpperCase()) &&
          i.fields.assignee?.accountId &&
          assigneeIds.includes(i.fields.assignee.accountId)
      );

      // Cache display names
      for (const issue of completed) {
        const a = issue.fields.assignee;
        if (a && !nameByAccountId.has(a.accountId)) {
          nameByAccountId.set(a.accountId, a.displayName);
        }
      }

      // Group by assignee
      const byAssignee = new Map<string, CycleTimeIssueData[]>();
      for (const id of assigneeIds) byAssignee.set(id, []);

      for (const issue of completed) {
        const accountId = issue.fields.assignee!.accountId;
        const ct = calculateCycleTime(issue);
        if (ct === null) continue;
        byAssignee.get(accountId)?.push({
          key: issue.key,
          summary: issue.fields.summary,
          cycleTimeDays: ct,
          assignee: { accountId, displayName: issue.fields.assignee!.displayName },
          issuetype: issue.fields.issuetype?.name || 'Unknown',
          created: issue.fields.created,
          resolutiondate: issue.fields.resolutiondate,
          storyPoints: getStoryPoints(issue),
        });
      }

      const assignees: AssigneeCycleTimeData[] = assigneeIds.map((accountId) => {
        const issueList = byAssignee.get(accountId) || [];
        const times = issueList.map((i) => i.cycleTimeDays);
        const displayName = nameByAccountId.get(accountId) || accountId;

        if (times.length === 0) {
          return { accountId, displayName, median: 0, average: 0, issueCount: 0, issues: [] };
        }

        const stats = computeCycleTimeStats(times);
        return {
          accountId,
          displayName,
          median: stats.median,
          average: stats.average,
          issueCount: times.length,
          issues: issueList.sort((a, b) => b.cycleTimeDays - a.cycleTimeDays),
        };
      });

      result.push({
        sprintId: sprint.id,
        sprintName: sprint.name,
        completeDate: sprint.completeDate!,
        assignees,
      });
    }

    return NextResponse.json({ sprints: result });
  } catch (error) {
    console.error('Error fetching engineer cycle time:', error);
    return NextResponse.json({ error: 'Failed to fetch engineer cycle time' }, { status: 500 });
  }
}
