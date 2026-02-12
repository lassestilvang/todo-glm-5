/**
 * Today Page
 * 
 * Shows tasks due today with:
 * - Overdue tasks prominently displayed at top
 * - TaskQuickAdd for quick task creation
 * - TaskList with date grouping
 * - Toggle for completed tasks
 * - Empty state for no tasks
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, parseISO, isBefore, startOfDay } from 'date-fns';
import { AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskQuickAdd } from '@/components/tasks/TaskQuickAdd';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFilters, type TaskFilterOptions } from '@/components/tasks/TaskFilters';
import { TaskEditor } from '@/components/tasks/TaskEditor';
import { PresetEmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner, LoadingPage } from '@/components/common/LoadingSpinner';
import { PageTransition, StaggerContainer, StaggerItem, TaskListSkeleton } from '@/components/common';
import { useTasks } from '@/hooks/useTasks';
import { useLists } from '@/hooks/useLists';
import { useLabels } from '@/hooks/useLabels';
import { useUIStore, useTaskStore, useOverdueCount } from '@/stores';
import { ViewType, type Task, type CreateTaskRequest, type UpdateTaskRequest, SortBy, SortOrder, Priority } from '@/types';
import { cn } from '@/lib/utils';

export default function TodayPage() {
  const { tasks, isLoading, error, refetch, createTask, updateTask, deleteTask, toggleComplete } = useTasks();
  const { lists, getDefaultList } = useLists();
  const { labels } = useLabels();
  const openTaskEditor = useUIStore((state) => state.openTaskEditor);
  const closeTaskEditor = useUIStore((state) => state.closeTaskEditor);
  const isTaskEditorOpen = useUIStore((state) => state.isTaskEditorOpen);
  const setViewMode = useTaskStore((state) => state.setViewMode);
  const setSelectedTaskId = useTaskStore((state) => state.setSelectedTaskId);
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const overdueCount = useOverdueCount();
  
  const [showCompleted, setShowCompleted] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedOverdue, setExpandedOverdue] = useState(true);
  const [filters, setFilters] = useState<TaskFilterOptions>({
    sortBy: SortBy.DUE_DATE,
    sortOrder: SortOrder.ASC,
  });
  
  // Set view mode on mount
  useEffect(() => {
    setViewMode(ViewType.TODAY);
  }, [setViewMode]);
  
  // Get today's date
  const today = startOfDay(new Date());
  const todayStr = today.toISOString().split('T')[0];
  
  // Filter tasks
  const todayTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const dueDate = parseISO(task.due_date);
      return isToday(dueDate);
    });
  }, [tasks]);
  
  const overdueTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.is_completed || !task.due_date) return false;
      const dueDate = parseISO(task.due_date);
      return isBefore(dueDate, today);
    });
  }, [tasks, today]);
  
  const pendingTodayTasks = todayTasks.filter((t) => !t.is_completed);
  const completedTodayTasks = todayTasks.filter((t) => t.is_completed);
  
  // Get lists lookup
  const listsLookup = useMemo(() => {
    const lookup: Record<string, typeof lists[0]> = {};
    lists.forEach((list) => {
      lookup[list.id] = list;
    });
    return lookup;
  }, [lists]);
  
  // Handle task creation
  const handleAddTask = useCallback(async (taskData: CreateTaskRequest) => {
    try {
      await createTask({
        ...taskData,
        due_date: taskData.due_date || todayStr,
      });
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }, [createTask, todayStr]);
  
  // Handle task edit
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setSelectedTaskId(task.id);
    openTaskEditor();
  }, [openTaskEditor, setSelectedTaskId]);
  
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
            <h1 className="text-2xl font-bold tracking-tight">Today</h1>
            <p className="text-muted-foreground">
              {format(today, 'EEEE, MMMM d, yyyy')}
            </p>
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
  const hasAnyTasks = pendingTodayTasks.length > 0 || completedTodayTasks.length > 0 || overdueTasks.length > 0;
  
  return (
    <PageTransition className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
          <p className="text-muted-foreground">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overdueTasks.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {overdueTasks.length} overdue
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
          placeholder="Add a task for today..."
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
      
      {/* Task Lists */}
      <div className="flex-1 overflow-auto">
        {!hasAnyTasks ? (
          <PresetEmptyState
            preset="noTasksToday"
            action={{
              label: 'Add task',
              onClick: () => {
                setEditingTask(null);
                openTaskEditor();
              },
            }}
          />
        ) : (
          <StaggerContainer className="space-y-6">
            {/* Overdue Section */}
            <AnimatePresence>
              {overdueTasks.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                    {/* Overdue Header */}
                    <button
                      onClick={() => setExpandedOverdue(!expandedOverdue)}
                      className="flex items-center gap-2 w-full p-3 text-left hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors rounded-t-lg"
                    >
                      {expandedOverdue ? (
                        <ChevronDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-red-500" />
                      )}
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-red-600 dark:text-red-400">
                        Overdue
                      </span>
                      <Badge variant="destructive" className="ml-auto">
                        {overdueTasks.length}
                      </Badge>
                    </button>
                    
                    {/* Overdue Tasks */}
                    <AnimatePresence>
                      {expandedOverdue && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-1">
                            {overdueTasks.map((task, index) => (
                              <StaggerItem key={task.id}>
                                <TaskItemRow
                                  task={task}
                                  list={listsLookup[task.list_id]}
                                  onToggleComplete={() => handleToggleComplete(task.id)}
                                  onEdit={() => handleEditTask(task)}
                                />
                              </StaggerItem>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Today's Pending Tasks */}
            {pendingTodayTasks.length > 0 && (
              <StaggerItem>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Today</span>
                    <Badge variant="secondary" className="text-xs">
                      {pendingTodayTasks.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {pendingTodayTasks.map((task) => (
                      <StaggerItem key={task.id}>
                        <TaskItemRow
                          task={task}
                          list={listsLookup[task.list_id]}
                          onToggleComplete={() => handleToggleComplete(task.id)}
                          onEdit={() => handleEditTask(task)}
                        />
                      </StaggerItem>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            )}
            
            {/* Completed Tasks */}
            <AnimatePresence>
              {showCompleted && completedTodayTasks.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Completed
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {completedTodayTasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {completedTodayTasks.map((task) => (
                        <StaggerItem key={task.id}>
                          <TaskItemRow
                            task={task}
                            list={listsLookup[task.list_id]}
                            onToggleComplete={() => handleToggleComplete(task.id)}
                            onEdit={() => handleEditTask(task)}
                          />
                        </StaggerItem>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
        'group flex items-center gap-3 rounded-lg border border-border p-3',
        'hover:bg-muted/50 transition-colors cursor-pointer',
        task.is_completed && 'bg-muted/30 opacity-60'
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
