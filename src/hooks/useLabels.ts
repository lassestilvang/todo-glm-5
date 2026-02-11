/**
 * useLabels Hook
 * 
 * Custom hook for fetching and managing labels with:
 * - SWR-like data fetching
 * - CRUD mutations with optimistic updates
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  Label, 
  CreateLabelRequest, 
  UpdateLabelRequest, 
  ApiResponse,
} from '@/types';
import { useLabelStore } from '@/stores';

// ============================================
// API HELPERS
// ============================================

async function fetchLabels(): Promise<Label[]> {
  const response = await fetch('/api/labels');
  const data: ApiResponse<Label[]> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to fetch labels');
  }
  
  return data.data;
}

async function createLabelRequest(label: CreateLabelRequest): Promise<Label> {
  const response = await fetch('/api/labels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(label),
  });
  
  const data: ApiResponse<Label> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to create label');
  }
  
  return data.data;
}

async function updateLabelRequest(id: string, updates: UpdateLabelRequest): Promise<Label> {
  const response = await fetch(`/api/labels/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  
  const data: ApiResponse<Label> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to update label');
  }
  
  return data.data;
}

async function deleteLabelRequest(id: string): Promise<void> {
  const response = await fetch(`/api/labels/${id}`, {
    method: 'DELETE',
  });
  
  const data: ApiResponse<void> = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to delete label');
  }
}

// ============================================
// MAIN HOOK
// ============================================

interface UseLabelsOptions {
  autoFetch?: boolean;
}

interface UseLabelsReturn {
  labels: Label[];
  isLoading: boolean;
  error: Error | null;
  selectedLabelIds: string[];
  
  // CRUD operations
  createLabel: (label: CreateLabelRequest) => Promise<Label>;
  updateLabel: (id: string, updates: UpdateLabelRequest) => Promise<Label>;
  deleteLabel: (id: string) => Promise<void>;
  
  // Selection
  selectLabels: (ids: string[]) => void;
  toggleLabelSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Fetch operations
  refetch: () => Promise<void>;
  
  // Helpers
  getLabelById: (id: string) => Label | undefined;
  getLabelsByIds: (ids: string[]) => Label[];
}

export function useLabels(options: UseLabelsOptions = {}): UseLabelsReturn {
  const { autoFetch = true } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { 
    labels, 
    setLabels, 
    addLabel, 
    updateLabel: updateLabelStore, 
    deleteLabel: deleteLabelStore,
    selectedLabelIds,
    setSelectedLabelIds,
    toggleLabelSelection,
    clearLabelSelection,
    getLabelById,
  } = useLabelStore();
  
  // Fetch labels
  const fetchLabelsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchLabels();
      setLabels(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch labels'));
    } finally {
      setIsLoading(false);
    }
  }, [setLabels]);
  
  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchLabelsData();
    }
  }, [autoFetch, fetchLabelsData]);
  
  // Create label with optimistic update
  const createLabel = useCallback(async (labelData: CreateLabelRequest): Promise<Label> => {
    const tempId = `temp-${Date.now()}`;
    const optimisticLabel: Label = {
      id: tempId,
      name: labelData.name,
      emoji: labelData.emoji || null,
      color: labelData.color || '#64748b',
      created_at: new Date().toISOString(),
    };
    
    // Optimistic update
    addLabel(optimisticLabel);
    
    try {
      const newLabel = await createLabelRequest(labelData);
      
      // Replace optimistic label with real one
      useLabelStore.setState((state) => ({
        labels: state.labels.map((l) => (l.id === tempId ? newLabel : l)),
      }));
      
      return newLabel;
    } catch (err) {
      // Revert optimistic update
      useLabelStore.setState((state) => ({
        labels: state.labels.filter((l) => l.id !== tempId),
      }));
      throw err;
    }
  }, [addLabel]);
  
  // Update label with optimistic update
  const updateLabel = useCallback(async (
    id: string, 
    updates: UpdateLabelRequest
  ): Promise<Label> => {
    // Store previous state for rollback
    const previousLabel = labels.find((l) => l.id === id);
    
    // Optimistic update
    updateLabelStore(id, updates);
    
    try {
      const updatedLabel = await updateLabelRequest(id, updates);
      updateLabelStore(id, updatedLabel);
      return updatedLabel;
    } catch (err) {
      // Revert on error
      if (previousLabel) {
        updateLabelStore(id, previousLabel);
      }
      throw err;
    }
  }, [labels, updateLabelStore]);
  
  // Delete label with optimistic update
  const deleteLabel = useCallback(async (id: string): Promise<void> => {
    // Store previous state for rollback
    const previousLabel = labels.find((l) => l.id === id);
    
    // Optimistic update
    deleteLabelStore(id);
    
    try {
      await deleteLabelRequest(id);
    } catch (err) {
      // Revert on error
      if (previousLabel) {
        addLabel(previousLabel);
      }
      throw err;
    }
  }, [labels, deleteLabelStore, addLabel]);
  
  // Select labels
  const selectLabels = useCallback((ids: string[]) => {
    setSelectedLabelIds(ids);
  }, [setSelectedLabelIds]);
  
  // Get labels by IDs
  const getLabelsByIds = useCallback((ids: string[]): Label[] => {
    return ids.map((id) => getLabelById(id)).filter(Boolean) as Label[];
  }, [getLabelById]);
  
  return {
    labels,
    isLoading,
    error,
    selectedLabelIds,
    createLabel,
    updateLabel,
    deleteLabel,
    selectLabels,
    toggleLabelSelection,
    clearSelection,
    refetch: fetchLabelsData,
    getLabelById,
    getLabelsByIds,
  };
}

// ============================================
// SINGLE LABEL HOOK
// ============================================

/**
 * Hook for single label operations
 */
export function useLabel(labelId: string | null) {
  const label = useLabelStore((state) => 
    state.labels.find((l) => l.id === labelId)
  );
  
  const updateLabelStore = useLabelStore((state) => state.updateLabel);
  const deleteLabelStore = useLabelStore((state) => state.deleteLabel);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchLabel = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/labels/${id}`);
      const data: ApiResponse<Label> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to fetch label');
      }
      
      updateLabelStore(id, data.data);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch label'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateLabelStore]);
  
  useEffect(() => {
    if (labelId && !label) {
      fetchLabel(labelId);
    }
  }, [labelId, label, fetchLabel]);
  
  return {
    label,
    isLoading,
    error,
    refetch: labelId ? () => fetchLabel(labelId) : undefined,
  };
}

// ============================================
// TASK LABELS HOOK
// ============================================

/**
 * Hook for managing labels on a task
 */
export function useTaskLabels(taskId: string | null) {
  const [assignedLabels, setAssignedLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const allLabels = useLabelStore((state) => state.labels);
  
  // Fetch labels for a task
  const fetchTaskLabels = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tasks/${id}/labels`);
      const data: ApiResponse<Label[]> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to fetch task labels');
      }
      
      setAssignedLabels(data.data);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch task labels'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Add label to task
  const addLabelToTask = useCallback(async (labelId: string) => {
    if (!taskId) return;
    
    const label = allLabels.find((l) => l.id === labelId);
    if (!label) return;
    
    // Optimistic update
    setAssignedLabels((prev) => [...prev, label]);
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label_id: labelId }),
      });
      
      const data: ApiResponse<void> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to add label');
      }
    } catch (err) {
      // Revert on error
      setAssignedLabels((prev) => prev.filter((l) => l.id !== labelId));
      throw err;
    }
  }, [taskId, allLabels]);
  
  // Remove label from task
  const removeLabelFromTask = useCallback(async (labelId: string) => {
    if (!taskId) return;
    
    // Store previous state
    const previousLabels = [...assignedLabels];
    
    // Optimistic update
    setAssignedLabels((prev) => prev.filter((l) => l.id !== labelId));
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/labels/${labelId}`, {
        method: 'DELETE',
      });
      
      const data: ApiResponse<void> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to remove label');
      }
    } catch (err) {
      // Revert on error
      setAssignedLabels(previousLabels);
      throw err;
    }
  }, [taskId, assignedLabels]);
  
  // Toggle label on task
  const toggleLabel = useCallback(async (labelId: string) => {
    const isAssigned = assignedLabels.some((l) => l.id === labelId);
    
    if (isAssigned) {
      await removeLabelFromTask(labelId);
    } else {
      await addLabelToTask(labelId);
    }
  }, [assignedLabels, addLabelToTask, removeLabelFromTask]);
  
  useEffect(() => {
    if (taskId) {
      fetchTaskLabels(taskId);
    }
  }, [taskId, fetchTaskLabels]);
  
  return {
    labels: assignedLabels,
    allLabels,
    isLoading,
    error,
    addLabel: addLabelToTask,
    removeLabel: removeLabelFromTask,
    toggleLabel,
    refetch: taskId ? () => fetchTaskLabels(taskId) : undefined,
  };
}

// ============================================
// LABEL COLORS HOOK
// ============================================

/**
 * Available label colors
 */
export const LABEL_COLORS = [
  { name: 'Slate', value: '#64748b', tailwind: 'bg-slate-500' },
  { name: 'Red', value: '#ef4444', tailwind: 'bg-list-red' },
  { name: 'Orange', value: '#f97316', tailwind: 'bg-list-orange' },
  { name: 'Amber', value: '#f59e0b', tailwind: 'bg-list-amber' },
  { name: 'Yellow', value: '#eab308', tailwind: 'bg-list-yellow' },
  { name: 'Lime', value: '#84cc16', tailwind: 'bg-list-lime' },
  { name: 'Green', value: '#22c55e', tailwind: 'bg-list-green' },
  { name: 'Emerald', value: '#10b981', tailwind: 'bg-list-emerald' },
  { name: 'Teal', value: '#14b8a6', tailwind: 'bg-list-teal' },
  { name: 'Cyan', value: '#06b6d4', tailwind: 'bg-list-cyan' },
  { name: 'Blue', value: '#3b82f6', tailwind: 'bg-list-blue' },
  { name: 'Violet', value: '#8b5cf6', tailwind: 'bg-list-violet' },
  { name: 'Purple', value: '#a855f7', tailwind: 'bg-list-purple' },
  { name: 'Fuchsia', value: '#d946ef', tailwind: 'bg-list-fuchsia' },
  { name: 'Pink', value: '#ec4899', tailwind: 'bg-list-pink' },
  { name: 'Rose', value: '#f43f5e', tailwind: 'bg-list-rose' },
] as const;

/**
 * Hook to get label color utilities
 */
export function useLabelColors() {
  const getColorByName = (name: string) => 
    LABEL_COLORS.find((c) => c.name.toLowerCase() === name.toLowerCase());
  
  const getColorByValue = (value: string) => 
    LABEL_COLORS.find((c) => c.value === value);
  
  const getTailwindClass = (colorValue: string) => 
    getColorByValue(colorValue)?.tailwind || 'bg-slate-500';
  
  return {
    colors: LABEL_COLORS,
    getColorByName,
    getColorByValue,
    getTailwindClass,
  };
}

// ============================================
// LABEL EMOJIS HOOK
// ============================================

/**
 * Common label emojis
 */
export const LABEL_EMOJIS = [
  '🏷️', '📌', '🔖', '📍', '🎯', '⭐', '💡', '🔥',
  '✨', '💎', '🚀', '🎨', '📚', '💼', '🏠', '🛒',
  '💪', '🎮', '🎵', '🎬', '📱', '💻', '🌟', '❤️',
  '💜', '💙', '💚', '💛', '🧡', '🖤', '🤍', '⚡',
] as const;

/**
 * Hook to get label emoji utilities
 */
export function useLabelEmojis() {
  return {
    emojis: LABEL_EMOJIS,
    defaultEmoji: '🏷️',
  };
}
