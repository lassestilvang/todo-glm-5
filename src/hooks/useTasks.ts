/**
 * useTasks Hook
 * 
 * Custom hook for fetching and managing tasks with:
 * - SWR-like data fetching
 * - CRUD mutations with optimistic updates
 * - Filter and sort functionality
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskQueryParams,
  ApiResponse,
  SortBy,
  SortOrder,
  Priority,
} from '@/types';
import { useTaskStore, useListStore } from '@/stores';

// ============================================
// API HELPERS
// ============================================

async function fetchTasks(params?: TaskQueryParams): Promise<Task[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.list_id) searchParams.set('list_id', params.list_id);
  if (params?.is_completed !== undefined) searchParams.set('is_completed', String(params.is_completed));
  if (params?.priority !== undefined) searchParams.set('priority', String(params.priority));
  if (params?.due_date_from) searchParams.set('due_date_from', params.due_date_from);
  if (params?.due_date_to) searchParams.set('due_date_to', params.due_date_to);
  if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
  if (params?.sort_order) searchParams.set('sort_order', params.sort_order);
  if (params?.search) searchParams.set('search', params.search);
  
  const response = await fetch(`/api/tasks?${searchParams.toString()}`);
  const data: ApiResponse<Task[]> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to fetch tasks');
  }
  
  return data.data;
}

async function createTaskRequest(task: CreateTaskRequest): Promise<Task> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  
  const data: ApiResponse<Task> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to create task');
  }
  
  return data.data;
}

async function updateTaskRequest(id: string, updates: UpdateTaskRequest): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  
  const data: ApiResponse<Task> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to update task');
  }
  
  return data.data;
}

async function deleteTaskRequest(id: string): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
  
  const data: ApiResponse<void> = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to delete task');
  }
}

async function toggleTaskCompleteRequest(id: string, isCompleted: boolean): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_completed: isCompleted }),
  });
  
  const data: ApiResponse<Task> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to toggle task');
  }
  
  return data.data;
}

// ============================================
// MAIN HOOK
// ============================================

interface UseTasksOptions {
  listId?: string;
  autoFetch?: boolean;
}

interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  
  // CRUD operations
  createTask: (task: CreateTaskRequest) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskRequest) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string, isCompleted: boolean) => Promise<Task>;
  
  // Fetch operations
  refetch: () => Promise<void>;
  
  // Filtered and sorted tasks
  filteredTasks: Task[];
  
  // Stats
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { listId, autoFetch = true } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { 
    tasks, 
    setTasks, 
    addTask, 
    updateTask, 
    deleteTask,
    filters,
    sortBy,
    sortOrder,
  } = useTaskStore();
  
  const selectedListId = useListStore((state) => state.selectedListId);
  
  // Fetch tasks
  const fetchTasksData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params: TaskQueryParams = {
        list_id: listId || selectedListId || undefined,
        is_completed: filters.isCompleted,
        priority: filters.priority,
        due_date_from: filters.dueDateFrom,
        due_date_to: filters.dueDateTo,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      
      const data = await fetchTasks(params);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
    } finally {
      setIsLoading(false);
    }
  }, [listId, selectedListId, filters, sortBy, sortOrder, setTasks]);
  
  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchTasksData();
    }
  }, [autoFetch, fetchTasksData]);
  
  // Create task with optimistic update
  const createTask = useCallback(async (taskData: CreateTaskRequest): Promise<Task> => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      list_id: taskData.list_id,
      name: taskData.name,
      description: taskData.description || null,
      due_date: taskData.due_date || null,
      due_time: taskData.due_time || null,
      deadline: taskData.deadline || null,
      priority: taskData.priority || 0,
      estimate_minutes: taskData.estimate_minutes || null,
      actual_minutes: null,
      is_completed: false,
      completed_at: null,
      recurrence_type: taskData.recurrence_type || 'NONE' as never,
      recurrence_config: taskData.recurrence_config || null,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Optimistic update
    addTask(optimisticTask);
    
    try {
      const newTask = await createTaskRequest(taskData);
      
      // Replace optimistic task with real one
      useTaskStore.setState((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? newTask : t)),
      }));
      
      return newTask;
    } catch (err) {
      // Revert optimistic update
      useTaskStore.setState((state) => ({
        tasks: state.tasks.filter((t) => t.id !== tempId),
      }));
      throw err;
    }
  }, [addTask]);
  
  // Update task with optimistic update
  const updateTaskMutation = useCallback(async (
    id: string, 
    updates: UpdateTaskRequest
  ): Promise<Task> => {
    // Store previous state for rollback
    const previousTask = tasks.find((t) => t.id === id);
    
    // Convert UpdateTaskRequest to Partial<Task> for store
    const storeUpdates = {
      ...updates,
      recurrence_type: updates.recurrence_type ?? undefined,
    };
    
    // Optimistic update
    updateTask(id, storeUpdates);
    
    try {
      const updatedTask = await updateTaskRequest(id, updates);
      updateTask(id, updatedTask);
      return updatedTask;
    } catch (err) {
      // Revert on error
      if (previousTask) {
        updateTask(id, previousTask);
      }
      throw err;
    }
  }, [tasks, updateTask]);
  
  // Delete task with optimistic update
  const deleteTaskMutation = useCallback(async (id: string): Promise<void> => {
    // Store previous state for rollback
    const previousTask = tasks.find((t) => t.id === id);
    
    // Optimistic update
    deleteTask(id);
    
    try {
      await deleteTaskRequest(id);
    } catch (err) {
      // Revert on error
      if (previousTask) {
        addTask(previousTask);
      }
      throw err;
    }
  }, [tasks, deleteTask, addTask]);
  
  // Toggle complete
  const toggleComplete = useCallback(async (
    id: string, 
    isCompleted: boolean
  ): Promise<Task> => {
    const previousTask = tasks.find((t) => t.id === id);
    
    // Optimistic update
    updateTask(id, { 
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    });
    
    try {
      const updatedTask = await toggleTaskCompleteRequest(id, isCompleted);
      updateTask(id, updatedTask);
      return updatedTask;
    } catch (err) {
      if (previousTask) {
        updateTask(id, previousTask);
      }
      throw err;
    }
  }, [tasks, updateTask]);
  
  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    
    // Apply list filter
    if (listId || selectedListId) {
      result = result.filter((t) => t.list_id === (listId || selectedListId));
    }
    
    // Apply completion filter
    if (filters.isCompleted !== undefined) {
      result = result.filter((t) => t.is_completed === filters.isCompleted);
    }
    
    // Apply priority filter
    if (filters.priority !== undefined) {
      result = result.filter((t) => t.priority === filters.priority);
    }
    
    // Apply date filters
    if (filters.dueDateFrom) {
      result = result.filter((t) => t.due_date && t.due_date >= filters.dueDateFrom!);
    }
    if (filters.dueDateTo) {
      result = result.filter((t) => t.due_date && t.due_date <= filters.dueDateTo!);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'DUE_DATE':
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = a.due_date.localeCompare(b.due_date);
          break;
          
        case 'PRIORITY':
          comparison = b.priority - a.priority; // Higher priority first
          break;
          
        case 'NAME':
          comparison = a.name.localeCompare(b.name);
          break;
          
        case 'CREATED_AT':
          comparison = a.created_at.localeCompare(b.created_at);
          break;
          
        default:
          comparison = 0;
      }
      
      return sortOrder === 'DESC' ? -comparison : comparison;
    });
    
    return result;
  }, [tasks, listId, selectedListId, filters, sortBy, sortOrder]);
  
  // Stats
  const completedCount = useMemo(
    () => tasks.filter((t) => t.is_completed).length,
    [tasks]
  );
  
  const pendingCount = useMemo(
    () => tasks.filter((t) => !t.is_completed).length,
    [tasks]
  );
  
  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(
      (t) => !t.is_completed && t.due_date && t.due_date < today
    ).length;
  }, [tasks]);
  
  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask: updateTaskMutation,
    deleteTask: deleteTaskMutation,
    toggleComplete,
    refetch: fetchTasksData,
    filteredTasks,
    completedCount,
    pendingCount,
    overdueCount,
  };
}

// ============================================
// VIEW-SPECIFIC HOOKS
// ============================================

/**
 * Hook for today's tasks
 */
export function useTodayTasks() {
  const today = new Date().toISOString().split('T')[0];
  
  return useTasks({
    autoFetch: true,
  });
}

/**
 * Hook for week's tasks
 */
export function useWeekTasks() {
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  
  return useTasks({
    autoFetch: true,
  });
}

/**
 * Hook for overdue tasks
 */
export function useOverdueTasks() {
  const { tasks, isLoading, refetch } = useTasks({ autoFetch: false });
  
  const today = new Date().toISOString().split('T')[0];
  
  const overdueTasks = useMemo(
    () => tasks.filter((t) => !t.is_completed && t.due_date && t.due_date < today),
    [tasks, today]
  );
  
  return {
    tasks: overdueTasks,
    isLoading,
    refetch,
  };
}

/**
 * Hook for single task operations
 */
export function useTask(taskId: string | null) {
  const task = useTaskStore((state) => 
    state.tasks.find((t) => t.id === taskId)
  );
  
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchTask = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tasks/${id}`);
      const data: ApiResponse<Task> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to fetch task');
      }
      
      updateTask(id, data.data);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch task'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateTask]);
  
  useEffect(() => {
    if (taskId && !task) {
      fetchTask(taskId);
    }
  }, [taskId, task, fetchTask]);
  
  return {
    task,
    isLoading,
    error,
    refetch: taskId ? () => fetchTask(taskId) : undefined,
  };
}
