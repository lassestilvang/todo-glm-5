-- ============================================
-- Daily Task Planner - Database Schema
-- ============================================
-- This file contains the complete database schema for the task planner.
-- Run this file through the migration script to initialize the database.

-- ============================================
-- MIGRATIONS TRACKING TABLE
-- ============================================
-- Tracks which migrations have been applied to the database

CREATE TABLE IF NOT EXISTS migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- LISTS TABLE
-- ============================================
-- Stores task lists/categories

CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  emoji TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- TASKS TABLE
-- ============================================
-- Stores individual tasks

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  due_time TEXT,
  deadline TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  estimate_minutes INTEGER,
  actual_minutes INTEGER,
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  recurrence_type TEXT NOT NULL DEFAULT 'NONE',
  recurrence_config TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

-- ============================================
-- SUBTASKS TABLE
-- ============================================
-- Stores subtasks for tasks

CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ============================================
-- LABELS TABLE
-- ============================================
-- Stores labels/tags that can be applied to tasks

CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emoji TEXT,
  color TEXT NOT NULL DEFAULT 'gray',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- TASK_LABELS JUNCTION TABLE
-- ============================================
-- Many-to-many relationship between tasks and labels

CREATE TABLE IF NOT EXISTS task_labels (
  task_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  PRIMARY KEY (task_id, label_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- ============================================
-- REMINDERS TABLE
-- ============================================
-- Stores reminders for tasks

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  remind_at TEXT NOT NULL,
  is_sent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ============================================
-- ATTACHMENTS TABLE
-- ============================================
-- Stores file attachments for tasks

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ============================================
-- TASK_HISTORY TABLE
-- ============================================
-- Stores change history for tasks

CREATE TABLE IF NOT EXISTS task_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  action TEXT NOT NULL,
  changes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================
-- Performance indexes for common queries

-- Lists indexes
CREATE INDEX IF NOT EXISTS idx_lists_position ON lists(position);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);

-- Subtasks indexes
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_position ON subtasks(task_id, position);

-- Labels indexes
CREATE INDEX IF NOT EXISTS idx_labels_name ON labels(name);

-- Task labels indexes
CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id);

-- Reminders indexes
CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_is_sent ON reminders(is_sent);

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id);

-- Task history indexes
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at);

-- ============================================
-- TRIGGERS
-- ============================================
-- Automatic timestamp updates

-- Trigger to update lists.updated_at on row update
CREATE TRIGGER IF NOT EXISTS update_lists_timestamp
AFTER UPDATE ON lists
FOR EACH ROW
BEGIN
  UPDATE lists SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Trigger to update tasks.updated_at on row update
CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
  UPDATE tasks SET updated_at = datetime('now') WHERE id = OLD.id;
END;
