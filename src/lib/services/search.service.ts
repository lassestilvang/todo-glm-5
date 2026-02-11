/**
 * Search Service
 * 
 * Provides fuzzy search functionality using Fuse.js.
 * Searches across tasks, lists, and labels.
 */

import Fuse, { FuseResultMatch, IFuseOptions } from 'fuse.js';
import { 
  Task, 
  List, 
  Label,
  SearchResult 
} from '@/types';
import { listsService } from './lists.service';
import { tasksService } from './tasks.service';
import { labelsService } from './labels.service';
import { DatabaseError } from '../errors';

/**
 * Search options for customizing search behavior
 */
export interface SearchOptions {
  /** Maximum number of results to return per category */
  limit?: number;
  /** Minimum match score threshold (0-1, lower = more permissive) */
  threshold?: number;
  /** Whether to include completed tasks */
  includeCompleted?: boolean;
  /** Scope to search within */
  scope?: 'all' | 'tasks' | 'lists' | 'labels';
}

/**
 * Combined search result containing all matched entities
 */
export interface CombinedSearchResult {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  /** Total number of matches across all categories */
  totalMatches: number;
}

/**
 * Task search result with match highlighting
 */
export interface TaskSearchResult {
  item: Task;
  matches?: readonly FuseResultMatch[];
  score?: number;
}

/**
 * Fuse.js options for task search
 */
const TASK_SEARCH_OPTIONS: IFuseOptions<Task> = {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'description', weight: 0.3 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  findAllMatches: true,
};

/**
 * Fuse.js options for list search
 */
const LIST_SEARCH_OPTIONS: IFuseOptions<List> = {
  keys: [
    { name: 'name', weight: 0.8 },
    { name: 'emoji', weight: 0.2 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
};

/**
 * Fuse.js options for label search
 */
const LABEL_SEARCH_OPTIONS: IFuseOptions<Label> = {
  keys: [
    { name: 'name', weight: 0.8 },
    { name: 'emoji', weight: 0.2 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
};

/**
 * Search service class
 */
export class SearchService {
  private taskFuse: Fuse<Task> | null = null;
  private listFuse: Fuse<List> | null = null;
  private labelFuse: Fuse<Label> | null = null;
  private tasksData: Task[] = [];
  private listsData: List[] = [];
  private labelsData: Label[] = [];

  /**
   * Initialize search indices by loading data
   */
  private async initializeIndices(): Promise<void> {
    try {
      const [tasks, lists, labels] = await Promise.all([
        tasksService.getAll(),
        listsService.getAll(),
        labelsService.getAll(),
      ]);

      this.tasksData = tasks;
      this.listsData = lists;
      this.labelsData = labels;

      this.taskFuse = new Fuse(tasks, TASK_SEARCH_OPTIONS);
      this.listFuse = new Fuse(lists, LIST_SEARCH_OPTIONS);
      this.labelFuse = new Fuse(labels, LABEL_SEARCH_OPTIONS);
    } catch (error) {
      throw new DatabaseError('Failed to initialize search indices', error as Error);
    }
  }

  /**
   * Refresh search indices (call after data changes)
   */
  async refreshIndices(): Promise<void> {
    await this.initializeIndices();
  }

  /**
   * Ensure indices are initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.taskFuse || !this.listFuse || !this.labelFuse) {
      await this.initializeIndices();
    }
  }

  /**
   * Search tasks using fuzzy matching
   */
  async searchTasks(query: string, options?: SearchOptions): Promise<TaskSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    await this.ensureInitialized();

    const threshold = options?.threshold ?? 0.4;
    const limit = options?.limit ?? 20;

    // Recreate fuse with custom threshold if different
    let fuse = this.taskFuse!;
    if (threshold !== 0.4) {
      fuse = new Fuse(this.tasksData, { ...TASK_SEARCH_OPTIONS, threshold });
    }

    const results = fuse.search(query.trim(), { limit });

    // Filter completed tasks if needed
    let filteredResults = results;
    if (!options?.includeCompleted) {
      filteredResults = results.filter(r => !r.item.is_completed);
    }

    return filteredResults.map(result => ({
      item: result.item,
      matches: result.matches,
      score: result.score,
    }));
  }

  /**
   * Search across all entities (tasks, lists, labels)
   */
  async searchAll(query: string, options?: SearchOptions): Promise<CombinedSearchResult> {
    if (!query || query.trim().length === 0) {
      return {
        tasks: [],
        lists: [],
        labels: [],
        totalMatches: 0,
      };
    }

    await this.ensureInitialized();

    const threshold = options?.threshold ?? 0.4;
    const limit = options?.limit ?? 20;
    const scope = options?.scope ?? 'all';

    const result: CombinedSearchResult = {
      tasks: [],
      lists: [],
      labels: [],
      totalMatches: 0,
    };

    // Search tasks
    if (scope === 'all' || scope === 'tasks') {
      const taskResults = await this.searchTasks(query, options);
      result.tasks = taskResults.map(r => r.item);
      result.totalMatches += result.tasks.length;
    }

    // Search lists
    if (scope === 'all' || scope === 'lists') {
      let listFuse = this.listFuse!;
      if (threshold !== 0.4) {
        listFuse = new Fuse(this.listsData, { ...LIST_SEARCH_OPTIONS, threshold });
      }
      const listResults = listFuse.search(query.trim(), { limit });
      result.lists = listResults.map(r => r.item);
      result.totalMatches += result.lists.length;
    }

    // Search labels
    if (scope === 'all' || scope === 'labels') {
      let labelFuse = this.labelFuse!;
      if (threshold !== 0.4) {
        labelFuse = new Fuse(this.labelsData, { ...LABEL_SEARCH_OPTIONS, threshold });
      }
      const labelResults = labelFuse.search(query.trim(), { limit });
      result.labels = labelResults.map(r => r.item);
      result.totalMatches += result.labels.length;
    }

    return result;
  }

  /**
   * Search and return results with highlights
   */
  async searchWithHighlights(
    query: string, 
    options?: SearchOptions
  ): Promise<SearchResult> {
    const combined = await this.searchAll(query, options);
    
    const highlights = new Map<string, string[]>();

    // Add highlights for tasks
    const taskResults = await this.searchTasks(query, options);
    taskResults.forEach(result => {
      if (result.matches && result.matches.length > 0) {
        const highlightTexts = result.matches.map(match => {
          const indices = match.indices;
          const text = match.value || '';
          // Create highlighted text
          let highlighted = '';
          let lastIndex = 0;
          indices.forEach(([start, end]: [number, number]) => {
            highlighted += text.slice(lastIndex, start);
            highlighted += `<mark>${text.slice(start, end + 1)}</mark>`;
            lastIndex = end + 1;
          });
          highlighted += text.slice(lastIndex);
          return highlighted;
        });
        highlights.set(result.item.id, highlightTexts);
      }
    });

    return {
      tasks: combined.tasks,
      lists: combined.lists,
      labels: combined.labels,
      highlights,
    };
  }

  /**
   * Quick search for autocomplete/suggestions
   * Returns top 5 results per category
   */
  async quickSearch(query: string): Promise<CombinedSearchResult> {
    return this.searchAll(query, { limit: 5, threshold: 0.3 });
  }

  /**
   * Search tasks by exact field match
   */
  async searchExact(field: 'name' | 'description' | 'priority', value: string | number): Promise<Task[]> {
    if (field === 'priority') {
      const tasks = await tasksService.getAll();
      return tasks.filter(t => t.priority === value);
    }

    // For name and description, use exact match
    await this.ensureInitialized();

    const exactOptions: IFuseOptions<Task> = {
      keys: [field],
      threshold: 0.0, // Exact match
      includeScore: true,
    };

    const exactFuse = new Fuse(this.tasksData, exactOptions);

    const results = exactFuse.search(String(value));
    return results.map(r => r.item);
  }

  /**
   * Get search suggestions based on partial input
   */
  async getSuggestions(partialQuery: string): Promise<string[]> {
    if (!partialQuery || partialQuery.trim().length < 2) {
      return [];
    }

    const combined = await this.quickSearch(partialQuery);
    const suggestions: Set<string> = new Set();

    // Add task names as suggestions
    combined.tasks.forEach(task => {
      suggestions.add(task.name);
    });

    // Add list names as suggestions
    combined.lists.forEach(list => {
      suggestions.add(list.name);
    });

    // Add label names as suggestions
    combined.labels.forEach(label => {
      suggestions.add(label.name);
    });

    return Array.from(suggestions).slice(0, 10);
  }
}

// Export singleton instance
export const searchService = new SearchService();
