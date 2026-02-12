/**
 * Upcoming Page
 * 
 * Shows all future tasks with:
 * - Tasks grouped by time period (This Week, Next Week, This Month, Later)
 * - TaskQuickAdd for quick task creation
 * - TaskList with date grouping
 * - Empty state for no tasks
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  parseISO, 
  isAfter, 
  startOfDay, 
  addDays, 
  addWeeks, 
  addMonths,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isThisWeek,
  isToday,
} from 'date-fns';
import { 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

// ============================================
// TIME PERIOD TYPES
// ============================================

interface TimePeriod {
  id: string;
  label: string;
  icon: React.ReactNode;
  dateRange: { start: Date; end: Date };
  color?: string;
}

export default function UpcomingPage() {
  const { tasks, isLoading, error, refetch, createTask, updateTask, deleteTask, toggleComplete } = useTasks();
  const { lists, getDefaultList } = useLists();
  const { labels } = useLabels();
  const openTaskEditor = useUIStore((state) => state.openTaskEditor);
  const closeTaskEditor = useUIStore((state) => state.closeTaskEditor);
  const isTaskEditorOpen = useUIStore((state) => state.isTaskEditorOpen);
  const setViewMode = useTaskStore((state) => state.setViewMode);
  
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(['thisWeek', 'nextWeek']));
  const [filters, setFilters] = useState<TaskFilterOptions>({
    sortBy: SortBy.DUE_DATE,
    sortOrder: SortOrder.ASC,
  });
  
  // Set view mode on mount
  useEffect(() => {
    setViewMode(ViewType.UPCOMING);
  }, [setViewMode]);
  
  // Get date boundaries
  const today = startOfDay(new Date());
  
  // Define time periods
  const timePeriods = useMemo((): TimePeriod[] => {
    const thisWeekStart = today;
    const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    const nextWeekStart = addDays(thisWeekEnd, 1);
    const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });
    
    const thisMonthStart = startOfMonth(today);
    const thisMonthEnd = endOfMonth(today);
    
    return [
      {
        id: 'thisWeek',
        label: 'This Week',
        icon: <Calendar className="h-4 w-4 text-primary" />,
        dateRange: { start: thisWeekStart, end: thisWeekEnd },
        color: 'text-primary',
      },
      {
        id: 'nextWeek',
        label: 'Next Week',
        icon: <Calendar className="h-4 w-4 text-blue-500" />,
        dateRange: { start: nextWeekStart, end: nextWeekEnd },
        color: 'text-blue-500',
      },
      {
        id: 'thisMonth',
        label: 'Later This Month',
        icon: <Calendar className="h-4 w-4 text-purple-500" />,
        dateRange: { start: nextWeekEnd, end: thisMonthEnd },
        color: 'text-purple-500',
      },
      {
        id: 'future',
        label: 'Future',
        icon: <Clock className="h-4 w-4 text-muted-foreground" />,
        dateRange: { start: thisMonthEnd, end: addMonths(today, 12) },
      },
    ];
  }, [today]);
  
  // Filter upcoming tasks (not completed, due date in the future)
  const upcomingTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.is_completed) return false;
      if (!task.due_date) return false;
      const dueDate = parseISO(task.due_date);
      return isAfter(dueDate, today) || isToday(dueDate);
    });
  }, [tasks, today]);
  
  // Group tasks by time period
  const tasksByPeriod = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    
    timePeriods.forEach((period) => {
      groups[period.id] = upcomingTasks.filter((task) => {
        if (!task.due_date) return false;
        const dueDate = parseISO(task.due_date);
        return isWithinInterval(dueDate, period.dateRange);
      });
    });
    
    // Sort tasks within each period
    Object.keys(groups).forEach((periodId) => {
      groups[periodId].sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
    });
    
    return groups;
  }, [upcomingTasks, timePeriods]);
  
  // Get lists lookup
  const listsLookup = useMemo(() => {
    const lookup: Record<string, typeof lists[0]> = {};
    lists.forEach((list) => {
      lookup[list.id] = list;
    });
    return lookup;
  }, [lists]);
  
  // Toggle period expansion
  const togglePeriodExpand = useCallback((periodId: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(periodId)) {
        next.delete(periodId);
      } else {
        next.add(periodId);
      }
      return next;
    });
  }, []);
  
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
            <h1 className="text-2xl font-bold tracking-tight">Upcoming</h1>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
        
        {/* Quick Add skeleton */}
        <div className="mb-4">
          <div className="h-10 bg-muted rounded-md animate-pulse" />
        </div>
        
        {/* Task list skeleton */}
        <TaskListSkeleton count={5} showGroupHeader />
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
  const totalUpcoming = upcomingTasks.length;
  
  return (
    <PageTransition className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upcoming</h1>
          <p className="text-muted-foreground">
            {totalUpcoming} task{totalUpcoming !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCompleted(!showCompleted)}
        >
          {showCompleted ? 'Hide completed' : 'Show completed'}
        </Button>
      </div>
      
      {/* Quick Add */}
      <div className="mb-4">
        <TaskQuickAdd
          listId={defaultList?.id}
          onAdd={handleAddTask}
          placeholder="Add an upcoming task..."
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
          showCompletionFilter={false}
        />
      </div>
      
      {/* Task Lists by Period */}
      <div className="flex-1 overflow-auto">
        {totalUpcoming === 0 ? (
          <PresetEmptyState
            preset="noTasksUpcoming"
            action={{
              label: 'Add task',
              onClick: () => {
                setEditingTask(null);
                openTaskEditor();
              },
            }}
          />
        ) : (
          <StaggerContainer className="space-y-4">
            {timePeriods.map((period) => {
              const periodTasks = tasksByPeriod[period.id] || [];
              if (periodTasks.length === 0) return null;
              
              const isExpanded = expandedPeriods.has(period.id);
              
              return (
                <StaggerItem key={period.id}>
                  <motion.div
                    layout
                    className="rounded-lg border border-border overflow-hidden"
                  >
                    {/* Period Header */}
                    <button
                      onClick={() => togglePeriodExpand(period.id)}
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
                      
                      {period.icon}
                      
                      <span className={cn('font-medium', period.color)}>
                        {period.label}
                      </span>
                      
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {periodTasks.length}
                      </Badge>
                    </button>
                    
                    {/* Period Tasks */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-1 border-t border-border pt-2">
                            {periodTasks.map((task) => (
                              <TaskItemRow
                                key={task.id}
                                task={task}
                                list={listsLookup[task.list_id]}
                                onToggleComplete={() => handleToggleComplete(task.id)}
                                onEdit={() => handleEditTask(task)}
                                showDate
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </StaggerItem>
              );
            })}
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
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-border bg-background p-3',
        'hover:bg-muted/50 transition-colors cursor-pointer',
        task.is_completed && 'opacity-60'
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
        <span className="text-xs text-muted-foreground">
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
