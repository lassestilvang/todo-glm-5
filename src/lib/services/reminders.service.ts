/**
 * Reminders Service
 * 
 * Handles all database operations for task reminders.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  all, 
  get, 
  run 
} from '../db';
import { 
  Reminder, 
  ReminderRow, 
  CreateReminderRequest,
  rowToReminder 
} from '@/types';
import { 
  NotFoundError, 
  ValidationError, 
  DatabaseError 
} from '../errors';

/**
 * Convert database row to Reminder entity
 */
function mapRowToReminder(row: ReminderRow): Reminder {
  return rowToReminder(row);
}

/**
 * Reminders service class
 */
export class RemindersService {
  /**
   * Get all reminders for a task
   */
  async getByTaskId(taskId: string): Promise<Reminder[]> {
    try {
      const rows = all<ReminderRow>(
        'SELECT * FROM reminders WHERE task_id = ? ORDER BY remind_at ASC',
        [taskId]
      );
      return rows.map(mapRowToReminder);
    } catch (error) {
      throw new DatabaseError('Failed to fetch reminders', error as Error);
    }
  }

  /**
   * Get a single reminder by ID
   */
  async getById(id: string): Promise<Reminder | null> {
    try {
      const row = get<ReminderRow>(
        'SELECT * FROM reminders WHERE id = ?',
        [id]
      );
      return row ? mapRowToReminder(row) : null;
    } catch (error) {
      throw new DatabaseError('Failed to fetch reminder', error as Error);
    }
  }

  /**
   * Get all pending (not sent) reminders
   */
  async getPending(): Promise<Reminder[]> {
    try {
      const rows = all<ReminderRow>(
        `SELECT * FROM reminders 
         WHERE is_sent = 0 
         ORDER BY remind_at ASC`
      );
      return rows.map(mapRowToReminder);
    } catch (error) {
      throw new DatabaseError('Failed to fetch pending reminders', error as Error);
    }
  }

  /**
   * Get all due reminders (pending and past the remind time)
   */
  async getDue(): Promise<Reminder[]> {
    const now = new Date().toISOString();
    
    try {
      const rows = all<ReminderRow>(
        `SELECT * FROM reminders 
         WHERE is_sent = 0 AND remind_at <= ?
         ORDER BY remind_at ASC`,
        [now]
      );
      return rows.map(mapRowToReminder);
    } catch (error) {
      throw new DatabaseError('Failed to fetch due reminders', error as Error);
    }
  }

  /**
   * Create a new reminder
   */
  async create(taskId: string, data: CreateReminderRequest): Promise<Reminder> {
    // Validate input
    if (!data.remind_at) {
      throw new ValidationError('Reminder time is required');
    }

    // Validate remind_at is a valid date
    const remindDate = new Date(data.remind_at);
    if (isNaN(remindDate.getTime())) {
      throw new ValidationError('Invalid reminder time format');
    }

    // Verify task exists
    const taskExists = get<{ id: string }>(
      'SELECT id FROM tasks WHERE id = ?',
      [taskId]
    );
    if (!taskExists) {
      throw new NotFoundError('Task', taskId);
    }

    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      run(
        `INSERT INTO reminders (id, task_id, remind_at, is_sent, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, taskId, data.remind_at, 0, now]
      );

      const reminder = await this.getById(id);
      if (!reminder) {
        throw new DatabaseError('Failed to retrieve created reminder');
      }
      return reminder;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to create reminder', error as Error);
    }
  }

  /**
   * Delete a reminder
   */
  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Reminder', id);
    }

    try {
      run('DELETE FROM reminders WHERE id = ?', [id]);
    } catch (error) {
      throw new DatabaseError('Failed to delete reminder', error as Error);
    }
  }

  /**
   * Mark a reminder as sent
   */
  async markAsSent(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Reminder', id);
    }

    try {
      run(
        'UPDATE reminders SET is_sent = 1 WHERE id = ?',
        [id]
      );
    } catch (error) {
      throw new DatabaseError('Failed to mark reminder as sent', error as Error);
    }
  }

  /**
   * Mark all reminders for a task as sent
   */
  async markAllAsSent(taskId: string): Promise<void> {
    try {
      run(
        'UPDATE reminders SET is_sent = 1 WHERE task_id = ?',
        [taskId]
      );
    } catch (error) {
      throw new DatabaseError('Failed to mark reminders as sent', error as Error);
    }
  }

  /**
   * Delete all reminders for a task
   */
  async deleteByTaskId(taskId: string): Promise<void> {
    try {
      run('DELETE FROM reminders WHERE task_id = ?', [taskId]);
    } catch (error) {
      throw new DatabaseError('Failed to delete task reminders', error as Error);
    }
  }

  /**
   * Get upcoming reminders within a time range
   */
  async getUpcoming(from: Date, to: Date): Promise<Reminder[]> {
    try {
      const rows = all<ReminderRow>(
        `SELECT * FROM reminders 
         WHERE is_sent = 0 AND remind_at >= ? AND remind_at <= ?
         ORDER BY remind_at ASC`,
        [from.toISOString(), to.toISOString()]
      );
      return rows.map(mapRowToReminder);
    } catch (error) {
      throw new DatabaseError('Failed to fetch upcoming reminders', error as Error);
    }
  }

  /**
   * Get reminder count for a task
   */
  async getCountByTaskId(taskId: string): Promise<number> {
    try {
      const result = get<{ count: number }>(
        'SELECT COUNT(*) as count FROM reminders WHERE task_id = ?',
        [taskId]
      );
      return result?.count ?? 0;
    } catch (error) {
      throw new DatabaseError('Failed to get reminder count', error as Error);
    }
  }

  /**
   * Get pending reminder count for a task
   */
  async getPendingCountByTaskId(taskId: string): Promise<number> {
    try {
      const result = get<{ count: number }>(
        'SELECT COUNT(*) as count FROM reminders WHERE task_id = ? AND is_sent = 0',
        [taskId]
      );
      return result?.count ?? 0;
    } catch (error) {
      throw new DatabaseError('Failed to get pending reminder count', error as Error);
    }
  }
}

// Export singleton instance
export const remindersService = new RemindersService();
