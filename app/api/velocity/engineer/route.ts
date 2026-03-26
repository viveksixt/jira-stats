import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnection } from '@/lib/jira/auth/storage';
import { JiraClient } from '@/lib/jira/client';
import { getStoryPoints } from '@/lib/metrics/velocity';
import type { EngineerVelocityData, AssigneeVelocityData, VelocityGranularity } from '@/types/jira';

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function weekStartUtc(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function isCompletedStatus(statusName?: string): boolean {
  const s = statusName?.toLowerCase() || '';
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
    const assigneeIdsParam = searchParams.get('assigneeIds');
    const mode = searchParams.get('mode') || 'sprint-count';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 50);
    const startDate = parseDateParam(searchParams.get('startDate'));
    const endDate = parseDateParam(searchParams.get('endDate'));
    const granularity = (searchParams.get('granularity') || 'sprint') as VelocityGranularity;

    if (!boardIdParam) {
      return NextResponse.json({ error: 'boardId parameter required' }, { status: 400 });
    }
    if (!assigneeIdsParam) {
      return NextResponse.json({ error: 'assigneeIds parameter required' }, { status: 400 });
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

    const assigneeIds = assigneeIdsParam.split(',').map((s) => s.trim()).filter(Boolean);
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

    // Helper to resolve display names (best-effort)
    const nameByAccountId = new Map<string, string>();

    if (granularity === 'week') {
      // Aggregate across all selected sprints by week of resolutiondate
      const buckets = new Map<number, { weekStart: Date; byAssignee: Map<string, AssigneeVelocityData> }>();

      for (const sprint of target) {
        const issues = await client.getSprintIssues(sprint.id);
        for (const issue of issues) {
          if (!isCompletedStatus(issue.fields.status?.name)) continue;
          const assignee = issue.fields.assignee;
          if (!assignee?.accountId) continue;
          if (!assigneeIds.includes(assignee.accountId)) continue;

          const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null;
          if (!resolved || Number.isNaN(resolved.getTime())) continue;

          nameByAccountId.set(assignee.accountId, assignee.displayName);

          const ws = weekStartUtc(resolved);
          const key = ws.getTime();

          if (!buckets.has(key)) {
            buckets.set(key, { weekStart: ws, byAssignee: new Map() });
          }

          const bucket = buckets.get(key)!;
          if (!bucket.byAssignee.has(assignee.accountId)) {
            bucket.byAssignee.set(assignee.accountId, {
              accountId: assignee.accountId,
              displayName: assignee.displayName,
              velocity: 0,
              issueCount: 0,
              issues: [],
            });
          }

          const data = bucket.byAssignee.get(assignee.accountId)!;
          data.velocity += getStoryPoints(issue);
          data.issueCount += 1;
          data.issues.push(issue);
        }
      }

      const points: EngineerVelocityData[] = Array.from(buckets.values())
        .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
        .map((bucket) => {
          const weekIso = bucket.weekStart.toISOString();
          const weekLabel = weekIso.split('T')[0];

          // Ensure all selected assignees exist in each bucket (0s show as 0 line points)
          const assignees: AssigneeVelocityData[] = assigneeIds.map((accountId) => {
            const existing = bucket.byAssignee.get(accountId);
            const displayName = existing?.displayName || nameByAccountId.get(accountId) || accountId;
            return (
              existing || {
                accountId,
                displayName,
                velocity: 0,
                issueCount: 0,
                issues: [],
              }
            );
          });

          return {
            sprintId: bucket.weekStart.getTime(),
            sprintName: weekLabel,
            completeDate: weekIso,
            assignees,
          };
        });

      return NextResponse.json({ sprints: points });
    }

    // Sprint granularity (default)
    const result: EngineerVelocityData[] = [];

    for (const sprint of target) {
      const issues = await client.getSprintIssues(sprint.id);

      const assignees: AssigneeVelocityData[] = assigneeIds.map((accountId) => {
        const relevant = issues.filter((issue) => {
          if (!isCompletedStatus(issue.fields.status?.name)) return false;
          return issue.fields.assignee?.accountId === accountId;
        });

        const displayName = relevant[0]?.fields.assignee?.displayName || nameByAccountId.get(accountId) || accountId;
        if (relevant[0]?.fields.assignee?.displayName) {
          nameByAccountId.set(accountId, relevant[0].fields.assignee.displayName);
        }

        return {
          accountId,
          displayName,
          velocity: relevant.reduce((sum, issue) => sum + getStoryPoints(issue), 0),
          issueCount: relevant.length,
          issues: relevant,
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
    console.error('Error fetching engineer velocity:', error);
    return NextResponse.json({ error: 'Failed to fetch engineer velocity' }, { status: 500 });
  }
}

