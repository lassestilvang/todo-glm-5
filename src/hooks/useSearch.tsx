/**
 * useSearch Hook
 * 
 * Custom hook for searching tasks, lists, and labels with:
 * - Debounced search
 * - Fuzzy search support
 * - Keyboard navigation
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Fuse, { FuseResultMatch, FuseOptionKey, IFuseOptions } from 'fuse.js';
import type { 
  Task, 
  List, 
  Label, 
  SearchParams,
  ApiResponse,
} from '@/types';
import { useTaskStore, useListStore, useLabelStore } from '@/stores';

// ============================================
// TYPES
// ============================================

export interface SearchResultItem {
  id: string;
  type: 'task' | 'list' | 'label';
  name: string;
  description?: string | null;
  emoji?: string | null;
  color?: string;
  dueDate?: string | null;
  priority?: number;
  isCompleted?: boolean;
  listName?: string;
  matches: readonly FuseResultMatch[];
}

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResultItem[];
  isSearching: boolean;
  clearSearch: () => void;
  
  // Keyboard navigation
  selectedIndex: number;
  selectNext: () => void;
  selectPrevious: () => void;
  selectFirst: () => void;
  selectLast: () => void;
  selectedResult: SearchResultItem | null;
}

// ============================================
// FUZZY SEARCH CONFIGURATION
// ============================================

const taskSearchKeys: FuseOptionKey<Task>[] = [
  { name: 'name', weight: 2 },
  { name: 'description', weight: 1 },
];

const listSearchKeys: FuseOptionKey<List>[] = [
  { name: 'name', weight: 2 },
];

const labelSearchKeys: FuseOptionKey<Label>[] = [
  { name: 'name', weight: 2 },
];

const fuseOptions: IFuseOptions<unknown> = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

// ============================================
// DEBOUNCE HOOK
// ============================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// ============================================
// MAIN HOOK
// ============================================

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxResults = 20,
  } = options;
  
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const tasks = useTaskStore((state) => state.tasks);
  const lists = useListStore((state) => state.lists);
  const labels = useLabelStore((state) => state.labels);
  
  // Debounce the search query
  const debouncedQuery = useDebounce(query, debounceMs);
  
  // Create Fuse instances
  const taskFuse = useMemo(() => new Fuse(tasks, {
    ...fuseOptions,
    keys: taskSearchKeys,
  }), [tasks]);
  
  const listFuse = useMemo(() => new Fuse(lists, {
    ...fuseOptions,
    keys: listSearchKeys,
  }), [lists]);
  
  const labelFuse = useMemo(() => new Fuse(labels, {
    ...fuseOptions,
    keys: labelSearchKeys,
  }), [labels]);
  
  // Perform search
  const results = useMemo((): SearchResultItem[] => {
    if (!debouncedQuery || debouncedQuery.length < minQueryLength) {
      return [];
    }
    
    const searchResults: SearchResultItem[] = [];
    
    // Search tasks
    const taskResults = taskFuse.search(debouncedQuery, { limit: maxResults });
    taskResults.forEach((result) => {
      const task = result.item;
      const list = lists.find((l) => l.id === task.list_id);
      
      searchResults.push({
        id: task.id,
        type: 'task',
        name: task.name,
        description: task.description,
        dueDate: task.due_date,
        priority: task.priority,
        isCompleted: task.is_completed,
        listName: list?.name,
        matches: result.matches || [],
      });
    });
    
    // Search lists
    const listResults = listFuse.search(debouncedQuery, { limit: maxResults / 2 });
    listResults.forEach((result) => {
      const list = result.item;
      searchResults.push({
        id: list.id,
        type: 'list',
        name: list.name,
        emoji: list.emoji,
        color: list.color,
        matches: result.matches || [],
      });
    });
    
    // Search labels
    const labelResults = labelFuse.search(debouncedQuery, { limit: maxResults / 2 });
    labelResults.forEach((result) => {
      const label = result.item;
      searchResults.push({
        id: label.id,
        type: 'label',
        name: label.name,
        emoji: label.emoji,
        color: label.color,
        matches: result.matches || [],
      });
    });
    
    // Sort by relevance (score) and limit results
    return searchResults.slice(0, maxResults);
  }, [debouncedQuery, taskFuse, listFuse, labelFuse, lists, minQueryLength, maxResults]);
  
  // Update searching state
  useEffect(() => {
    if (query !== debouncedQuery) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [query, debouncedQuery]);
  
  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
  }, []);
  
  // Keyboard navigation
  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => 
      prev < results.length - 1 ? prev + 1 : prev
    );
  }, [results.length]);
  
  const selectPrevious = useCallback(() => {
    setSelectedIndex((prev) => 
      prev > 0 ? prev - 1 : prev
    );
  }, []);
  
  const selectFirst = useCallback(() => {
    setSelectedIndex(0);
  }, []);
  
  const selectLast = useCallback(() => {
    setSelectedIndex(results.length - 1);
  }, [results.length]);
  
  // Selected result
  const selectedResult = useMemo(
    () => results[selectedIndex] || null,
    [results, selectedIndex]
  );
  
  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
    selectedIndex,
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
    selectedResult,
  };
}

// ============================================
// API SEARCH HOOK
// ============================================

interface UseApiSearchOptions {
  debounceMs?: number;
  scope?: 'all' | 'tasks' | 'lists' | 'labels';
}

interface UseApiSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  tasks: Task[];
  lists: List[];
  labels: Label[];
  isLoading: boolean;
  error: Error | null;
  clearSearch: () => void;
}

/**
 * Hook for server-side search via API
 */
export function useApiSearch(options: UseApiSearchOptions = {}): UseApiSearchReturn {
  const { debounceMs = 300, scope = 'all' } = options;
  
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Debounce the search query
  const debouncedQuery = useDebounce(query, debounceMs);
  
  // Perform search
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setTasks([]);
      setLists([]);
      setLabels([]);
      return;
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    const performSearch = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          query: debouncedQuery,
          scope,
        });
        
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: abortControllerRef.current?.signal,
        });
        
        const data: ApiResponse<{
          tasks: Task[];
          lists: List[];
          labels: Label[];
        }> = await response.json();
        
        if (!data.success || !data.data) {
          throw new Error(data.error?.message || 'Search failed');
        }
        
        setTasks(data.data.tasks);
        setLists(data.data.lists);
        setLabels(data.data.labels);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err : new Error('Search failed'));
      } finally {
        setIsLoading(false);
      }
    };
    
    performSearch();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, scope]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setTasks([]);
    setLists([]);
    setLabels([]);
    setError(null);
  }, []);
  
  return {
    query,
    setQuery,
    tasks,
    lists,
    labels,
    isLoading,
    error,
    clearSearch,
  };
}

// ============================================
// QUICK SEARCH HOOK
// ============================================

/**
 * Hook for quick search with keyboard shortcut
 */
export function useQuickSearch() {
  const [isOpen, setIsOpen] = useState(false);
  
  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const toggleSearch = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);
  
  // Listen for keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
      
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleSearch, closeSearch]);
  
  return {
    isOpen,
    openSearch,
    closeSearch,
    toggleSearch,
  };
}

// ============================================
// SEARCH HIGHLIGHT UTILITY
// ============================================

/**
 * Highlight matched text in search results
 */
export function highlightMatches(
  text: string, 
  matches: readonly FuseResultMatch[]
): React.ReactNode[] {
  if (!matches.length) {
    return [text];
  }
  
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Sort matches by index
  const sortedMatches = [...matches].sort((a, b) => {
    const aStart = a.indices[0]?.[0] ?? 0;
    const bStart = b.indices[0]?.[0] ?? 0;
    return aStart - bStart;
  });
  
  sortedMatches.forEach((match, matchIndex) => {
    match.indices.forEach(([start, end]) => {
      // Add text before match
      if (start > lastIndex) {
        result.push(text.slice(lastIndex, start));
      }
      
      // Add matched text with highlight
      result.push(
        <mark key={`${matchIndex}-${start}`} className="bg-primary/30 text-inherit rounded px-0.5">
          {text.slice(start, end + 1)}
        </mark>
      );
      
      lastIndex = end + 1;
    });
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }
  
  return result;
}
