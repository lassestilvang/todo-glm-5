/**
 * Search Page
 * 
 * Search across tasks, lists, and labels with:
 * - Search input at top
 * - Results grouped by type (Tasks, Lists, Labels)
 * - Highlight matching text
 * - Show "No results" state
 * - Recent searches (optional)
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Clock, 
  CheckSquare,
  List,
  Tag,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, PresetEmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/common/PageTransition';
import { TaskListSkeleton } from '@/components/common/Skeleton';
import { useSearch, highlightMatches } from '@/hooks/useSearch';
import { useLabels } from '@/hooks/useLabels';
import { useTasks } from '@/hooks/useTasks';
import { useLists } from '@/hooks/useLists';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday, isPast } from 'date-fns';
import type { Task, Label, List as ListType } from '@/types';
import type { SearchResultItem } from '@/hooks/useSearch';

type SearchScope = 'all' | 'tasks' | 'lists' | 'labels';

// ============================================
// RECENT SEARCHES STORAGE
// ============================================

const RECENT_SEARCHES_KEY = 'recent-searches';
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return;
  const recent = getRecentSearches();
  const filtered = recent.filter((s) => s.toLowerCase() !== query.toLowerCase());
  const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const labelId = searchParams.get('label');
  const queryParam = searchParams.get('q');
  
  const [query, setQuery] = useState(queryParam || '');
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(labelId);
  const [scope, setScope] = useState<SearchScope>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const { results, isSearching, setQuery: setSearchQuery } = useSearch();
  const { labels } = useLabels();
  const { tasks, toggleComplete } = useTasks();
  const { lists } = useLists();
  const openTaskEditor = useUIStore((state) => state.openTaskEditor);
  
  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);
  
  // Set initial label filter from URL
  useEffect(() => {
    if (labelId) {
      setSelectedLabelId(labelId);
    }
  }, [labelId]);
  
  // Set initial query from URL
  useEffect(() => {
    if (queryParam) {
      setQuery(queryParam);
      setSearchQuery(queryParam);
    }
  }, [queryParam, setSearchQuery]);
  
  // Update search query with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(query);
      if (query.trim()) {
        saveRecentSearch(query.trim());
        setRecentSearches(getRecentSearches());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, setSearchQuery]);
  
  // Get lists lookup
  const listsLookup = useMemo(() => {
    const lookup: Record<string, ListType> = {};
    lists.forEach((list) => {
      lookup[list.id] = list;
    });
    return lookup;
  }, [lists]);
  
  // Filter results by scope
  const filteredResults = useMemo(() => {
    if (scope === 'all') return results;
    return results.filter((result) => result.type === scope.slice(0, -1)); // 'tasks' -> 'task'
  }, [results, scope]);
  
  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {
      task: [],
      list: [],
      label: [],
    };
    
    filteredResults.forEach((result) => {
      if (groups[result.type]) {
        groups[result.type].push(result);
      }
    });
    
    return groups;
  }, [filteredResults]);
  
  // Filter tasks by label if selected
  const tasksByLabel = useMemo(() => {
    if (!selectedLabelId) return [];
    return tasks.filter((task) => task.labels?.some((l) => l.id === selectedLabelId));
  }, [tasks, selectedLabelId]);
  
  // Get selected label
  const selectedLabel = selectedLabelId
    ? labels.find((l) => l.id === selectedLabelId)
    : null;
  
  // Handle task toggle
  const handleToggleComplete = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      try {
        await toggleComplete(taskId, !task.is_completed);
      } catch (err) {
        console.error('Failed to toggle task:', err);
      }
    }
  }, [tasks, toggleComplete]);
  
  // Handle result click
  const handleResultClick = useCallback((result: SearchResultItem) => {
    if (result.type === 'task') {
      router.push(`/today?task=${result.id}`);
    } else if (result.type === 'list') {
      router.push(`/list/${result.id}`);
    } else if (result.type === 'label') {
      setSelectedLabelId(result.id);
    }
  }, [router]);
  
  // Handle recent search click
  const handleRecentSearchClick = useCallback((search: string) => {
    setQuery(search);
    setSearchQuery(search);
  }, [setSearchQuery]);
  
  // Clear recent searches
  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);
  
  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      case 'list':
        return <List className="h-4 w-4" />;
      case 'label':
        return <Tag className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  return (
    <PageTransition className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Find tasks, lists, and labels
        </p>
      </div>
      
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tasks, lists, labels..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-11"
          autoFocus
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => {
              setQuery('');
              setSearchQuery('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Scope Tabs */}
      <div className="mb-4">
        <Tabs value={scope} onValueChange={(v) => setScope(v as SearchScope)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="lists">Lists</TabsTrigger>
            <TabsTrigger value="labels">Labels</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Label Filter */}
      {labels.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Filter by label:</p>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={!selectedLabelId ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedLabelId(null)}
            >
              All
            </Badge>
            {labels.map((label) => (
              <Badge
                key={label.id}
                variant={selectedLabelId === label.id ? 'default' : 'outline'}
                className="cursor-pointer gap-1"
                style={{
                  borderColor: label.color,
                  backgroundColor: selectedLabelId === label.id ? label.color : 'transparent',
                  color: selectedLabelId === label.id ? 'white' : undefined,
                }}
                onClick={() => setSelectedLabelId(label.id)}
              >
                {label.emoji && <span>{label.emoji}</span>}
                {label.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Results */}
      <div className="flex-1 overflow-auto">
        {isSearching ? (
          <TaskListSkeleton count={3} />
        ) : query.length >= 2 ? (
          // Search results
          filteredResults.length > 0 ? (
            <StaggerContainer className="space-y-6">
              {/* Tasks */}
              {groupedResults.task.length > 0 && (scope === 'all' || scope === 'tasks') && (
                <StaggerItem>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckSquare className="h-4 w-4" />
                      <span>Tasks</span>
                      <Badge variant="secondary" className="text-xs">
                        {groupedResults.task.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {groupedResults.task.map((result) => (
                          <TaskResultRow
                            key={result.id}
                            result={result}
                            list={result.listName ? lists.find(l => l.name === result.listName) : undefined}
                            onToggleComplete={() => handleToggleComplete(result.id)}
                            onClick={() => handleResultClick(result)}
                          />
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              )}
              
              {/* Lists */}
              {groupedResults.list.length > 0 && (scope === 'all' || scope === 'lists') && (
                <StaggerItem>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <List className="h-4 w-4" />
                      <span>Lists</span>
                      <Badge variant="secondary" className="text-xs">
                        {groupedResults.list.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {groupedResults.list.map((result) => (
                        <ListResultRow
                          key={result.id}
                          result={result}
                          onClick={() => handleResultClick(result)}
                        />
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              )}
              
              {/* Labels */}
              {groupedResults.label.length > 0 && (scope === 'all' || scope === 'labels') && (
                <StaggerItem>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <span>Labels</span>
                      <Badge variant="secondary" className="text-xs">
                        {groupedResults.label.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {groupedResults.label.map((result) => (
                        <LabelResultRow
                          key={result.id}
                          result={result}
                          onClick={() => handleResultClick(result)}
                        />
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              )}
            </StaggerContainer>
          ) : (
            <EmptyState
              icon={Search}
              title="No results found"
              description={`No results for "${query}". Try a different search term.`}
            />
          )
        ) : selectedLabelId && selectedLabel ? (
          // Label filter results
          <StaggerContainer className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Tasks with label "{selectedLabel.name}"
            </p>
            {tasksByLabel.length > 0 ? (
              tasksByLabel.map((task) => (
                <StaggerItem key={task.id}>
                  <TaskResultRow
                    result={{
                      id: task.id,
                      type: 'task',
                      name: task.name,
                      description: task.description,
                      dueDate: task.due_date,
                      priority: task.priority,
                      isCompleted: task.is_completed,
                      listName: listsLookup[task.list_id]?.name,
                      matches: [],
                    }}
                    list={listsLookup[task.list_id]}
                    onToggleComplete={() => handleToggleComplete(task.id)}
                    onClick={() => router.push(`/today?task=${task.id}`)}
                  />
                </StaggerItem>
              ))
            ) : (
              <EmptyState
                title="No tasks with this label"
                description={`No tasks have the label "${selectedLabel.name}"`}
              />
            )}
          </StaggerContainer>
        ) : (
          // Recent searches
          recentSearches.length > 0 ? (
            <StaggerContainer className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Recent searches
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={handleClearRecent}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <StaggerItem key={index}>
                    <button
                      onClick={() => handleRecentSearchClick(search)}
                      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{search}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
          ) : (
            <EmptyState
              icon={Search}
              title="Start searching"
              description="Enter a search term to find tasks, lists, and labels"
            />
          )
        )}
      </div>
    </PageTransition>
  );
}

// ============================================
// TASK RESULT ROW
// ============================================

interface TaskResultRowProps {
  result: SearchResultItem;
  list?: ListType;
  onToggleComplete: () => void;
  onClick: () => void;
}

function TaskResultRow({ result, list, onToggleComplete, onClick }: TaskResultRowProps) {
  const dueDate = result.dueDate ? parseISO(result.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !result.isCompleted;
  
  // Get highlighted name
  const highlightedName = result.matches.length > 0
    ? highlightMatches(result.name, result.matches.filter((m) => m.key === 'name'))
    : result.name;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border p-3',
        'hover:bg-muted/50 transition-colors cursor-pointer',
        result.isCompleted && 'opacity-60'
      )}
      onClick={onClick}
    >
      <Checkbox
        checked={result.isCompleted}
        onCheckedChange={onToggleComplete}
        onClick={(e) => e.stopPropagation()}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      
      {list && (
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: list.color }}
          title={list.name}
        />
      )}
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          result.isCompleted && 'line-through text-muted-foreground'
        )}>
          {highlightedName}
        </p>
        {result.description && (
          <p className="text-xs text-muted-foreground truncate">
            {result.description}
          </p>
        )}
      </div>
      
      {result.priority && result.priority > 0 && (
        <Badge variant="outline" className="text-xs">
          P{result.priority}
        </Badge>
      )}
      
      {dueDate && (
        <span className={cn(
          'text-xs',
          isOverdue ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {format(dueDate, 'MMM d')}
        </span>
      )}
      
      <Badge variant="secondary" className="text-xs">
        Task
      </Badge>
    </motion.div>
  );
}

// ============================================
// LIST RESULT ROW
// ============================================

interface ListResultRowProps {
  result: SearchResultItem;
  onClick: () => void;
}

function ListResultRow({ result, onClick }: ListResultRowProps) {
  const highlightedName = result.matches.length > 0
    ? highlightMatches(result.name, result.matches.filter((m) => m.key === 'name'))
    : result.name;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border p-3',
        'hover:bg-muted/50 transition-colors cursor-pointer'
      )}
      onClick={onClick}
    >
      <span
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: result.color || '#3b82f6' }}
      />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate flex items-center gap-2">
          {result.emoji && <span>{result.emoji}</span>}
          {highlightedName}
        </p>
      </div>
      
      <Badge variant="secondary" className="text-xs">
        List
      </Badge>
    </motion.div>
  );
}

// ============================================
// LABEL RESULT ROW
// ============================================

interface LabelResultRowProps {
  result: SearchResultItem;
  onClick: () => void;
}

function LabelResultRow({ result, onClick }: LabelResultRowProps) {
  const highlightedName = result.matches.length > 0
    ? highlightMatches(result.name, result.matches.filter((m) => m.key === 'name'))
    : result.name;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border p-3',
        'hover:bg-muted/50 transition-colors cursor-pointer'
      )}
      onClick={onClick}
    >
      <Badge
        style={{
          backgroundColor: result.color ? `${result.color}20` : undefined,
          color: result.color,
          borderColor: result.color,
        }}
      >
        {result.emoji && <span className="mr-1">{result.emoji}</span>}
        {highlightedName}
      </Badge>
      
      <div className="flex-1" />
      
      <Badge variant="secondary" className="text-xs">
        Label
      </Badge>
    </motion.div>
  );
}
