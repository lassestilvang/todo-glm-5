/**
 * Subtasks Service Tests
 * 
 * Tests for the SubtasksService class.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { SubtasksService } from '../subtasks.service';
import { NotFoundError, ValidationError } from '../../errors';
import { 
  createList, 
  createTask, 
  createSubtask,
  isValidUuid 
} from '@/test/fixtures';
import { get, all, run } from '../../db';

// Create a fresh service instance for each test
const subtasksService = new SubtasksService();

describe('SubtasksService', () => {
  let testListId: string;
  let testTaskId: string;

  beforeEach(() => {
    // Create a test list and task for subtasks
    const list = createList({ name: 'Test List' });
    testListId = list.id;
    const task = createTask({ list_id: testListId, name: 'Test Task' });
    testTaskId = task.id;
  });

  describe('getByTaskId()', () => {
    test('returns subtasks for a task', async () => {
      // Arrange
      createSubtask(testTaskId, { name: 'Subtask 1' });
      createSubtask(testTaskId, { name: 'Subtask 2' });
      
      // Act
      const subtasks = await subtasksService.getByTaskId(testTaskId);
      
      // Assert
      expect(subtasks.length).toBe(2);
    });

    test('returns empty array for task with no subtasks', async () => {
      // Act
      const subtasks = await subtasksService.getByTaskId(testTaskId);
      
      // Assert
      expect(subtasks.length).toBe(0);
    });

    test('returns subtasks ordered by position', async () => {
      // Arrange
      createSubtask(testTaskId, { name: 'First', position: 2 });
      createSubtask(testTaskId, { name: 'Second', position: 0 });
      createSubtask(testTaskId, { name: 'Third', position: 1 });
      
      // Act
      const subtasks = await subtasksService.getByTaskId(testTaskId);
      
      // Assert
      expect(subtasks[0].name).toBe('Second');
      expect(subtasks[1].name).toBe('Third');
      expect(subtasks[2].name).toBe('First');
    });
  });

  describe('getById()', () => {
    test('returns subtask for valid ID', async () => {
      // Arrange
      const created = createSubtask(testTaskId, { name: 'Test Subtask' });
      
      // Act
      const subtask = await subtasksService.getById(created.id);
      
      // Assert
      expect(subtask).not.toBeNull();
      expect(subtask?.id).toBe(created.id);
      expect(subtask?.name).toBe('Test Subtask');
    });

    test('returns null for non-existent subtask', async () => {
      // Act
      const subtask = await subtasksService.getById('non-existent-id');
      
      // Assert
      expect(subtask).toBeNull();
    });
  });

  describe('create()', () => {
    test('creates subtask linked to task', async () => {
      // Arrange
      const data = { task_id: testTaskId, name: 'New Subtask' };
      
      // Act
      const subtask = await subtasksService.create(testTaskId, data);
      
      // Assert
      expect(subtask.task_id).toBe(testTaskId);
      expect(subtask.name).toBe('New Subtask');
      expect(subtask.is_completed).toBe(false);
    });

    test('throws NotFoundError for non-existent task', async () => {
      // Arrange
      const data = { task_id: 'non-existent-task', name: 'Subtask' };
      
      // Act & Assert
      expect(
        subtasksService.create('non-existent-task', data)
      ).rejects.toThrow(NotFoundError);
    });

    test('throws ValidationError for empty name', async () => {
      // Arrange
      const data = { task_id: testTaskId, name: '' };
      
      // Act & Assert
      expect(
        subtasksService.create(testTaskId, data)
      ).rejects.toThrow(ValidationError);
    });

    test('sets position to end of list', async () => {
      // Arrange
      createSubtask(testTaskId, { name: 'First', position: 0 });
      createSubtask(testTaskId, { name: 'Second', position: 1 });
      
      // Act
      const subtask = await subtasksService.create(testTaskId, { 
        task_id: testTaskId, 
        name: 'Third' 
      });
      
      // Assert
      expect(subtask.position).toBe(2);
    });

    test('trims whitespace from name', async () => {
      // Arrange
      const data = { task_id: testTaskId, name: '  Trimmed Subtask  ' };
      
      // Act
      const subtask = await subtasksService.create(testTaskId, data);
      
      // Assert
      expect(subtask.name).toBe('Trimmed Subtask');
    });
  });

  describe('update()', () => {
    test('updates subtask name', async () => {
      // Arrange
      const subtask = createSubtask(testTaskId, { name: 'Original' });
      
      // Act
      const updated = await subtasksService.update(subtask.id, { name: 'Updated' });
      
      // Assert
      expect(updated.name).toBe('Updated');
    });

    test('throws NotFoundError for non-existent subtask', async () => {
      // Act & Assert
      expect(
        subtasksService.update('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    test('throws ValidationError for empty name', async () => {
      // Arrange
      const subtask = createSubtask(testTaskId, { name: 'Test' });
      
      // Act & Assert
      expect(
        subtasksService.update(subtask.id, { name: '' })
      ).rejects.toThrow(ValidationError);
    });

    test('updates completion status', async () => {
      // Arrange
      const subtask = createSubtask(testTaskId, { name: 'Test' });
      
      // Act
      const updated = await subtasksService.update(subtask.id, { is_completed: true });
      
      // Assert
      expect(updated.is_completed).toBe(true);
    });

    test('updates position', async () => {
      // Arrange
      const subtask = createSubtask(testTaskId, { name: 'Test', position: 2 });
      
      // Act
      const updated = await subtasksService.update(subtask.id, { position: 0 });
      
      // Assert
      expect(updated.position).toBe(0);
    });
  });

  describe('toggle()', () => {
    test('toggles completion status from incomplete to complete', async () => {
      // Arrange
      const subtask = createSubtask(testTaskId, { name: 'Test' });
      
      // Act
      const toggled = await subtasksService.toggle(subtask.id);
      
      // Assert
      expect(toggled.is_completed).toBe(true);
    });

    test('toggles completion status from complete to incomplete', async () => {
      // Arrange
      const subtask = createSubtask(testTaskId, { name: 'Test' });
      run('UPDATE subtasks SET is_completed = 1 WHERE id = ?', [subtask.id]);
      
      // Act
      const toggled = await subtasksService.toggle(subtask.id);
      
      // Assert
      expect(toggled.is_completed).toBe(false);
    });

    test('throws NotFoundError for non-existent subtask', async () => {
      // Act & Assert
      expect(
        subtasksService.toggle('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete()', () => {
    test('removes subtask', async () => {
      // Arrange
      const subtask = createSubtask(testTaskId, { name: 'Test' });
      
      // Act
      await subtasksService.delete(subtask.id);
      
      // Assert
      const deleted = await subtasksService.getById(subtask.id);
      expect(deleted).toBeNull();
    });

    test('throws NotFoundError for non-existent subtask', async () => {
      // Act & Assert
      expect(
        subtasksService.delete('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('reorder()', () => {
    test('updates subtask positions', async () => {
      // Arrange
      const subtask1 = createSubtask(testTaskId, { name: 'First', position: 0 });
      const subtask2 = createSubtask(testTaskId, { name: 'Second', position: 1 });
      const subtask3 = createSubtask(testTaskId, { name: 'Third', position: 2 });
      
      // Act - Reverse order
      await subtasksService.reorder(testTaskId, [subtask3.id, subtask2.id, subtask1.id]);
      
      // Assert
      const subtasks = await subtasksService.getByTaskId(testTaskId);
      expect(subtasks[0].id).toBe(subtask3.id);
      expect(subtasks[1].id).toBe(subtask2.id);
      expect(subtasks[2].id).toBe(subtask1.id);
    });

    test('throws ValidationError for empty array', async () => {
      // Act & Assert
      expect(
        subtasksService.reorder(testTaskId, [])
      ).rejects.toThrow(ValidationError);
    });

    test('throws ValidationError for non-array input', async () => {
      // Act & Assert
      expect(
        subtasksService.reorder(testTaskId, null as unknown as string[])
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getCompletionStats()', () => {
    test('returns correct completion statistics', async () => {
      // Arrange
      const subtask1 = createSubtask(testTaskId, { name: 'First' });
      const subtask2 = createSubtask(testTaskId, { name: 'Second' });
      const subtask3 = createSubtask(testTaskId, { name: 'Third' });
      
      // Complete one subtask
      run('UPDATE subtasks SET is_completed = 1 WHERE id = ?', [subtask1.id]);
      
      // Act
      const stats = await subtasksService.getCompletionStats(testTaskId);
      
      // Assert
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.percentage).toBe(33);
    });

    test('returns zero stats for task with no subtasks', async () => {
      // Act
      const stats = await subtasksService.getCompletionStats(testTaskId);
      
      // Assert
      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.percentage).toBe(0);
    });

    test('returns 100% when all subtasks completed', async () => {
      // Arrange
      const subtask1 = createSubtask(testTaskId, { name: 'First' });
      const subtask2 = createSubtask(testTaskId, { name: 'Second' });
      run('UPDATE subtasks SET is_completed = 1 WHERE id = ?', [subtask1.id]);
      run('UPDATE subtasks SET is_completed = 1 WHERE id = ?', [subtask2.id]);
      
      // Act
      const stats = await subtasksService.getCompletionStats(testTaskId);
      
      // Assert
      expect(stats.percentage).toBe(100);
    });
  });
});
