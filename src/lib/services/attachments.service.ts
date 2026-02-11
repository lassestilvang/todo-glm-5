/**
 * Attachments Service
 * 
 * Handles all database operations for task attachments.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  all, 
  get, 
  run 
} from '../db';
import { 
  Attachment, 
  AttachmentRow, 
  CreateAttachmentRequest,
  rowToAttachment 
} from '@/types';
import { 
  NotFoundError, 
  ValidationError, 
  DatabaseError 
} from '../errors';

/**
 * Convert database row to Attachment entity
 */
function mapRowToAttachment(row: AttachmentRow): Attachment {
  return rowToAttachment(row);
}

/**
 * Attachments service class
 */
export class AttachmentsService {
  /**
   * Get all attachments for a task
   */
  async getByTaskId(taskId: string): Promise<Attachment[]> {
    try {
      const rows = all<AttachmentRow>(
        'SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at DESC',
        [taskId]
      );
      return rows.map(mapRowToAttachment);
    } catch (error) {
      throw new DatabaseError('Failed to fetch attachments', error as Error);
    }
  }

  /**
   * Get a single attachment by ID
   */
  async getById(id: string): Promise<Attachment | null> {
    try {
      const row = get<AttachmentRow>(
        'SELECT * FROM attachments WHERE id = ?',
        [id]
      );
      return row ? mapRowToAttachment(row) : null;
    } catch (error) {
      throw new DatabaseError('Failed to fetch attachment', error as Error);
    }
  }

  /**
   * Create a new attachment
   */
  async create(taskId: string, data: CreateAttachmentRequest): Promise<Attachment> {
    // Validate input
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Attachment name is required');
    }

    if (!data.file_path || data.file_path.trim().length === 0) {
      throw new ValidationError('File path is required');
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
        `INSERT INTO attachments (id, task_id, name, file_path, file_size, mime_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          taskId,
          data.name.trim(),
          data.file_path.trim(),
          data.file_size ?? null,
          data.mime_type ?? null
        ]
      );

      const attachment = await this.getById(id);
      if (!attachment) {
        throw new DatabaseError('Failed to retrieve created attachment');
      }
      return attachment;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to create attachment', error as Error);
    }
  }

  /**
   * Delete an attachment
   */
  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Attachment', id);
    }

    try {
      run('DELETE FROM attachments WHERE id = ?', [id]);
    } catch (error) {
      throw new DatabaseError('Failed to delete attachment', error as Error);
    }
  }

  /**
   * Delete all attachments for a task
   */
  async deleteByTaskId(taskId: string): Promise<void> {
    try {
      run('DELETE FROM attachments WHERE task_id = ?', [taskId]);
    } catch (error) {
      throw new DatabaseError('Failed to delete task attachments', error as Error);
    }
  }

  /**
   * Get attachment count for a task
   */
  async getCountByTaskId(taskId: string): Promise<number> {
    try {
      const result = get<{ count: number }>(
        'SELECT COUNT(*) as count FROM attachments WHERE task_id = ?',
        [taskId]
      );
      return result?.count ?? 0;
    } catch (error) {
      throw new DatabaseError('Failed to get attachment count', error as Error);
    }
  }

  /**
   * Get total file size for a task's attachments
   */
  async getTotalSizeByTaskId(taskId: string): Promise<number> {
    try {
      const result = get<{ total: number }>(
        'SELECT COALESCE(SUM(file_size), 0) as total FROM attachments WHERE task_id = ?',
        [taskId]
      );
      return result?.total ?? 0;
    } catch (error) {
      throw new DatabaseError('Failed to get total attachment size', error as Error);
    }
  }

  /**
   * Get attachments by MIME type
   */
  async getByMimeType(taskId: string, mimeType: string): Promise<Attachment[]> {
    try {
      const rows = all<AttachmentRow>(
        'SELECT * FROM attachments WHERE task_id = ? AND mime_type LIKE ? ORDER BY created_at DESC',
        [taskId, `${mimeType}%`]
      );
      return rows.map(mapRowToAttachment);
    } catch (error) {
      throw new DatabaseError('Failed to fetch attachments by MIME type', error as Error);
    }
  }

  /**
   * Get all attachments (for admin/cleanup purposes)
   */
  async getAll(): Promise<Attachment[]> {
    try {
      const rows = all<AttachmentRow>(
        'SELECT * FROM attachments ORDER BY created_at DESC'
      );
      return rows.map(mapRowToAttachment);
    } catch (error) {
      throw new DatabaseError('Failed to fetch all attachments', error as Error);
    }
  }

  /**
   * Get attachments older than a date (for cleanup)
   */
  async getOlderThan(date: Date): Promise<Attachment[]> {
    try {
      const rows = all<AttachmentRow>(
        'SELECT * FROM attachments WHERE created_at < ? ORDER BY created_at ASC',
        [date.toISOString()]
      );
      return rows.map(mapRowToAttachment);
    } catch (error) {
      throw new DatabaseError('Failed to fetch old attachments', error as Error);
    }
  }
}

// Export singleton instance
export const attachmentsService = new AttachmentsService();
