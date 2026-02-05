'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ClickableMetricCard } from '@/components/dashboard/ClickableMetricCard';
import { IssueDetailsModal } from '@/components/dashboard/IssueDetailsModal';
import { CycleTimeChart } from '@/components/dashboard/CycleTimeChart';
import { TechDebtChart } from '@/components/dashboard/TechDebtChart';
import { TechDebtSettings } from '@/components/dashboard/TechDebtSettings';
import { AssigneeStoryPointsChart } from '@/components/dashboard/AssigneeStoryPointsChart';
import { BugsVsStoriesChart } from '@/components/dashboard/BugsVsStoriesChart';
import { CreatedResolvedTrendChart } from '@/components/dashboard/CreatedResolvedTrendChart';
import { WorkloadDistributionChart } from '@/components/dashboard/WorkloadDistributionChart';
import { IssueAgingChart } from '@/components/dashboard/IssueAgingChart';
import { FilterPanel } from '@/components/dashboard/FilterPanel';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ClearAllToasts } from '@/components/ui/clear-all-toasts';
import { showSuccess, showError, showLoading } from '@/lib/toast';
import { cache, cacheKeys } from '@/lib/cache';
import { DEFAULT_TECH_LABELS } from '@/lib/metrics/kpi';
import type { JiraBoard, JiraProject, JiraSprint, QueryMode, BoardType, JiraIssue } from '@/types/jira';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Query mode state
  const [queryMode, setQueryMode] = useState<QueryMode>('board');

  // Board mode state
  const [boardType, setBoardType] = useState<BoardType>('all');
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [boards, setBoards] = useState<JiraBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<JiraBoard | null>(null);
  const [sprints, setSprints] = useState<JiraSprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<JiraSprint | null>(null);

  // JQL mode state
  const [jqlLoading, setJqlLoading] = useState(false);

  // Tech debt labels customization
  const [techLabels, setTechLabels] = useState<string[]>(DEFAULT_TECH_LABELS);

  // Metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [issues, setIssues] = useState<any>(null);
  const [issuesByType, setIssuesByType] = useState<any>(null);

  // Issue Details Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalIssues, setModalIssues] = useState<JiraIssue[]>([]);

  // Initialize
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/auth');
        if (!res.ok) {
          throw new Error('Authentication failed');
        }
        const data = await res.json();
        if (!data.connected) {
          showError('Not connected to Jira. Please authenticate.');
          router.push('/login');
        } else {
          setConnected(true);
          await loadProjects();
          await loadBoards();
        }
      } catch (error) {
        showError('Failed to check authentication');
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [router]);

  const loadProjects = async () => {
    const cachedProjects = cache.get<JiraProject[]>(cacheKeys.projects);
    if (cachedProjects) {
      setProjects(cachedProjects);
      return;
    }

    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        throw new Error('Failed to load projects');
      }
      const data = await res.json();
      setProjects(data.projects || []);
      cache.set(cacheKeys.projects, data.projects || [], 600000);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    }
  };

  const loadBoards = async (projectKey?: string) => {
    const cacheKey = projectKey ? cacheKeys.boardsByProject(projectKey) : cacheKeys.boards;
    const cachedBoards = cache.get<JiraBoard[]>(cacheKey);
    if (cachedBoards) {
      setBoards(cachedBoards);
      if (cachedBoards.length > 0) {
        setSelectedBoard(cachedBoards[0]);
      }
      showSuccess('Boards loaded from cache');
      return;
    }

    const toastId = toast.loading('Loading boards...');
    try {
      const url = projectKey
        ? `/api/boards?projectKeyOrId=${projectKey}&type=${boardType}`
        : `/api/boards?type=${boardType}`;
      const res = await fetch(url);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to load boards');
      }
      const data = await res.json();
      setBoards(data.boards || []);
      cache.set(cacheKey, data.boards || [], 600000);
      if (data.boards && data.boards.length > 0) {
        setSelectedBoard(data.boards[0]);
      }
      toast.success('Boards loaded successfully', { id: toastId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load boards';
      showError(errorMessage);
      console.error('Failed to load boards:', error);
      toast.dismiss(toastId);
      setBoards([]);
      setSelectedBoard(null);
    }
  };

  // Handle board type change
  useEffect(() => {
    if (selectedProject) {
      loadBoards(selectedProject.key);
    } else {
      loadBoards();
    }
  }, [boardType]);

  // Handle project change
  const handleProjectSelect = (project: JiraProject) => {
    setSelectedProject(project);
    loadBoards(project.key);
    setSprints([]);
    setSelectedSprint(null);
    setMetrics(null);
  };

  // Load sprints when board changes
  useEffect(() => {
    if (selectedBoard) {
      loadSprints(selectedBoard.id);
    }
  }, [selectedBoard]);

  const loadSprints = async (boardId: number) => {
    const cachedSprints = cache.get<JiraSprint[]>(cacheKeys.sprints(boardId));
    if (cachedSprints) {
      const closedSprints = cachedSprints.filter((s) => s.state === 'closed');
      setSprints(closedSprints);
      if (closedSprints.length > 0) {
        setSelectedSprint(closedSprints[closedSprints.length - 1]);
      }
      return;
    }

    const toastId = toast.loading('Loading sprints...');
    try {
      const res = await fetch(`/api/sprints?boardId=${boardId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to load sprints');
      }
      const data = await res.json();
      const closedSprints = (data.sprints || []).filter((s) => s.state === 'closed');
      setSprints(closedSprints);
      cache.set(cacheKeys.sprints(boardId), data.sprints || [], 600000);
      if (closedSprints.length > 0) {
        setSelectedSprint(closedSprints[closedSprints.length - 1]);
      }
      toast.success(`Loaded ${closedSprints.length} closed sprints`, { id: toastId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load sprints';
      showError(errorMessage);
      console.error('Failed to load sprints:', error);
      setSprints([]);
      toast.dismiss(toastId);
    }
  };

  // Load metrics when sprint changes
  useEffect(() => {
    if (selectedSprint) {
      loadMetrics(selectedSprint.id);
    }
  }, [selectedSprint]);

  const loadMetrics = async (sprintId: number) => {
    const cachedMetrics = cache.get<any>(cacheKeys.metrics(sprintId));
    if (cachedMetrics) {
      setMetrics(cachedMetrics.metrics || cachedMetrics);
      setChartData(cachedMetrics.chartData || null);
      setIssues(cachedMetrics.issues || null);
      setIssuesByType(cachedMetrics.issuesByType || null);
      showSuccess('Metrics loaded from cache');
      return;
    }

    const toastId = toast.loading('Calculating metrics...');
    try {
      const techLabelsParam = techLabels.join(',');
      const res = await fetch(`/api/metrics?sprintId=${sprintId}&techLabels=${encodeURIComponent(techLabelsParam)}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to calculate metrics');
      }
      const data = await res.json();
      setMetrics(data.metrics);
      setChartData(data.chartData);
      setIssues(data.issues || null);
      setIssuesByType(data.issuesByType || null);
      cache.set(cacheKeys.metrics(sprintId), data, 600000);
      toast.success('Metrics calculated successfully', { id: toastId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate metrics';
      showError(errorMessage);
      console.error('Failed to load metrics:', error);
      setMetrics(null);
      setChartData(null);
      setIssues(null);
      setIssuesByType(null);
      toast.dismiss(toastId);
    }
  };

  // Handle tech labels change
  const handleTechLabelsChange = (labels: string[]) => {
    setTechLabels(labels);
    // Clear cache and reload metrics if we have a selected sprint
    if (selectedSprint) {
      cache.remove(cacheKeys.metrics(selectedSprint.id));
      loadMetrics(selectedSprint.id);
    }
  };

  // Handle JQL query execution
  const handleJQLExecute = async (jql: string) => {
    setJqlLoading(true);
    const toastId = toast.loading('Executing JQL query...');
    try {
      const res = await fetch('/api/jql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jql, techLabels }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to execute JQL query');
      }

      const data = await res.json();
      if (data.metrics) {
        setMetrics(data.metrics);
        setChartData(data.chartData);
        setIssues(data.issues || null);
        setIssuesByType(data.issuesByType || null);
        toast.success(`JQL query executed: ${data.issueCount} issues found`, { id: toastId });
      } else {
        showError(data.message || 'No results from JQL query');
        setChartData(null);
        setIssues(null);
        setIssuesByType(null);
        toast.dismiss(toastId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute JQL query';
      showError(errorMessage);
      console.error('JQL query failed:', error);
      setChartData(null);
      setIssues(null);
      setIssuesByType(null);
      toast.dismiss(toastId);
    } finally {
      setJqlLoading(false);
    }
  };

  // Handle metric card click
  const handleMetricClick = (issues: JiraIssue[], title: string) => {
    setModalIssues(issues);
    setModalTitle(title);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Jira Metrics Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-green-600 flex items-center gap-1">
                ✓ Connected
              </span>
              <ClearAllToasts />
              <Button variant="outline" onClick={() => router.push('/settings')}>
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Filter Panel */}
        <div className="mb-6">
          <FilterPanel
            queryMode={queryMode}
            onQueryModeChange={setQueryMode}
            boardType={boardType}
            onBoardTypeChange={setBoardType}
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={handleProjectSelect}
            boards={boards}
            selectedBoard={selectedBoard}
            onBoardSelect={(board) => {
              setSelectedBoard(board);
              setMetrics(null);
            }}
            sprints={sprints}
            selectedSprint={selectedSprint}
            onSprintSelect={(sprint) => {
              setSelectedSprint(sprint);
              setMetrics(null);
            }}
            onJQLExecute={handleJQLExecute}
            jqlLoading={jqlLoading}
          />
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <ClickableMetricCard
                title="KPI (Product Topics)"
                value={`${metrics.productIssues} items`}
                icon="📊"
                issues={issues?.product || []}
                onIssuesClick={handleMetricClick}
                tooltipText={`${issues?.product?.length || 0} product issues`}
              />
              <ClickableMetricCard
                title="Tech Debt Ratio"
                value={`${metrics.techDebtRatio.toFixed(1)}%`}
                icon="⚙️"
                issues={issues?.techDebt || []}
                onIssuesClick={handleMetricClick}
                tooltipText={`${issues?.techDebt?.length || 0} tech debt issues`}
              />
              <ClickableMetricCard
                title="Cycle Time"
                value={`${metrics.cycleTime.average.toFixed(1)} days`}
                icon="⏱️"
                issues={issues?.cycleTime || []}
                onIssuesClick={handleMetricClick}
                tooltipText={`${issues?.cycleTime?.length || 0} completed issues`}
              />
              <MetricCard
                title="Velocity"
                value={`${metrics.velocity} pts`}
                icon="🚀"
              />
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cycle Time Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <CycleTimeChart
                    data={[
                      { sprint: 'Sp41', cycleTime: 5.2 },
                      { sprint: 'Sp42', cycleTime: 4.8 },
                      { sprint: 'Sp43', cycleTime: 5.5 },
                      { sprint: 'Sp44', cycleTime: 4.2 },
                      { sprint: 'Current', cycleTime: metrics.cycleTime.average },
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Tech Debt Ratio Trend</CardTitle>
                    <TechDebtSettings
                      techLabels={techLabels}
                      onSave={handleTechLabelsChange}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <TechDebtChart
                    data={[
                      { sprint: 'Sp43', techDebt: 12, product: 38 },
                      { sprint: 'Sp44', techDebt: 10, product: 40 },
                      { sprint: 'Current', techDebt: metrics.techDebtIssues, product: metrics.productIssues },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Advanced Charts Section */}
            {chartData && (
              <>
                {/* Story Points by Assignee & Issue Type Breakdown */}
                <div className="grid gap-6 md:grid-cols-2 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Story Points by Assignee</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AssigneeStoryPointsChart data={chartData.storyPointsByAssignee || []} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Bugs vs Stories vs Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BugsVsStoriesChart
                        data={chartData.issueTypeBreakdown || { bugs: 0, stories: 0, tasks: 0, other: 0, total: 0 }}
                        issues={issuesByType}
                        onIssueTypeClick={handleMetricClick}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Created vs Resolved Trend */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Created vs Resolved Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CreatedResolvedTrendChart data={chartData.createdResolvedTrend || []} />
                  </CardContent>
                </Card>

                {/* Workload Distribution & Issue Aging */}
                <div className="grid gap-6 md:grid-cols-2 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Workload Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <WorkloadDistributionChart data={chartData.workloadDistribution || []} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Issue Aging</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <IssueAgingChart data={chartData.issueAging || []} />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </>
        )}

        {!metrics && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {queryMode === 'board' && selectedSprint
                ? 'Loading metrics...'
                : queryMode === 'jql'
                  ? 'Enter a JQL query to get started'
                  : 'Select a board and sprint to view metrics'}
            </p>
          </div>
        )}
      </main>

      {/* Issue Details Modal */}
      <IssueDetailsModal
        isOpen={modalOpen}
        title={modalTitle}
        issues={modalIssues}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
