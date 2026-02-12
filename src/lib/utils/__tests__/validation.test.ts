/**
 * Validation Schema Tests
 * 
 * Tests for Zod validation schemas.
 */

import { describe, test, expect } from 'bun:test';
import { 
  createListSchema,
  updateListSchema,
  reorderListsSchema,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  taskQuerySchema,
  createSubtaskSchema,
  updateSubtaskSchema,
  createLabelSchema,
  updateLabelSchema,
  taskLabelSchema,
  createReminderSchema,
  createAttachmentSchema,
  searchQuerySchema
} from '../../validations';
import { Priority, RecurrenceType } from '@/types';

describe('Validation Schemas', () => {
  describe('List Schemas', () => {
    describe('createListSchema', () => {
      test('validates valid list data', () => {
        const result = createListSchema.safeParse({ name: 'Test List' });
        expect(result.success).toBe(true);
      });

      test('validates list with all optional fields', () => {
        const result = createListSchema.safeParse({ 
          name: 'Test List', 
          color: '#ff0000', 
          emoji: '📋' 
        });
        expect(result.success).toBe(true);
      });

      test('rejects empty name', () => {
        const result = createListSchema.safeParse({ name: '' });
        expect(result.success).toBe(false);
      });

      test('rejects missing name', () => {
        const result = createListSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      test('rejects invalid color format', () => {
        const result = createListSchema.safeParse({ name: 'Test', color: 'red' });
        expect(result.success).toBe(false);
      });

      test('rejects name longer than 100 characters', () => {
        const result = createListSchema.safeParse({ name: 'a'.repeat(101) });
        expect(result.success).toBe(false);
      });

      test('trims whitespace from name', () => {
        const result = createListSchema.safeParse({ name: '  Test List  ' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('Test List');
        }
      });
    });

    describe('updateListSchema', () => {
      test('validates partial updates', () => {
        const result = updateListSchema.safeParse({ name: 'Updated' });
        expect(result.success).toBe(true);
      });

      test('allows empty object', () => {
        const result = updateListSchema.safeParse({});
        expect(result.success).toBe(true);
      });

      test('validates position', () => {
        const result = updateListSchema.safeParse({ position: 5 });
        expect(result.success).toBe(true);
      });

      test('rejects negative position', () => {
        const result = updateListSchema.safeParse({ position: -1 });
        expect(result.success).toBe(false);
      });
    });

    describe('reorderListsSchema', () => {
      test('validates array of IDs', () => {
        const result = reorderListsSchema.safeParse({ listIds: ['id1', 'id2'] });
        expect(result.success).toBe(true);
      });

      test('rejects empty array', () => {
        const result = reorderListsSchema.safeParse({ listIds: [] });
        expect(result.success).toBe(false);
      });

      test('rejects missing listIds', () => {
        const result = reorderListsSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Task Schemas', () => {
    describe('createTaskSchema', () => {
      test('validates minimal task data', () => {
        const result = createTaskSchema.safeParse({ 
          list_id: 'list-1', 
          name: 'Test Task' 
        });
        expect(result.success).toBe(true);
      });

      test('validates task with all fields', () => {
        const result = createTaskSchema.safeParse({ 
          list_id: 'list-1', 
          name: 'Test Task',
          description: 'Description',
          due_date: '2024-01-15',
          due_time: '14:30',
          priority: Priority.HIGH,
          estimate_minutes: 60,
          recurrence_type: RecurrenceType.DAILY
        });
        expect(result.success).toBe(true);
      });

      test('rejects empty name', () => {
        const result = createTaskSchema.safeParse({ list_id: 'list-1', name: '' });
        expect(result.success).toBe(false);
      });

      test('rejects missing list_id', () => {
        const result = createTaskSchema.safeParse({ name: 'Test Task' });
        expect(result.success).toBe(false);
      });

      test('rejects invalid date format', () => {
        const result = createTaskSchema.safeParse({ 
          list_id: 'list-1', 
          name: 'Test',
          due_date: '01-15-2024' 
        });
        expect(result.success).toBe(false);
      });

      test('rejects invalid time format', () => {
        const result = createTaskSchema.safeParse({ 
          list_id: 'list-1', 
          name: 'Test',
          due_time: '2:30 PM' 
        });
        expect(result.success).toBe(false);
      });

      test('validates subtasks', () => {
        const result = createTaskSchema.safeParse({ 
          list_id: 'list-1', 
          name: 'Test',
          subtasks: [{ name: 'Subtask 1' }, { name: 'Subtask 2' }]
        });
        expect(result.success).toBe(true);
      });

      test('validates label_ids', () => {
        const result = createTaskSchema.safeParse({ 
          list_id: 'list-1', 
          name: 'Test',
          label_ids: ['label-1', 'label-2']
        });
        expect(result.success).toBe(true);
      });
    });

    describe('updateTaskSchema', () => {
      test('validates partial updates', () => {
        const result = updateTaskSchema.safeParse({ name: 'Updated' });
        expect(result.success).toBe(true);
      });

      test('allows null values for nullable fields', () => {
        const result = updateTaskSchema.safeParse({ 
          description: null,
          due_date: null 
        });
        expect(result.success).toBe(true);
      });

      test('validates is_completed', () => {
        const result = updateTaskSchema.safeParse({ is_completed: true });
        expect(result.success).toBe(true);
      });
    });

    describe('moveTaskSchema', () => {
      test('validates move request', () => {
        const result = moveTaskSchema.safeParse({ listId: 'new-list-id' });
        expect(result.success).toBe(true);
      });

      test('rejects missing listId', () => {
        const result = moveTaskSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });

    describe('taskQuerySchema', () => {
      test('validates query parameters', () => {
        const result = taskQuerySchema.safeParse({ 
          listId: 'list-1',
          completed: true,
          priority: 3
        });
        expect(result.success).toBe(true);
      });

      test('coerces string booleans', () => {
        const result = taskQuerySchema.safeParse({ completed: 'true' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.completed).toBe(true);
        }
      });

      test('coerces string numbers', () => {
        const result = taskQuerySchema.safeParse({ priority: '3' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.priority).toBe(3);
        }
      });

      test('rejects invalid priority', () => {
        const result = taskQuerySchema.safeParse({ priority: 5 });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Subtask Schemas', () => {
    describe('createSubtaskSchema', () => {
      test('validates subtask name', () => {
        const result = createSubtaskSchema.safeParse({ name: 'Test Subtask' });
        expect(result.success).toBe(true);
      });

      test('rejects empty name', () => {
        const result = createSubtaskSchema.safeParse({ name: '' });
        expect(result.success).toBe(false);
      });

      test('rejects name longer than 200 characters', () => {
        const result = createSubtaskSchema.safeParse({ name: 'a'.repeat(201) });
        expect(result.success).toBe(false);
      });
    });

    describe('updateSubtaskSchema', () => {
      test('validates partial updates', () => {
        const result = updateSubtaskSchema.safeParse({ name: 'Updated' });
        expect(result.success).toBe(true);
      });

      test('validates is_completed', () => {
        const result = updateSubtaskSchema.safeParse({ is_completed: true });
        expect(result.success).toBe(true);
      });

      test('validates position', () => {
        const result = updateSubtaskSchema.safeParse({ position: 5 });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Label Schemas', () => {
    describe('createLabelSchema', () => {
      test('validates label data', () => {
        const result = createLabelSchema.safeParse({ name: 'Test Label' });
        expect(result.success).toBe(true);
      });

      test('validates label with all fields', () => {
        const result = createLabelSchema.safeParse({ 
          name: 'Test Label', 
          color: '#ff0000', 
          emoji: '🏷️' 
        });
        expect(result.success).toBe(true);
      });

      test('rejects empty name', () => {
        const result = createLabelSchema.safeParse({ name: '' });
        expect(result.success).toBe(false);
      });

      test('rejects name longer than 50 characters', () => {
        const result = createLabelSchema.safeParse({ name: 'a'.repeat(51) });
        expect(result.success).toBe(false);
      });
    });

    describe('updateLabelSchema', () => {
      test('validates partial updates', () => {
        const result = updateLabelSchema.safeParse({ name: 'Updated' });
        expect(result.success).toBe(true);
      });
    });

    describe('taskLabelSchema', () => {
      test('validates label ID', () => {
        const result = taskLabelSchema.safeParse({ labelId: 'label-1' });
        expect(result.success).toBe(true);
      });

      test('rejects missing labelId', () => {
        const result = taskLabelSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Reminder Schemas', () => {
    describe('createReminderSchema', () => {
      test('validates datetime', () => {
        const result = createReminderSchema.safeParse({ 
          remind_at: '2024-01-15T14:30:00Z' 
        });
        expect(result.success).toBe(true);
      });

      test('rejects invalid datetime', () => {
        const result = createReminderSchema.safeParse({ remind_at: 'invalid' });
        expect(result.success).toBe(false);
      });

      test('rejects missing remind_at', () => {
        const result = createReminderSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Attachment Schemas', () => {
    describe('createAttachmentSchema', () => {
      test('validates attachment data', () => {
        const result = createAttachmentSchema.safeParse({ 
          name: 'document.pdf',
          file_path: '/uploads/document.pdf'
        });
        expect(result.success).toBe(true);
      });

      test('validates with optional fields', () => {
        const result = createAttachmentSchema.safeParse({ 
          name: 'document.pdf',
          file_path: '/uploads/document.pdf',
          file_size: 1024,
          mime_type: 'application/pdf'
        });
        expect(result.success).toBe(true);
      });

      test('rejects empty name', () => {
        const result = createAttachmentSchema.safeParse({ 
          name: '',
          file_path: '/uploads/document.pdf'
        });
        expect(result.success).toBe(false);
      });

      test('rejects empty file_path', () => {
        const result = createAttachmentSchema.safeParse({ 
          name: 'document.pdf',
          file_path: ''
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Search Schemas', () => {
    describe('searchQuerySchema', () => {
      test('validates search query', () => {
        const result = searchQuerySchema.safeParse({ q: 'test query' });
        expect(result.success).toBe(true);
      });

      test('validates with all parameters', () => {
        const result = searchQuerySchema.safeParse({ 
          q: 'test',
          type: 'tasks',
          limit: 10
        });
        expect(result.success).toBe(true);
      });

      test('rejects empty query', () => {
        const result = searchQuerySchema.safeParse({ q: '' });
        expect(result.success).toBe(false);
      });

      test('rejects missing query', () => {
        const result = searchQuerySchema.safeParse({});
        expect(result.success).toBe(false);
      });

      test('rejects query longer than 200 characters', () => {
        const result = searchQuerySchema.safeParse({ q: 'a'.repeat(201) });
        expect(result.success).toBe(false);
      });

      test('rejects invalid type', () => {
        const result = searchQuerySchema.safeParse({ q: 'test', type: 'invalid' });
        expect(result.success).toBe(false);
      });

      test('rejects limit > 50', () => {
        const result = searchQuerySchema.safeParse({ q: 'test', limit: 51 });
        expect(result.success).toBe(false);
      });

      test('coerces limit from string', () => {
        const result = searchQuerySchema.safeParse({ q: 'test', limit: '10' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(10);
        }
      });

      test('uses default values', () => {
        const result = searchQuerySchema.safeParse({ q: 'test' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe('all');
          expect(result.data.limit).toBe(20);
        }
      });
    });
  });

  describe('Error Messages', () => {
    test('createListSchema provides helpful error messages', () => {
      const result = createListSchema.safeParse({ name: '' });
      if (!result.success) {
        const errors = result.error.issues.map(i => i.message);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('required');
      }
    });

    test('createTaskSchema provides helpful error messages for invalid date', () => {
      const result = createTaskSchema.safeParse({ 
        list_id: 'list-1', 
        name: 'Test',
        due_date: 'invalid' 
      });
      if (!result.success) {
        const dateError = result.error.issues.find(i => i.path.includes('due_date'));
        expect(dateError).toBeDefined();
        expect(dateError?.message).toContain('Invalid date format');
      }
    });

    test('createLabelSchema provides helpful error for invalid color', () => {
      const result = createLabelSchema.safeParse({ 
        name: 'Test',
        color: 'red' 
      });
      if (!result.success) {
        const colorError = result.error.issues.find(i => i.path.includes('color'));
        expect(colorError).toBeDefined();
        expect(colorError?.message).toContain('Invalid hex color');
      }
    });
  });
});
