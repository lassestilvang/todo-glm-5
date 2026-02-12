/**
 * TaskItem Component
 * 
 * Single task row with:
 * - Checkbox for completion (with animation)
 * - Task name (strikethrough when completed)
 * - Due date badge (overdue in red)
 * - Priority indicator
 * - List color dot
 * - Labels badges
 * - Subtask count
 * - Expand/collapse for subtasks
 * - Hover actions: Edit, Delete, Add to calendar
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  MoreHorizontal,
  Trash2,
  CalendarPlus,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PriorityDot, PRIORITY_CONFIG } from './PriorityBadge';
import { DurationDisplay } from './DurationPicker';
import { RecurrenceBadge } from './RecurrencePicker';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Task, Subtask, Label, List, Priority } from '@/types';
import type { WithClassName } from '@/types';

// ============================================
// ANIMATION VARIANTS
// ============================================

const taskItemVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -20 },
  completed: {
    opacity: 0.6,
    transition: { duration: 0.3 }
  },
  incomplete: {
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

const checkboxVariants = {
  tap: { scale: 0.9 },
  hover: { scale: 1.05 }
};

const strikethroughVariants = {
  initial: { width: '0%' },
  animate: { width: '100%' }
};

const hoverActionsVariants = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 }
};

// ============================================
// TYPES
// ============================================

interface TaskItemProps extends WithClassName {
  task: Task;
  list?: List;
  subtasks?: Subtask[];
  labels?: Label[];
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddToCalendar?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isDragging?: boolean;
  isOverdue?: boolean;
}

// ============================================
// DATE UTILITIES
// ============================================

function formatDueDate(dueDate: string | null): { text: string; isOverdue: boolean; isToday: boolean; isTomorrow: boolean } {
  if (!dueDate) {
    return { text: '', isOverdue: false, isToday: false, isTomorrow: false };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const isOverdue = due < today;
  const isToday = due.getTime() === today.getTime();
  const isTomorrow = due.getTime() === tomorrow.getTime();
  
  let text = '';
  
  if (isToday) {
    text = 'Today';
  } else if (isTomorrow) {
    text = 'Tomorrow';
  } else if (isOverdue) {
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    text = daysOverdue === 1 ? 'Yesterday' : `${daysOverdue} days overdue`;
  } else {
    // Format date
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (due.getFullYear() !== today.getFullYear()) {
      options.year = 'numeric';
    }
    text = due.toLocaleDateString('en-US', options);
  }
  
  return { text, isOverdue, isToday, isTomorrow };
}

function formatDueTime(dueTime: string | null): string {
  if (!dueTime) return '';
  
  const [hours, minutes] = dueTime.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// ============================================
// COMPONENT
// ============================================

export function TaskItem({
  task,
  list,
  subtasks = [],
  labels = [],
  onToggleComplete,
  onEdit,
  onDelete,
  onAddToCalendar,
  isExpanded = false,
  onToggleExpand,
  isDragging = false,
  className,
}: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Calculate due date info
  const dueDateInfo = useMemo(() => formatDueDate(task.due_date), [task.due_date]);
  const isOverdue = dueDateInfo.isOverdue && !task.is_completed;
  
  // Subtask progress
  const subtaskProgress = useMemo(() => {
    if (subtasks.length === 0) return null;
    const completed = subtasks.filter(s => s.is_completed).length;
    return { completed, total: subtasks.length };
  }, [subtasks]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onEdit();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          onDelete();
        }
      }
    },
    [onEdit, onDelete]
  );
  
  // Handle toggle complete with animation
  const handleToggleComplete = useCallback(() => {
    if (!task.is_completed) {
      setIsCompleting(true);
      setTimeout(() => {
        onToggleComplete();
        setIsCompleting(false);
      }, 150);
    } else {
      onToggleComplete();
    }
  }, [task.is_completed, onToggleComplete]);
  
  // Animation variants based on reduced motion preference
  const getAnimationProps = () => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      };
    }
    return {
      initial: taskItemVariants.initial,
      animate: task.is_completed ? taskItemVariants.completed : taskItemVariants.incomplete,
      exit: taskItemVariants.exit,
    };
  };
  
  return (
    <motion.div
      layout
      {...getAnimationProps()}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        opacity: { duration: 0.2 }
      }}
      className={cn(
        'group relative flex items-start gap-2 px-2 py-2.5 rounded-lg',
        'hover:bg-muted/50 transition-colors',
        isDragging && 'opacity-50 bg-muted',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="listitem"
      aria-label={`${task.name}${task.is_completed ? ', completed' : ''}`}
    >
      {/* Drag handle */}
      <div
        className="cursor-grab active:cursor-grabbing pt-1 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {/* Expand button */}
      {subtasks.length > 0 && onToggleExpand && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="pt-1 hover:bg-muted rounded transition-colors"
          aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
          aria-expanded={isExpanded}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </motion.button>
      )}
      
      {/* Checkbox */}
      <div className="pt-0.5">
        <motion.div
          whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Checkbox
            checked={task.is_completed}
            onCheckedChange={handleToggleComplete}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            aria-label={task.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
          />
        </motion.div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Task name */}
        <div className="flex items-center gap-2 relative">
          {/* List color dot */}
          {list && (
            <motion.span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: list.color }}
              title={list.name}
              aria-label={`List: ${list.name}`}
              layout
            />
          )}
          
          <span className="relative">
            <span
              className={cn(
                'text-sm font-medium truncate transition-colors duration-300',
                task.is_completed && 'text-muted-foreground'
              )}
            >
              {task.name}
            </span>
            
            {/* Animated strikethrough */}
            <motion.span
              className="absolute left-0 top-1/2 h-px bg-muted-foreground"
              initial={{ width: '0%' }}
              animate={{ width: task.is_completed ? '100%' : '0%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ originX: 0 }}
            />
          </span>
          
          {/* Priority indicator */}
          {task.priority > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <PriorityDot priority={task.priority} size="sm" />
            </motion.div>
          )}
        </div>
        
        {/* Meta info row */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {/* Due date */}
          {task.due_date && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Badge
                variant="outline"
                className={cn(
                  'text-xs gap-1',
                  isOverdue && 'border-red-300 text-red-600 dark:border-red-800 dark:text-red-400',
                  dueDateInfo.isToday && 'border-primary text-primary'
                )}
              >
                <Calendar className="h-3 w-3" />
                {dueDateInfo.text}
                {task.due_time && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <Clock className="h-3 w-3" />
                    {formatDueTime(task.due_time)}
                  </>
                )}
              </Badge>
            </motion.div>
          )}
          
          {/* Duration */}
          {task.estimate_minutes && (
            <DurationDisplay minutes={task.estimate_minutes} size="sm" />
          )}
          
          {/* Recurrence */}
          {task.recurrence_type && task.recurrence_type !== 'NONE' && (
            <RecurrenceBadge type={task.recurrence_type} config={task.recurrence_config} />
          )}
          
          {/* Labels */}
          {labels.slice(0, 3).map((label, index) => (
            <motion.div
              key={label.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${label.color}20`,
                  color: label.color,
                }}
              >
                {label.emoji && <span className="mr-0.5">{label.emoji}</span>}
                {label.name}
              </Badge>
            </motion.div>
          ))}
          
          {labels.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{labels.length - 3}
            </Badge>
          )}
          
          {/* Subtask count */}
          {subtaskProgress && (
            <span className="text-xs text-muted-foreground">
              {subtaskProgress.completed}/{subtaskProgress.total} subtasks
            </span>
          )}
        </div>
      </div>
      
      {/* Hover actions */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={prefersReducedMotion ? undefined : hoverActionsVariants.initial}
            animate={prefersReducedMotion ? undefined : hoverActionsVariants.animate}
            exit={prefersReducedMotion ? undefined : hoverActionsVariants.exit}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="Edit task"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {onAddToCalendar && (
                  <DropdownMenuItem onClick={onAddToCalendar}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Add to calendar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// TASK ITEM SKELETON
// ============================================

export function TaskItemSkeleton() {
  return (
    <div className="flex items-start gap-2 px-2 py-2.5 rounded-lg animate-pulse">
      <div className="h-4 w-4 rounded border bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/4" />
      </div>
    </div>
  );
}

// ============================================
// TASK ITEM COMPACT
// ============================================

interface TaskItemCompactProps extends WithClassName {
  task: Task;
  list?: List;
  onToggleComplete: () => void;
  onClick?: () => void;
}

export function TaskItemCompact({
  task,
  list,
  onToggleComplete,
  onClick,
  className,
}: TaskItemCompactProps) {
  const dueDateInfo = useMemo(() => formatDueDate(task.due_date), [task.due_date]);
  const isOverdue = dueDateInfo.isOverdue && !task.is_completed;
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: -5 }}
      animate={prefersReducedMotion ? undefined : { opacity: task.is_completed ? 0.6 : 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, x: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer',
        'hover:bg-muted/50 transition-colors',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
    >
      <motion.div
        whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
      >
        <Checkbox
          checked={task.is_completed}
          onCheckedChange={(checked) => {
            onToggleComplete();
          }}
          onClick={(e) => e.stopPropagation()}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </motion.div>
      
      {list && (
        <motion.span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: list.color }}
          layout
        />
      )}
      
      <span className="relative">
        <span
          className={cn(
            'flex-1 text-sm truncate transition-colors',
            task.is_completed && 'text-muted-foreground'
          )}
        >
          {task.name}
        </span>
        {/* Animated strikethrough */}
        <motion.span
          className="absolute left-0 top-1/2 h-px bg-muted-foreground"
          initial={{ width: '0%' }}
          animate={{ width: task.is_completed ? '100%' : '0%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </span>
      
      {task.due_date && (
        <motion.span
          className={cn(
            'text-xs',
            isOverdue ? 'text-red-500' : 'text-muted-foreground'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {dueDateInfo.text}
        </motion.span>
      )}
    </motion.div>
  );
}
