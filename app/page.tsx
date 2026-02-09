'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ClickableMetricCard } from '@/components/dashboard/ClickableMetricCard';
import { ChartDetailsModal } from '@/components/dashboard/ChartDetailsModal';
import { MetricInfoModal } from '@/components/dashboard/MetricInfoModal';
import { CycleTimeChart } from '@/components/dashboard/CycleTimeChart';
import { TechDebtChart } from '@/components/dashboard/TechDebtChart';
import { AssigneeStoryPointsChart } from '@/components/dashboard/AssigneeStoryPointsChart';
import { BugsVsStoriesChart } from '@/components/dashboard/BugsVsStoriesChart';
import { BugsTrendChart } from '@/components/dashboard/BugsTrendChart';
import { WorkloadDistributionChart } from '@/components/dashboard/WorkloadDistributionChart';
import { IssueAgingChart } from '@/components/dashboard/IssueAgingChart';
import { FilterIcon } from '@/components/dashboard/FilterIcon';
import { VelocityFilters } from '@/components/velocity/VelocityFilters';
import { TeamVelocityChart } from '@/components/velocity/TeamVelocityChart';
import { EngineerVelocityChart } from '@/components/velocity/EngineerVelocityChart';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ClearAllToasts } from '@/components/ui/clear-all-toasts';
import { showSuccess, showError, showLoading } from '@/lib/toast';
import { cache, cacheKeys, preferenceKeys } from '@/lib/cache';
import { DEFAULT_TECH_LABELS } from '@/lib/metrics/kpi';
import { loadPreset, type FilterPreset } from '@/lib/filter-presets';
import type { JiraBoard, JiraProject, JiraSprint, QueryMode, BoardType, JiraIssue, VelocitySprintData, EngineerVelocityData, VelocityEngineer, VelocityTimelineConfig } from '@/types/jira';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Query mode state
  const [queryMode, setQueryMode] = useState<QueryMode>('board');

  // Board mode state
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [boards, setBoards] = useState<JiraBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<JiraBoard | null>(null);
  const [sprints, setSprints] = useState<JiraSprint[]>([]);
  const [selectedSprints, setSelectedSprints] = useState<JiraSprint[]>([]);

  // JQL mode state
  const [jqlLoading, setJqlLoading] = useState(false);

  // Tech debt labels customization and ignore list
  const [techLabels, setTechLabels] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(preferenceKeys.techLabels);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed : DEFAULT_TECH_LABELS;
        } catch {
          return DEFAULT_TECH_LABELS;
        }
      }
      return DEFAULT_TECH_LABELS;
    }
    return DEFAULT_TECH_LABELS;
  });
  const [ignoreIssueKeys, setIgnoreIssueKeys] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(preferenceKeys.ignoreIssueKeys);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    }
    return [];
  });
  const [techEpicKeys, setTechEpicKeys] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(preferenceKeys.techEpicKeys);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    }
    return [];
  });

  // Metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [issues, setIssues] = useState<any>(null);
  const [issuesByType, setIssuesByType] = useState<any>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'velocity'>('overview');

  // Velocity analysis state
  const [selectedVelocityBoard, setSelectedVelocityBoard] = useState<JiraBoard | null>(null);
  const [teamVelocityData, setTeamVelocityData] = useState<VelocitySprintData[]>([]);
  const [engineerVelocityData, setEngineerVelocityData] = useState<EngineerVelocityData[]>([]);
  const [selectedEngineers, setSelectedEngineers] = useState<VelocityEngineer[]>([]);
  const [timelineConfig, setTimelineConfig] = useState<VelocityTimelineConfig>({
    mode: 'sprint-count',
    sprintLimit: 20,
  });
  const [fetchingVelocity, setFetchingVelocity] = useState(false);

  // Preset loading state
  const [presetLoading, setPresetLoading] = useState(false);
  const isLoadingPresetRef = useRef(false);

  // Issue Details Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalIssues, setModalIssues] = useState<JiraIssue[]>([]);
  const [modalShowAge, setModalShowAge] = useState(false);

  // Metric Info Modal
  const [metricInfoOpen, setMetricInfoOpen] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState<'kpi' | 'techDebtRatio' | 'cycleTime' | 'velocity' | null>(null);

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

  // Restore persisted filter values when data loads
  useEffect(() => {
    if (projects.length > 0) {
      const savedProjectKey = localStorage.getItem(preferenceKeys.project);
      if (savedProjectKey) {
        const found = projects.find(p => p.key === savedProjectKey);
        if (found) {
          setSelectedProject(found);
          loadBoards(found.key);
        }
      }
    }
  }, [projects]);

  // Restore board selection
  useEffect(() => {
    if (isLoadingPresetRef.current || boards.length === 0) return;
    const savedBoardId = localStorage.getItem(preferenceKeys.board);
    if (savedBoardId) {
      const found = boards.find(b => b.id === parseInt(savedBoardId));
      if (found) {
        setSelectedBoard(found);
      }
    }
  }, [boards]);

  // Sync velocity board with filtered boards/project
  useEffect(() => {
    if (!selectedProject) {
      setSelectedVelocityBoard(null);
      setSelectedEngineers([]);
      setTeamVelocityData([]);
      setEngineerVelocityData([]);
      return;
    }

    if (boards.length === 0) {
      setSelectedVelocityBoard(null);
      return;
    }

    if (selectedVelocityBoard && boards.some(b => b.id === selectedVelocityBoard.id)) {
      return;
    }

    const defaultBoard = selectedBoard && boards.some(b => b.id === selectedBoard.id)
      ? selectedBoard
      : boards[0];
    setSelectedVelocityBoard(defaultBoard);
  }, [boards, selectedBoard, selectedProject, selectedVelocityBoard]);

  // Restore sprint selection
  useEffect(() => {
    if (isLoadingPresetRef.current || sprints.length === 0) return;
    const savedSprintId = localStorage.getItem(preferenceKeys.sprint);
    if (savedSprintId) {
      const found = sprints.find(s => s.id === parseInt(savedSprintId));
      if (found) {
        setSelectedSprints([found]);
      }
    }
  }, [sprints]);

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

  const loadBoards = async (projectKey?: string): Promise<JiraBoard[]> => {
    const cacheKey = projectKey ? cacheKeys.boardsByProject(projectKey) : cacheKeys.boards;
    const cachedBoards = cache.get<JiraBoard[]>(cacheKey);
    if (cachedBoards) {
      setBoards(cachedBoards);
      if (cachedBoards.length > 0 && !isLoadingPresetRef.current) {
        setSelectedBoard(cachedBoards[0]);
      }
      if (!isLoadingPresetRef.current) {
        showSuccess('Boards loaded from cache');
      }
      return cachedBoards;
    }

    const toastId = !isLoadingPresetRef.current ? toast.loading('Loading boards...') : undefined;
    try {
      const url = projectKey
        ? `/api/boards?projectKeyOrId=${projectKey}`
        : `/api/boards`;
      const res = await fetch(url);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to load boards');
      }
      const data = await res.json();
      const boards = data.boards || [];
      setBoards(boards);
      cache.set(cacheKey, boards, 600000);
      if (boards.length > 0 && !isLoadingPresetRef.current) {
        setSelectedBoard(boards[0]);
      }
      if (toastId) {
        toast.success('Boards loaded successfully', { id: toastId });
      }
      return boards;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load boards';
      if (!isLoadingPresetRef.current) {
        showError(errorMessage);
      }
      console.error('Failed to load boards:', error);
      if (toastId) {
        toast.dismiss(toastId);
      }
      setBoards([]);
      setSelectedBoard(null);
      throw error;
    }
  };

  // Removed board type change handler as board type toggle was removed

  // Handle project change
  const handleProjectSelect = (project: JiraProject) => {
    setSelectedProject(project);
    localStorage.setItem(preferenceKeys.project, project.key);
    loadBoards(project.key);
    setSprints([]);
    setSelectedSprints([]);
    setMetrics(null);
  };

  // Load sprints when board changes
  useEffect(() => {
    if (isLoadingPresetRef.current || !selectedBoard) return;
    
    loadSprints(selectedBoard.id);
    localStorage.setItem(preferenceKeys.board, selectedBoard.id.toString());
    // Clear tech epic selection when board changes
    setTechEpicKeys([]);
    localStorage.removeItem(preferenceKeys.techEpicKeys);
  }, [selectedBoard]);

  const loadSprints = async (boardId: number): Promise<JiraSprint[]> => {
    const cachedSprints = cache.get<JiraSprint[]>(cacheKeys.sprints(boardId));
    if (cachedSprints) {
      const closedSprints = cachedSprints.filter((s) => s.state === 'closed');
      setSprints(closedSprints);
      if (closedSprints.length > 0 && !isLoadingPresetRef.current) {
        setSelectedSprints([closedSprints[closedSprints.length - 1]]);
      }
      return closedSprints;
    }

    const toastId = !isLoadingPresetRef.current ? toast.loading('Loading sprints...') : undefined;
    try {
      const res = await fetch(`/api/sprints?boardId=${boardId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to load sprints');
      }
      const data = await res.json();
      const closedSprints = (data.sprints || []).filter((s: JiraSprint) => s.state === 'closed');
      setSprints(closedSprints);
      cache.set(cacheKeys.sprints(boardId), data.sprints || [], 600000);
      if (closedSprints.length > 0 && !isLoadingPresetRef.current) {
        setSelectedSprints([closedSprints[closedSprints.length - 1]]);
      }
      if (toastId) {
        toast.success(`Loaded ${closedSprints.length} closed sprints`, { id: toastId });
      }
      return closedSprints;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load sprints';
      if (!isLoadingPresetRef.current) {
        showError(errorMessage);
      }
      console.error('Failed to load sprints:', error);
      if (toastId) {
        toast.dismiss(toastId);
      }
      setSprints([]);
      throw error;
    }
  };

  // Load metrics when sprint changes
  useEffect(() => {
    if (selectedSprints.length > 0) {
      // For now, load metrics for the first sprint (we'll enhance this for multi-sprint later)
      const sprintIds = selectedSprints.map(s => s.id).join(',');
      loadMetrics(sprintIds);
      localStorage.setItem(preferenceKeys.sprint, selectedSprints[0].id.toString());
    }
  }, [selectedSprints]);

  const loadMetrics = async (sprintIds: string) => {
    // Use first sprint ID as cache key for now
    const firstSprintId = sprintIds.split(',')[0];
    const cachedMetrics = cache.get<any>(cacheKeys.metrics(parseInt(firstSprintId)));
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
      const ignoreKeysParam = ignoreIssueKeys.join(',');
      const techEpicKeysParam = techEpicKeys.join(',');
      const res = await fetch(`/api/metrics?sprintIds=${sprintIds}&techLabels=${encodeURIComponent(techLabelsParam)}&ignoreKeys=${encodeURIComponent(ignoreKeysParam)}&techEpicKeys=${encodeURIComponent(techEpicKeysParam)}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to calculate metrics');
      }
      const data = await res.json();
      setMetrics(data.metrics);
      setChartData(data.chartData);
      setIssues(data.issues || null);
      setIssuesByType(data.issuesByType || null);
      cache.set(cacheKeys.metrics(parseInt(firstSprintId)), data, 600000);
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

  const handleVelocityBoardSelect = (board: JiraBoard) => {
    setSelectedVelocityBoard(board);
    setSelectedEngineers([]);
    setTeamVelocityData([]);
    setEngineerVelocityData([]);
  };

  const fetchVelocityData = async () => {
    if (!selectedVelocityBoard || !selectedProject) return;

    setFetchingVelocity(true);
    const toastId = toast.loading('Fetching velocity data...');

    try {
      let teamUrl = `/api/velocity/team?boardId=${selectedVelocityBoard.id}`;
      if (timelineConfig.mode === 'date-range' && timelineConfig.startDate && timelineConfig.endDate) {
        teamUrl += `&mode=date-range&startDate=${timelineConfig.startDate}&endDate=${timelineConfig.endDate}`;
      } else {
        teamUrl += `&mode=sprint-count&limit=${timelineConfig.sprintLimit || 20}`;
      }

      const teamRes = await fetch(teamUrl);
      if (!teamRes.ok) {
        throw new Error('Failed to fetch team velocity');
      }
      const teamData = await teamRes.json();
      setTeamVelocityData(teamData.sprints || []);

      if (selectedEngineers.length > 0) {
        let engineerUrl = `/api/velocity/engineer?boardId=${selectedVelocityBoard.id}&assigneeIds=${selectedEngineers.map(e => e.accountId).join(',')}`;
        if (timelineConfig.mode === 'date-range' && timelineConfig.startDate && timelineConfig.endDate) {
          engineerUrl += `&mode=date-range&startDate=${timelineConfig.startDate}&endDate=${timelineConfig.endDate}`;
        } else {
          engineerUrl += `&mode=sprint-count&limit=${timelineConfig.sprintLimit || 20}`;
        }

        const engineerRes = await fetch(engineerUrl);
        if (!engineerRes.ok) {
          throw new Error('Failed to fetch engineer velocity');
        }
        const engineerData = await engineerRes.json();
        setEngineerVelocityData(engineerData.sprints || []);
      } else {
        setEngineerVelocityData([]);
      }

      toast.success('Velocity data loaded successfully', { id: toastId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch velocity data';
      showError(errorMessage);
      console.error('Error fetching velocity:', error);
      toast.dismiss(toastId);
    } finally {
      setFetchingVelocity(false);
    }
  };

  // Handle tech labels change
  const handleTechLabelsChange = (labels: string[]) => {
    setTechLabels(labels);
    localStorage.setItem(preferenceKeys.techLabels, JSON.stringify(labels));
    // Clear cache and reload metrics if we have selected sprints
    if (selectedSprints.length > 0) {
      selectedSprints.forEach(sprint => {
        cache.remove(cacheKeys.metrics(sprint.id));
      });
      const sprintIds = selectedSprints.map(s => s.id).join(',');
      loadMetrics(sprintIds);
    }
  };

  // Handle ignore issue keys change
  const handleIgnoreIssueKeysChange = (keys: string[]) => {
    setIgnoreIssueKeys(keys);
    localStorage.setItem(preferenceKeys.ignoreIssueKeys, JSON.stringify(keys));
    // Clear cache and reload metrics if we have selected sprints
    if (selectedSprints.length > 0) {
      selectedSprints.forEach(sprint => {
        cache.remove(cacheKeys.metrics(sprint.id));
      });
      const sprintIds = selectedSprints.map(s => s.id).join(',');
      loadMetrics(sprintIds);
    }
  };

  // Handle tech epic keys change
  const handleTechEpicKeysChange = (keys: string[]) => {
    setTechEpicKeys(keys);
    localStorage.setItem(preferenceKeys.techEpicKeys, JSON.stringify(keys));
    // Clear cache and reload metrics if we have selected sprints
    if (selectedSprints.length > 0) {
      selectedSprints.forEach(sprint => {
        cache.remove(cacheKeys.metrics(sprint.id));
      });
      const sprintIds = selectedSprints.map(s => s.id).join(',');
      loadMetrics(sprintIds);
    }
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    setSelectedProject(null);
    setSelectedBoard(null);
    setSelectedSprints([]);
    setTechEpicKeys([]);
    setSprints([]);
    setMetrics(null);
    // Clear localStorage preferences
    localStorage.removeItem(preferenceKeys.project);
    localStorage.removeItem(preferenceKeys.board);
    localStorage.removeItem(preferenceKeys.sprint);
    localStorage.removeItem(preferenceKeys.techEpicKeys);
  };

  // Handle loading a preset
  const handleLoadPreset = async (preset: FilterPreset) => {
    isLoadingPresetRef.current = true;
    setPresetLoading(true);
    const toastId = toast.loading('Applying preset...');
    
    try {
      // Step 1: Load and set project
      if (!preset.projectKey) {
        setSelectedProject(null);
      } else {
        const foundProject = projects.find(p => p.key === preset.projectKey);
        if (!foundProject) {
          const errorMsg = `Project "${preset.projectKey}" not found. Preset could not be fully applied.`;
          toast.dismiss(toastId);
          showError(errorMsg);
          isLoadingPresetRef.current = false;
          setPresetLoading(false);
          return;
        }
        setSelectedProject(foundProject);
      }

      // Step 2: Load and set board
      if (!preset.boardId) {
        setSelectedBoard(null);
      } else {
        try {
          const fetchedBoards = await loadBoards(preset.projectKey || undefined);
          const foundBoard = fetchedBoards.find(b => b.id === preset.boardId);
          if (!foundBoard) {
            const errorMsg = `Board ID ${preset.boardId} not found. Preset could not be fully applied.`;
            toast.dismiss(toastId);
            showError(errorMsg);
            isLoadingPresetRef.current = false;
            setPresetLoading(false);
            return;
          }
          setSelectedBoard(foundBoard);
        } catch (error) {
          const errorMsg = `Failed to load boards for project ${preset.projectKey}. Preset could not be fully applied.`;
          toast.dismiss(toastId);
          showError(errorMsg);
          console.error('Error loading boards for preset:', error);
          isLoadingPresetRef.current = false;
          setPresetLoading(false);
          return;
        }
      }

      // Step 3: Load and set sprints
      if (preset.sprintIds.length > 0 && preset.boardId) {
        try {
          const fetchedSprints = await loadSprints(preset.boardId);
          const foundSprints = fetchedSprints.filter(s => preset.sprintIds.includes(s.id));
          const missingSprintIds = preset.sprintIds.filter(id => !foundSprints.find(s => s.id === id));
          
          if (missingSprintIds.length > 0) {
            console.warn(`Some sprints from the preset were not found: ${missingSprintIds.join(', ')}`);
          }
          
          setSelectedSprints(foundSprints);
        } catch (error) {
          const errorMsg = `Failed to load sprints for board ${preset.boardId}. Preset could not be fully applied.`;
          toast.dismiss(toastId);
          showError(errorMsg);
          console.error('Error loading sprints for preset:', error);
          isLoadingPresetRef.current = false;
          setPresetLoading(false);
          return;
        }
      } else {
        setSelectedSprints([]);
      }

      // Step 4: Save to localStorage and set remaining fields
      if (preset.projectKey) {
        localStorage.setItem(preferenceKeys.project, preset.projectKey);
      } else {
        localStorage.removeItem(preferenceKeys.project);
      }

      if (preset.boardId) {
        localStorage.setItem(preferenceKeys.board, preset.boardId.toString());
      } else {
        localStorage.removeItem(preferenceKeys.board);
      }

      if (preset.sprintIds.length > 0) {
        localStorage.setItem(preferenceKeys.sprint, JSON.stringify(preset.sprintIds[0]));
      } else {
        localStorage.removeItem(preferenceKeys.sprint);
      }

      setTechEpicKeys(preset.techEpicKeys);
      localStorage.setItem(preferenceKeys.techEpicKeys, JSON.stringify(preset.techEpicKeys));

      if (preset.techLabels && preset.techLabels.length > 0) {
        setTechLabels(preset.techLabels);
        localStorage.setItem(preferenceKeys.techLabels, JSON.stringify(preset.techLabels));
      }

      if (preset.ignoreIssueKeys && preset.ignoreIssueKeys.length > 0) {
        setIgnoreIssueKeys(preset.ignoreIssueKeys);
        localStorage.setItem(preferenceKeys.ignoreIssueKeys, JSON.stringify(preset.ignoreIssueKeys));
      }

      // Success
      toast.success('Preset applied successfully!', { id: toastId });
    } finally {
      // Defer clearing to after React effects have processed the state updates
      // This ensures the ref stays true during the render + effect cycle
      setTimeout(() => {
        isLoadingPresetRef.current = false;
        setPresetLoading(false);
      }, 0);
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
        body: JSON.stringify({ jql, techLabels, ignoreKeys: ignoreIssueKeys, techEpicKeys }),
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
  const handleMetricClick = (issues: JiraIssue[], title: string, showAge: boolean = false) => {
    setModalIssues(issues);
    setModalTitle(title);
    setModalShowAge(showAge);
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Space metrics ++</h1>
            <div className="flex items-center gap-4">
              <FilterIcon
                queryMode={queryMode}
                onQueryModeChange={setQueryMode}
                projects={projects}
                selectedProject={selectedProject}
                onProjectSelect={(project) => {
                  setSelectedProject(project);
                  localStorage.setItem(preferenceKeys.project, project.key);
                  loadBoards(project.key);
                  setSprints([]);
                  setSelectedSprints([]);
                  setMetrics(null);
                }}
                boards={boards}
                selectedBoard={selectedBoard}
                onBoardSelect={(board) => {
                  setSelectedBoard(board);
                  setMetrics(null);
                }}
                sprints={sprints}
                selectedSprints={selectedSprints}
                onSprintsSelect={setSelectedSprints}
                techEpicKeys={techEpicKeys}
                onTechEpicKeysChange={handleTechEpicKeysChange}
                techLabels={techLabels}
                onTechLabelsChange={handleTechLabelsChange}
                ignoreIssueKeys={ignoreIssueKeys}
                onIgnoreIssueKeysChange={handleIgnoreIssueKeysChange}
                onClearFilters={handleClearFilters}
                onJQLExecute={handleJQLExecute}
                jqlLoading={jqlLoading}
                onLoadPreset={handleLoadPreset}
                presetLoading={presetLoading}
              />
              <div title="Connected to Jira" className="relative group">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap">
                  Connected to Jira
                </div>
              </div>
              <button 
                onClick={() => router.push('/settings')}
                title="User Settings"
                className="p-2 hover:bg-accent rounded-md transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">

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
                showInfoIcon={true}
                onInfoClick={() => {
                  setSelectedMetricType('kpi');
                  setMetricInfoOpen(true);
                }}
              />
              <ClickableMetricCard
                title="Tech Debt Ratio"
                value={`${metrics.techDebtRatio.toFixed(1)}%`}
                icon="⚙️"
                issues={issues?.techDebt || []}
                onIssuesClick={handleMetricClick}
                tooltipText={`${issues?.techDebt?.length || 0} tech debt issues`}
                showInfoIcon={true}
                onInfoClick={() => {
                  setSelectedMetricType('techDebtRatio');
                  setMetricInfoOpen(true);
                }}
              />
              <ClickableMetricCard
                title="Cycle Time"
                value={`${metrics.cycleTime.average.toFixed(1)} days`}
                icon="⏱️"
                issues={issues?.cycleTime || []}
                onIssuesClick={handleMetricClick}
                tooltipText={`${issues?.cycleTime?.length || 0} completed issues`}
                showInfoIcon={true}
                onInfoClick={() => {
                  setSelectedMetricType('cycleTime');
                  setMetricInfoOpen(true);
                }}
                showAge={true}
              />
              <ClickableMetricCard
                title="Velocity"
                value={`${metrics.velocity} pts`}
                icon="🚀"
                issues={issues?.all?.filter((issue: JiraIssue) => 
                  issue.fields.status?.name?.toLowerCase() === 'done' ||
                  issue.fields.status?.name?.toLowerCase() === 'closed' ||
                  issue.fields.status?.name?.toLowerCase() === 'resolved'
                ) || []}
                onIssuesClick={handleMetricClick}
                tooltipText="Completed issues"
                showInfoIcon={true}
                onInfoClick={() => {
                  setSelectedMetricType('velocity');
                  setMetricInfoOpen(true);
                }}
              />
            </div>

            <div className="flex items-center gap-2 border-b mb-6">
              <button
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'velocity'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('velocity')}
              >
                Velocity Analysis
              </button>
            </div>

            {activeTab === 'overview' && (
              <>
                {/* Charts */}
                <div className="grid gap-6 md:grid-cols-2 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle>Cycle Time Trend</CardTitle>
                      <button 
                        className="text-sm text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
                        onClick={() => handleMetricClick(issues?.cycleTime || [], 'Cycle Time - All Issues', true)}
                      >
                        View All
                      </button>
                    </CardHeader>
                    <CardContent>
                      <CycleTimeChart
                        data={[
                          { sprint: selectedSprints.length > 0 ? selectedSprints[0].name : 'Current', cycleTime: metrics.cycleTime.average },
                        ]}
                        issues={issues?.all}
                        onIssueClick={(issues) => handleMetricClick(issues, 'Cycle Time Details', true)}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle>Tech Debt Ratio Trend</CardTitle>
                      <button 
                        className="text-sm text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
                        onClick={() => handleMetricClick([...(issues?.techDebt || []), ...(issues?.product || [])], 'Tech Debt Ratio - All Issues')}
                      >
                        View All
                      </button>
                    </CardHeader>
                    <CardContent>
                      <TechDebtChart
                        data={[
                          { sprint: selectedSprints.length > 0 ? selectedSprints[0].name : 'Current', techDebt: metrics.techDebtIssues, product: metrics.productIssues },
                        ]}
                        techIssues={issues?.techDebt}
                        productIssues={issues?.product}
                        onTechClick={(issues) => handleMetricClick(issues, 'Tech Debt Issues')}
                        onProductClick={(issues) => handleMetricClick(issues, 'Product Issues')}
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
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle>Story Points by Assignee</CardTitle>
                          <button 
                            className="text-sm text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
                            onClick={() => handleMetricClick(issues?.all || [], 'Story Points by Assignee - All Issues')}
                          >
                            View All
                          </button>
                        </CardHeader>
                        <CardContent>
                          <AssigneeStoryPointsChart 
                            data={chartData.storyPointsByAssignee || []} 
                            issues={issues?.all}
                            onIssueClick={(issues) => handleMetricClick(issues, 'Assignee Issues')}
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle>Bugs vs Stories vs Tasks</CardTitle>
                          <button 
                            className="text-sm text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
                            onClick={() => handleMetricClick(issues?.all || [], 'Bugs vs Stories - All Issues')}
                          >
                            View All
                          </button>
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

                    {/* Bugs Trend */}
                    <Card className="mb-6">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Bugs Trend</CardTitle>
                        <button 
                          className="text-sm text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
                          onClick={() => handleMetricClick(issues?.bugs || [], 'Bugs - All Issues')}
                        >
                          View All
                        </button>
                      </CardHeader>
                      <CardContent>
                        <BugsTrendChart 
                          data={chartData.bugsTrend || []} 
                          issues={issues?.bugs}
                          onIssueClick={(issues) => handleMetricClick(issues, 'Bugs for Selected Date')}
                        />
                      </CardContent>
                    </Card>

                    {/* Workload Distribution & Issue Aging */}
                    <div className="grid gap-6 md:grid-cols-2 mb-6">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle>Workload Distribution</CardTitle>
                          <button 
                            className="text-sm text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
                            onClick={() => handleMetricClick(issues?.all || [], 'Workload Distribution - All Issues')}
                          >
                            View All
                          </button>
                        </CardHeader>
                        <CardContent>
                          <WorkloadDistributionChart 
                            data={chartData.workloadDistribution || []} 
                            issues={issues?.all}
                            onIssueClick={(issues) => handleMetricClick(issues, 'Workload Details')}
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle>Issue Aging</CardTitle>
                          <button 
                            className="text-sm text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
                            onClick={() => handleMetricClick(
                              (issues?.all || []).filter((issue: JiraIssue) => 
                                issue.fields.status?.statusCategory?.key !== 'done'
                              ), 
                              'Issue Aging - All Open Issues',
                              true
                            )}
                          >
                            View All
                          </button>
                        </CardHeader>
                        <CardContent>
                          <IssueAgingChart 
                            data={chartData.issueAging || []} 
                            issues={issues?.all}
                            onIssueClick={(issues) => handleMetricClick(issues, 'Aging Issues', true)}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'velocity' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle className="text-lg">Velocity Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Project: <span className="text-foreground font-medium">
                          {selectedProject ? `${selectedProject.name} (${selectedProject.key})` : 'None selected'}
                        </span>
                      </div>
                      <VelocityFilters
                        boards={boards}
                        selectedBoard={selectedVelocityBoard}
                        onBoardSelect={handleVelocityBoardSelect}
                        selectedEngineers={selectedEngineers}
                        onEngineersSelect={setSelectedEngineers}
                        timelineConfig={timelineConfig}
                        onTimelineConfigChange={setTimelineConfig}
                        onApply={fetchVelocityData}
                        loading={fetchingVelocity}
                        boardDisabled={!selectedProject}
                        boardDisabledMessage="Select a project in Filter Options to enable board selection."
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-3 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Velocity Over Sprints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {teamVelocityData.length > 0 ? (
                        <TeamVelocityChart
                          data={teamVelocityData}
                          onSprintClick={(issues, sprintName) =>
                            handleMetricClick(issues, `Sprint: ${sprintName}`, true)
                          }
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                          <div className="text-center">
                            <p className="text-lg mb-2">📊 No data</p>
                            <p className="text-sm">
                              Select a board and apply filters to see velocity data
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {selectedEngineers.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Individual Engineer Velocity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {engineerVelocityData.length > 0 ? (
                          <EngineerVelocityChart
                            data={engineerVelocityData}
                            onEngineerDataClick={(issues, engineerName, sprintName) =>
                              handleMetricClick(issues, `${engineerName} - ${sprintName}`, true)
                            }
                          />
                        ) : (
                          <div className="flex items-center justify-center h-64 text-muted-foreground">
                            <div className="text-center">
                              <p className="text-lg mb-2">📈 Loading engineer data...</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {!metrics && (
          <div className="text-center py-16">
            <div className="space-y-6 max-w-2xl mx-auto">
              {queryMode === 'board' && selectedProject && selectedBoard && selectedSprints.length > 0 ? (
                <div>
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-lg font-semibold">Metrics would be loaded soon...</p>
                  <p className="text-muted-foreground mt-2">Use filters to add project, board, and sprint to view metrics</p>
                </div>
              ) : queryMode === 'jql' ? (
                <div>
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-lg font-semibold">Enter a JQL query to get started</p>
                  <p className="text-muted-foreground mt-2">Click the filter icon to write a custom Jira Query Language query</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-4">🚀</div>
                  <p className="text-lg font-semibold">Get started by applying filters</p>
                  <div className="mt-6 space-y-4 text-left bg-muted/50 p-6 rounded-lg">
                    <p className="text-sm font-semibold text-foreground mb-3">Follow these steps to view your metrics:</p>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="font-semibold text-primary min-w-6">1.</span>
                        <span>Click the <strong className="font-semibold text-foreground">filter icon (☰)</strong> in the top-right to open filters</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-semibold text-primary min-w-6">2.</span>
                        <span>Select a <strong className="font-semibold text-foreground">Project</strong> from the dropdown</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-semibold text-primary min-w-6">3.</span>
                        <span>Select a <strong className="font-semibold text-foreground">Board</strong> from your project</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-semibold text-primary min-w-6">4.</span>
                        <span>Select one or more <strong className="font-semibold text-foreground">Sprints</strong> to analyze</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-semibold text-primary min-w-6">5.</span>
                        <span><strong className="font-semibold text-foreground">Optional:</strong> Configure Tech Topics by selecting <strong>Tech Epics</strong> or custom labels in Settings (⚙️)</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-semibold text-primary min-w-6">6.</span>
                        <span>Click <strong className="font-semibold text-foreground">Apply Filters</strong> to load your metrics</span>
                      </li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">💡 Tip: Save your favorite filter combinations as presets for quick access</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Issue Details Modal */}
      <ChartDetailsModal
        isOpen={modalOpen}
        title={modalTitle}
        issues={modalIssues}
        onClose={() => setModalOpen(false)}
        techLabels={techLabels}
        showAge={modalShowAge}
      />

      {/* Metric Info Modal */}
      <MetricInfoModal
        open={metricInfoOpen}
        onOpenChange={setMetricInfoOpen}
        metricType={selectedMetricType}
      />

      {/* Clear All Notifications Button - Fixed Bottom Right */}
      <ClearAllToasts />
    </div>
  );
}
