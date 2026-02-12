/**
 * Search Service Tests
 * 
 * Tests for the SearchService class.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { SearchService } from '../search.service';
import { 
  createList, 
  createTask, 
  createLabel,
  seedLists,
  seedLabels,
  seedTasks
} from '@/test/fixtures';
import { Priority } from '@/types';

// Create a fresh service instance for each test
const searchService = new SearchService();

describe('SearchService', () => {
  let testListId: string;

  beforeEach(async () => {
    // Create test data
    const list = createList({ name: 'Work Tasks' });
    testListId = list.id;
    
    // Create some tasks
    createTask({ 
      list_id: testListId, 
      name: 'Complete project proposal', 
      description: 'Write the Q1 project proposal document',
      priority: Priority.HIGH
    });
    createTask({ 
      list_id: testListId, 
      name: 'Review code changes', 
      description: 'Review pull requests from team',
      priority: Priority.MEDIUM
    });
    createTask({ 
      list_id: testListId, 
      name: 'Buy groceries', 
      description: 'Get milk and eggs from store',
      priority: Priority.LOW
    });
    
    // Create labels
    createLabel({ name: 'Important', color: '#ff0000' });
    createLabel({ name: 'Later', color: '#00ff00' });
    
    // Refresh search indices
    await searchService.refreshIndices();
  });

  describe('searchTasks()', () => {
    test('finds tasks by name', async () => {
      // Act
      const results = await searchService.searchTasks('project');
      
      // Assert
      expect(results.length).toBe(1);
      expect(results[0].item.name).toBe('Complete project proposal');
    });

    test('finds tasks by description', async () => {
      // Act
      const results = await searchService.searchTasks('pull requests');
      
      // Assert
      expect(results.length).toBe(1);
      expect(results[0].item.name).toBe('Review code changes');
    });

    test('returns empty array for no matches', async () => {
      // Act
      const results = await searchService.searchTasks('nonexistent');
      
      // Assert
      expect(results.length).toBe(0);
    });

    test('returns empty array for empty query', async () => {
      // Act
      const results = await searchService.searchTasks('');
      
      // Assert
      expect(results.length).toBe(0);
    });

    test('returns empty array for whitespace query', async () => {
      // Act
      const results = await searchService.searchTasks('   ');
      
      // Assert
      expect(results.length).toBe(0);
    });

    test('respects limit option', async () => {
      // Arrange - Create more tasks with "task" in name
      createTask({ list_id: testListId, name: 'Task A' });
      createTask({ list_id: testListId, name: 'Task B' });
      createTask({ list_id: testListId, name: 'Task C' });
      await searchService.refreshIndices();
      
      // Act
      const results = await searchService.searchTasks('task', { limit: 2 });
      
      // Assert
      expect(results.length).toBe(2);
    });

    test('excludes completed tasks by default', async () => {
      // Arrange - Complete a task
      const { run } = await import('../../db');
      const tasks = await searchService.searchTasks('project');
      run('UPDATE tasks SET is_completed = 1 WHERE id = ?', [tasks[0].item.id]);
      await searchService.refreshIndices();
      
      // Act
      const results = await searchService.searchTasks('project');
      
      // Assert
      expect(results.length).toBe(0);
    });

    test('includes completed tasks when option is set', async () => {
      // Arrange - Complete a task
      const { run } = await import('../../db');
      const tasks = await searchService.searchTasks('project');
      run('UPDATE tasks SET is_completed = 1 WHERE id = ?', [tasks[0].item.id]);
      await searchService.refreshIndices();
      
      // Act
      const results = await searchService.searchTasks('project', { includeCompleted: true });
      
      // Assert
      expect(results.length).toBe(1);
    });

    test('returns results with match information', async () => {
      // Act
      const results = await searchService.searchTasks('project');
      
      // Assert
      expect(results[0].matches).toBeDefined();
      expect(results[0].matches!.length).toBeGreaterThan(0);
    });

    test('returns results with score', async () => {
      // Act
      const results = await searchService.searchTasks('project');
      
      // Assert
      expect(results[0].score).toBeDefined();
      expect(results[0].score).toBeLessThan(1); // Fuse.js scores are 0-1
    });
  });

  describe('searchAll()', () => {
    test('searches across tasks, lists, and labels', async () => {
      // Act
      const results = await searchService.searchAll('work');
      
      // Assert - Should find the "Work Tasks" list
      expect(results.lists.length).toBe(1);
      expect(results.lists[0].name).toBe('Work Tasks');
    });

    test('returns empty results for empty query', async () => {
      // Act
      const results = await searchService.searchAll('');
      
      // Assert
      expect(results.tasks.length).toBe(0);
      expect(results.lists.length).toBe(0);
      expect(results.labels.length).toBe(0);
      expect(results.totalMatches).toBe(0);
    });

    test('calculates total matches correctly', async () => {
      // Act
      const results = await searchService.searchAll('project');
      
      // Assert
      expect(results.totalMatches).toBe(results.tasks.length + results.lists.length + results.labels.length);
    });

    test('respects scope option - tasks only', async () => {
      // Act
      const results = await searchService.searchAll('work', { scope: 'tasks' });
      
      // Assert
      expect(results.lists.length).toBe(0);
      expect(results.labels.length).toBe(0);
    });

    test('respects scope option - lists only', async () => {
      // Act
      const results = await searchService.searchAll('work', { scope: 'lists' });
      
      // Assert
      expect(results.tasks.length).toBe(0);
      expect(results.labels.length).toBe(0);
      expect(results.lists.length).toBe(1);
    });

    test('respects scope option - labels only', async () => {
      // Act
      const results = await searchService.searchAll('important', { scope: 'labels' });
      
      // Assert
      expect(results.tasks.length).toBe(0);
      expect(results.lists.length).toBe(0);
      expect(results.labels.length).toBe(1);
    });

    test('respects limit option', async () => {
      // Arrange - Create more items
      createTask({ list_id: testListId, name: 'Test task 1' });
      createTask({ list_id: testListId, name: 'Test task 2' });
      createTask({ list_id: testListId, name: 'Test task 3' });
      await searchService.refreshIndices();
      
      // Act
      const results = await searchService.searchAll('test', { limit: 2 });
      
      // Assert
      expect(results.tasks.length).toBeLessThanOrEqual(2);
    });
  });

  describe('quickSearch()', () => {
    test('returns limited results quickly', async () => {
      // Act
      const results = await searchService.quickSearch('project');
      
      // Assert
      expect(results.totalMatches).toBeGreaterThan(0);
    });

    test('uses lower threshold for more permissive matching', async () => {
      // Act - Quick search should find partial matches
      const results = await searchService.quickSearch('proj');
      
      // Assert - Should find "project" with lower threshold
      expect(results.tasks.length).toBeGreaterThan(0);
    });

    test('limits results to 5 per category', async () => {
      // Arrange - Create many matching tasks
      for (let i = 0; i < 10; i++) {
        createTask({ list_id: testListId, name: `Project task ${i}` });
      }
      await searchService.refreshIndices();
      
      // Act
      const results = await searchService.quickSearch('project');
      
      // Assert
      expect(results.tasks.length).toBeLessThanOrEqual(5);
    });
  });

  describe('searchWithHighlights()', () => {
    test('returns results with highlights', async () => {
      // Act
      const results = await searchService.searchWithHighlights('project');
      
      // Assert
      expect(results.highlights).toBeDefined();
      expect(results.highlights.size).toBeGreaterThan(0);
    });

    test('includes highlighted text in matches', async () => {
      // Act
      const results = await searchService.searchWithHighlights('project');
      
      // Assert
      const taskWithHighlight = results.tasks.find(t => 
        t.name.toLowerCase().includes('project')
      );
      if (taskWithHighlight) {
        const highlights = results.highlights.get(taskWithHighlight.id);
        expect(highlights).toBeDefined();
      }
    });
  });

  describe('searchExact()', () => {
    test('finds tasks with exact name match', async () => {
      // Act
      const results = await searchService.searchExact('name', 'Complete project proposal');
      
      // Assert
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Complete project proposal');
    });

    test('finds tasks by priority', async () => {
      // Act
      const results = await searchService.searchExact('priority', Priority.HIGH);
      
      // Assert
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(t => t.priority === Priority.HIGH)).toBe(true);
    });

    test('returns empty array for no exact matches', async () => {
      // Act
      const results = await searchService.searchExact('name', 'Nonexistent Task Name');
      
      // Assert
      expect(results.length).toBe(0);
    });
  });

  describe('getSuggestions()', () => {
    test('returns suggestions based on partial input', async () => {
      // Act
      const suggestions = await searchService.getSuggestions('pro');
      
      // Assert
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('pro'))).toBe(true);
    });

    test('returns empty array for short input', async () => {
      // Act
      const suggestions = await searchService.getSuggestions('p');
      
      // Assert
      expect(suggestions.length).toBe(0);
    });

    test('returns empty array for empty input', async () => {
      // Act
      const suggestions = await searchService.getSuggestions('');
      
      // Assert
      expect(suggestions.length).toBe(0);
    });

    test('limits suggestions to 10', async () => {
      // Arrange - Create many matching items
      for (let i = 0; i < 20; i++) {
        createTask({ list_id: testListId, name: `Project ${i}` });
      }
      await searchService.refreshIndices();
      
      // Act
      const suggestions = await searchService.getSuggestions('project');
      
      // Assert
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    test('includes task, list, and label names in suggestions', async () => {
      // Act
      const suggestions = await searchService.getSuggestions('imp');
      
      // Assert - Should include "Important" label
      expect(suggestions.some(s => s.toLowerCase().includes('imp'))).toBe(true);
    });
  });

  describe('refreshIndices()', () => {
    test('updates search indices with new data', async () => {
      // Arrange - Get initial count
      const initialResults = await searchService.searchTasks('newtask');
      expect(initialResults.length).toBe(0);
      
      // Add new task
      createTask({ list_id: testListId, name: 'NewTask To Find' });
      
      // Act - Refresh and search
      await searchService.refreshIndices();
      const results = await searchService.searchTasks('newtask');
      
      // Assert
      expect(results.length).toBe(1);
    });
  });
});
