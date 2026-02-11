/**
 * Labels Service
 * 
 * Handles all database operations for labels and task-label associations.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  all, 
  get, 
  run, 
  transaction 
} from '../db';
import { 
  Label, 
  LabelRow, 
  Task,
  TaskRow,
  CreateLabelRequest, 
  UpdateLabelRequest,
  rowToLabel,
  rowToTask
} from '@/types';
import { 
  NotFoundError, 
  ValidationError, 
  DatabaseError,
  ConflictError 
} from '../errors';

/**
 * Convert database row to Label entity
 */
function mapRowToLabel(row: LabelRow): Label {
  return rowToLabel(row);
}

/**
 * Convert database row to Task entity
 */
function mapRowToTask(row: TaskRow): Task {
  return rowToTask(row);
}

/**
 * Labels service class
 */
export class LabelsService {
  /**
   * Get all labels
   */
  async getAll(): Promise<Label[]> {
    try {
      const rows = all<LabelRow>(
        'SELECT * FROM labels ORDER BY name ASC'
      );
      return rows.map(mapRowToLabel);
    } catch (error) {
      throw new DatabaseError('Failed to fetch labels', error as Error);
    }
  }

  /**
   * Get a single label by ID
   */
  async getById(id: string): Promise<Label | null> {
    try {
      const row = get<LabelRow>(
        'SELECT * FROM labels WHERE id = ?',
        [id]
      );
      return row ? mapRowToLabel(row) : null;
    } catch (error) {
      throw new DatabaseError('Failed to fetch label', error as Error);
    }
  }

  /**
   * Create a new label
   */
  async create(data: CreateLabelRequest): Promise<Label> {
    // Validate input
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Label name is required');
    }

    // Check for duplicate name
    const existing = get<LabelRow>(
      'SELECT id FROM labels WHERE name = ?',
      [data.name.trim()]
    );
    if (existing) {
      throw new ConflictError(`Label with name "${data.name}" already exists`);
    }

    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      run(
        `INSERT INTO labels (id, name, emoji, color, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          data.name.trim(),
          data.emoji ?? null,
          data.color ?? '#64748b'
        ]
      );

      const label = await this.getById(id);
      if (!label) {
        throw new DatabaseError('Failed to retrieve created label');
      }
      return label;
    } catch (error) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to create label', error as Error);
    }
  }

  /**
   * Update a label
   */
  async update(id: string, data: UpdateLabelRequest): Promise<Label> {
    // Check if label exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Label', id);
    }

    // Validate input
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Label name cannot be empty');
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name.trim() !== existing.name) {
      const duplicate = get<LabelRow>(
        'SELECT id FROM labels WHERE name = ? AND id != ?',
        [data.name.trim(), id]
      );
      if (duplicate) {
        throw new ConflictError(`Label with name "${data.name}" already exists`);
      }
    }

    try {
      const updates: string[] = [];
      const values: unknown[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name.trim());
      }
      if (data.emoji !== undefined) {
        updates.push('emoji = ?');
        values.push(data.emoji);
      }
      if (data.color !== undefined) {
        updates.push('color = ?');
        values.push(data.color);
      }

      if (updates.length > 0) {
        values.push(id);

        run(
          `UPDATE labels SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      const label = await this.getById(id);
      if (!label) {
        throw new DatabaseError('Failed to retrieve updated label');
      }
      return label;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to update label', error as Error);
    }
  }

  /**
   * Delete a label
   */
  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Label', id);
    }

    try {
      // Delete task-label associations first (should cascade, but be explicit)
      run('DELETE FROM task_labels WHERE label_id = ?', [id]);
      // Delete the label
      run('DELETE FROM labels WHERE id = ?', [id]);
    } catch (error) {
      throw new DatabaseError('Failed to delete label', error as Error);
    }
  }

  /**
   * Add a label to a task
   */
  async addToTask(taskId: string, labelId: string): Promise<void> {
    // Verify task exists
    const taskExists = get<{ id: string }>(
      'SELECT id FROM tasks WHERE id = ?',
      [taskId]
    );
    if (!taskExists) {
      throw new NotFoundError('Task', taskId);
    }

    // Verify label exists
    const labelExists = await this.getById(labelId);
    if (!labelExists) {
      throw new NotFoundError('Label', labelId);
    }

    try {
      // Check if already associated
      const existing = get<{ task_id: string }>(
        'SELECT task_id FROM task_labels WHERE task_id = ? AND label_id = ?',
        [taskId, labelId]
      );

      if (!existing) {
        run(
          'INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)',
          [taskId, labelId]
        );
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to add label to task', error as Error);
    }
  }

  /**
   * Remove a label from a task
   */
  async removeFromTask(taskId: string, labelId: string): Promise<void> {
    try {
      run(
        'DELETE FROM task_labels WHERE task_id = ? AND label_id = ?',
        [taskId, labelId]
      );
    } catch (error) {
      throw new DatabaseError('Failed to remove label from task', error as Error);
    }
  }

  /**
   * Get all labels for a task
   */
  async getTaskLabels(taskId: string): Promise<Label[]> {
    try {
      const rows = all<LabelRow>(
        `SELECT l.* FROM labels l
         INNER JOIN task_labels tl ON l.id = tl.label_id
         WHERE tl.task_id = ?
         ORDER BY l.name ASC`,
        [taskId]
      );
      return rows.map(mapRowToLabel);
    } catch (error) {
      throw new DatabaseError('Failed to fetch task labels', error as Error);
    }
  }

  /**
   * Get all tasks with a specific label
   */
  async getTasksWithLabel(labelId: string): Promise<Task[]> {
    // Verify label exists
    const labelExists = await this.getById(labelId);
    if (!labelExists) {
      throw new NotFoundError('Label', labelId);
    }

    try {
      const rows = all<TaskRow>(
        `SELECT t.* FROM tasks t
         INNER JOIN task_labels tl ON t.id = tl.task_id
         WHERE tl.label_id = ?
         ORDER BY t.created_at DESC`,
        [labelId]
      );
      return rows.map(mapRowToTask);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch tasks with label', error as Error);
    }
  }

  /**
   * Set all labels for a task (replaces existing)
   */
  async setTaskLabels(taskId: string, labelIds: string[]): Promise<void> {
    // Verify task exists
    const taskExists = get<{ id: string }>(
      'SELECT id FROM tasks WHERE id = ?',
      [taskId]
    );
    if (!taskExists) {
      throw new NotFoundError('Task', taskId);
    }

    try {
      transaction(() => {
        // Remove existing labels
        run('DELETE FROM task_labels WHERE task_id = ?', [taskId]);

        // Add new labels
        labelIds.forEach(labelId => {
          run(
            'INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)',
            [taskId, labelId]
          );
        });
      });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to set task labels', error as Error);
    }
  }

  /**
   * Get label usage count
   */
  async getUsageCount(labelId: string): Promise<number> {
    try {
      const result = get<{ count: number }>(
        'SELECT COUNT(*) as count FROM task_labels WHERE label_id = ?',
        [labelId]
      );
      return result?.count ?? 0;
    } catch (error) {
      throw new DatabaseError('Failed to get label usage count', error as Error);
    }
  }
}

// Export singleton instance
export const labelsService = new LabelsService();
