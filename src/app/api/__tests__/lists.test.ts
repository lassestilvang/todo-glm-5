/**
 * Lists API Route Tests
 * 
 * Tests for the Lists API endpoints.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { GET, POST } from '../route';
import { GET as GetById, PUT, DELETE } from '../[id]/route';
import { createList, createTask } from '@/test/fixtures';
import { NextRequest } from 'next/server';

// Helper to create a NextRequest-like object
function createRequest(body?: object, method: string = 'GET'): NextRequest {
  return {
    json: async () => body,
    method,
    url: 'http://localhost/api/lists',
  } as unknown as NextRequest;
}

// Helper to create route params
function createParams(id: string): { params: Promise<{ id: string }> } {
  return {
    params: Promise.resolve({ id }),
  };
}

describe('Lists API', () => {
  describe('GET /api/lists', () => {
    test('returns all lists', async () => {
      // Arrange
      createList({ name: 'List 1' });
      createList({ name: 'List 2' });
      
      // Act
      const response = await GET();
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(3); // 2 created + Inbox
    });

    test('returns lists with task counts', async () => {
      // Arrange
      const list = createList({ name: 'List with tasks' });
      createTask({ list_id: list.id, name: 'Task 1' });
      createTask({ list_id: list.id, name: 'Task 2' });
      
      // Act
      const response = await GET();
      const data = await response.json();
      
      // Assert
      const listWithTasks = data.data.find((l: { id: string }) => l.id === list.id);
      expect(listWithTasks.task_count).toBe(2);
    });
  });

  describe('POST /api/lists', () => {
    test('creates new list', async () => {
      // Arrange
      const body = { name: 'New List', color: '#ff0000', emoji: '🎯' };
      const request = createRequest(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('New List');
      expect(data.data.color).toBe('#ff0000');
      expect(data.data.emoji).toBe('🎯');
    });

    test('validates input - requires name', async () => {
      // Arrange
      const body = { color: '#ff0000' };
      const request = createRequest(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    test('validates input - rejects empty name', async () => {
      // Arrange
      const body = { name: '' };
      const request = createRequest(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    test('validates input - rejects invalid color format', async () => {
      // Arrange
      const body = { name: 'Test', color: 'invalid' };
      const request = createRequest(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/lists/[id]', () => {
    test('returns list by ID', async () => {
      // Arrange
      const list = createList({ name: 'Test List' });
      
      // Act
      const response = await GetById(createRequest(), createParams(list.id));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(list.id);
      expect(data.data.name).toBe('Test List');
    });

    test('returns 404 for non-existent list', async () => {
      // Act
      const response = await GetById(createRequest(), createParams('non-existent-id'));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('NOT_FOUND');
    });

    test('returns list with task counts', async () => {
      // Arrange
      const list = createList({ name: 'List with tasks' });
      createTask({ list_id: list.id, name: 'Task 1' });
      createTask({ list_id: list.id, name: 'Task 2' });
      
      // Act
      const response = await GetById(createRequest(), createParams(list.id));
      const data = await response.json();
      
      // Assert
      expect(data.data.task_count).toBe(2);
    });
  });

  describe('PUT /api/lists/[id]', () => {
    test('updates list', async () => {
      // Arrange
      const list = createList({ name: 'Original' });
      const body = { name: 'Updated', color: '#00ff00' };
      const request = createRequest(body, 'PUT');
      
      // Act
      const response = await PUT(request, createParams(list.id));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated');
      expect(data.data.color).toBe('#00ff00');
    });

    test('returns 404 for non-existent list', async () => {
      // Arrange
      const body = { name: 'Updated' };
      const request = createRequest(body, 'PUT');
      
      // Act
      const response = await PUT(request, createParams('non-existent-id'));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    test('validates input - rejects empty name', async () => {
      // Arrange
      const list = createList({ name: 'Test' });
      const body = { name: '' };
      const request = createRequest(body, 'PUT');
      
      // Act
      const response = await PUT(request, createParams(list.id));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/lists/[id]', () => {
    test('deletes list', async () => {
      // Arrange
      const list = createList({ name: 'To Delete' });
      
      // Act
      const response = await DELETE(createRequest(), createParams(list.id));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.message).toBe('List deleted successfully');
    });

    test('returns 404 for non-existent list', async () => {
      // Act
      const response = await DELETE(createRequest(), createParams('non-existent-id'));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    test('returns 403 when trying to delete Inbox', async () => {
      // Act
      const response = await DELETE(createRequest(), createParams('inbox'));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('FORBIDDEN');
    });
  });
});
