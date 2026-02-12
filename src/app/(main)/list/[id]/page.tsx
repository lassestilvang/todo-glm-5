/**
 * List Detail Page
 * 
 * Shows tasks for a specific list with:
 * - ListHeader component with list info
 * - TaskQuickAdd with list pre-selected
 * - TaskList with filters
 * - Empty state specific to list
 * - Handle 404 for invalid list ID
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  parseISO, 
  isToday, 
  isPast,
  startOfDay,
} from 'date-fns';
import { 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskQuickAdd } from '@/components/tasks/TaskQuickAdd';
import { TaskFilters, type TaskFilterOptions } from '@/components/tasks/TaskFilters';
import { TaskEditor } from '@/components/tasks/TaskEditor';
import { ListHeader } from '@/components/lists/ListHeader';
import { PresetEmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageTransition, StaggerContainer, StaggerItem, TaskListSkeleton } from '@/components/common';
import { useTasks } from '@/hooks/useTasks';
import { useList, useLists } from '@/hooks/useLists';
import { useLabels } from '@/hooks/useLabels';
import { useUIStore, useListStore } from '@/stores';
import { type Task, type CreateTaskRequest, type UpdateTaskRequest, SortBy, SortOrder } from '@/types';
import { cn } from '@/lib/utils';

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;
  
  const { tasks, isLoading: tasksLoading, refetch, createTask, updateTask, deleteTask, toggleComplete } = useTasks();
  const { list, isLoading: listLoading, error: listError } = useList(listId);
  const { lists, updateList, deleteList } = useLists();
  const { labels } = useLabels();
  const openTaskEditor = useUIStore((state) => state.openTaskEditor);
  const closeTaskEditor = useUIStore((state) => state.closeTaskEditor);
  const isTaskEditorOpen = useUIStore((state) => state.isTaskEditorOpen);
  const setSelectedListId = useListStore((state) => state.setSelectedListId);
  
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['pending']));
  const [filters, setFilters] = useState<TaskFilterOptions>({
    sortBy: SortBy.DUE_DATE,
    sortOrder: SortOrder.ASC,
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isListEditorOpen, setIsListEditorOpen] = useState(false);
  
  // Set selected list on mount
  useEffect(() => {
    setSelectedListId(listId);
    return () => setSelectedListId(null);
  }, [listId, setSelectedListId]);
  
  // Filter tasks for this list
  const listTasks = useMemo(() => {
    return tasks.filter((task) => task.list_id === listId);
  }, [tasks, listId]);
  
  const pendingTasks = listTasks.filter((t) => !t.is_completed);
  const completedTasks = listTasks.filter((t) => t.is_completed);
  
  // Group pending tasks by date
  const tasksByDate = useMemo(() => {
    const groups: Record<string, { label: string; tasks: Task[]; color?: string }> = {
      overdue: { label: 'Overdue', tasks: [], color: 'text-red-500' },
      today: { label: 'Today', tasks: [], color: 'text-primary' },
      future: { label: 'Upcoming', tasks: [] },
      noDate: { label: 'No Date', tasks: [] },
    };
    
    const today = startOfDay(new Date());
    
    pendingTasks.forEach((task) => {
      if (!task.due_date) {
        groups.noDate.tasks.push(task);
      } else {
        const dueDate = parseISO(task.due_date);
        if (isPast(dueDate) && !isToday(dueDate)) {
          groups.overdue.tasks.push(task);
        } else if (isToday(dueDate)) {
          groups.today.tasks.push(task);
        } else {
          groups.future.tasks.push(task);
        }
      }
    });
    
    return groups;
  }, [pendingTasks]);
  
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
  
  // Handle task creation
  const handleAddTask = useCallback(async (taskData: CreateTaskRequest) => {
    try {
      await createTask({
        ...taskData,
        list_id: listId,
      });
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }, [createTask, listId]);
  
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
  
  // Handle list delete
  const handleDeleteList = useCallback(async () => {
    if (!list || list.is_default) return;
    try {
      await deleteList(list.id);
      router.push('/today');
    } catch (err) {
      console.error('Failed to delete list:', err);
    }
  }, [list, deleteList, router]);
  
  const isLoading = tasksLoading || listLoading;
  
  // Loading state
  if (isLoading) {
    return (
      <PageTransition className="flex flex-col h-full">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
          <div>
            <div className="h-7 w-32 bg-muted rounded animate-pulse mb-1" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
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
  
  // 404 state
  if (!list) {
    return (
      <PageTransition className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">List not found</h2>
        <p className="text-muted-foreground mb-4">
          This list doesn't exist or has been deleted.
        </p>
        <Button onClick={() => router.push('/today')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go to Today
        </Button>
      </PageTransition>
    );
  }
  
  return (
    <PageTransition className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: list.color }}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {list.emoji && <span>{list.emoji}</span>}
              {list.name}
            </h1>
            <p className="text-muted-foreground">
              {pendingTasks.length} pending, {completedTasks.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsListEditorOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit list
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/settings?tab=lists`)}>
                <Settings className="mr-2 h-4 w-4" />
                List settings
              </DropdownMenuItem>
              {!list.is_default && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete list
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Quick Add */}
      <div className="mb-4">
        <TaskQuickAdd
          listId={listId}
          onAdd={handleAddTask}
          placeholder={`Add a task to "${list.name}"...`}
          defaultListId={listId}
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
        {listTasks.length === 0 ? (
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
        ) : (
          <StaggerContainer className="space-y-4">
            {/* Pending tasks grouped by date */}
            {Object.entries(tasksByDate).map(([dateKey, group]) => {
              if (group.tasks.length === 0) return null;
              
              const isExpanded = expandedGroups.has(dateKey);
              
              return (
                <StaggerItem key={dateKey}>
                  <motion.div
                    layout
                    className={cn(
                      'rounded-lg border border-border overflow-hidden',
                      dateKey === 'overdue' && 'border-red-200 dark:border-red-900'
                    )}
                  >
                    {/* Group Header */}
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
                      
                      <span className={cn('font-medium', group.color)}>
                        {group.label}
                      </span>
                      
                      <Badge 
                        variant={dateKey === 'overdue' ? 'destructive' : 'secondary'} 
                        className="ml-auto text-xs"
                      >
                        {group.tasks.length}
                      </Badge>
                    </button>
                    
                    {/* Group Tasks */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-1 border-t border-border pt-2">
                            {group.tasks.map((task) => (
                              <TaskItemRow
                                key={task.id}
                                task={task}
                                onToggleComplete={() => handleToggleComplete(task.id)}
                                onEdit={() => handleEditTask(task)}
                                showDate={dateKey === 'future'}
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
            
            {/* Completed tasks */}
            <AnimatePresence>
              {showCompleted && completedTasks.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-lg border border-border">
                    <button
                      onClick={() => toggleGroupExpand('completed')}
                      className="flex items-center gap-2 w-full p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      {expandedGroups.has('completed') ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      
                      <span className="font-medium text-muted-foreground">
                        Completed
                      </span>
                      
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {completedTasks.length}
                      </Badge>
                    </button>
                    
                    <AnimatePresence>
                      {expandedGroups.has('completed') && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-1 border-t border-border pt-2">
                            {completedTasks.map((task) => (
                              <TaskItemRow
                                key={task.id}
                                task={task}
                                onToggleComplete={() => handleToggleComplete(task.id)}
                                onEdit={() => handleEditTask(task)}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Show completed toggle */}
            {completedTasks.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? 'Hide' : 'Show'} {completedTasks.length} completed task{completedTasks.length !== 1 ? 's' : ''}
              </Button>
            )}
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
        defaultListId={listId}
        onDelete={editingTask ? handleDeleteTask : undefined}
      />
      
      {/* Delete List Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete list"
        description={`Are you sure you want to delete "${list.name}"? This will also delete all tasks in this list. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteList}
        variant="destructive"
      />
    </PageTransition>
  );
}

// ============================================
// TASK ITEM ROW COMPONENT
// ============================================

interface TaskItemRowProps {
  task: Task;
  onToggleComplete: () => void;
  onEdit: () => void;
  showDate?: boolean;
}

function TaskItemRow({ task, onToggleComplete, onEdit, showDate = false }: TaskItemRowProps) {
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
