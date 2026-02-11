/**
 * Database connection singleton using better-sqlite3
 * 
 * This module provides a centralized database connection for the application.
 * The database file is stored at data/tasks.db
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

// Database file path
const DB_PATH = join(process.cwd(), 'data', 'tasks.db');

// Ensure the data directory exists
function ensureDataDirectory(): void {
  const dataDir = dirname(DB_PATH);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

// Database singleton instance
let db: Database.Database | null = null;

/**
 * Get the database connection singleton
 * Creates a new connection if one doesn't exist
 */
export function getDb(): Database.Database {
  if (!db) {
    ensureDataDirectory();
    db = new Database(DB_PATH);
    
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
    
    console.log(`[DB] Connected to database at ${DB_PATH}`);
  }
  
  return db;
}

/**
 * Close the database connection
 * Should be called when the application shuts down
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] Database connection closed');
  }
}

/**
 * Execute a SQL statement and return the result
 */
export function exec(sql: string): Database.RunResult {
  const database = getDb();
  return database.exec(sql);
}

/**
 * Prepare a SQL statement for execution
 */
export function prepare<T = unknown>(sql: string): Database.Statement<T> {
  const database = getDb();
  return database.prepare<T>(sql);
}

/**
 * Run a SQL statement with parameters
 */
export function run(sql: string, params: unknown[] = []): Database.RunResult {
  const stmt = prepare(sql);
  return stmt.run(...params);
}

/**
 * Get a single row from a SQL query
 */
export function get<T = unknown>(sql: string, params: unknown[] = []): T | undefined {
  const stmt = prepare<T>(sql);
  return stmt.get(...params);
}

/**
 * Get all rows from a SQL query
 */
export function all<T = unknown>(sql: string, params: unknown[] = []): T[] {
  const stmt = prepare<T>(sql);
  return stmt.all(...params) as T[];
}

/**
 * Check if the database is initialized (has the migrations table)
 */
export function isDatabaseInitialized(): boolean {
  try {
    const result = get<{ count: number }>(
      "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='migrations'"
    );
    return (result?.count ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Get the current migration version
 */
export function getMigrationVersion(): number {
  if (!isDatabaseInitialized()) {
    return 0;
  }
  
  const result = get<{ version: number }>(
    'SELECT version FROM migrations ORDER BY version DESC LIMIT 1'
  );
  
  return result?.version ?? 0;
}

/**
 * Record a migration in the migrations table
 */
export function recordMigration(version: number, name: string): void {
  run(
    'INSERT INTO migrations (version, name) VALUES (?, ?)',
    [version, name]
  );
}

/**
 * Transaction helper - executes a function within a transaction
 */
export function transaction<T>(fn: () => T): T {
  const database = getDb();
  return database.transaction(fn)();
}

/**
 * Begin a transaction manually
 */
export function beginTransaction(): void {
  run('BEGIN TRANSACTION');
}

/**
 * Commit the current transaction
 */
export function commit(): void {
  run('COMMIT');
}

/**
 * Rollback the current transaction
 */
export function rollback(): void {
  run('ROLLBACK');
}

// Export the database type for use in other modules
export type { Database } from 'better-sqlite3';

// Default export is the getDb function
export default getDb;
