/**
 * Test Setup
 * 
 * Sets up the test database and provides utilities for testing.
 * This file is automatically loaded by Bun before running tests.
 */

import { beforeAll, beforeEach, afterAll, afterEach } from 'bun:test';
import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';

// Test database path
export const TEST_DB_PATH = join(process.cwd(), 'data', 'test.db');

// Store original database module functions
let originalDb: Database.Database | null = null;

/**
 * Create a fresh test database
 */
export function createTestDatabase(): Database.Database {
  // Ensure data directory exists
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // Create new database
  const db = new Database(TEST_DB_PATH);
  
  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');
  
  // Run schema
  const schemaPath = join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
  const schema = require('fs').readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  
  return db;
}

/**
 * Clear all data from the test database
 */
export function clearTestDatabase(db: Database.Database): void {
  db.exec('DELETE FROM task_history');
  db.exec('DELETE FROM task_labels');
  db.exec('DELETE FROM reminders');
  db.exec('DELETE FROM attachments');
  db.exec('DELETE FROM subtasks');
  db.exec('DELETE FROM tasks');
  db.exec('DELETE FROM labels');
  db.exec('DELETE FROM lists WHERE id != "inbox"');
  db.exec('DELETE FROM migrations');
}

/**
 * Seed the test database with the Inbox list
 */
export function seedInbox(db: Database.Database): void {
  const now = new Date().toISOString();
  db.exec(`
    INSERT OR IGNORE INTO lists (id, name, color, emoji, position, is_default, created_at, updated_at)
    VALUES ('inbox', 'Inbox', '#6366f1', '📥', 0, 1, '${now}', '${now}')
  `);
}

/**
 * Close and optionally delete the test database
 */
export function closeTestDatabase(db: Database.Database, deleteFile = false): void {
  if (db) {
    db.close();
  }
  
  if (deleteFile && existsSync(TEST_DB_PATH)) {
    rmSync(TEST_DB_PATH, { force: true });
  }
  
  // Also clean up WAL files
  const walPath = TEST_DB_PATH + '-wal';
  const shmPath = TEST_DB_PATH + '-shm';
  if (existsSync(walPath)) rmSync(walPath, { force: true });
  if (existsSync(shmPath)) rmSync(shmPath, { force: true });
}

// Global test database instance
let testDb: Database.Database;

/**
 * Get the test database instance
 */
export function getTestDb(): Database.Database {
  return testDb;
}

// Setup before all tests
beforeAll(() => {
  // Clean up any existing test database
  if (existsSync(TEST_DB_PATH)) {
    rmSync(TEST_DB_PATH, { force: true });
  }
  
  // Create fresh test database
  testDb = createTestDatabase();
  seedInbox(testDb);
  
  // Mock the database module to use test database
  const dbModule = require('../lib/db');
  
  // Store original functions
  const originalGetDb = dbModule.getDb;
  const originalCloseDb = dbModule.closeDb;
  
  // Override to use test database
  dbModule.getDb = () => testDb;
  dbModule.closeDb = () => { /* no-op in tests */ };
});

// Clean up after each test
afterEach(() => {
  clearTestDatabase(testDb);
  seedInbox(testDb);
});

// Clean up after all tests
afterAll(() => {
  closeTestDatabase(testDb, true);
});

// Re-export test utilities
export { testDb };
