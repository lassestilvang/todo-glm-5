/**
 * Lists Service
 * 
 * Handles all database operations for lists.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  all, 
  get, 
  run, 
  transaction 
} from '../db';
import { 
  List, 
  ListRow, 
  CreateListRequest, 
  UpdateListRequest,
  rowToList 
} from '@/types';
import { 
  NotFoundError, 
  ValidationError, 
  DatabaseError,
  ForbiddenError 
} from '../errors';

const INBOX_ID = 'inbox';

/**
 * Convert database row to List entity
 */
function mapRowToList(row: ListRow): List {
  return rowToList(row);
}

/**
 * Lists service class
 */
export class ListsService {
  /**
   * Get all lists ordered by position
   */
  async getAll(): Promise<List[]> {
    try {
      const rows = all<ListRow>(
        'SELECT * FROM lists ORDER BY position ASC'
      );
      return rows.map(mapRowToList);
    } catch (error) {
      throw new DatabaseError('Failed to fetch lists', error as Error);
    }
  }

  /**
   * Get a single list by ID
   */
  async getById(id: string): Promise<List | null> {
    try {
      const row = get<ListRow>(
        'SELECT * FROM lists WHERE id = ?',
        [id]
      );
      return row ? mapRowToList(row) : null;
    } catch (error) {
      throw new DatabaseError('Failed to fetch list', error as Error);
    }
  }

  /**
   * Get the default "Inbox" list
   */
  async getDefault(): Promise<List> {
    const list = await this.getById(INBOX_ID);
    if (!list) {
      throw new NotFoundError('List', INBOX_ID);
    }
    return list;
  }

  /**
   * Create a new list
   */
  async create(data: CreateListRequest): Promise<List> {
    // Validate input
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('List name is required');
    }

    try {
      return transaction(() => {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        // Get the max position for ordering
        const maxPosition = get<{ max: number }>(
          'SELECT COALESCE(MAX(position), -1) as max FROM lists'
        );
        const position = (maxPosition?.max ?? -1) + 1;

        run(
          `INSERT INTO lists (id, name, color, emoji, position, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.name.trim(),
            data.color ?? '#6366f1',
            data.emoji ?? '📋',
            position,
            0, // not default
            now,
            now
          ]
        );

        const list = this.getByIdSync(id);
        if (!list) {
          throw new DatabaseError('Failed to retrieve created list');
        }
        return list;
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new DatabaseError('Failed to create list', error as Error);
    }
  }

  /**
   * Update a list
   */
  async update(id: string, data: UpdateListRequest): Promise<List> {
    // Check if list exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('List', id);
    }

    // Validate input
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('List name cannot be empty');
    }

    try {
      const now = new Date().toISOString();
      const updates: string[] = [];
      const values: unknown[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name.trim());
      }
      if (data.color !== undefined) {
        updates.push('color = ?');
        values.push(data.color);
      }
      if (data.emoji !== undefined) {
        updates.push('emoji = ?');
        values.push(data.emoji);
      }
      if (data.position !== undefined) {
        updates.push('position = ?');
        values.push(data.position);
      }

      if (updates.length > 0) {
        updates.push('updated_at = ?');
        values.push(now);
        values.push(id);

        run(
          `UPDATE lists SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      const list = await this.getById(id);
      if (!list) {
        throw new DatabaseError('Failed to retrieve updated list');
      }
      return list;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new DatabaseError('Failed to update list', error as Error);
    }
  }

  /**
   * Delete a list
   * Tasks should be moved to Inbox first
   */
  async delete(id: string): Promise<void> {
    // Prevent deletion of Inbox
    if (id === INBOX_ID) {
      throw new ForbiddenError('Cannot delete the Inbox list');
    }

    // Check if list exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('List', id);
    }

    try {
      transaction(() => {
        // Move all tasks to Inbox
        run(
          'UPDATE tasks SET list_id = ?, updated_at = ? WHERE list_id = ?',
          [INBOX_ID, new Date().toISOString(), id]
        );

        // Delete the list
        run('DELETE FROM lists WHERE id = ?', [id]);
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new DatabaseError('Failed to delete list', error as Error);
    }
  }

  /**
   * Reorder lists
   */
  async reorder(listIds: string[]): Promise<void> {
    if (!Array.isArray(listIds) || listIds.length === 0) {
      throw new ValidationError('List IDs array is required');
    }

    try {
      transaction(() => {
        listIds.forEach((id, index) => {
          run(
            'UPDATE lists SET position = ?, updated_at = ? WHERE id = ?',
            [index, new Date().toISOString(), id]
          );
        });
      });
    } catch (error) {
      throw new DatabaseError('Failed to reorder lists', error as Error);
    }
  }

  /**
   * Get list with task counts
   */
  async getWithTaskCounts(id: string): Promise<{
    list: List;
    taskCount: number;
    completedTaskCount: number;
  } | null> {
    const list = await this.getById(id);
    if (!list) return null;

    try {
      const counts = get<{
        task_count: number;
        completed_task_count: number;
      }>(
        `SELECT 
          COUNT(*) as task_count,
          SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_task_count
        FROM tasks 
        WHERE list_id = ?`,
        [id]
      );

      return {
        list,
        taskCount: counts?.task_count ?? 0,
        completedTaskCount: counts?.completed_task_count ?? 0,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get list task counts', error as Error);
    }
  }

  /**
   * Get all lists with task counts
   */
  async getAllWithTaskCounts(): Promise<Array<{
    list: List;
    taskCount: number;
    completedTaskCount: number;
  }>> {
    const lists = await this.getAll();
    
    try {
      const results = lists.map(list => {
        const counts = get<{
          task_count: number;
          completed_task_count: number;
        }>(
          `SELECT 
            COUNT(*) as task_count,
            SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_task_count
          FROM tasks 
          WHERE list_id = ?`,
          [list.id]
        );

        return {
          list,
          taskCount: counts?.task_count ?? 0,
          completedTaskCount: counts?.completed_task_count ?? 0,
        };
      });

      return results;
    } catch (error) {
      throw new DatabaseError('Failed to get list task counts', error as Error);
    }
  }
  /**
   * Get list by ID (synchronous version for use in transactions)
   */
  private getByIdSync(id: string): List | null {
    const row = get<ListRow>(
      'SELECT * FROM lists WHERE id = ?',
      [id]
    );
    return row ? mapRowToList(row) : null;
  }
}

// Import AppError for instanceof check
import { AppError } from '../errors';

// Export singleton instance
export const listsService = new ListsService();
