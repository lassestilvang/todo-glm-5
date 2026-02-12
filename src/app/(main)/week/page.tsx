/**
 * Week Page
 * 
 * Shows tasks for the next 7 days with:
 * - Tasks grouped by date (Today, Tomorrow, Wednesday, etc.)
 * - TaskQuickAdd for quick task creation
 * - TaskList with date grouping
 * - Empty state for no tasks
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  addDays, 
  isWithinInterval, 
  parseISO, 
  isToday, 
  isTomorrow,
  startOfDay,
  isSameDay,
} from 'date-fns';
import { 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  AlertCircle,
  Plus,
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

export default function WeekPage() {
  const { tasks, isLoading, error, refetch, createTask, updateTask, deleteTask, toggleComplete } = useTasks();
  const { lists, getDefaultList } = useLists();
  const { labels } = useLabels();
  const openTaskEditor = useUIStore((state) => state.openTaskEditor);
  const closeTaskEditor = useUIStore((state) => state.closeTaskEditor);
  const isTaskEditorOpen = useUIStore((state) => state.isTaskEditorOpen);
  const setViewMode = useTaskStore((state) => state.setViewMode);
  
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<TaskFilterOptions>({
    sortBy: SortBy.DUE_DATE,
    sortOrder: SortOrder.ASC,
  });
  
  // Set view mode on mount
  useEffect(() => {
    setViewMode(ViewType.WEEK);
  }, [setViewMode]);
  
  // Get date range
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 6); // 7 days including today
  
  // Filter tasks for this week
  const weekTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const dueDate = parseISO(task.due_date);
      return isWithinInterval(dueDate, { start: today, end: weekEnd });
    });
  }, [tasks, today, weekEnd]);
  
  // Group tasks by day
  const tasksByDay = useMemo(() => {
    const groups: Record<string, { date: Date; tasks: Task[] }> = {};
    
    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const key = format(date, 'yyyy-MM-dd');
      groups[key] = { date, tasks: [] };
    }
    
    // Add tasks to their respective days
    weekTasks.forEach((task) => {
      if (!task.due_date) return;
      const key = task.due_date;
      if (groups[key]) {
        groups[key].tasks.push(task);
      }
    });
    
    return groups;
  }, [weekTasks, today]);
  
  // Get lists lookup
  const listsLookup = useMemo(() => {
    const lookup: Record<string, typeof lists[0]> = {};
    lists.forEach((list) => {
      lookup[list.id] = list;
    });
    return lookup;
  }, [lists]);
  
  // Toggle day expansion
  const toggleDayExpand = useCallback((dateKey: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  }, []);
  
  // Expand days with tasks on mount
  useEffect(() => {
    const daysWithTasks = Object.entries(tasksByDay)
      .filter(([_, { tasks }]) => tasks.some((t) => !t.is_completed))
      .map(([key]) => key);
    setExpandedDays(new Set(daysWithTasks));
  }, [tasksByDay]);
  
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
  
  // Get day label
  const getDayLabel = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE');
  };
  
  // Loading state
  if (isLoading) {
    return (
      <PageTransition className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">This Week</h1>
            <p className="text-muted-foreground">
              {format(today, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        
        {/* Quick Add skeleton */}
        <div className="mb-4">
          <div className="h-10 bg-muted rounded-md animate-pulse" />
        </div>
        
        {/* Task list skeleton */}
        <TaskListSkeleton count={7} showGroupHeader />
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
  const totalPending = weekTasks.filter((t) => !t.is_completed).length;
  const totalCompleted = weekTasks.filter((t) => t.is_completed).length;
  
  return (
    <PageTransition className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">This Week</h1>
          <p className="text-muted-foreground">
            {format(today, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {totalPending} pending
          </Badge>
          {totalCompleted > 0 && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {totalCompleted} done
            </Badge>
          )}
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
          placeholder="Add a task for this week..."
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
      
      {/* Task Lists by Day */}
      <div className="flex-1 overflow-auto">
        {totalPending === 0 && totalCompleted === 0 ? (
          <PresetEmptyState
            preset="noTasksWeek"
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
            {Object.entries(tasksByDay).map(([dateKey, { date, tasks: dayTasks }]) => {
              const pendingTasks = dayTasks.filter((t) => !t.is_completed);
              const completedTasks = dayTasks.filter((t) => t.is_completed);
              const displayTasks = showCompleted ? dayTasks : pendingTasks;
              const isExpanded = expandedDays.has(dateKey);
              const isCurrentDay = isToday(date);
              
              if (displayTasks.length === 0) return null;
              
              return (
                <StaggerItem key={dateKey}>
                  <motion.div
                    layout
                    className="rounded-lg border border-border overflow-hidden"
                  >
                    {/* Day Header */}
                    <button
                      onClick={() => toggleDayExpand(dateKey)}
                      className={cn(
                        'flex items-center gap-2 w-full p-3 text-left transition-colors',
                        'hover:bg-muted/50',
                        isCurrentDay && 'bg-primary/5'
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      
                      <Calendar className={cn(
                        'h-4 w-4',
                        isCurrentDay ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      
                      <span className={cn(
                        'font-medium',
                        isCurrentDay && 'text-primary'
                      )}>
                        {getDayLabel(date)}
                      </span>
                      
                      <span className="text-sm text-muted-foreground">
                        {format(date, 'MMM d')}
                      </span>
                      
                      <div className="ml-auto flex items-center gap-2">
                        {completedTasks.length > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {completedTasks.length}
                          </Badge>
                        )}
                        <Badge variant={isCurrentDay ? 'default' : 'secondary'} className="text-xs">
                          {pendingTasks.length}
                        </Badge>
                      </div>
                    </button>
                    
                    {/* Day Tasks */}
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
}

function TaskItemRow({ task, list, onToggleComplete, onEdit }: TaskItemRowProps) {
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
      
      {task.due_time && (
        <span className="text-xs text-muted-foreground">
          {task.due_time}
        </span>
      )}
    </motion.div>
  );
}
