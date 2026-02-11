#!/usr/bin/env bun
/**
 * Database Migration Script
 * 
 * This script reads the schema.sql file and executes it to initialize
 * or update the database schema. It handles migration versioning to
 * prevent re-running migrations.
 * 
 * Usage: bun run db:migrate
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { getDb, closeDb, getMigrationVersion, run, get } from './index';

// Path to the schema file
const SCHEMA_PATH = join(__dirname, 'schema.sql');

// Current schema version (increment this when making schema changes)
const SCHEMA_VERSION = 1;
const SCHEMA_NAME = 'initial_schema';

/**
 * Check if migrations table exists
 */
function migrationsTableExists(): boolean {
  const result = get<{ count: number }>(
    "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='migrations'"
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Create migrations table if it doesn't exist
 */
function ensureMigrationsTable(): void {
  if (!migrationsTableExists()) {
    console.log('[MIGRATE] Creating migrations table...');
    run(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    console.log('[MIGRATE] Migrations table created');
  }
}

/**
 * Check if a specific migration has been applied
 */
function isMigrationApplied(version: number): boolean {
  const result = get<{ count: number }>(
    'SELECT count(*) as count FROM migrations WHERE version = ?',
    [version]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Record a migration as applied
 */
function recordMigration(version: number, name: string): void {
  run(
    'INSERT INTO migrations (version, name) VALUES (?, ?)',
    [version, name]
  );
}

/**
 * Run the schema migration
 */
function runMigration(): void {
  console.log('[MIGRATE] Starting database migration...');
  console.log(`[MIGRATE] Schema version: ${SCHEMA_VERSION}`);
  
  // Ensure data directory exists
  const dataDir = dirname(join(process.cwd(), 'data', 'tasks.db'));
  if (!existsSync(dataDir)) {
    console.log(`[MIGRATE] Creating data directory: ${dataDir}`);
    mkdirSync(dataDir, { recursive: true });
  }
  
  // Get database connection
  const db = getDb();
  
  // Ensure migrations table exists
  ensureMigrationsTable();
  
  // Check current version
  const currentVersion = getMigrationVersion();
  console.log(`[MIGRATE] Current database version: ${currentVersion}`);
  
  // Check if this migration has already been applied
  if (isMigrationApplied(SCHEMA_VERSION)) {
    console.log(`[MIGRATE] Migration ${SCHEMA_VERSION} (${SCHEMA_NAME}) already applied, skipping`);
    return;
  }
  
  // Read the schema file
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`[MIGRATE] ERROR: Schema file not found at ${SCHEMA_PATH}`);
    process.exit(1);
  }
  
  console.log(`[MIGRATE] Reading schema from ${SCHEMA_PATH}`);
  const schemaSql = readFileSync(SCHEMA_PATH, 'utf-8');
  
  // Execute the schema in a transaction
  console.log('[MIGRATE] Executing schema migration...');
  
  try {
    // Run the migration in a transaction
    const txn = db.transaction(() => {
      // Execute the schema SQL
      db.exec(schemaSql);
      
      // Record the migration
      recordMigration(SCHEMA_VERSION, SCHEMA_NAME);
    });
    
    txn();
    
    console.log(`[MIGRATE] Migration ${SCHEMA_VERSION} (${SCHEMA_NAME}) applied successfully`);
  } catch (error) {
    console.error('[MIGRATE] ERROR: Migration failed');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Get migration status
 */
function showStatus(): void {
  console.log('\n[MIGRATE] Migration Status:');
  console.log('==========================');
  
  const currentVersion = getMigrationVersion();
  console.log(`Current version: ${currentVersion}`);
  console.log(`Target version: ${SCHEMA_VERSION}`);
  
  if (migrationsTableExists()) {
    const db = getDb();
    const migrations = db.prepare('SELECT version, name, applied_at FROM migrations ORDER BY version').all() as Array<{
      version: number;
      name: string;
      applied_at: string;
    }>;
    
    if (migrations.length > 0) {
      console.log('\nApplied migrations:');
      for (const migration of migrations) {
        console.log(`  - v${migration.version}: ${migration.name} (${migration.applied_at})`);
      }
    } else {
      console.log('\nNo migrations applied yet');
    }
  } else {
    console.log('\nMigrations table does not exist (database not initialized)');
  }
  
  console.log('');
}

// Run the migration
console.log('========================================');
console.log('  Database Migration Script');
console.log('========================================\n');

runMigration();
showStatus();

// Close the database connection
closeDb();

console.log('[MIGRATE] Migration complete!');
