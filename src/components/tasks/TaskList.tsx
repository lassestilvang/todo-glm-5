/**
 * TaskList Component
 * 
 * Displays a list of tasks with:
 * - Virtualization for performance
 * - Group tasks by date or priority
 * - Drag and drop reordering
 * - Show completed tasks toggle
 * - Empty state when no tasks
 */

'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  ListFilter, 
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskItem, TaskItemSkeleton } from './TaskItem';
import { SubtaskList } from './SubtaskList';
import { PresetEmptyState } from '@/components/common/EmptyState';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Task, Subtask, Label, List, Priority, SortBy, SortOrder } from '@/types';
import type { WithClassName } from '@/types';

// ============================================
// ANIMATION VARIANTS
// ============================================

const groupVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const taskVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: {
      duration: 0.2,
    },
  },
};

const expandVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.1 },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
};

// ============================================
// TYPES
// ============================================

interface TaskListProps extends WithClassName {
  tasks: Task[];
  subtasks?: Record<string, Subtask[]>;
  labels?: Record<string, Label[]>;
  lists?: Record<string, List>;
  groupBy?: 'date' | 'priority' | 'none';
  showCompleted?: boolean;
  onTaskClick?: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTasks?: (taskIds: string[]) => void;
  onAddSubtask?: (taskId: string, name: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onUpdateSubtask?: (taskId: string, subtaskId: string, name: string) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  isLoading?: boolean;
  showGroupHeaders?: boolean;
}

interface TaskGroup {
  id: string;
  label: string;
  tasks: Task[];
  icon?: React.ReactNode;
  color?: string;
}

// ============================================
// GROUPING UTILITIES
// ============================================

function groupTasksByDate(tasks: Task[]): TaskGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const groups: Record<string, TaskGroup> = {
    overdue: {
      id: 'overdue',
      label: 'Overdue',
      tasks: [],
      icon: <Calendar className="h-4 w-4 text-red-500" />,
      color: 'text-red-500',
    },
    today: {
      id: 'today',
      label: 'Today',
      tasks: [],
      icon: <Calendar className="h-4 w-4 text-primary" />,
      color: 'text-primary',
    },
    tomorrow: {
      id: 'tomorrow',
      label: 'Tomorrow',
      tasks: [],
      icon: <Calendar className="h-4 w-4" />,
    },
    thisWeek: {
      id: 'thisWeek',
      label: 'This Week',
      tasks: [],
      icon: <Calendar className="h-4 w-4" />,
    },
    later: {
      id: 'later',
      label: 'Later',
      tasks: [],
      icon: <Calendar className="h-4 w-4" />,
    },
    noDate: {
      id: 'noDate',
      label: 'No Date',
      tasks: [],
      icon: <Circle className="h-4 w-4" />,
    },
  };
  
  tasks.forEach((task) => {
    if (!task.due_date) {
      groups.noDate.tasks.push(task);
    } else {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        groups.overdue.tasks.push(task);
      } else if (dueDate.getTime() === today.getTime()) {
        groups.today.tasks.push(task);
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        groups.tomorrow.tasks.push(task);
      } else if (dueDate < nextWeek) {
        groups.thisWeek.tasks.push(task);
      } else {
        groups.later.tasks.push(task);
      }
    }
  });
  
  // Return only non-empty groups in order
  const order = ['overdue', 'today', 'tomorrow', 'thisWeek', 'later', 'noDate'];
  return order
    .filter((id) => groups[id].tasks.length > 0)
    .map((id) => groups[id]);
}

function groupTasksByPriority(tasks: Task[]): TaskGroup[] {
  const groups: Record<string, TaskGroup> = {
    urgent: {
      id: 'urgent',
      label: 'Urgent',
      tasks: [],
      color: 'text-red-500',
    },
    high: {
      id: 'high',
      label: 'High',
      tasks: [],
      color: 'text-orange-500',
    },
    medium: {
      id: 'medium',
      label: 'Medium',
      tasks: [],
      color: 'text-yellow-500',
    },
    low: {
      id: 'low',
      label: 'Low',
      tasks: [],
      color: 'text-blue-500',
    },
    none: {
      id: 'none',
      label: 'No Priority',
      tasks: [],
      color: 'text-muted-foreground',
    },
  };
  
  tasks.forEach((task) => {
    switch (task.priority) {
      case 4:
        groups.urgent.tasks.push(task);
        break;
      case 3:
        groups.high.tasks.push(task);
        break;
      case 2:
        groups.medium.tasks.push(task);
        break;
      case 1:
        groups.low.tasks.push(task);
        break;
      default:
        groups.none.tasks.push(task);
    }
  });
  
  const order = ['urgent', 'high', 'medium', 'low', 'none'];
  return order
    .filter((id) => groups[id].tasks.length > 0)
    .map((id) => groups[id]);
}

// ============================================
// COMPONENT
// ============================================

export function TaskList({
  tasks,
  subtasks = {},
  labels = {},
  lists = {},
  groupBy = 'none',
  showCompleted = true,
  onTaskClick,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onReorderTasks,
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  isLoading = false,
  showGroupHeaders = true,
  className,
}: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['overdue', 'today']));
  
  // Filter tasks by completion
  const filteredTasks = useMemo(() => {
    if (showCompleted) return tasks;
    return tasks.filter((task) => !task.is_completed);
  }, [tasks, showCompleted]);
  
  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'date') {
      return groupTasksByDate(filteredTasks);
    } else if (groupBy === 'priority') {
      return groupTasksByPriority(filteredTasks);
    }
    return [{ id: 'all', label: 'All Tasks', tasks: filteredTasks }];
  }, [filteredTasks, groupBy]);
  
  // Toggle task expansion
  const toggleTaskExpand = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);
  
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
  
  // Handle reorder
  const handleReorder = useCallback(
    (newOrder: Task[], groupId: string) => {
      if (onReorderTasks) {
        onReorderTasks(newOrder.map((t) => t.id));
      }
    },
    [onReorderTasks]
  );
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <TaskItemSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  // Empty state
  if (filteredTasks.length === 0) {
    return (
      <PresetEmptyState
        preset="noTasks"
        action={onTaskClick ? {
          label: 'Add task',
          onClick: () => onTaskClick({} as Task),
        } : undefined}
        className={className}
      />
    );
  }
  
  return (
    <ScrollArea className={cn('flex-1', className)}>
      <div className="space-y-4 pb-4">
        {groupedTasks.map((group) => (
          <TaskGroup
            key={group.id}
            group={group}
            subtasks={subtasks}
            labels={labels}
            lists={lists}
            isExpanded={expandedGroups.has(group.id)}
            onToggleExpand={() => toggleGroupExpand(group.id)}
            expandedTasks={expandedTasks}
            onToggleTaskExpand={toggleTaskExpand}
            onTaskClick={onTaskClick}
            onToggleComplete={onToggleComplete}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onReorder={onReorderTasks ? handleReorder : undefined}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onUpdateSubtask={onUpdateSubtask}
            onDeleteSubtask={onDeleteSubtask}
            showGroupHeaders={showGroupHeaders && groupedTasks.length > 1}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================
// TASK GROUP COMPONENT
// ============================================

interface TaskGroupProps {
  group: TaskGroup;
  subtasks: Record<string, Subtask[]>;
  labels: Record<string, Label[]>;
  lists: Record<string, List>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedTasks: Set<string>;
  onToggleTaskExpand: (taskId: string) => void;
  onTaskClick?: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onReorder?: (newOrder: Task[], groupId: string) => void;
  onAddSubtask?: (taskId: string, name: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onUpdateSubtask?: (taskId: string, subtaskId: string, name: string) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  showGroupHeaders: boolean;
}

function TaskGroup({
  group,
  subtasks,
  labels,
  lists,
  isExpanded,
  onToggleExpand,
  expandedTasks,
  onToggleTaskExpand,
  onTaskClick,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onReorder,
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  showGroupHeaders,
}: TaskGroupProps) {
  const completedCount = group.tasks.filter((t) => t.is_completed).length;
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="space-y-1"
    >
      {/* Group header */}
      {showGroupHeaders && (
        <motion.button
          onClick={onToggleExpand}
          className="flex items-center gap-2 w-full py-1 text-sm font-medium hover:bg-muted/50 rounded px-2 transition-colors"
          aria-expanded={isExpanded}
          whileHover={prefersReducedMotion ? undefined : { backgroundColor: 'rgba(0,0,0,0.05)' }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
          
          {group.icon}
          
          <span className={group.color}>{group.label}</span>
          
          <motion.span 
            className="text-muted-foreground text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={completedCount}
          >
            {completedCount > 0 ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {completedCount}/{group.tasks.length}
              </span>
            ) : (
              <span>{group.tasks.length}</span>
            )}
          </motion.span>
        </motion.button>
      )}
      
      {/* Tasks */}
      <AnimatePresence mode="popLayout">
        {isExpanded && (
          <motion.div
            variants={prefersReducedMotion ? undefined : expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            {onReorder ? (
              <Reorder.Group
                axis="y"
                values={group.tasks}
                onReorder={(newOrder) => onReorder(newOrder, group.id)}
                className="space-y-0.5"
              >
                {group.tasks.map((task, index) => (
                  <Reorder.Item key={task.id} value={task} className="list-none">
                    <motion.div
                      variants={prefersReducedMotion ? undefined : taskVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ delay: index * 0.03 }}
                    >
                      <TaskItemWithSubtasks
                        task={task}
                        subtasks={subtasks[task.id] || []}
                        labels={labels[task.id] || []}
                        list={lists[task.list_id]}
                        isExpanded={expandedTasks.has(task.id)}
                        onToggleExpand={() => onToggleTaskExpand(task.id)}
                        onToggleComplete={() => onToggleComplete(task.id)}
                        onEdit={() => onEditTask(task)}
                        onDelete={() => onDeleteTask(task.id)}
                        onAddSubtask={onAddSubtask}
                        onToggleSubtask={onToggleSubtask}
                        onUpdateSubtask={onUpdateSubtask}
                        onDeleteSubtask={onDeleteSubtask}
                      />
                    </motion.div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              <motion.div
                variants={prefersReducedMotion ? undefined : groupVariants}
                initial="hidden"
                animate="visible"
                className="space-y-0.5"
              >
                {group.tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    variants={prefersReducedMotion ? undefined : taskVariants}
                    exit="exit"
                    layout
                  >
                    <TaskItemWithSubtasks
                      task={task}
                      subtasks={subtasks[task.id] || []}
                      labels={labels[task.id] || []}
                      list={lists[task.list_id]}
                      isExpanded={expandedTasks.has(task.id)}
                      onToggleExpand={() => onToggleTaskExpand(task.id)}
                      onToggleComplete={() => onToggleComplete(task.id)}
                      onEdit={() => onEditTask(task)}
                      onDelete={() => onDeleteTask(task.id)}
                      onAddSubtask={onAddSubtask}
                      onToggleSubtask={onToggleSubtask}
                      onUpdateSubtask={onUpdateSubtask}
                      onDeleteSubtask={onDeleteSubtask}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// TASK ITEM WITH SUBTASKS
// ============================================

interface TaskItemWithSubtasksProps {
  task: Task;
  subtasks: Subtask[];
  labels: Label[];
  list?: List;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubtask?: (taskId: string, name: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onUpdateSubtask?: (taskId: string, subtaskId: string, name: string) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
}

function TaskItemWithSubtasks({
  task,
  subtasks,
  labels,
  list,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}: TaskItemWithSubtasksProps) {
  return (
    <div className="space-y-1">
      <TaskItem
        task={task}
        list={list}
        subtasks={subtasks}
        labels={labels}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
        isExpanded={isExpanded}
        onToggleExpand={subtasks.length > 0 ? onToggleExpand : undefined}
      />
      
      {/* Subtasks */}
      <AnimatePresence>
        {isExpanded && subtasks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-6 pl-4 border-l-2 border-muted"
          >
            <SubtaskList
              taskId={task.id}
              subtasks={subtasks}
              onAdd={(name) => onAddSubtask?.(task.id, name)}
              onToggle={(id) => onToggleSubtask?.(task.id, id)}
              onUpdate={(id, name) => onUpdateSubtask?.(task.id, id, name)}
              onDelete={(id) => onDeleteSubtask?.(task.id, id)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// TASK LIST SKELETON
// ============================================

export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TaskItemSkeleton key={i} />
      ))}
    </div>
  );
}
