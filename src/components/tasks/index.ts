/**
 * Task Components
 * 
 * Export all task-related components from a single entry point.
 */

// Core components
export { TaskList, TaskListSkeleton } from './TaskList';
export { TaskItem, TaskItemSkeleton, TaskItemCompact } from './TaskItem';
export { TaskEditor } from './TaskEditor';
export { TaskQuickAdd, TaskQuickAddCompact } from './TaskQuickAdd';
export { TaskDetailPanel } from './TaskDetailPanel';
export { SubtaskList, SubtaskListSkeleton } from './SubtaskList';
export { TaskHistory, HistoryItem } from './TaskHistory';
export { TaskFilters, TaskFiltersCompact, type TaskFilterOptions } from './TaskFilters';

// Picker components
export { TimePicker, TimeInput } from './TimePicker';
export { DurationPicker, DurationDisplay, DurationInput } from './DurationPicker';
export { RecurrencePicker, RecurrenceDisplay, RecurrenceBadge } from './RecurrencePicker';

// Badge components
export { 
  PriorityBadge, 
  PriorityDot, 
  PriorityIcon, 
  PrioritySelectValue,
  PRIORITY_CONFIG 
} from './PriorityBadge';

// Re-export types for convenience
export type { 
  Task, 
  Subtask, 
  Label, 
  List, 
  TaskHistory as TaskHistoryType,
  Priority as PriorityType,
  RecurrenceType,
  RecurrenceConfig,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '@/types';
