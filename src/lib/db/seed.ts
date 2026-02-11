#!/usr/bin/env bun
/**
 * Database Seed Script
 * 
 * This script populates the database with initial data:
 * - Default "Inbox" list
 * - Sample labels for testing
 * - Optional sample tasks for development
 * 
 * Usage: bun run db:seed
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb, closeDb, run, get, all } from './index';
import { Priority, RecurrenceType } from '@/types';

// ============================================
// SEED DATA
// ============================================

/**
 * Default labels to create
 */
const DEFAULT_LABELS = [
  { name: 'Work', emoji: '💼', color: 'blue' },
  { name: 'Personal', emoji: '🏠', color: 'green' },
  { name: 'Important', emoji: '⭐', color: 'yellow' },
  { name: 'Urgent', emoji: '🔥', color: 'red' },
  { name: 'Ideas', emoji: '💡', color: 'purple' },
  { name: 'Health', emoji: '💪', color: 'teal' },
];

/**
 * Sample tasks for development (optional)
 */
const SAMPLE_TASKS = [
  {
    name: 'Welcome to your task planner!',
    description: 'This is your first task. Click to see more details.',
    priority: Priority.NONE,
  },
  {
    name: 'Create your first list',
    description: 'Organize your tasks by creating custom lists from the sidebar.',
    priority: Priority.LOW,
  },
  {
    name: 'Try adding labels',
    description: 'Labels help you categorize and filter tasks.',
    priority: Priority.MEDIUM,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a list exists by ID
 */
function listExists(id: string): boolean {
  const result = get<{ count: number }>(
    'SELECT count(*) as count FROM lists WHERE id = ?',
    [id]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Check if a label exists by name
 */
function labelExists(name: string): boolean {
  const result = get<{ count: number }>(
    'SELECT count(*) as count FROM labels WHERE name = ?',
    [name]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Get the count of tasks in the database
 */
function getTaskCount(): number {
  const result = get<{ count: number }>(
    'SELECT count(*) as count FROM tasks'
  );
  return result?.count ?? 0;
}

/**
 * Get the count of lists in the database
 */
function getListCount(): number {
  const result = get<{ count: number }>(
    'SELECT count(*) as count FROM lists'
  );
  return result?.count ?? 0;
}

// ============================================
// SEED FUNCTIONS
// ============================================

/**
 * Create the default "Inbox" list
 */
function createInboxList(): string {
  const inboxId = 'inbox';
  
  if (listExists(inboxId)) {
    console.log('[SEED] Inbox list already exists, skipping');
    return inboxId;
  }
  
  console.log('[SEED] Creating default Inbox list...');
  
  run(
    `INSERT INTO lists (id, name, color, emoji, position, is_default)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [inboxId, 'Inbox', 'blue', '📥', 0, 1]
  );
  
  console.log('[SEED] Inbox list created');
  return inboxId;
}

/**
 * Create default labels
 */
function createDefaultLabels(): void {
  console.log('[SEED] Creating default labels...');
  
  let created = 0;
  let skipped = 0;
  
  for (const label of DEFAULT_LABELS) {
    if (labelExists(label.name)) {
      skipped++;
      continue;
    }
    
    const id = uuidv4();
    run(
      `INSERT INTO labels (id, name, emoji, color)
       VALUES (?, ?, ?, ?)`,
      [id, label.name, label.emoji, label.color]
    );
    created++;
  }
  
  console.log(`[SEED] Labels: ${created} created, ${skipped} skipped`);
}

/**
 * Create sample tasks for development
 */
function createSampleTasks(inboxId: string): void {
  const taskCount = getTaskCount();
  
  if (taskCount > 0) {
    console.log(`[SEED] Database already has ${taskCount} tasks, skipping sample tasks`);
    return;
  }
  
  console.log('[SEED] Creating sample tasks...');
  
  const today = new Date().toISOString().split('T')[0];
  
  for (let i = 0; i < SAMPLE_TASKS.length; i++) {
    const task = SAMPLE_TASKS[i];
    const id = uuidv4();
    
    run(
      `INSERT INTO tasks (
        id, list_id, name, description, due_date, priority, 
        recurrence_type, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        inboxId,
        task.name,
        task.description,
        i === 0 ? today : null, // First task is due today
        task.priority,
        RecurrenceType.NONE,
        i,
      ]
    );
  }
  
  console.log(`[SEED] ${SAMPLE_TASKS.length} sample tasks created`);
}

/**
 * Display seed summary
 */
function showSummary(): void {
  console.log('\n[SEED] Database Summary:');
  console.log('========================');
  
  const listCount = getListCount();
  const taskCount = getTaskCount();
  
  const labelCount = get<{ count: number }>(
    'SELECT count(*) as count FROM labels'
  )?.count ?? 0;
  
  console.log(`Lists: ${listCount}`);
  console.log(`Tasks: ${taskCount}`);
  console.log(`Labels: ${labelCount}`);
  
  // Show lists
  const lists = all<{ id: string; name: string; is_default: number }>(
    'SELECT id, name, is_default FROM lists ORDER BY position'
  );
  
  if (lists.length > 0) {
    console.log('\nLists:');
    for (const list of lists) {
      const defaultFlag = list.is_default ? ' (default)' : '';
      console.log(`  - ${list.name}${defaultFlag}`);
    }
  }
  
  // Show labels
  const labels = all<{ name: string; emoji: string; color: string }>(
    'SELECT name, emoji, color FROM labels ORDER BY name'
  );
  
  if (labels.length > 0) {
    console.log('\nLabels:');
    for (const label of labels) {
      console.log(`  - ${label.emoji} ${label.name} (${label.color})`);
    }
  }
  
  console.log('');
}

// ============================================
// MAIN EXECUTION
// ============================================

console.log('========================================');
console.log('  Database Seed Script');
console.log('========================================\n');

// Get database connection
const db = getDb();

// Run seeding in a transaction
console.log('[SEED] Starting database seeding...\n');

try {
  const transaction = db.transaction(() => {
    // Create the default Inbox list
    const inboxId = createInboxList();
    
    // Create default labels
    createDefaultLabels();
    
    // Create sample tasks (only if database is empty)
    createSampleTasks(inboxId);
  });
  
  transaction();
  
  console.log('\n[SEED] Seeding completed successfully!');
  
  // Show summary
  showSummary();
  
} catch (error) {
  console.error('[SEED] ERROR: Seeding failed');
  console.error(error);
  process.exit(1);
}

// Close the database connection
closeDb();

console.log('[SEED] Done!');
