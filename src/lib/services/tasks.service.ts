/**
 * Tasks Service
 * 
 * Handles all database operations for tasks.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  addDays, 
  startOfWeek, 
  endOfWeek,
  isBefore,
  isAfter,
  parseISO
} from 'date-fns';
import { 
  all, 
  get, 
  run, 
  transaction 
} from '../db';
import { 
  Task, 
  TaskRow, 
  TaskHistory,
  TaskHistoryRow,
  CreateTaskRequest, 
  UpdateTaskRequest,
  Priority,
  TaskAction,
  RecurrenceType,
  rowToTask,
  rowToTaskHistory
} from '@/types';
import { 
  NotFoundError, 
  ValidationError, 
  DatabaseError 
} from '../errors';

/**
 * Task filter options for querying tasks
 */
export interface TaskFilterOptions {
  listId?: string;
  isCompleted?: boolean;
  priority?: Priority;
  dueDateFrom?: string;
  dueDateTo?: string;
  labelIds?: string[];
  search?: string;
}

/**
 * Convert database row to Task entity
 */
function mapRowToTask(row: TaskRow): Task {
  return rowToTask(row);
}

/**
 * Tasks service class
 */
export class TasksService {
  /**
   * Get all tasks with optional filters
   */
  async getAll(options?: TaskFilterOptions): Promise<Task[]> {
    try {
      let sql = 'SELECT * FROM tasks WHERE 1=1';
      const params: unknown[] = [];

      if (options?.listId) {
        sql += ' AND list_id = ?';
        params.push(options.listId);
      }

      if (options?.isCompleted !== undefined) {
        sql += ' AND is_completed = ?';
        params.push(options.isCompleted ? 1 : 0);
      }

      if (options?.priority !== undefined) {
        sql += ' AND priority = ?';
        params.push(options.priority);
      }

      if (options?.dueDateFrom) {
        sql += ' AND due_date >= ?';
        params.push(options.dueDateFrom);
      }

      if (options?.dueDateTo) {
        sql += ' AND due_date <= ?';
        params.push(options.dueDateTo);
      }

      if (options?.search) {
        sql += ' AND (name LIKE ? OR description LIKE ?)';
        const searchTerm = `%${options.search}%`;
        params.push(searchTerm, searchTerm);
      }

      sql += ' ORDER BY position ASC, created_at DESC';

      const rows = all<TaskRow>(sql, params);
      return rows.map(mapRowToTask);
    } catch (error) {
      throw new DatabaseError('Failed to fetch tasks', error as Error);
    }
  }

  /**
   * Get a single task by ID
   */
  async getById(id: string): Promise<Task | null> {
    try {
      const row = get<TaskRow>(
        'SELECT * FROM tasks WHERE id = ?',
        [id]
      );
      return row ? mapRowToTask(row) : null;
    } catch (error) {
      throw new DatabaseError('Failed to fetch task', error as Error);
    }
  }

  /**
   * Get tasks by list ID
   */
  async getByListId(listId: string, options?: TaskFilterOptions): Promise<Task[]> {
    return this.getAll({ ...options, listId });
  }

  /**
   * Get tasks due today
   */
  async getToday(): Promise<Task[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.getAll({
      dueDateFrom: today,
      dueDateTo: today,
      isCompleted: false,
    });
  }

  /**
   * Get tasks due in the next 7 days
   */
  async getWeek(): Promise<Task[]> {
    const today = startOfDay(new Date());
    const weekEnd = endOfDay(addDays(today, 6));
    
    return this.getAll({
      dueDateFrom: format(today, 'yyyy-MM-dd'),
      dueDateTo: format(weekEnd, 'yyyy-MM-dd'),
      isCompleted: false,
    });
  }

  /**
   * Get all upcoming (future) tasks
   */
  async getUpcoming(): Promise<Task[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    try {
      const rows = all<TaskRow>(
        `SELECT * FROM tasks 
         WHERE due_date >= ? AND is_completed = 0
         ORDER BY due_date ASC, priority DESC`,
        [today]
      );
      return rows.map(mapRowToTask);
    } catch (error) {
      throw new DatabaseError('Failed to fetch upcoming tasks', error as Error);
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdue(): Promise<Task[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    try {
      const rows = all<TaskRow>(
        `SELECT * FROM tasks 
         WHERE due_date < ? AND is_completed = 0 AND due_date IS NOT NULL
         ORDER BY due_date ASC, priority DESC`,
        [today]
      );
      return rows.map(mapRowToTask);
    } catch (error) {
      throw new DatabaseError('Failed to fetch overdue tasks', error as Error);
    }
  }

  /**
   * Search tasks by name/description
   */
  async search(query: string): Promise<Task[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    return this.getAll({ search: query });
  }

  /**
   * Create a new task
   */
  async create(data: CreateTaskRequest): Promise<Task> {
    // Validate input
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Task name is required');
    }

    if (!data.list_id) {
      throw new ValidationError('List ID is required');
    }

    try {
      return transaction(() => {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        // Get the max position for ordering within the list
        const maxPosition = get<{ max: number }>(
          'SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE list_id = ?',
          [data.list_id]
        );
        const position = (maxPosition?.max ?? -1) + 1;

        run(
          `INSERT INTO tasks (
            id, list_id, name, description, due_date, due_time, deadline,
            priority, estimate_minutes, actual_minutes, is_completed, completed_at,
            recurrence_type, recurrence_config, position, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.list_id,
            data.name.trim(),
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

        // Log the creation
        this.logChangeSync(id, TaskAction.CREATED, null);

        const task = this.getByIdSync(id);
        if (!task) {
          throw new DatabaseError('Failed to retrieve created task');
        }
        return task;
      });
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) throw error;
      throw new DatabaseError('Failed to create task', error as Error);
    }
  }

  /**
   * Update a task
   */
  async update(id: string, data: UpdateTaskRequest): Promise<Task> {
    // Check if task exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Task', id);
    }

    // Validate input
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Task name cannot be empty');
    }

    try {
      return transaction(() => {
        const now = new Date().toISOString();
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        const updates: string[] = [];
        const values: unknown[] = [];

        if (data.name !== undefined && data.name !== existing.name) {
          changes.name = { old: existing.name, new: data.name.trim() };
          updates.push('name = ?');
          values.push(data.name.trim());
        }
        if (data.description !== undefined && data.description !== existing.description) {
          changes.description = { old: existing.description, new: data.description };
          updates.push('description = ?');
          values.push(data.description);
        }
        if (data.list_id !== undefined && data.list_id !== existing.list_id) {
          changes.list_id = { old: existing.list_id, new: data.list_id };
          updates.push('list_id = ?');
          values.push(data.list_id);
        }
        if (data.due_date !== undefined && data.due_date !== existing.due_date) {
          changes.due_date = { old: existing.due_date, new: data.due_date };
          updates.push('due_date = ?');
          values.push(data.due_date);
        }
        if (data.due_time !== undefined && data.due_time !== existing.due_time) {
          changes.due_time = { old: existing.due_time, new: data.due_time };
          updates.push('due_time = ?');
          values.push(data.due_time);
        }
        if (data.deadline !== undefined && data.deadline !== existing.deadline) {
          changes.deadline = { old: existing.deadline, new: data.deadline };
          updates.push('deadline = ?');
          values.push(data.deadline);
        }
        if (data.priority !== undefined && data.priority !== existing.priority) {
          changes.priority = { old: existing.priority, new: data.priority };
          updates.push('priority = ?');
          values.push(data.priority);
        }
        if (data.estimate_minutes !== undefined && data.estimate_minutes !== existing.estimate_minutes) {
          changes.estimate_minutes = { old: existing.estimate_minutes, new: data.estimate_minutes };
          updates.push('estimate_minutes = ?');
          values.push(data.estimate_minutes);
        }
        if (data.actual_minutes !== undefined && data.actual_minutes !== existing.actual_minutes) {
          changes.actual_minutes = { old: existing.actual_minutes, new: data.actual_minutes };
          updates.push('actual_minutes = ?');
          values.push(data.actual_minutes);
        }
        if (data.recurrence_type !== undefined && data.recurrence_type !== existing.recurrence_type) {
          changes.recurrence_type = { old: existing.recurrence_type, new: data.recurrence_type };
          updates.push('recurrence_type = ?');
          values.push(data.recurrence_type);
        }
        if (data.recurrence_config !== undefined) {
          const configStr = data.recurrence_config ? JSON.stringify(data.recurrence_config) : null;
          changes.recurrence_config = { old: existing.recurrence_config, new: data.recurrence_config };
          updates.push('recurrence_config = ?');
          values.push(configStr);
        }
        if (data.position !== undefined && data.position !== existing.position) {
          changes.position = { old: existing.position, new: data.position };
          updates.push('position = ?');
          values.push(data.position);
        }

        if (updates.length > 0) {
          updates.push('updated_at = ?');
          values.push(now);
          values.push(id);

          run(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
            values
          );

          // Log the update
          this.logChangeSync(id, TaskAction.UPDATED, changes);
        }

        const task = this.getByIdSync(id);
        if (!task) {
          throw new DatabaseError('Failed to retrieve updated task');
        }
        return task;
      });
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError || error instanceof ValidationError) throw error;
      throw new DatabaseError('Failed to update task', error as Error);
    }
  }

  /**
   * Mark task as complete
   */
  async complete(id: string): Promise<Task> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Task', id);
    }

    if (existing.is_completed) {
      return existing; // Already completed
    }

    try {
      return transaction(() => {
        const now = new Date().toISOString();
        
        run(
          'UPDATE tasks SET is_completed = 1, completed_at = ?, updated_at = ? WHERE id = ?',
          [now, now, id]
        );

        // Log the completion
        this.logChangeSync(id, TaskAction.COMPLETED, {
          is_completed: { old: false, new: true },
          completed_at: { old: null, new: now }
        });

        const task = this.getByIdSync(id);
        if (!task) {
          throw new DatabaseError('Failed to retrieve completed task');
        }
        return task;
      });
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to complete task', error as Error);
    }
  }

  /**
   * Mark task as incomplete
   */
  async uncomplete(id: string): Promise<Task> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Task', id);
    }

    if (!existing.is_completed) {
      return existing; // Already incomplete
    }

    try {
      return transaction(() => {
        const now = new Date().toISOString();
        
        run(
          'UPDATE tasks SET is_completed = 0, completed_at = NULL, updated_at = ? WHERE id = ?',
          [now, id]
        );

        // Log the uncompletion
        this.logChangeSync(id, TaskAction.UNCOMPLETED, {
          is_completed: { old: true, new: false },
          completed_at: { old: existing.completed_at, new: null }
        });

        const task = this.getByIdSync(id);
        if (!task) {
          throw new DatabaseError('Failed to retrieve uncompleted task');
        }
        return task;
      });
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to uncomplete task', error as Error);
    }
  }

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Task', id);
    }

    try {
      transaction(() => {
        // Log the deletion before removing
        this.logChangeSync(id, TaskAction.DELETED, {
          name: { old: existing.name, new: null }
        });

        // Delete the task (cascade will handle subtasks, reminders, attachments, labels)
        run('DELETE FROM tasks WHERE id = ?', [id]);
      });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to delete task', error as Error);
    }
  }

  /**
   * Reorder tasks in a list
   */
  async reorder(listId: string, taskIds: string[]): Promise<void> {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new ValidationError('Task IDs array is required');
    }

    try {
      transaction(() => {
        taskIds.forEach((id, index) => {
          run(
            'UPDATE tasks SET position = ?, updated_at = ? WHERE id = ? AND list_id = ?',
            [index, new Date().toISOString(), id, listId]
          );
        });
      });
    } catch (error) {
      throw new DatabaseError('Failed to reorder tasks', error as Error);
    }
  }

  /**
   * Move task to a different list
   */
  async moveToList(taskId: string, listId: string): Promise<Task> {
    const existing = await this.getById(taskId);
    if (!existing) {
      throw new NotFoundError('Task', taskId);
    }

    if (existing.list_id === listId) {
      return existing; // Already in the target list
    }

    try {
      return transaction(() => {
        const now = new Date().toISOString();
        
        // Get the max position in the target list
        const maxPosition = get<{ max: number }>(
          'SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE list_id = ?',
          [listId]
        );
        const position = (maxPosition?.max ?? -1) + 1;

        run(
          'UPDATE tasks SET list_id = ?, position = ?, updated_at = ? WHERE id = ?',
          [listId, position, now, taskId]
        );

        // Log the move
        this.logChangeSync(taskId, TaskAction.UPDATED, {
          list_id: { old: existing.list_id, new: listId }
        });

        const task = this.getByIdSync(taskId);
        if (!task) {
          throw new DatabaseError('Failed to retrieve moved task');
        }
        return task;
      });
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to move task', error as Error);
    }
  }

  /**
   * Get task change history
   */
  async getHistory(taskId: string): Promise<TaskHistory[]> {
    try {
      const rows = all<TaskHistoryRow>(
        'SELECT * FROM task_history WHERE task_id = ? ORDER BY created_at DESC',
        [taskId]
      );
      return rows.map(rowToTaskHistory);
    } catch (error) {
      throw new DatabaseError('Failed to fetch task history', error as Error);
    }
  }

  /**
   * Log a task change (async wrapper)
   */
  async logChange(
    taskId: string, 
    action: TaskAction, 
    changes?: Record<string, { old: unknown; new: unknown }> | null
  ): Promise<void> {
    this.logChangeSync(taskId, action, changes);
  }

  /**
   * Log a task change (synchronous for use in transactions)
   */
  private logChangeSync(
    taskId: string, 
    action: TaskAction, 
    changes: Record<string, { old: unknown; new: unknown }> | null | undefined
  ): void {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    run(
      `INSERT INTO task_history (id, task_id, action, changes, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        taskId,
        action,
        changes ? JSON.stringify(changes) : null,
        now
      ]
    );
  }

  /**
   * Get task by ID (synchronous version for use in transactions)
   */
  private getByIdSync(id: string): Task | null {
    const row = get<TaskRow>(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );
    return row ? mapRowToTask(row) : null;
  }
}

// Export singleton instance
export const tasksService = new TasksService();
