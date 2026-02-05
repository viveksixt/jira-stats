'use client';

interface CacheItem<T> {
  data: T;
  expires: number;
}

export const cache = {
  set: <T,>(key: string, data: T, ttl: number = 3600000) => {
    if (typeof window === 'undefined') return;
    
    try {
      const item: CacheItem<T> = {
        data,
        expires: Date.now() + ttl,
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  },

  get: <T,>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const { data, expires } = JSON.parse(item) as CacheItem<T>;

      if (Date.now() > expires) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  },

  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove cached data:', error);
    }
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('jira-stats-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  },
};

// Cache key builders
export const cacheKeys = {
  boards: 'jira-stats-boards',
  sprints: (boardId: number) => `jira-stats-sprints-${boardId}`,
  metrics: (sprintId: number) => `jira-stats-metrics-${sprintId}`,
  components: (projectKey: string) => `jira-stats-components-${projectKey}`,
  projects: 'jira-stats-projects',
  boardsByProject: (projectKey: string) => `jira-stats-boards-${projectKey}`,
  jqlResults: (queryHash: string) => `jira-stats-jql-${queryHash}`,
  epics: (projectKey: string) => `jira-stats-epics-${projectKey}`,
};

// Preference key builders (no TTL, persisted indefinitely)
export const preferenceKeys = {
  techLabels: 'jira-stats-pref-tech-labels',
  ignoreIssueKeys: 'jira-stats-pref-ignore-keys',
  project: 'jira-stats-pref-project',
  board: 'jira-stats-pref-board',
  sprint: 'jira-stats-pref-sprint',
  jqlQuery: 'jira-stats-pref-jql-query',
  techEpicKeys: 'jira-stats-pref-tech-epic-keys',
};
