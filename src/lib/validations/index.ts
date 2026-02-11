/**
 * Validation schemas using Zod for API request validation
 */

import { z } from 'zod';
import { Priority, RecurrenceType } from '@/types';

// ============================================
// COMMON SCHEMAS
// ============================================

const uuidSchema = z.string().uuid();

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format');

const emojiSchema = z.string().max(10, 'Emoji must be at most 10 characters');

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)');

const dateTimeSchema = z.string().datetime();

// ============================================
// LIST SCHEMAS
// ============================================

export const createListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100, 'List name must be at most 100 characters').trim(),
  color: colorSchema.optional(),
  emoji: emojiSchema.optional(),
});

export const updateListSchema = z.object({
  name: z.string().min(1, 'List name cannot be empty').max(100, 'List name must be at most 100 characters').trim().optional(),
  color: colorSchema.optional(),
  emoji: emojiSchema.optional(),
  position: z.number().int().min(0).optional(),
});

export const reorderListsSchema = z.object({
  listIds: z.array(z.string().min(1)).min(1, 'At least one list ID is required'),
});

// ============================================
// TASK SCHEMAS
// ============================================

const prioritySchema = z.nativeEnum(Priority);

const recurrenceTypeSchema = z.nativeEnum(RecurrenceType);

const recurrenceConfigSchema = z.object({
  interval: z.number().int().min(1),
  unit: z.enum(['day', 'week', 'month', 'year']),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  endDate: dateSchema.optional(),
  maxOccurrences: z.number().int().min(1).optional(),
});

export const createTaskSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
  name: z.string().min(1, 'Task name is required').max(500, 'Task name must be at most 500 characters').trim(),
  description: z.string().max(5000, 'Description must be at most 5000 characters').optional(),
  due_date: dateSchema.optional(),
  due_time: timeSchema.optional(),
  deadline: dateSchema.optional(),
  priority: prioritySchema.optional(),
  estimate_minutes: z.number().int().min(0).max(525600).optional(), // Max 1 year in minutes
  recurrence_type: recurrenceTypeSchema.optional(),
  recurrence_config: recurrenceConfigSchema.optional(),
  label_ids: z.array(z.string().min(1)).optional(),
  subtasks: z.array(z.object({
    name: z.string().min(1, 'Subtask name is required').max(200, 'Subtask name must be at most 200 characters').trim(),
  })).optional(),
});

export const updateTaskSchema = z.object({
  list_id: z.string().min(1, 'List ID cannot be empty').optional(),
  name: z.string().min(1, 'Task name cannot be empty').max(500, 'Task name must be at most 500 characters').trim().optional(),
  description: z.string().max(5000, 'Description must be at most 5000 characters').nullable().optional(),
  due_date: dateSchema.nullable().optional(),
  due_time: timeSchema.nullable().optional(),
  deadline: dateSchema.nullable().optional(),
  priority: prioritySchema.optional(),
  estimate_minutes: z.number().int().min(0).max(525600).nullable().optional(),
  actual_minutes: z.number().int().min(0).max(525600).nullable().optional(),
  recurrence_type: recurrenceTypeSchema.nullable().optional(),
  recurrence_config: recurrenceConfigSchema.nullable().optional(),
  is_completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export const moveTaskSchema = z.object({
  listId: z.string().min(1, 'Target list ID is required'),
});

export const taskQuerySchema = z.object({
  listId: z.string().optional(),
  completed: z.coerce.boolean().optional(),
  overdue: z.coerce.boolean().optional(),
  today: z.coerce.boolean().optional(),
  week: z.coerce.boolean().optional(),
  upcoming: z.coerce.boolean().optional(),
  priority: z.coerce.number().int().min(0).max(4).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// ============================================
// SUBTASK SCHEMAS
// ============================================

export const createSubtaskSchema = z.object({
  name: z.string().min(1, 'Subtask name is required').max(200, 'Subtask name must be at most 200 characters').trim(),
});

export const updateSubtaskSchema = z.object({
  name: z.string().min(1, 'Subtask name cannot be empty').max(200, 'Subtask name must be at most 200 characters').trim().optional(),
  is_completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

// ============================================
// LABEL SCHEMAS
// ============================================

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(50, 'Label name must be at most 50 characters').trim(),
  color: colorSchema.optional(),
  emoji: emojiSchema.optional(),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1, 'Label name cannot be empty').max(50, 'Label name must be at most 50 characters').trim().optional(),
  color: colorSchema.optional(),
  emoji: emojiSchema.optional(),
});

export const taskLabelSchema = z.object({
  labelId: z.string().min(1, 'Label ID is required'),
});

// ============================================
// REMINDER SCHEMAS
// ============================================

export const createReminderSchema = z.object({
  remind_at: dateTimeSchema,
});

// ============================================
// ATTACHMENT SCHEMAS
// ============================================

export const createAttachmentSchema = z.object({
  name: z.string().min(1, 'Attachment name is required').max(255, 'Attachment name must be at most 255 characters').trim(),
  file_path: z.string().min(1, 'File path is required').max(1000, 'File path must be at most 1000 characters'),
  file_size: z.number().int().min(0).optional(),
  mime_type: z.string().max(100).optional(),
});

// ============================================
// SEARCH SCHEMAS
// ============================================

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Search query must be at most 200 characters'),
  type: z.enum(['all', 'tasks', 'lists', 'labels']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type ReorderListsInput = z.infer<typeof reorderListsSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
export type TaskLabelInput = z.infer<typeof taskLabelSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
