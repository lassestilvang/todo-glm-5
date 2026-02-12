/**
 * Test Fixtures
 * 
 * Provides sample data and helper functions for creating test data.
 */

import { v4 as uuidv4 } from 'uuid';
import { format, addDays, subDays } from 'date-fns';
import { 
  List, 
  Task, 
  Subtask, 
  Label, 
  Reminder,
  Priority,
  RecurrenceType,
  CreateListRequest,
  CreateTaskRequest,
  CreateLabelRequest,
  CreateSubtaskRequest,
  CreateReminderRequest
} from '@/types';
import { run, get, all } from '../lib/db';

// ============================================
// SAMPLE DATA
// ============================================

export const sampleLists: Partial<List>[] = [
  { name: 'Work', color: '#3b82f6', emoji: '💼' },
  { name: 'Personal', color: '#10b981', emoji: '🏠' },
  { name: 'Shopping', color: '#f59e0b', emoji: '🛒' },
];

export const sampleLabels: Partial<Label>[] = [
  { name: 'Important', color: '#ef4444', emoji: '🔴' },
  { name: 'Urgent', color: '#f97316', emoji: '🟠' },
  { name: 'Later', color: '#6366f1', emoji: '🔵' },
  { name: 'Quick', color: '#22c55e', emoji: '🟢' },
];

export const sampleTasks: Partial<Task>[] = [
  { 
    name: 'Complete project proposal', 
    description: 'Write and submit the Q1 project proposal',
    priority: Priority.HIGH,
  },
  { 
    name: 'Review code changes', 
    description: 'Review pull requests from team members',
    priority: Priority.MEDIUM,
  },
  { 
    name: 'Buy groceries', 
    description: 'Milk, eggs, bread, and vegetables',
    priority: Priority.LOW,
  },
  { 
    name: 'Schedule dentist appointment', 
    description: 'Annual checkup',
    priority: Priority.NONE,
  },
];

// ============================================
// DATABASE HELPERS
// ============================================

/**
 * Create a list in the database
 */
export function createList(data: CreateListRequest & { id?: string; position?: number }): List {
  const id = data.id ?? uuidv4();
  const now = new Date().toISOString();
  
  // Get max position if not provided
  let position = data.position ?? 0;
  if (data.position === undefined) {
    const maxPos = get<{ max: number }>(
      'SELECT COALESCE(MAX(position), -1) as max FROM lists'
    );
    position = (maxPos?.max ?? -1) + 1;
  }
  
  run(
    `INSERT INTO lists (id, name, color, emoji, position, is_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.color ?? '#6366f1',
      data.emoji ?? '📋',
      position,
      0,
      now,
      now
    ]
  );
  
  return {
    id,
    name: data.name,
    color: data.color ?? '#6366f1',
    emoji: data.emoji ?? '📋',
    position,
    is_default: false,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Create a task in the database
 */
export function createTask(data: CreateTaskRequest & { id?: string; position?: number }): Task {
  const id = data.id ?? uuidv4();
  const now = new Date().toISOString();
  
  // Get max position if not provided
  let position = data.position ?? 0;
  if (data.position === undefined) {
    const maxPos = get<{ max: number }>(
      'SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE list_id = ?',
      [data.list_id]
    );
    position = (maxPos?.max ?? -1) + 1;
  }
  
  run(
    `INSERT INTO tasks (
      id, list_id, name, description, due_date, due_time, deadline,
      priority, estimate_minutes, actual_minutes, is_completed, completed_at,
      recurrence_type, recurrence_config, position, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.list_id,
      data.name,
      data.description ?? null,
      data.due_date ?? null,
      data.due_time ?? null,
      data.deadline ?? null,
      data.priority ?? Priority.NONE,
      data.estimate_minutes ?? null,
      null, // actual_minutes
      0, // is_completed
      null, // completed_at
      data.recurrence_type ?? RecurrenceType.NONE,
      data.recurrence_config ? JSON.stringify(data.recurrence_config) : null,
      position,
      now,
      now
    ]
  );
  
  // Add labels if provided
  if (data.label_ids && data.label_ids.length > 0) {
    data.label_ids.forEach(labelId => {
      run(
        'INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)',
        [id, labelId]
      );
    });
  }
  
  // Add subtasks if provided
  if (data.subtasks && data.subtasks.length > 0) {
    data.subtasks.forEach((subtask, index) => {
      const subtaskId = uuidv4();
      run(
        'INSERT INTO subtasks (id, task_id, name, is_completed, position, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [subtaskId, id, subtask.name, 0, index, now]
      );
    });
  }
  
  return {
    id,
    list_id: data.list_id,
    name: data.name,
    description: data.description ?? null,
    due_date: data.due_date ?? null,
    due_time: data.due_time ?? null,
    deadline: data.deadline ?? null,
    priority: data.priority ?? Priority.NONE,
    estimate_minutes: data.estimate_minutes ?? null,
    actual_minutes: null,
    is_completed: false,
    completed_at: null,
    recurrence_type: data.recurrence_type ?? RecurrenceType.NONE,
    recurrence_config: data.recurrence_config ?? null,
    position,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Create a label in the database
 */
export function createLabel(data: CreateLabelRequest & { id?: string }): Label {
  const id = data.id ?? uuidv4();
  const now = new Date().toISOString();
  
  run(
    `INSERT INTO labels (id, name, emoji, color, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.name, data.emoji ?? null, data.color ?? '#64748b', now]
  );
  
  return {
    id,
    name: data.name,
    emoji: data.emoji ?? null,
    color: data.color ?? '#64748b',
    created_at: now,
  };
}

/**
 * Create a subtask in the database
 */
export function createSubtask(taskId: string, data: CreateSubtaskRequest & { id?: string; position?: number }): Subtask {
  const id = data.id ?? uuidv4();
  const now = new Date().toISOString();
  
  // Get max position if not provided
  let position = data.position ?? 0;
  if (data.position === undefined) {
    const maxPos = get<{ max: number }>(
      'SELECT COALESCE(MAX(position), -1) as max FROM subtasks WHERE task_id = ?',
      [taskId]
    );
    position = (maxPos?.max ?? -1) + 1;
  }
  
  run(
    `INSERT INTO subtasks (id, task_id, name, is_completed, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, taskId, data.name, 0, position, now]
  );
  
  return {
    id,
    task_id: taskId,
    name: data.name,
    is_completed: false,
    position,
    created_at: now,
  };
}

/**
 * Create a reminder in the database
 */
export function createReminder(taskId: string, data: CreateReminderRequest & { id?: string }): Reminder {
  const id = data.id ?? uuidv4();
  const now = new Date().toISOString();
  
  run(
    `INSERT INTO reminders (id, task_id, remind_at, is_sent, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, taskId, data.remind_at, 0, now]
  );
  
  return {
    id,
    task_id: taskId,
    remind_at: data.remind_at,
    is_sent: false,
    created_at: now,
  };
}

// ============================================
// DATE HELPERS
// ============================================

/**
 * Get today's date in YYYY-MM-DD format
 */
export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export function tomorrow(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function yesterday(): string {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd');
}

/**
 * Get a date N days from now in YYYY-MM-DD format
 */
export function daysFromNow(days: number): string {
  return format(addDays(new Date(), days), 'yyyy-MM-dd');
}

/**
 * Get a date N days ago in YYYY-MM-DD format
 */
export function daysAgo(days: number): string {
  return format(subDays(new Date(), days), 'yyyy-MM-dd');
}

/**
 * Get current ISO datetime string
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Get ISO datetime string N hours from now
 */
export function hoursFromNow(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

// ============================================
// SEED HELPERS
// ============================================

/**
 * Seed the database with sample lists
 */
export function seedLists(): List[] {
  return sampleLists.map(list => createList(list as CreateListRequest));
}

/**
 * Seed the database with sample labels
 */
export function seedLabels(): Label[] {
  return sampleLabels.map(label => createLabel(label as CreateLabelRequest));
}

/**
 * Seed the database with sample tasks for a list
 */
export function seedTasks(listId: string): Task[] {
  return sampleTasks.map(task => createTask({ ...task, list_id: listId } as CreateTaskRequest));
}

/**
 * Seed a complete test scenario with lists, labels, and tasks
 */
export function seedCompleteScenario(): { lists: List[]; labels: Label[]; tasks: Task[] } {
  const lists = seedLists();
  const labels = seedLabels();
  
  // Create tasks for each list
  const tasks: Task[] = [];
  lists.forEach(list => {
    const listTasks = seedTasks(list.id);
    tasks.push(...listTasks);
  });
  
  return { lists, labels, tasks };
}

// ============================================
// ASSERTION HELPERS
// ============================================

/**
 * Check if a value is a valid UUID
 */
export function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Check if a value is a valid ISO date string
 */
export function isValidIsoDate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Check if a value is a valid date in YYYY-MM-DD format
 */
export function isValidDateString(value: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}
