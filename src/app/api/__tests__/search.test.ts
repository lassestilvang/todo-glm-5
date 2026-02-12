/**
 * Search API Route Tests
 * 
 * Tests for the Search API endpoint.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { GET } from '../route';
import { createList, createTask, createLabel } from '@/test/fixtures';
import { Priority } from '@/types';
import { searchService } from '@/lib/services';

// Helper to create a NextRequest-like object with query params
function createRequestWithQuery(queryParams: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/search');
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

describe('Search API', () => {
  beforeEach(async () => {
    // Create test data
    const list = createList({ name: 'Work Tasks' });
    
    createTask({ 
      list_id: list.id, 
      name: 'Complete project proposal', 
      description: 'Write the Q1 project proposal',
      priority: Priority.HIGH
    });
    createTask({ 
      list_id: list.id, 
      name: 'Review code changes', 
      description: 'Review pull requests',
      priority: Priority.MEDIUM
    });
    createTask({ 
      list_id: list.id, 
      name: 'Buy groceries', 
      description: 'Get milk and eggs',
      priority: Priority.LOW
    });
    
    createLabel({ name: 'Important', color: '#ff0000' });
    createLabel({ name: 'Later', color: '#00ff00' });
    
    // Refresh search indices
    await searchService.refreshIndices();
  });

  describe('GET /api/search', () => {
    test('returns search results with query', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: 'project' }));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.totalMatches).toBeGreaterThan(0);
    });

    test('returns tasks matching query', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: 'project' }));
      const data = await response.json();
      
      // Assert
      expect(data.data.tasks.length).toBeGreaterThan(0);
      expect(data.data.tasks[0].name).toContain('project');
    });

    test('returns lists matching query', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: 'work' }));
      const data = await response.json();
      
      // Assert
      expect(data.data.lists.length).toBeGreaterThan(0);
      expect(data.data.lists[0].name).toContain('Work');
    });

    test('returns labels matching query', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: 'important' }));
      const data = await response.json();
      
      // Assert
      expect(data.data.labels.length).toBeGreaterThan(0);
      expect(data.data.labels[0].name).toContain('Important');
    });

    test('returns error without query', async () => {
      // Act
      const response = await GET(createRequestWithQuery({}));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    test('returns error with empty query', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: '' }));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    test('returns empty results for no matches', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: 'nonexistentxyz' }));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.tasks.length).toBe(0);
      expect(data.data.lists.length).toBe(0);
      expect(data.data.labels.length).toBe(0);
      expect(data.data.totalMatches).toBe(0);
    });

    test('respects type parameter - tasks only', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: 'work', type: 'tasks' }));
      const data = await response.json();
      
      // Assert
      expect(data.data.lists.length).toBe(0);
      expect(data.data.labels.length).toBe(0);
    });

    test('respects type parameter - lists only', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: 'work', type: 'lists' }));
      const data = await response.json();
      
      // Assert
      expect(data.data.tasks.length).toBe(0);
      expect(data.data.labels.length).toBe(0);
    });

    test('respects type parameter - labels only', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: 'important', type: 'labels' }));
      const data = await response.json();
      
      // Assert
      expect(data.data.tasks.length).toBe(0);
      expect(data.data.lists.length).toBe(0);
    });

    test('respects limit parameter', async () => {
      // Arrange - Create more tasks
      const list = createList({ name: 'Another List' });
      for (let i = 0; i < 10; i++) {
        createTask({ list_id: list.id, name: `Test task ${i}` });
      }
      await searchService.refreshIndices();
      
      // Act
      const response = await GET(createRequestWithQuery({ q: 'test', limit: '5' }));
      const data = await response.json();
      
      // Assert
      expect(data.data.tasks.length).toBeLessThanOrEqual(5);
    });

    test('calculates total matches correctly', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: 'project' }));
      const data = await response.json();
      
      // Assert
      const expectedTotal = data.data.tasks.length + data.data.lists.length + data.data.labels.length;
      expect(data.data.totalMatches).toBe(expectedTotal);
    });

    test('searches in task descriptions', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: 'pull requests' }));
      const data = await response.json();
      
      // Assert
      expect(data.data.tasks.length).toBeGreaterThan(0);
    });

    test('handles special characters in query', async () => {
      // Act
      const response = await GET(createRequestWithQuery({ q: 'test!@#$%' }));
      const data = await response.json();
      
      // Assert - Should not throw, returns empty results
      expect(data.success).toBe(true);
    });
  });
});
