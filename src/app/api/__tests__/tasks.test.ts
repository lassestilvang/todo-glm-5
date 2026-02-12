/**
 * Tasks API Route Tests
 * 
 * Tests for the Tasks API endpoints.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { GET, POST } from '../route';
import { GET as GetById, PUT, DELETE } from '../[id]/route';
import { POST as Complete, DELETE as Uncomplete } from '../[id]/complete/route';
import { createList, createTask, createLabel, today, tomorrow, yesterday } from '@/test/fixtures';
import { Priority } from '@/types';
import { run } from '@/lib/db';

// Helper to create a NextRequest-like object with query params
function createRequestWithQuery(queryParams: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/tasks');
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return {
    nextUrl: url,
    json: async () => ({}),
    method: 'GET',
    url: url.toString(),
  } as unknown as NextRequest;
}

// Helper to create a NextRequest-like object with body
function createRequestWithBody(body: object, method: string = 'GET'): NextRequest {
  return {
    json: async () => body,
    method,
    url: 'http://localhost/api/tasks',
    nextUrl: new URL('http://localhost/api/tasks'),
  } as unknown as NextRequest;
}

// Helper to create route params
function createParams(id: string): { params: Promise<{ id: string }> } {
  return {
    params: Promise.resolve({ id }),
  };
}

describe('Tasks API', () => {
  let testListId: string;

  beforeEach(() => {
    const list = createList({ name: 'Test List' });
    testListId = list.id;
  });

  describe('GET /api/tasks', () => {
    test('returns all tasks', async () => {
      // Arrange
      createTask({ list_id: testListId, name: 'Task 1' });
      createTask({ list_id: testListId, name: 'Task 2' });
      
      // Act
      const response = await GET(createRequestWithQuery({}));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(2);
    });

    test('returns today\'s tasks with ?today=true', async () => {
      // Arrange
      createTask({ list_id: testListId, name: 'Today Task', due_date: today() });
      createTask({ list_id: testListId, name: 'Tomorrow Task', due_date: tomorrow() });
      
      // Act
      const response = await GET(createRequestWithQuery({ today: 'true' }));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('Today Task');
    });

    test('returns overdue tasks with ?overdue=true', async () => {
      // Arrange
      createTask({ list_id: testListId, name: 'Overdue Task', due_date: yesterday() });
      createTask({ list_id: testListId, name: 'Today Task', due_date: today() });
      
      // Act
      const response = await GET(createRequestWithQuery({ overdue: 'true' }));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('Overdue Task');
    });

    test('returns week tasks with ?week=true', async () => {
      // Arrange
      createTask({ list_id: testListId, name: 'Today', due_date: today() });
      createTask({ list_id: testListId, name: 'Tomorrow', due_date: tomorrow() });
      
      // Act
      const response = await GET(createRequestWithQuery({ week: 'true' }));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(2);
    });

    test('returns upcoming tasks with ?upcoming=true', async () => {
      // Arrange
      createTask({ list_id: testListId, name: 'Future Task', due_date: tomorrow() });
      createTask({ list_id: testListId, name: 'Past Task', due_date: yesterday() });
      
      // Act
      const response = await GET(createRequestWithQuery({ upcoming: 'true' }));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('Future Task');
    });

    test('filters by listId', async () => {
      // Arrange
      const list2 = createList({ name: 'List 2' });
      createTask({ list_id: testListId, name: 'Task in List 1' });
      createTask({ list_id: list2.id, name: 'Task in List 2' });
      
      // Act
      const response = await GET(createRequestWithQuery({ listId: testListId }));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('Task in List 1');
    });

    test('filters by completed status', async () => {
      // Arrange
      const task1 = createTask({ list_id: testListId, name: 'Completed Task' });
      createTask({ list_id: testListId, name: 'Incomplete Task' });
      run('UPDATE tasks SET is_completed = 1 WHERE id = ?', [task1.id]);
      
      // Act
      const response = await GET(createRequestWithQuery({ completed: 'true' }));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('Completed Task');
    });

    test('filters by priority', async () => {
      // Arrange
      createTask({ list_id: testListId, name: 'High Priority', priority: Priority.HIGH });
      createTask({ list_id: testListId, name: 'Low Priority', priority: Priority.LOW });
      
      // Act
      const response = await GET(createRequestWithQuery({ priority: '3' })); // HIGH = 3
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('High Priority');
    });
  });

  describe('POST /api/tasks', () => {
    test('creates new task', async () => {
      // Arrange
      const body = { 
        list_id: testListId, 
        name: 'New Task',
        description: 'Task description',
        priority: Priority.HIGH
      };
      const request = createRequestWithBody(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('New Task');
      expect(data.data.description).toBe('Task description');
      expect(data.data.priority).toBe(Priority.HIGH);
    });

    test('validates input - requires name', async () => {
      // Arrange
      const body = { list_id: testListId };
      const request = createRequestWithBody(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    test('validates input - requires list_id', async () => {
      // Arrange
      const body = { name: 'Test Task' };
      const request = createRequestWithBody(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    test('validates input - rejects empty name', async () => {
      // Arrange
      const body = { list_id: testListId, name: '' };
      const request = createRequestWithBody(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    test('creates task with labels', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      const body = { 
        list_id: testListId, 
        name: 'Task with Label',
        label_ids: [label.id]
      };
      const request = createRequestWithBody(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    test('creates task with subtasks', async () => {
      // Arrange
      const body = { 
        list_id: testListId, 
        name: 'Task with Subtasks',
        subtasks: [
          { task_id: '', name: 'Subtask 1' },
          { task_id: '', name: 'Subtask 2' }
        ]
      };
      const request = createRequestWithBody(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/tasks/[id]', () => {
    test('returns task by ID', async () => {
      // Arrange
      const task = createTask({ list_id: testListId, name: 'Test Task' });
      
      // Act
      const response = await GetById(createRequestWithBody({}), createParams(task.id));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(task.id);
      expect(data.data.name).toBe('Test Task');
    });

    test('returns task with relations', async () => {
      // Arrange
      const task = createTask({ list_id: testListId, name: 'Test Task' });
      
      // Act
      const response = await GetById(createRequestWithBody({}), createParams(task.id));
      const data = await response.json();
      
      // Assert
      expect(data.data.list).toBeDefined();
      expect(data.data.subtasks).toBeDefined();
      expect(data.data.labels).toBeDefined();
      expect(data.data.reminders).toBeDefined();
      expect(data.data.attachments).toBeDefined();
    });

    test('returns 404 for non-existent task', async () => {
      // Act
      const response = await GetById(createRequestWithBody({}), createParams('non-existent-id'));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/tasks/[id]', () => {
    test('updates task', async () => {
      // Arrange
      const task = createTask({ list_id: testListId, name: 'Original' });
      const body = { name: 'Updated', priority: Priority.HIGH };
      const request = createRequestWithBody(body, 'PUT');
      
      // Act
      const response = await PUT(request, createParams(task.id));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated');
      expect(data.data.priority).toBe(Priority.HIGH);
    });

    test('returns 404 for non-existent task', async () => {
      // Arrange
      const body = { name: 'Updated' };
      const request = createRequestWithBody(body, 'PUT');
      
      // Act
      const response = await PUT(request, createParams('non-existent-id'));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    test('validates input - rejects empty name', async () => {
      // Arrange
      const task = createTask({ list_id: testListId, name: 'Test' });
      const body = { name: '' };
      const request = createRequestWithBody(body, 'PUT');
      
      // Act
      const response = await PUT(request, createParams(task.id));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    test('deletes task', async () => {
      // Arrange
      const task = createTask({ list_id: testListId, name: 'To Delete' });
      
      // Act
      const response = await DELETE(createRequestWithBody({}), createParams(task.id));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.message).toBe('Task deleted successfully');
    });

    test('returns 404 for non-existent task', async () => {
      // Act
      const response = await DELETE(createRequestWithBody({}), createParams('non-existent-id'));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/tasks/[id]/complete', () => {
    test('completes task', async () => {
      // Arrange
      const task = createTask({ list_id: testListId, name: 'Test Task' });
      
      // Act
      const response = await Complete(createRequestWithBody({}), createParams(task.id));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.is_completed).toBe(true);
      expect(data.data.completed_at).not.toBeNull();
    });

    test('returns 404 for non-existent task', async () => {
      // Act
      const response = await Complete(createRequestWithBody({}), createParams('non-existent-id'));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/[id]/complete', () => {
    test('uncompletes task', async () => {
      // Arrange
      const task = createTask({ list_id: testListId, name: 'Test Task' });
      run('UPDATE tasks SET is_completed = 1, completed_at = ? WHERE id = ?', [new Date().toISOString(), task.id]);
      
      // Act
      const response = await Uncomplete(createRequestWithBody({}), createParams(task.id));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.is_completed).toBe(false);
      expect(data.data.completed_at).toBeNull();
    });

    test('returns 404 for non-existent task', async () => {
      // Act
      const response = await Uncomplete(createRequestWithBody({}), createParams('non-existent-id'));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });
});
