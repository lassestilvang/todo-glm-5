/**
 * Labels Service Tests
 * 
 * Tests for the LabelsService class.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { LabelsService } from '../labels.service';
import { NotFoundError, ValidationError, ConflictError } from '../../errors';
import { 
  createList, 
  createTask, 
  createLabel,
  isValidUuid 
} from '@/test/fixtures';
import { get, all, run } from '../../db';

// Create a fresh service instance for each test
const labelsService = new LabelsService();

describe('LabelsService', () => {
  let testListId: string;
  let testTaskId: string;

  beforeEach(() => {
    // Create a test list and task
    const list = createList({ name: 'Test List' });
    testListId = list.id;
    const task = createTask({ list_id: testListId, name: 'Test Task' });
    testTaskId = task.id;
  });

  describe('getAll()', () => {
    test('returns all labels', async () => {
      // Arrange
      createLabel({ name: 'Label 1' });
      createLabel({ name: 'Label 2' });
      
      // Act
      const labels = await labelsService.getAll();
      
      // Assert
      expect(labels.length).toBe(2);
    });

    test('returns empty array when no labels exist', async () => {
      // Act
      const labels = await labelsService.getAll();
      
      // Assert
      expect(labels.length).toBe(0);
    });

    test('returns labels ordered by name', async () => {
      // Arrange
      createLabel({ name: 'Zebra' });
      createLabel({ name: 'Apple' });
      createLabel({ name: 'Mango' });
      
      // Act
      const labels = await labelsService.getAll();
      
      // Assert
      expect(labels[0].name).toBe('Apple');
      expect(labels[1].name).toBe('Mango');
      expect(labels[2].name).toBe('Zebra');
    });
  });

  describe('getById()', () => {
    test('returns correct label', async () => {
      // Arrange
      const created = createLabel({ name: 'Test Label' });
      
      // Act
      const label = await labelsService.getById(created.id);
      
      // Assert
      expect(label).not.toBeNull();
      expect(label?.id).toBe(created.id);
      expect(label?.name).toBe('Test Label');
    });

    test('returns null for non-existent label', async () => {
      // Act
      const label = await labelsService.getById('non-existent-id');
      
      // Assert
      expect(label).toBeNull();
    });
  });

  describe('create()', () => {
    test('creates label with unique name', async () => {
      // Arrange
      const data = { name: 'New Label', color: '#ff0000', emoji: '🏷️' };
      
      // Act
      const label = await labelsService.create(data);
      
      // Assert
      expect(label.name).toBe('New Label');
      expect(label.color).toBe('#ff0000');
      expect(label.emoji).toBe('🏷️');
    });

    test('throws error for duplicate name', async () => {
      // Arrange
      createLabel({ name: 'Existing Label' });
      
      // Act & Assert
      expect(
        labelsService.create({ name: 'Existing Label' })
      ).rejects.toThrow(ConflictError);
    });

    test('throws ValidationError for empty name', async () => {
      // Act & Assert
      expect(
        labelsService.create({ name: '' })
      ).rejects.toThrow(ValidationError);
    });

    test('sets default color when not provided', async () => {
      // Arrange
      const data = { name: 'No Color Label' };
      
      // Act
      const label = await labelsService.create(data);
      
      // Assert
      expect(label.color).toBe('#64748b');
    });

    test('trims whitespace from name', async () => {
      // Arrange
      const data = { name: '  Trimmed Label  ' };
      
      // Act
      const label = await labelsService.create(data);
      
      // Assert
      expect(label.name).toBe('Trimmed Label');
    });

    test('allows duplicate check to be case-sensitive', async () => {
      // Arrange
      createLabel({ name: 'Label' });
      
      // Act - Should not throw because case is different
      const label = await labelsService.create({ name: 'LABEL' });
      
      // Assert
      expect(label.name).toBe('LABEL');
    });
  });

  describe('update()', () => {
    test('updates label properties', async () => {
      // Arrange
      const label = createLabel({ name: 'Original', color: '#000000' });
      
      // Act
      const updated = await labelsService.update(label.id, { 
        name: 'Updated', 
        color: '#ffffff' 
      });
      
      // Assert
      expect(updated.name).toBe('Updated');
      expect(updated.color).toBe('#ffffff');
    });

    test('throws NotFoundError for non-existent label', async () => {
      // Act & Assert
      expect(
        labelsService.update('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    test('throws ValidationError for empty name', async () => {
      // Arrange
      const label = createLabel({ name: 'Test' });
      
      // Act & Assert
      expect(
        labelsService.update(label.id, { name: '' })
      ).rejects.toThrow(ValidationError);
    });

    test('throws ConflictError for duplicate name', async () => {
      // Arrange
      createLabel({ name: 'Label 1' });
      const label2 = createLabel({ name: 'Label 2' });
      
      // Act & Assert
      expect(
        labelsService.update(label2.id, { name: 'Label 1' })
      ).rejects.toThrow(ConflictError);
    });

    test('allows updating to same name', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      
      // Act - Should not throw
      const updated = await labelsService.update(label.id, { name: 'Test Label' });
      
      // Assert
      expect(updated.name).toBe('Test Label');
    });

    test('only updates provided fields', async () => {
      // Arrange
      const label = createLabel({ name: 'Original', color: '#000000', emoji: '🏷️' });
      
      // Act
      const updated = await labelsService.update(label.id, { name: 'Updated' });
      
      // Assert
      expect(updated.name).toBe('Updated');
      expect(updated.color).toBe('#000000');
      expect(updated.emoji).toBe('🏷️');
    });
  });

  describe('delete()', () => {
    test('removes label', async () => {
      // Arrange
      const label = createLabel({ name: 'To Delete' });
      
      // Act
      await labelsService.delete(label.id);
      
      // Assert
      const deleted = await labelsService.getById(label.id);
      expect(deleted).toBeNull();
    });

    test('throws NotFoundError for non-existent label', async () => {
      // Act & Assert
      expect(
        labelsService.delete('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });

    test('removes task-label associations when label is deleted', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      run(
        'INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)',
        [testTaskId, label.id]
      );
      
      // Act
      await labelsService.delete(label.id);
      
      // Assert
      const associations = all<{ task_id: string }>(
        'SELECT task_id FROM task_labels WHERE label_id = ?',
        [label.id]
      );
      expect(associations.length).toBe(0);
    });
  });

  describe('addToTask()', () => {
    test('associates label with task', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      
      // Act
      await labelsService.addToTask(testTaskId, label.id);
      
      // Assert
      const labels = await labelsService.getTaskLabels(testTaskId);
      expect(labels.length).toBe(1);
      expect(labels[0].id).toBe(label.id);
    });

    test('throws NotFoundError for non-existent task', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      
      // Act & Assert
      expect(
        labelsService.addToTask('non-existent-task', label.id)
      ).rejects.toThrow(NotFoundError);
    });

    test('throws NotFoundError for non-existent label', async () => {
      // Act & Assert
      expect(
        labelsService.addToTask(testTaskId, 'non-existent-label')
      ).rejects.toThrow(NotFoundError);
    });

    test('does not create duplicate associations', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      await labelsService.addToTask(testTaskId, label.id);
      
      // Act - Add again
      await labelsService.addToTask(testTaskId, label.id);
      
      // Assert
      const labels = await labelsService.getTaskLabels(testTaskId);
      expect(labels.length).toBe(1);
    });
  });

  describe('removeFromTask()', () => {
    test('removes label from task', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      await labelsService.addToTask(testTaskId, label.id);
      
      // Act
      await labelsService.removeFromTask(testTaskId, label.id);
      
      // Assert
      const labels = await labelsService.getTaskLabels(testTaskId);
      expect(labels.length).toBe(0);
    });

    test('does not throw when removing non-existent association', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      
      // Act - Should not throw
      await labelsService.removeFromTask(testTaskId, label.id);
      
      // Assert
      const labels = await labelsService.getTaskLabels(testTaskId);
      expect(labels.length).toBe(0);
    });
  });

  describe('getTaskLabels()', () => {
    test('returns labels for a task', async () => {
      // Arrange
      const label1 = createLabel({ name: 'Label 1' });
      const label2 = createLabel({ name: 'Label 2' });
      await labelsService.addToTask(testTaskId, label1.id);
      await labelsService.addToTask(testTaskId, label2.id);
      
      // Act
      const labels = await labelsService.getTaskLabels(testTaskId);
      
      // Assert
      expect(labels.length).toBe(2);
    });

    test('returns empty array for task with no labels', async () => {
      // Act
      const labels = await labelsService.getTaskLabels(testTaskId);
      
      // Assert
      expect(labels.length).toBe(0);
    });

    test('returns labels ordered by name', async () => {
      // Arrange
      const label1 = createLabel({ name: 'Zebra' });
      const label2 = createLabel({ name: 'Apple' });
      await labelsService.addToTask(testTaskId, label1.id);
      await labelsService.addToTask(testTaskId, label2.id);
      
      // Act
      const labels = await labelsService.getTaskLabels(testTaskId);
      
      // Assert
      expect(labels[0].name).toBe('Apple');
      expect(labels[1].name).toBe('Zebra');
    });
  });

  describe('getTasksWithLabel()', () => {
    test('returns tasks with label', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      const task2 = createTask({ list_id: testListId, name: 'Task 2' });
      await labelsService.addToTask(testTaskId, label.id);
      await labelsService.addToTask(task2.id, label.id);
      
      // Act
      const tasks = await labelsService.getTasksWithLabel(label.id);
      
      // Assert
      expect(tasks.length).toBe(2);
    });

    test('throws NotFoundError for non-existent label', async () => {
      // Act & Assert
      expect(
        labelsService.getTasksWithLabel('non-existent-label')
      ).rejects.toThrow(NotFoundError);
    });

    test('returns empty array for label with no tasks', async () => {
      // Arrange
      const label = createLabel({ name: 'Unused Label' });
      
      // Act
      const tasks = await labelsService.getTasksWithLabel(label.id);
      
      // Assert
      expect(tasks.length).toBe(0);
    });
  });

  describe('setTaskLabels()', () => {
    test('replaces existing labels with new ones', async () => {
      // Arrange
      const label1 = createLabel({ name: 'Label 1' });
      const label2 = createLabel({ name: 'Label 2' });
      const label3 = createLabel({ name: 'Label 3' });
      await labelsService.addToTask(testTaskId, label1.id);
      
      // Act
      await labelsService.setTaskLabels(testTaskId, [label2.id, label3.id]);
      
      // Assert
      const labels = await labelsService.getTaskLabels(testTaskId);
      expect(labels.length).toBe(2);
      const labelIds = labels.map(l => l.id);
      expect(labelIds).toContain(label2.id);
      expect(labelIds).toContain(label3.id);
      expect(labelIds).not.toContain(label1.id);
    });

    test('throws NotFoundError for non-existent task', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      
      // Act & Assert
      expect(
        labelsService.setTaskLabels('non-existent-task', [label.id])
      ).rejects.toThrow(NotFoundError);
    });

    test('clears all labels when given empty array', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      await labelsService.addToTask(testTaskId, label.id);
      
      // Act
      await labelsService.setTaskLabels(testTaskId, []);
      
      // Assert
      const labels = await labelsService.getTaskLabels(testTaskId);
      expect(labels.length).toBe(0);
    });
  });

  describe('getUsageCount()', () => {
    test('returns count of tasks using label', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      const task2 = createTask({ list_id: testListId, name: 'Task 2' });
      await labelsService.addToTask(testTaskId, label.id);
      await labelsService.addToTask(task2.id, label.id);
      
      // Act
      const count = await labelsService.getUsageCount(label.id);
      
      // Assert
      expect(count).toBe(2);
    });

    test('returns 0 for unused label', async () => {
      // Arrange
      const label = createLabel({ name: 'Unused Label' });
      
      // Act
      const count = await labelsService.getUsageCount(label.id);
      
      // Assert
      expect(count).toBe(0);
    });
  });
});
