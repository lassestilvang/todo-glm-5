/**
 * Type definitions for the Daily Task Planner application
 * 
 * This file contains all TypeScript types, interfaces, and enums
 * for the application.
 */

// ============================================
// ENUM TYPES
// ============================================

/**
 * Priority levels for tasks
 * - NONE: No priority set (default)
 * - LOW: Low priority
 * - MEDIUM: Medium priority
 * - HIGH: High priority
 * - URGENT: Urgent priority
 */
export enum Priority {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
}

/**
 * Recurrence types for recurring tasks
 */
export enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  WEEKDAYS = 'WEEKDAYS',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

/**
 * Task action types for history tracking
 */
export enum TaskAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  COMPLETED = 'COMPLETED',
  UNCOMPLETED = 'UNCOMPLETED',
  DELETED = 'DELETED',
  RESTORED = 'RESTORED',
}

/**
 * View types for different task views
 */
export enum ViewType {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  UPCOMING = 'UPCOMING',
  ALL = 'ALL',
}

/**
 * Sort options for tasks
 */
export enum SortBy {
  DUE_DATE = 'DUE_DATE',
  PRIORITY = 'PRIORITY',
  CREATED_AT = 'CREATED_AT',
  NAME = 'NAME',
}

/**
 * Sort order direction
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

// ============================================
// ENTITY INTERFACES
// ============================================

/**
 * List entity - represents a task list/category
 */
export interface List {
  id: string;
  name: string;
  color: string;
  emoji: string | null;
  position: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Task entity - represents a single task
 */
export interface Task {
  id: string;
  list_id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  deadline: string | null;
  priority: Priority;
  estimate_minutes: number | null;
  actual_minutes: number | null;
  is_completed: boolean;
  completed_at: string | null;
  recurrence_type: RecurrenceType;
  recurrence_config: RecurrenceConfig | null;
  position: number;
  created_at: string;
  updated_at: string;
  // Relations (populated on fetch)
  subtasks?: Subtask[];
  labels?: Label[];
  reminders?: Reminder[];
  attachments?: Attachment[];
}

/**
 * Subtask entity - represents a subtask within a task
 */
export interface Subtask {
  id: string;
  task_id: string;
  name: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

/**
 * Label entity - represents a tag/label for tasks
 */
export interface Label {
  id: string;
  name: string;
  emoji: string | null;
  color: string;
  created_at: string;
}

/**
 * TaskLabel junction entity - represents the many-to-many relationship
 */
export interface TaskLabel {
  task_id: string;
  label_id: string;
}

/**
 * Reminder entity - represents a task reminder
 */
export interface Reminder {
  id: string;
  task_id: string;
  remind_at: string;
  is_sent: boolean;
  created_at: string;
}

/**
 * Attachment entity - represents a file attached to a task
 */
export interface Attachment {
  id: string;
  task_id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

/**
 * TaskHistory entity - represents a change log entry for a task
 */
export interface TaskHistory {
  id: string;
  task_id: string;
  action: TaskAction;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;
}

/**
 * Recurrence configuration for custom recurring tasks
 */
export interface RecurrenceConfig {
  interval: number;
  unit: 'day' | 'week' | 'month' | 'year';
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number;
  endDate?: string;
  maxOccurrences?: number;
}

// ============================================
// API REQUEST TYPES
// ============================================

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// List API types
export interface CreateListRequest {
  name: string;
  color?: string;
  emoji?: string;
}

export interface UpdateListRequest {
  name?: string;
  color?: string;
  emoji?: string;
  position?: number;
}

export interface ListResponse extends List {
  task_count: number;
  completed_task_count: number;
}

// Task API types
export interface CreateTaskRequest {
  list_id: string;
  name: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  deadline?: string;
  priority?: Priority;
  estimate_minutes?: number;
  recurrence_type?: RecurrenceType;
  recurrence_config?: RecurrenceConfig;
  label_ids?: string[];
  subtasks?: CreateSubtaskRequest[];
}

export interface UpdateTaskRequest {
  list_id?: string;
  name?: string;
  description?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  deadline?: string | null;
  priority?: Priority;
  estimate_minutes?: number | null;
  actual_minutes?: number | null;
  recurrence_type?: RecurrenceType | null;
  recurrence_config?: RecurrenceConfig | null;
  is_completed?: boolean;
  position?: number;
}

export interface TaskQueryParams extends PaginationParams {
  list_id?: string;
  is_completed?: boolean;
  priority?: Priority;
  due_date_from?: string;
  due_date_to?: string;
  label_ids?: string[];
  sort_by?: SortBy;
  sort_order?: SortOrder;
  search?: string;
}

export interface TaskResponse extends Task {
  list: List;
}

// Subtask API types
export interface CreateSubtaskRequest {
  task_id: string;
  name: string;
}

export interface UpdateSubtaskRequest {
  name?: string;
  is_completed?: boolean;
  position?: number;
}

// Label API types
export interface CreateLabelRequest {
  name: string;
  emoji?: string;
  color?: string;
}

export interface UpdateLabelRequest {
  name?: string;
  emoji?: string;
  color?: string;
}

// Reminder API types
export interface CreateReminderRequest {
  task_id: string;
  remind_at: string;
}

// Attachment API types
export interface CreateAttachmentRequest {
  task_id: string;
  name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
}

// Search API types
export interface SearchParams {
  query: string;
  scope?: 'all' | 'tasks' | 'lists' | 'labels';
  fuzzy_threshold?: number;
}

export interface SearchResult {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  highlights: Map<string, string[]>;
}

// Batch Operations
export interface BatchUpdateRequest {
  task_ids: string[];
  updates: UpdateTaskRequest;
}

export interface BatchDeleteRequest {
  task_ids: string[];
}

export interface BatchMoveRequest {
  task_ids: string[];
  list_id: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Make certain properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make certain properties required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Prettify type for better readability
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * ISO 8601 date string
 */
export type DateString = string;

/**
 * Time string in HH:MM format
 */
export type TimeString = string;

/**
 * ISO 8601 datetime string
 */
export type DateTimeString = string;

/**
 * Component prop types
 */
export interface WithClassName {
  className?: string;
}

export interface WithId {
  id: string;
}

export interface WithChildren {
  children: React.ReactNode;
}

// ============================================
// DATABASE ROW TYPES (for raw SQL results)
// ============================================

/**
 * Raw database row types matching SQLite schema
 * These use snake_case to match the database column names
 */
export interface ListRow {
  id: string;
  name: string;
  color: string;
  emoji: string | null;
  position: number;
  is_default: number; // SQLite uses 0/1 for boolean
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  list_id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  deadline: string | null;
  priority: number;
  estimate_minutes: number | null;
  actual_minutes: number | null;
  is_completed: number; // SQLite uses 0/1 for boolean
  completed_at: string | null;
  recurrence_type: string;
  recurrence_config: string | null; // JSON string
  position: number;
  created_at: string;
  updated_at: string;
}

export interface SubtaskRow {
  id: string;
  task_id: string;
  name: string;
  is_completed: number; // SQLite uses 0/1 for boolean
  position: number;
  created_at: string;
}

export interface LabelRow {
  id: string;
  name: string;
  emoji: string | null;
  color: string;
  created_at: string;
}

export interface TaskLabelRow {
  task_id: string;
  label_id: string;
}

export interface ReminderRow {
  id: string;
  task_id: string;
  remind_at: string;
  is_sent: number; // SQLite uses 0/1 for boolean
  created_at: string;
}

export interface AttachmentRow {
  id: string;
  task_id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface TaskHistoryRow {
  id: string;
  task_id: string;
  action: string;
  changes: string | null; // JSON string
  created_at: string;
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard to check if a value is a valid Priority
 */
export function isPriority(value: unknown): value is Priority {
  return (
    typeof value === 'number' &&
    Object.values(Priority).includes(value as Priority)
  );
}

/**
 * Type guard to check if a value is a valid RecurrenceType
 */
export function isRecurrenceType(value: unknown): value is RecurrenceType {
  return (
    typeof value === 'string' &&
    Object.values(RecurrenceType).includes(value as RecurrenceType)
  );
}

/**
 * Type guard to check if a value is a valid TaskAction
 */
export function isTaskAction(value: unknown): value is TaskAction {
  return (
    typeof value === 'string' &&
    Object.values(TaskAction).includes(value as TaskAction)
  );
}

// ============================================
// HELPER FUNCTIONS FOR TYPE CONVERSION
// ============================================

/**
 * Convert a database row to a typed entity
 */
export function rowToList(row: ListRow): List {
  return {
    ...row,
    is_default: row.is_default === 1,
  };
}

export function rowToTask(row: TaskRow): Task {
  return {
    ...row,
    priority: row.priority as Priority,
    is_completed: row.is_completed === 1,
    recurrence_type: row.recurrence_type as RecurrenceType,
    recurrence_config: row.recurrence_config
      ? JSON.parse(row.recurrence_config)
      : null,
  };
}

export function rowToSubtask(row: SubtaskRow): Subtask {
  return {
    ...row,
    is_completed: row.is_completed === 1,
  };
}

export function rowToLabel(row: LabelRow): Label {
  return { ...row };
}

export function rowToReminder(row: ReminderRow): Reminder {
  return {
    ...row,
    is_sent: row.is_sent === 1,
  };
}

export function rowToAttachment(row: AttachmentRow): Attachment {
  return { ...row };
}

export function rowToTaskHistory(row: TaskHistoryRow): TaskHistory {
  return {
    ...row,
    action: row.action as TaskAction,
    changes: row.changes ? JSON.parse(row.changes) : null,
  };
}
