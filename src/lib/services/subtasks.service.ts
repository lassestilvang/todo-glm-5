/**
 * Subtasks Service
 * 
 * Handles all database operations for subtasks.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  all, 
  get, 
  run, 
  transaction 
} from '../db';
import { 
  Subtask, 
  SubtaskRow, 
  CreateSubtaskRequest, 
  UpdateSubtaskRequest,
  rowToSubtask 
} from '@/types';
import { 
  NotFoundError, 
  ValidationError, 
  DatabaseError 
} from '../errors';

/**
 * Convert database row to Subtask entity
 */
function mapRowToSubtask(row: SubtaskRow): Subtask {
  return rowToSubtask(row);
}

/**
 * Subtasks service class
 */
export class SubtasksService {
  /**
   * Get all subtasks for a task
   */
  async getByTaskId(taskId: string): Promise<Subtask[]> {
    try {
      const rows = all<SubtaskRow>(
        'SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC',
        [taskId]
      );
      return rows.map(mapRowToSubtask);
    } catch (error) {
      throw new DatabaseError('Failed to fetch subtasks', error as Error);
    }
  }

  /**
   * Get a single subtask by ID
   */
  async getById(id: string): Promise<Subtask | null> {
    try {
      const row = get<SubtaskRow>(
        'SELECT * FROM subtasks WHERE id = ?',
        [id]
      );
      return row ? mapRowToSubtask(row) : null;
    } catch (error) {
      throw new DatabaseError('Failed to fetch subtask', error as Error);
    }
  }

  /**
   * Create a new subtask
   */
  async create(taskId: string, data: CreateSubtaskRequest): Promise<Subtask> {
    // Validate input
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Subtask name is required');
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
      return transaction(() => {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        // Get the max position for ordering
        const maxPosition = get<{ max: number }>(
          'SELECT COALESCE(MAX(position), -1) as max FROM subtasks WHERE task_id = ?',
          [taskId]
        );
        const position = (maxPosition?.max ?? -1) + 1;

        run(
          `INSERT INTO subtasks (id, task_id, name, is_completed, position, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, taskId, data.name.trim(), 0, position, now]
        );

        const subtask = this.getByIdSync(id);
        if (!subtask) {
          throw new DatabaseError('Failed to retrieve created subtask');
        }
        return subtask;
      });
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to create subtask', error as Error);
    }
  }

  /**
   * Update a subtask
   */
  async update(id: string, data: UpdateSubtaskRequest): Promise<Subtask> {
    // Check if subtask exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Subtask', id);
    }

    // Validate input
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Subtask name cannot be empty');
    }

    try {
      const updates: string[] = [];
      const values: unknown[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name.trim());
      }
      if (data.is_completed !== undefined) {
        updates.push('is_completed = ?');
        values.push(data.is_completed ? 1 : 0);
      }
      if (data.position !== undefined) {
        updates.push('position = ?');
        values.push(data.position);
      }

      if (updates.length > 0) {
        values.push(id);

        run(
          `UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      const subtask = await this.getById(id);
      if (!subtask) {
        throw new DatabaseError('Failed to retrieve updated subtask');
      }
      return subtask;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to update subtask', error as Error);
    }
  }

  /**
   * Delete a subtask
   */
  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Subtask', id);
    }

    try {
      run('DELETE FROM subtasks WHERE id = ?', [id]);
    } catch (error) {
      throw new DatabaseError('Failed to delete subtask', error as Error);
    }
  }

  /**
   * Toggle subtask completion status
   */
  async toggle(id: string): Promise<Subtask> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Subtask', id);
    }

    try {
      const newStatus = existing.is_completed ? 0 : 1;
      
      run(
        'UPDATE subtasks SET is_completed = ? WHERE id = ?',
        [newStatus, id]
      );

      const subtask = await this.getById(id);
      if (!subtask) {
        throw new DatabaseError('Failed to retrieve toggled subtask');
      }
      return subtask;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to toggle subtask', error as Error);
    }
  }

  /**
   * Reorder subtasks within a task
   */
  async reorder(taskId: string, subtaskIds: string[]): Promise<void> {
    if (!Array.isArray(subtaskIds) || subtaskIds.length === 0) {
      throw new ValidationError('Subtask IDs array is required');
    }

    try {
      transaction(() => {
        subtaskIds.forEach((id, index) => {
          run(
            'UPDATE subtasks SET position = ? WHERE id = ? AND task_id = ?',
            [index, id, taskId]
          );
        });
      });
    } catch (error) {
      throw new DatabaseError('Failed to reorder subtasks', error as Error);
    }
  }

  /**
   * Get completion statistics for a task's subtasks
   */
  async getCompletionStats(taskId: string): Promise<{
    total: number;
    completed: number;
    percentage: number;
  }> {
    try {
      const stats = get<{
        total: number;
        completed: number;
      }>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
        FROM subtasks 
        WHERE task_id = ?`,
        [taskId]
      );

      const total = stats?.total ?? 0;
      const completed = stats?.completed ?? 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { total, completed, percentage };
    } catch (error) {
      throw new DatabaseError('Failed to get subtask completion stats', error as Error);
    }
  }

  /**
   * Get subtask by ID (synchronous version for use in transactions)
   */
  private getByIdSync(id: string): Subtask | null {
    const row = get<SubtaskRow>(
      'SELECT * FROM subtasks WHERE id = ?',
      [id]
    );
    return row ? mapRowToSubtask(row) : null;
  }
}

// Export singleton instance
export const subtasksService = new SubtasksService();
