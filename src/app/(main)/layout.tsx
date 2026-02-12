/**
 * Main Layout
 * 
 * Layout wrapper for the main application routes.
 * Includes sidebar, main content area, and global keyboard shortcuts.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { SearchDialog } from '@/components/common/SearchDialog';
import { TaskEditor } from '@/components/tasks/TaskEditor';
import { useUIStore, useTaskStore } from '@/stores';
import { useLists } from '@/hooks/useLists';
import { useLabels } from '@/hooks/useLabels';
import { useTasks } from '@/hooks/useTasks';
import type { CreateTaskRequest, UpdateTaskRequest } from '@/types';

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  
  // Stores
  const isTaskEditorOpen = useUIStore((state) => state.isTaskEditorOpen);
  const openTaskEditor = useUIStore((state) => state.openTaskEditor);
  const closeTaskEditor = useUIStore((state) => state.closeTaskEditor);
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const tasks = useTaskStore((state) => state.tasks);
  
  // Hooks
  const { lists, getDefaultList } = useLists();
  const { labels } = useLabels();
  const { createTask, updateTask, deleteTask } = useTasks();
  
  // Get selected task for editing
  const selectedTask = selectedTaskId 
    ? tasks.find((t) => t.id === selectedTaskId) 
    : null;
  
  // Handle task save
  const handleSaveTask = useCallback(async (taskData: CreateTaskRequest | UpdateTaskRequest) => {
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, taskData as UpdateTaskRequest);
      } else {
        await createTask(taskData as CreateTaskRequest);
      }
      closeTaskEditor();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  }, [selectedTask, createTask, updateTask, closeTaskEditor]);
  
  // Handle task delete
  const handleDeleteTask = useCallback(async () => {
    if (!selectedTask) return;
    try {
      await deleteTask(selectedTask.id);
      closeTaskEditor();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, [selectedTask, deleteTask, closeTaskEditor]);
  
  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable;
      
      // Cmd/Ctrl + N: New task (only if not in input)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !isInput) {
        e.preventDefault();
        openTaskEditor();
      }
      
      // Cmd/Ctrl + /: Show keyboard shortcuts (future implementation)
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        // TODO: Show keyboard shortcuts dialog
        console.log('Keyboard shortcuts');
      }
      
      // Escape: Close dialogs
      if (e.key === 'Escape') {
        // This is handled by individual components
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openTaskEditor]);
  
  const defaultList = getDefaultList();
  
  return (
    <AppLayout>
      {children}
      
      {/* Global search dialog */}
      <SearchDialog />
      
      {/* Global task editor */}
      <TaskEditor
        task={selectedTask ?? undefined}
        open={isTaskEditorOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeTaskEditor();
          }
        }}
        onSave={handleSaveTask}
        lists={lists}
        labels={labels}
        defaultListId={defaultList?.id}
        onDelete={selectedTask ? handleDeleteTask : undefined}
      />
    </AppLayout>
  );
}
