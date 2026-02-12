/**
 * Reminders Service Tests
 * 
 * Tests for the RemindersService class.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { RemindersService } from '../reminders.service';
import { NotFoundError, ValidationError } from '../../errors';
import { 
  createList, 
  createTask, 
  createReminder,
  hoursFromNow,
  now,
  isValidUuid 
} from '@/test/fixtures';
import { get, all, run } from '../../db';

// Create a fresh service instance for each test
const remindersService = new RemindersService();

describe('RemindersService', () => {
  let testListId: string;
  let testTaskId: string;

  beforeEach(() => {
    // Create a test list and task
    const list = createList({ name: 'Test List' });
    testListId = list.id;
    const task = createTask({ list_id: testListId, name: 'Test Task' });
    testTaskId = task.id;
  });

  describe('getByTaskId()', () => {
    test('returns reminders for a task', async () => {
      // Arrange
      const remindAt = hoursFromNow(1);
      createReminder(testTaskId, { remind_at: remindAt });
      
      // Act
      const reminders = await remindersService.getByTaskId(testTaskId);
      
      // Assert
      expect(reminders.length).toBe(1);
    });

    test('returns empty array for task with no reminders', async () => {
      // Act
      const reminders = await remindersService.getByTaskId(testTaskId);
      
      // Assert
      expect(reminders.length).toBe(0);
    });

    test('returns reminders ordered by remind_at', async () => {
      // Arrange
      createReminder(testTaskId, { remind_at: hoursFromNow(3) });
      createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      createReminder(testTaskId, { remind_at: hoursFromNow(2) });
      
      // Act
      const reminders = await remindersService.getByTaskId(testTaskId);
      
      // Assert
      expect(new Date(reminders[0].remind_at).getTime()).toBeLessThan(
        new Date(reminders[1].remind_at).getTime()
      );
      expect(new Date(reminders[1].remind_at).getTime()).toBeLessThan(
        new Date(reminders[2].remind_at).getTime()
      );
    });
  });

  describe('getById()', () => {
    test('returns reminder for valid ID', async () => {
      // Arrange
      const created = createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      
      // Act
      const reminder = await remindersService.getById(created.id);
      
      // Assert
      expect(reminder).not.toBeNull();
      expect(reminder?.id).toBe(created.id);
    });

    test('returns null for non-existent reminder', async () => {
      // Act
      const reminder = await remindersService.getById('non-existent-id');
      
      // Assert
      expect(reminder).toBeNull();
    });
  });

  describe('getPending()', () => {
    test('returns unsent reminders', async () => {
      // Arrange
      createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      createReminder(testTaskId, { remind_at: hoursFromNow(2) });
      
      // Mark one as sent
      const reminders = await remindersService.getByTaskId(testTaskId);
      await remindersService.markAsSent(reminders[0].id);
      
      // Act
      const pending = await remindersService.getPending();
      
      // Assert
      expect(pending.length).toBe(1);
    });

    test('returns empty array when all reminders are sent', async () => {
      // Arrange
      const reminder = createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      await remindersService.markAsSent(reminder.id);
      
      // Act
      const pending = await remindersService.getPending();
      
      // Assert
      expect(pending.length).toBe(0);
    });
  });

  describe('getDue()', () => {
    test('returns pending reminders past remind time', async () => {
      // Arrange - Create a reminder in the past
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 1);
      createReminder(testTaskId, { remind_at: pastTime.toISOString() });
      
      // Create a future reminder
      createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      
      // Act
      const due = await remindersService.getDue();
      
      // Assert
      expect(due.length).toBe(1);
    });

    test('excludes sent reminders', async () => {
      // Arrange - Create a past reminder and mark it sent
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 1);
      const reminder = createReminder(testTaskId, { remind_at: pastTime.toISOString() });
      await remindersService.markAsSent(reminder.id);
      
      // Act
      const due = await remindersService.getDue();
      
      // Assert
      expect(due.length).toBe(0);
    });
  });

  describe('create()', () => {
    test('creates reminder', async () => {
      // Arrange
      const remindAt = hoursFromNow(1);
      const data = { remind_at: remindAt };
      
      // Act
      const reminder = await remindersService.create(testTaskId, data);
      
      // Assert
      expect(reminder.task_id).toBe(testTaskId);
      expect(reminder.remind_at).toBe(remindAt);
      expect(reminder.is_sent).toBe(false);
    });

    test('throws NotFoundError for non-existent task', async () => {
      // Arrange
      const data = { remind_at: hoursFromNow(1) };
      
      // Act & Assert
      expect(
        remindersService.create('non-existent-task', data)
      ).rejects.toThrow(NotFoundError);
    });

    test('throws ValidationError for missing remind_at', async () => {
      // Arrange
      const data = { remind_at: '' };
      
      // Act & Assert
      expect(
        remindersService.create(testTaskId, data)
      ).rejects.toThrow(ValidationError);
    });

    test('throws ValidationError for invalid date format', async () => {
      // Arrange
      const data = { remind_at: 'invalid-date' };
      
      // Act & Assert
      expect(
        remindersService.create(testTaskId, data)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('delete()', () => {
    test('removes reminder', async () => {
      // Arrange
      const reminder = createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      
      // Act
      await remindersService.delete(reminder.id);
      
      // Assert
      const deleted = await remindersService.getById(reminder.id);
      expect(deleted).toBeNull();
    });

    test('throws NotFoundError for non-existent reminder', async () => {
      // Act & Assert
      expect(
        remindersService.delete('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('markAsSent()', () => {
    test('marks reminder as sent', async () => {
      // Arrange
      const reminder = createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      
      // Act
      await remindersService.markAsSent(reminder.id);
      
      // Assert
      const updated = await remindersService.getById(reminder.id);
      expect(updated?.is_sent).toBe(true);
    });

    test('throws NotFoundError for non-existent reminder', async () => {
      // Act & Assert
      expect(
        remindersService.markAsSent('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('markAllAsSent()', () => {
    test('marks all reminders for a task as sent', async () => {
      // Arrange
      createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      createReminder(testTaskId, { remind_at: hoursFromNow(2) });
      
      // Act
      await remindersService.markAllAsSent(testTaskId);
      
      // Assert
      const reminders = await remindersService.getByTaskId(testTaskId);
      expect(reminders.every(r => r.is_sent)).toBe(true);
    });
  });

  describe('deleteByTaskId()', () => {
    test('deletes all reminders for a task', async () => {
      // Arrange
      createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      createReminder(testTaskId, { remind_at: hoursFromNow(2) });
      
      // Act
      await remindersService.deleteByTaskId(testTaskId);
      
      // Assert
      const reminders = await remindersService.getByTaskId(testTaskId);
      expect(reminders.length).toBe(0);
    });
  });

  describe('getUpcoming()', () => {
    test('returns reminders within time range', async () => {
      // Arrange
      const from = new Date();
      const to = new Date();
      to.setHours(to.getHours() + 3);
      
      createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      createReminder(testTaskId, { remind_at: hoursFromNow(2) });
      createReminder(testTaskId, { remind_at: hoursFromNow(5) }); // Outside range
      
      // Act
      const upcoming = await remindersService.getUpcoming(from, to);
      
      // Assert
      expect(upcoming.length).toBe(2);
    });

    test('excludes sent reminders', async () => {
      // Arrange
      const from = new Date();
      const to = new Date();
      to.setHours(to.getHours() + 3);
      
      const reminder = createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      await remindersService.markAsSent(reminder.id);
      createReminder(testTaskId, { remind_at: hoursFromNow(2) });
      
      // Act
      const upcoming = await remindersService.getUpcoming(from, to);
      
      // Assert
      expect(upcoming.length).toBe(1);
    });
  });

  describe('getCountByTaskId()', () => {
    test('returns count of reminders for a task', async () => {
      // Arrange
      createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      createReminder(testTaskId, { remind_at: hoursFromNow(2) });
      
      // Act
      const count = await remindersService.getCountByTaskId(testTaskId);
      
      // Assert
      expect(count).toBe(2);
    });

    test('returns 0 for task with no reminders', async () => {
      // Act
      const count = await remindersService.getCountByTaskId(testTaskId);
      
      // Assert
      expect(count).toBe(0);
    });
  });

  describe('getPendingCountByTaskId()', () => {
    test('returns count of pending reminders', async () => {
      // Arrange
      const reminder = createReminder(testTaskId, { remind_at: hoursFromNow(1) });
      createReminder(testTaskId, { remind_at: hoursFromNow(2) });
      await remindersService.markAsSent(reminder.id);
      
      // Act
      const count = await remindersService.getPendingCountByTaskId(testTaskId);
      
      // Assert
      expect(count).toBe(1);
    });
  });
});
