/**
 * All Tasks Page
 * 
 * Shows all tasks with:
 * - Group by list or date
 * - Show completed tasks toggle
 * - TaskQuickAdd for quick task creation
 * - TaskList with filters
 * - Empty state for no tasks
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  parseISO, 
  isToday, 
  isTomorrow, 
  isThisWeek, 
  isPast,
  startOfDay,
} from 'date-fns';
import { 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  List,
  Calendar,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskQuickAdd } from '@/components/tasks/TaskQuickAdd';
import { TaskFilters, type TaskFilterOptions } from '@/components/tasks/TaskFilters';
import { TaskEditor } from '@/components/tasks/TaskEditor';
import { PresetEmptyState } from '@/components/common/EmptyState';
import { PageTransition, StaggerContainer, StaggerItem, TaskListSkeleton } from '@/components/common';
import { useTasks } from '@/hooks/useTasks';
import { useLists } from '@/hooks/useLists';
import { useLabels } from '@/hooks/useLabels';
import { useUIStore, useTaskStore } from '@/stores';
import { ViewType, type Task, type CreateTaskRequest, type UpdateTaskRequest, SortBy, SortOrder } from '@/types';
import { cn } from '@/lib/utils';

type GroupBy = 'list' | 'date' | 'none';

export default function AllTasksPage() {
  const { tasks, isLoading, error, refetch, createTask, updateTask, deleteTask, toggleComplete } = useTasks();
  const { lists, getDefaultList } = useLists();
  const { labels } = useLabels();
  const openTaskEditor = useUIStore((state) => state.openTaskEditor);
  const closeTaskEditor = useUIStore((state) => state.closeTaskEditor);
  const isTaskEditorOpen = useUIStore((state) => state.isTaskEditorOpen);
  const setViewMode = useTaskStore((state) => state.setViewMode);
  
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('list');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<TaskFilterOptions>({
    sortBy: SortBy.DUE_DATE,
    sortOrder: SortOrder.ASC,
  });
  
  // Set view mode on mount
  useEffect(() => {
    setViewMode(ViewType.ALL);
  }, [setViewMode]);
  
  // Filter tasks based on completion
  const filteredTasks = useMemo(() => {
    if (showCompleted) return tasks;
    return tasks.filter((task) => !task.is_completed);
  }, [tasks, showCompleted]);
  
  // Get lists lookup
  const listsLookup = useMemo(() => {
    const lookup: Record<string, typeof lists[0]> = {};
    lists.forEach((list) => {
      lookup[list.id] = list;
    });
    return lookup;
  }, [lists]);
  
  // Group tasks by list
  const tasksByList = useMemo(() => {
    const groups: Record<string, { list: typeof lists[0] | null; tasks: Task[] }> = {};
    
    filteredTasks.forEach((task) => {
      const listId = task.list_id;
      if (!groups[listId]) {
        groups[listId] = {
          list: listsLookup[listId] || null,
          tasks: [],
        };
      }
      groups[listId].tasks.push(task);
    });
    
    // Sort by list position
    return Object.entries(groups)
      .sort(([, a], [, b]) => {
        if (!a.list) return 1;
        if (!b.list) return -1;
        return a.list.position - b.list.position;
      })
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, { list: typeof lists[0] | null; tasks: Task[] }>);
  }, [filteredTasks, listsLookup]);
  
  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const groups: Record<string, { label: string; tasks: Task[]; color?: string }> = {
      overdue: { label: 'Overdue', tasks: [], color: 'text-red-500' },
      today: { label: 'Today', tasks: [], color: 'text-primary' },
      tomorrow: { label: 'Tomorrow', tasks: [] },
      thisWeek: { label: 'This Week', tasks: [] },
      later: { label: 'Later', tasks: [] },
      noDate: { label: 'No Date', tasks: [] },
    };
    
    const today = startOfDay(new Date());
    
    filteredTasks.forEach((task) => {
      if (!task.due_date) {
        groups.noDate.tasks.push(task);
      } else {
        const dueDate = parseISO(task.due_date);
        if (isPast(dueDate) && !isToday(dueDate)) {
          groups.overdue.tasks.push(task);
        } else if (isToday(dueDate)) {
          groups.today.tasks.push(task);
        } else if (isTomorrow(dueDate)) {
          groups.tomorrow.tasks.push(task);
        } else if (isThisWeek(dueDate)) {
          groups.thisWeek.tasks.push(task);
        } else {
          groups.later.tasks.push(task);
        }
      }
    });
    
    return groups;
  }, [filteredTasks]);
  
  // Toggle group expansion
  const toggleGroupExpand = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);
  
  // Expand groups with tasks on mount
  useEffect(() => {
    if (groupBy === 'list') {
      setExpandedGroups(new Set(Object.keys(tasksByList)));
    } else if (groupBy === 'date') {
      const nonEmptyGroups = Object.entries(tasksByDate)
        .filter(([_, group]) => group.tasks.length > 0)
        .map(([key]) => key);
      setExpandedGroups(new Set(nonEmptyGroups));
    }
  }, [groupBy, tasksByList, tasksByDate]);
  
  // Handle task creation
  const handleAddTask = useCallback(async (taskData: CreateTaskRequest) => {
    try {
      await createTask(taskData);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }, [createTask]);
  
  // Handle task edit
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    openTaskEditor();
  }, [openTaskEditor]);
  
  // Handle task save
  const handleSaveTask = useCallback(async (taskData: CreateTaskRequest | UpdateTaskRequest) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData as UpdateTaskRequest);
      } else {
        await createTask(taskData as CreateTaskRequest);
      }
      setEditingTask(null);
      closeTaskEditor();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  }, [editingTask, createTask, updateTask, closeTaskEditor]);
  
  // Handle task delete
  const handleDeleteTask = useCallback(async () => {
    if (!editingTask) return;
    try {
      await deleteTask(editingTask.id);
      setEditingTask(null);
      closeTaskEditor();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, [editingTask, deleteTask, closeTaskEditor]);
  
  // Handle toggle complete
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
  
  // Loading state
  if (isLoading) {
    return (
      <PageTransition className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">All Tasks</h1>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
        
        {/* Quick Add skeleton */}
        <div className="mb-4">
          <div className="h-10 bg-muted rounded-md animate-pulse" />
        </div>
        
        {/* Task list skeleton */}
        <TaskListSkeleton count={8} showGroupHeader />
      </PageTransition>
    );
  }
  
  // Error state
  if (error) {
    return (
      <PageTransition className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive mb-4">Failed to load tasks</p>
        <Button onClick={() => refetch()}>Try again</Button>
      </PageTransition>
    );
  }
  
  const defaultList = getDefaultList();
  const pendingCount = tasks.filter((t) => !t.is_completed).length;
  const completedCount = tasks.filter((t) => t.is_completed).length;
  
  return (
    <PageTransition className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Tasks</h1>
          <p className="text-muted-foreground">
            {pendingCount} pending, {completedCount} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <TabsList className="h-8">
              <TabsTrigger value="list" className="h-7 px-2">
                <List className="h-3.5 w-3.5 mr-1" />
                List
              </TabsTrigger>
              <TabsTrigger value="date" className="h-7 px-2">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Date
              </TabsTrigger>
              <TabsTrigger value="none" className="h-7 px-2">
                <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                None
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? 'Hide completed' : 'Show completed'}
          </Button>
        </div>
      </div>
      
      {/* Quick Add */}
      <div className="mb-4">
        <TaskQuickAdd
          listId={defaultList?.id}
          onAdd={handleAddTask}
          placeholder="Add a new task..."
          defaultListId={defaultList?.id}
        />
      </div>
      
      {/* Filters */}
      <div className="mb-4">
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          labels={labels}
          showSort={true}
          showCompletionFilter={true}
        />
      </div>
      
      {/* Task Lists */}
      <div className="flex-1 overflow-auto">
        {filteredTasks.length === 0 ? (
          <PresetEmptyState
            preset="noTasks"
            action={{
              label: 'Add task',
              onClick: () => {
                setEditingTask(null);
                openTaskEditor();
              },
            }}
          />
        ) : groupBy === 'list' ? (
          // Group by List
          <StaggerContainer className="space-y-4">
            {Object.entries(tasksByList).map(([listId, { list, tasks: listTasks }]) => {
              const isExpanded = expandedGroups.has(listId);
              const pendingTasks = listTasks.filter((t) => !t.is_completed);
              const completedTasks = listTasks.filter((t) => t.is_completed);
              
              return (
                <StaggerItem key={listId}>
                  <motion.div
                    layout
                    className="rounded-lg border border-border overflow-hidden"
                  >
                    {/* List Header */}
                    <button
                      onClick={() => toggleGroupExpand(listId)}
                      className={cn(
                        'flex items-center gap-2 w-full p-3 text-left transition-colors',
                        'hover:bg-muted/50'
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      
                      {list && (
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                      )}
                      
                      <span className="font-medium">
                        {list?.name || 'Unknown List'}
                      </span>
                      
                      {list?.emoji && <span className="text-sm">{list.emoji}</span>}
                      
                      <div className="ml-auto flex items-center gap-2">
                        {completedTasks.length > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {completedTasks.length}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {pendingTasks.length}
                        </Badge>
                      </div>
                    </button>
                    
                    {/* List Tasks */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-1 border-t border-border pt-2">
                            {pendingTasks.map((task) => (
                              <TaskItemRow
                                key={task.id}
                                task={task}
                                onToggleComplete={() => handleToggleComplete(task.id)}
                                onEdit={() => handleEditTask(task)}
                                showDate
                              />
                            ))}
                            
                            {showCompleted && completedTasks.length > 0 && (
                              <>
                                <div className="h-px bg-border my-2" />
                                {completedTasks.map((task) => (
                                  <TaskItemRow
                                    key={task.id}
                                    task={task}
                                    onToggleComplete={() => handleToggleComplete(task.id)}
                                    onEdit={() => handleEditTask(task)}
                                    showDate
                                  />
                                ))}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        ) : groupBy === 'date' ? (
          // Group by Date
          <StaggerContainer className="space-y-4">
            {Object.entries(tasksByDate).map(([dateKey, group]) => {
              if (group.tasks.length === 0) return null;
              
              const isExpanded = expandedGroups.has(dateKey);
              const pendingTasks = group.tasks.filter((t) => !t.is_completed);
              const completedTasks = group.tasks.filter((t) => t.is_completed);
              
              return (
                <StaggerItem key={dateKey}>
                  <motion.div
                    layout
                    className={cn(
                      'rounded-lg border border-border overflow-hidden',
                      dateKey === 'overdue' && 'border-red-200 dark:border-red-900'
                    )}
                  >
                    {/* Date Header */}
                    <button
                      onClick={() => toggleGroupExpand(dateKey)}
                      className={cn(
                        'flex items-center gap-2 w-full p-3 text-left transition-colors',
                        'hover:bg-muted/50',
                        dateKey === 'overdue' && 'bg-red-50 dark:bg-red-950/20'
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      
                      <Calendar className={cn(
                        'h-4 w-4',
                        group.color || 'text-muted-foreground'
                      )} />
                      
                      <span className={cn('font-medium', group.color)}>
                        {group.label}
                      </span>
                      
                      <div className="ml-auto flex items-center gap-2">
                        {completedTasks.length > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {completedTasks.length}
                          </Badge>
                        )}
                        <Badge 
                          variant={dateKey === 'overdue' ? 'destructive' : 'secondary'} 
                          className="text-xs"
                        >
                          {pendingTasks.length}
                        </Badge>
                      </div>
                    </button>
                    
                    {/* Date Tasks */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-1 border-t border-border pt-2">
                            {pendingTasks.map((task) => (
                              <TaskItemRow
                                key={task.id}
                                task={task}
                                list={listsLookup[task.list_id]}
                                onToggleComplete={() => handleToggleComplete(task.id)}
                                onEdit={() => handleEditTask(task)}
                              />
                            ))}
                            
                            {showCompleted && completedTasks.length > 0 && (
                              <>
                                <div className="h-px bg-border my-2" />
                                {completedTasks.map((task) => (
                                  <TaskItemRow
                                    key={task.id}
                                    task={task}
                                    list={listsLookup[task.list_id]}
                                    onToggleComplete={() => handleToggleComplete(task.id)}
                                    onEdit={() => handleEditTask(task)}
                                  />
                                ))}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        ) : (
          // No grouping
          <StaggerContainer className="space-y-1">
            {filteredTasks.map((task) => (
              <StaggerItem key={task.id}>
                <TaskItemRow
                  task={task}
                  list={listsLookup[task.list_id]}
                  onToggleComplete={() => handleToggleComplete(task.id)}
                  onEdit={() => handleEditTask(task)}
                  showDate
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
      
      {/* Task Editor Dialog */}
      <TaskEditor
        task={editingTask || undefined}
        open={isTaskEditorOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTask(null);
            closeTaskEditor();
          }
        }}
        onSave={handleSaveTask}
        lists={lists}
        labels={labels}
        defaultListId={defaultList?.id}
        onDelete={editingTask ? handleDeleteTask : undefined}
      />
    </PageTransition>
  );
}

// ============================================
// TASK ITEM ROW COMPONENT
// ============================================

interface TaskItemRowProps {
  task: Task;
  list?: { id: string; name: string; color: string; emoji: string | null };
  onToggleComplete: () => void;
  onEdit: () => void;
  showDate?: boolean;
}

function TaskItemRow({ task, list, onToggleComplete, onEdit, showDate = false }: TaskItemRowProps) {
  const dueDate = task.due_date ? parseISO(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.is_completed;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-border bg-background p-3',
        'hover:bg-muted/50 transition-colors cursor-pointer',
        task.is_completed && 'opacity-60',
        isOverdue && 'border-red-200 dark:border-red-900'
      )}
      onClick={onEdit}
    >
      <Checkbox
        checked={task.is_completed}
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
      
      <span
        className={cn(
          'flex-1 text-sm truncate',
          task.is_completed && 'line-through text-muted-foreground'
        )}
      >
        {task.name}
      </span>
      
      {task.priority > 0 && (
        <Badge variant="outline" className="text-xs">
          P{task.priority}
        </Badge>
      )}
      
      {showDate && dueDate && (
        <span className={cn(
          'text-xs',
          isOverdue ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {format(dueDate, 'MMM d')}
        </span>
      )}
      
      {task.due_time && (
        <span className="text-xs text-muted-foreground">
          {task.due_time}
        </span>
      )}
    </motion.div>
  );
}
