/**
 * Lists Service Tests
 * 
 * Tests for the ListsService class.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { ListsService } from '../lists.service';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors';
import { 
  createList, 
  createTask, 
  createLabel,
  today,
  isValidUuid 
} from '@/test/fixtures';
import { get, all } from '../../db';

// Create a fresh service instance for each test
const listsService = new ListsService();

describe('ListsService', () => {
  describe('getAll()', () => {
    test('returns all lists ordered by position', async () => {
      // Arrange
      createList({ name: 'List A', position: 2 });
      createList({ name: 'List B', position: 0 });
      createList({ name: 'List C', position: 1 });
      
      // Act
      const lists = await listsService.getAll();
      
      // Assert
      expect(lists.length).toBe(4); // 3 created + Inbox
      expect(lists[0].name).toBe('Inbox'); // position 0
      expect(lists[1].name).toBe('List B'); // position 0 (but after Inbox)
      expect(lists[2].name).toBe('List C'); // position 1
      expect(lists[3].name).toBe('List A'); // position 2
    });

    test('returns empty array when no lists exist (except Inbox)', async () => {
      // Act
      const lists = await listsService.getAll();
      
      // Assert
      expect(lists.length).toBe(1); // Only Inbox
      expect(lists[0].id).toBe('inbox');
    });
  });

  describe('getById()', () => {
    test('returns correct list for valid ID', async () => {
      // Arrange
      const created = createList({ name: 'Test List' });
      
      // Act
      const list = await listsService.getById(created.id);
      
      // Assert
      expect(list).not.toBeNull();
      expect(list?.id).toBe(created.id);
      expect(list?.name).toBe('Test List');
    });

    test('returns null for non-existent list', async () => {
      // Act
      const list = await listsService.getById('non-existent-id');
      
      // Assert
      expect(list).toBeNull();
    });
  });

  describe('getDefault()', () => {
    test('returns the Inbox list', async () => {
      // Act
      const list = await listsService.getDefault();
      
      // Assert
      expect(list.id).toBe('inbox');
      expect(list.name).toBe('Inbox');
      expect(list.is_default).toBe(true);
    });
  });

  describe('create()', () => {
    test('creates a new list with correct properties', async () => {
      // Arrange
      const data = { name: 'New List', color: '#ff0000', emoji: '🎯' };
      
      // Act
      const list = await listsService.create(data);
      
      // Assert
      expect(list.name).toBe('New List');
      expect(list.color).toBe('#ff0000');
      expect(list.emoji).toBe('🎯');
      expect(list.is_default).toBe(false);
    });

    test('generates UUID for id', async () => {
      // Arrange
      const data = { name: 'Test List' };
      
      // Act
      const list = await listsService.create(data);
      
      // Assert
      expect(isValidUuid(list.id)).toBe(true);
    });

    test('sets default color and emoji when not provided', async () => {
      // Arrange
      const data = { name: 'Minimal List' };
      
      // Act
      const list = await listsService.create(data);
      
      // Assert
      expect(list.color).toBe('#6366f1');
      expect(list.emoji).toBe('📋');
    });

    test('throws ValidationError for empty name', async () => {
      // Arrange
      const data = { name: '' };
      
      // Act & Assert
      expect(listsService.create(data)).rejects.toThrow(ValidationError);
    });

    test('throws ValidationError for whitespace-only name', async () => {
      // Arrange
      const data = { name: '   ' };
      
      // Act & Assert
      expect(listsService.create(data)).rejects.toThrow(ValidationError);
    });

    test('trims whitespace from name', async () => {
      // Arrange
      const data = { name: '  Trimmed List  ' };
      
      // Act
      const list = await listsService.create(data);
      
      // Assert
      expect(list.name).toBe('Trimmed List');
    });

    test('sets position to end of list', async () => {
      // Arrange
      createList({ name: 'First', position: 1 });
      createList({ name: 'Second', position: 2 });
      
      // Act
      const list = await listsService.create({ name: 'Third' });
      
      // Assert
      expect(list.position).toBe(3);
    });
  });

  describe('update()', () => {
    test('updates list properties', async () => {
      // Arrange
      const created = createList({ name: 'Original', color: '#000000' });
      
      // Act
      const updated = await listsService.update(created.id, { 
        name: 'Updated', 
        color: '#ffffff' 
      });
      
      // Assert
      expect(updated.name).toBe('Updated');
      expect(updated.color).toBe('#ffffff');
    });

    test('throws NotFoundError for non-existent list', async () => {
      // Act & Assert
      expect(
        listsService.update('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    test('throws ValidationError for empty name', async () => {
      // Arrange
      const created = createList({ name: 'Test List' });
      
      // Act & Assert
      expect(
        listsService.update(created.id, { name: '' })
      ).rejects.toThrow(ValidationError);
    });

    test('only updates provided fields', async () => {
      // Arrange
      const created = createList({ name: 'Original', color: '#000000', emoji: '📝' });
      
      // Act
      const updated = await listsService.update(created.id, { name: 'Updated' });
      
      // Assert
      expect(updated.name).toBe('Updated');
      expect(updated.color).toBe('#000000');
      expect(updated.emoji).toBe('📝');
    });

    test('updates position', async () => {
      // Arrange
      const created = createList({ name: 'Test List', position: 5 });
      
      // Act
      const updated = await listsService.update(created.id, { position: 0 });
      
      // Assert
      expect(updated.position).toBe(0);
    });
  });

  describe('delete()', () => {
    test('removes list', async () => {
      // Arrange
      const created = createList({ name: 'To Delete' });
      
      // Act
      await listsService.delete(created.id);
      
      // Assert
      const list = await listsService.getById(created.id);
      expect(list).toBeNull();
    });

    test('throws NotFoundError for non-existent list', async () => {
      // Act & Assert
      expect(listsService.delete('non-existent-id')).rejects.toThrow(NotFoundError);
    });

    test('throws ForbiddenError when trying to delete Inbox', async () => {
      // Act & Assert
      expect(listsService.delete('inbox')).rejects.toThrow(ForbiddenError);
    });

    test('moves tasks to Inbox when list is deleted', async () => {
      // Arrange
      const list = createList({ name: 'List with tasks' });
      const task = createTask({ list_id: list.id, name: 'Task in list' });
      
      // Act
      await listsService.delete(list.id);
      
      // Assert - Task should now be in Inbox
      const tasks = all<{ id: string; list_id: string }>(
        'SELECT id, list_id FROM tasks WHERE id = ?',
        [task.id]
      );
      expect(tasks[0].list_id).toBe('inbox');
    });
  });

  describe('reorder()', () => {
    test('updates list positions', async () => {
      // Arrange
      const list1 = createList({ name: 'List 1', position: 0 });
      const list2 = createList({ name: 'List 2', position: 1 });
      const list3 = createList({ name: 'List 3', position: 2 });
      
      // Act - Reverse the order
      await listsService.reorder([list3.id, list2.id, list1.id]);
      
      // Assert
      const lists = await listsService.getAll();
      const reorderedLists = lists.filter(l => !l.is_default);
      expect(reorderedLists[0].id).toBe(list3.id);
      expect(reorderedLists[1].id).toBe(list2.id);
      expect(reorderedLists[2].id).toBe(list1.id);
    });

    test('throws ValidationError for empty array', async () => {
      // Act & Assert
      expect(listsService.reorder([])).rejects.toThrow(ValidationError);
    });

    test('throws ValidationError for non-array input', async () => {
      // Act & Assert
      expect(listsService.reorder(null as unknown as string[])).rejects.toThrow(ValidationError);
    });
  });

  describe('getWithTaskCounts()', () => {
    test('returns list with task counts', async () => {
      // Arrange
      const list = createList({ name: 'List with tasks' });
      createTask({ list_id: list.id, name: 'Task 1' });
      createTask({ list_id: list.id, name: 'Task 2' });
      
      // Create completed task
      const completedTask = createTask({ list_id: list.id, name: 'Completed Task' });
      const { run } = await import('../../db');
      run('UPDATE tasks SET is_completed = 1 WHERE id = ?', [completedTask.id]);
      
      // Act
      const result = await listsService.getWithTaskCounts(list.id);
      
      // Assert
      expect(result).not.toBeNull();
      expect(result?.list.id).toBe(list.id);
      expect(result?.taskCount).toBe(3);
      expect(result?.completedTaskCount).toBe(1);
    });

    test('returns null for non-existent list', async () => {
      // Act
      const result = await listsService.getWithTaskCounts('non-existent-id');
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAllWithTaskCounts()', () => {
    test('returns all lists with task counts', async () => {
      // Arrange
      const list1 = createList({ name: 'List 1' });
      const list2 = createList({ name: 'List 2' });
      createTask({ list_id: list1.id, name: 'Task 1' });
      createTask({ list_id: list1.id, name: 'Task 2' });
      createTask({ list_id: list2.id, name: 'Task 3' });
      
      // Act
      const results = await listsService.getAllWithTaskCounts();
      
      // Assert
      expect(results.length).toBe(3); // Inbox + 2 lists
      const list1Result = results.find(r => r.list.id === list1.id);
      const list2Result = results.find(r => r.list.id === list2.id);
      expect(list1Result?.taskCount).toBe(2);
      expect(list2Result?.taskCount).toBe(1);
    });
  });
});
