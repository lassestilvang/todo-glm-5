/**
 * Labels API Route Tests
 * 
 * Tests for the Labels API endpoints.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { GET, POST } from '../route';
import { GET as GetById, PUT, DELETE } from '../[id]/route';
import { createLabel } from '@/test/fixtures';

// Helper to create a NextRequest-like object
function createRequest(body?: object, method: string = 'GET'): NextRequest {
  return {
    json: async () => body,
    method,
    url: 'http://localhost/api/labels',
  } as unknown as NextRequest;
}

// Helper to create route params
function createParams(id: string): { params: Promise<{ id: string }> } {
  return {
    params: Promise.resolve({ id }),
  };
}

describe('Labels API', () => {
  describe('GET /api/labels', () => {
    test('returns all labels', async () => {
      // Arrange
      createLabel({ name: 'Label 1' });
      createLabel({ name: 'Label 2' });
      
      // Act
      const response = await GET();
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(2);
    });

    test('returns empty array when no labels exist', async () => {
      // Act
      const response = await GET();
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(0);
    });

    test('returns labels ordered by name', async () => {
      // Arrange
      createLabel({ name: 'Zebra' });
      createLabel({ name: 'Apple' });
      createLabel({ name: 'Mango' });
      
      // Act
      const response = await GET();
      const data = await response.json();
      
      // Assert
      expect(data.data[0].name).toBe('Apple');
      expect(data.data[1].name).toBe('Mango');
      expect(data.data[2].name).toBe('Zebra');
    });
  });

  describe('POST /api/labels', () => {
    test('creates new label', async () => {
      // Arrange
      const body = { name: 'New Label', color: '#ff0000', emoji: '🏷️' };
      const request = createRequest(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('New Label');
      expect(data.data.color).toBe('#ff0000');
      expect(data.data.emoji).toBe('🏷️');
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

    test('returns 409 for duplicate name', async () => {
      // Arrange
      createLabel({ name: 'Existing Label' });
      const body = { name: 'Existing Label' };
      const request = createRequest(body, 'POST');
      
      // Act
      const response = await POST(request);
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('CONFLICT');
    });
  });

  describe('GET /api/labels/[id]', () => {
    test('returns label by ID', async () => {
      // Arrange
      const label = createLabel({ name: 'Test Label' });
      
      // Act
      const response = await GetById(createRequest(), createParams(label.id));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(label.id);
      expect(data.data.name).toBe('Test Label');
    });

    test('returns 404 for non-existent label', async () => {
      // Act
      const response = await GetById(createRequest(), createParams('non-existent-id'));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/labels/[id]', () => {
    test('updates label', async () => {
      // Arrange
      const label = createLabel({ name: 'Original' });
      const body = { name: 'Updated', color: '#00ff00' };
      const request = createRequest(body, 'PUT');
      
      // Act
      const response = await PUT(request, createParams(label.id));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated');
      expect(data.data.color).toBe('#00ff00');
    });

    test('returns 404 for non-existent label', async () => {
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
      const label = createLabel({ name: 'Test' });
      const body = { name: '' };
      const request = createRequest(body, 'PUT');
      
      // Act
      const response = await PUT(request, createParams(label.id));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    test('returns 409 for duplicate name', async () => {
      // Arrange
      createLabel({ name: 'Label 1' });
      const label2 = createLabel({ name: 'Label 2' });
      const body = { name: 'Label 1' };
      const request = createRequest(body, 'PUT');
      
      // Act
      const response = await PUT(request, createParams(label2.id));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/labels/[id]', () => {
    test('deletes label', async () => {
      // Arrange
      const label = createLabel({ name: 'To Delete' });
      
      // Act
      const response = await DELETE(createRequest(), createParams(label.id));
      const data = await response.json();
      
      // Assert
      expect(data.success).toBe(true);
      expect(data.message).toBe('Label deleted successfully');
    });

    test('returns 404 for non-existent label', async () => {
      // Act
      const response = await DELETE(createRequest(), createParams('non-existent-id'));
      const data = await response.json();
      
      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });
});
