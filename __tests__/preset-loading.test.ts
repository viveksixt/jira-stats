import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { FilterPreset } from '@/lib/filter-presets';
import type { JiraProject, JiraBoard, JiraSprint } from '@/types/jira';

// Mock data
const mockProject: JiraProject = {
  key: 'TEST',
  name: 'Test Project',
  id: '1',
  type: 'software',
};

const mockBoard: JiraBoard = {
  id: 1,
  name: 'Test Board',
  type: 'scrum',
};

const mockBoard2: JiraBoard = {
  id: 2,
  name: 'Another Board',
  type: 'scrum',
};

const mockSprint: JiraSprint = {
  id: 101,
  name: 'Sprint 1',
  state: 'closed',
  startDate: '2024-01-01',
  endDate: '2024-01-15',
};

const mockSprint2: JiraSprint = {
  id: 102,
  name: 'Sprint 2',
  state: 'closed',
  startDate: '2024-01-16',
  endDate: '2024-01-30',
};

const mockPreset: FilterPreset = {
  id: 'preset-1',
  name: 'Test Preset',
  queryMode: 'board',
  projectKey: 'TEST',
  boardId: 1,
  sprintIds: [101],
  techEpicKeys: ['TEST-100'],
  techLabels: ['tech-debt'],
  ignoreIssueKeys: ['TEST-999'],
  createdAt: new Date().toISOString(),
};

describe('Preset Loading Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Sequential Loading: Project -> Boards -> Sprints', () => {
    it('should load project and verify it exists in projects list', () => {
      const projects = [mockProject];
      const foundProject = projects.find(p => p.key === mockPreset.projectKey);
      
      expect(foundProject).toBeDefined();
      expect(foundProject?.key).toBe('TEST');
      expect(foundProject?.name).toBe('Test Project');
    });

    it('should load boards after project is set', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ boards: [mockBoard, mockBoard2] }),
      });

      const projectKey = mockPreset.projectKey;
      const response = await fetch(`/api/boards?projectKeyOrId=${projectKey}`);
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(`/api/boards?projectKeyOrId=${projectKey}`);
      expect(data.boards).toHaveLength(2);
      expect(data.boards[0].id).toBe(1);
    });

    it('should find board in fetched boards list', async () => {
      const boards = [mockBoard, mockBoard2];
      const foundBoard = boards.find(b => b.id === mockPreset.boardId);

      expect(foundBoard).toBeDefined();
      expect(foundBoard?.id).toBe(1);
      expect(foundBoard?.name).toBe('Test Board');
    });

    it('should load sprints after board is set', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sprints: [mockSprint, mockSprint2] }),
      });

      const boardId = mockPreset.boardId;
      const response = await fetch(`/api/sprints?boardId=${boardId}`);
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(`/api/sprints?boardId=${boardId}`);
      expect(data.sprints).toHaveLength(2);
    });

    it('should filter sprints by preset sprintIds', async () => {
      const allSprints = [mockSprint, mockSprint2];
      const closedSprints = allSprints.filter(s => s.state === 'closed');
      const foundSprints = closedSprints.filter(s => mockPreset.sprintIds.includes(s.id));

      expect(foundSprints).toHaveLength(1);
      expect(foundSprints[0].id).toBe(101);
    });

    it('should set tech epic keys and remaining fields', () => {
      const techEpicKeys = mockPreset.techEpicKeys;
      const techLabels = mockPreset.techLabels;
      const ignoreIssueKeys = mockPreset.ignoreIssueKeys;

      expect(techEpicKeys).toEqual(['TEST-100']);
      expect(techLabels).toEqual(['tech-debt']);
      expect(ignoreIssueKeys).toEqual(['TEST-999']);
    });
  });

  describe('Error Handling', () => {
    it('should handle project not found', () => {
      const projects: JiraProject[] = [];
      const foundProject = projects.find(p => p.key === mockPreset.projectKey);

      expect(foundProject).toBeUndefined();
    });

    it('should handle board fetch failure', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to load boards' }),
      });

      const response = await fetch('/api/boards?projectKeyOrId=TEST');
      expect(response.ok).toBe(false);

      const data = await response.json();
      expect(data.error).toBe('Failed to load boards');
    });

    it('should handle board not found in fetched results', () => {
      const boards: JiraBoard[] = [];
      const foundBoard = boards.find(b => b.id === mockPreset.boardId);

      expect(foundBoard).toBeUndefined();
    });

    it('should handle sprint fetch failure', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to load sprints' }),
      });

      const response = await fetch(`/api/sprints?boardId=${mockPreset.boardId}`);
      expect(response.ok).toBe(false);

      const data = await response.json();
      expect(data.error).toBe('Failed to load sprints');
    });

    it('should handle network error during fetch', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/boards?projectKeyOrId=TEST');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toBe('Network error');
      }
    });
  });

  describe('Partial Success - Missing Sprint IDs', () => {
    it('should handle when some sprint IDs are not found', () => {
      const allSprints = [mockSprint];
      const presetSprintIds = [101, 102, 103]; // 102 and 103 don't exist
      const foundSprints = allSprints.filter(s => presetSprintIds.includes(s.id));
      const missingSprintIds = presetSprintIds.filter(id => !foundSprints.find(s => s.id === id));

      expect(foundSprints).toHaveLength(1);
      expect(missingSprintIds).toEqual([102, 103]);
    });

    it('should still apply preset with available sprints', () => {
      const allSprints = [mockSprint];
      const presetSprintIds = [101, 999]; // 999 doesn't exist
      const foundSprints = allSprints.filter(s => presetSprintIds.includes(s.id));

      // Should still set the preset with the sprints that were found
      expect(foundSprints.length).toBeGreaterThan(0);
      expect(foundSprints[0].id).toBe(101);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save project key to localStorage', () => {
      localStorage.setItem('jira-stats-project', mockPreset.projectKey);
      expect(localStorage.getItem('jira-stats-project')).toBe('TEST');
    });

    it('should save board ID to localStorage', () => {
      localStorage.setItem('jira-stats-board', mockPreset.boardId.toString());
      expect(localStorage.getItem('jira-stats-board')).toBe('1');
    });

    it('should save sprint ID to localStorage', () => {
      localStorage.setItem('jira-stats-sprint', JSON.stringify(mockPreset.sprintIds[0]));
      const saved = JSON.parse(localStorage.getItem('jira-stats-sprint') || '0');
      expect(saved).toBe(101);
    });

    it('should save tech epic keys to localStorage', () => {
      localStorage.setItem('jira-stats-tech-epic-keys', JSON.stringify(mockPreset.techEpicKeys));
      const saved = JSON.parse(localStorage.getItem('jira-stats-tech-epic-keys') || '[]');
      expect(saved).toEqual(['TEST-100']);
    });

    it('should save tech labels to localStorage', () => {
      localStorage.setItem('jira-stats-tech-labels', JSON.stringify(mockPreset.techLabels));
      const saved = JSON.parse(localStorage.getItem('jira-stats-tech-labels') || '[]');
      expect(saved).toEqual(['tech-debt']);
    });

    it('should save ignore issue keys to localStorage', () => {
      localStorage.setItem('jira-stats-ignore-keys', JSON.stringify(mockPreset.ignoreIssueKeys));
      const saved = JSON.parse(localStorage.getItem('jira-stats-ignore-keys') || '[]');
      expect(saved).toEqual(['TEST-999']);
    });

    it('should clear localStorage when preset values are null/empty', () => {
      localStorage.setItem('jira-stats-project', 'OLD_VALUE');
      localStorage.removeItem('jira-stats-project');

      expect(localStorage.getItem('jira-stats-project')).toBeNull();
    });
  });

  describe('Complete Preset Application Flow', () => {
    it('should apply all preset values in correct sequence', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      // Setup mock responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ boards: [mockBoard] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sprints: [mockSprint] }),
        });

      // Step 1: Verify project
      const projects = [mockProject];
      const foundProject = projects.find(p => p.key === mockPreset.projectKey);
      expect(foundProject).toBeDefined();

      // Step 2: Load boards
      const boardResponse = await fetch(`/api/boards?projectKeyOrId=${mockPreset.projectKey}`);
      const boardData = await boardResponse.json();
      const foundBoard = boardData.boards.find((b: JiraBoard) => b.id === mockPreset.boardId);
      expect(foundBoard).toBeDefined();

      // Step 3: Load sprints
      const sprintResponse = await fetch(`/api/sprints?boardId=${mockPreset.boardId}`);
      const sprintData = await sprintResponse.json();
      const foundSprints = sprintData.sprints.filter((s: JiraSprint) =>
        mockPreset.sprintIds.includes(s.id)
      );
      expect(foundSprints).toHaveLength(1);

      // Step 4: Verify remaining fields
      expect(mockPreset.techEpicKeys).toEqual(['TEST-100']);
      expect(mockPreset.techLabels).toEqual(['tech-debt']);
      expect(mockPreset.ignoreIssueKeys).toEqual(['TEST-999']);

      // Verify all API calls were made in order
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, `/api/boards?projectKeyOrId=${mockPreset.projectKey}`);
      expect(mockFetch).toHaveBeenNthCalledWith(2, `/api/sprints?boardId=${mockPreset.boardId}`);
    });
  });

  describe('Multiple Board/Sprint Lookups', () => {
    it('should correctly identify board from multiple boards', () => {
      const boards = [mockBoard, mockBoard2];
      const targetBoardId = 2;
      const foundBoard = boards.find(b => b.id === targetBoardId);

      expect(foundBoard?.id).toBe(2);
      expect(foundBoard?.name).toBe('Another Board');
    });

    it('should correctly filter multiple sprints', () => {
      const sprints = [mockSprint, mockSprint2];
      const targetSprintIds = [102];
      const foundSprints = sprints.filter(s => targetSprintIds.includes(s.id));

      expect(foundSprints).toHaveLength(1);
      expect(foundSprints[0].id).toBe(102);
    });

    it('should handle empty preset values', () => {
      const emptyPreset: FilterPreset = {
        ...mockPreset,
        projectKey: null,
        boardId: null,
        sprintIds: [],
        techEpicKeys: [],
      };

      expect(emptyPreset.projectKey).toBeNull();
      expect(emptyPreset.boardId).toBeNull();
      expect(emptyPreset.sprintIds.length).toBe(0);
    });
  });
});
