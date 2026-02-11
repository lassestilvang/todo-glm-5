/**
 * useLists Hook
 * 
 * Custom hook for fetching and managing lists with:
 * - SWR-like data fetching
 * - CRUD mutations with optimistic updates
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  List, 
  CreateListRequest, 
  UpdateListRequest, 
  ApiResponse,
  ListResponse,
} from '@/types';
import { useListStore } from '@/stores';

// ============================================
// API HELPERS
// ============================================

async function fetchLists(): Promise<ListResponse[]> {
  const response = await fetch('/api/lists');
  const data: ApiResponse<ListResponse[]> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to fetch lists');
  }
  
  return data.data;
}

async function createListRequest(list: CreateListRequest): Promise<List> {
  const response = await fetch('/api/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(list),
  });
  
  const data: ApiResponse<List> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to create list');
  }
  
  return data.data;
}

async function updateListRequest(id: string, updates: UpdateListRequest): Promise<List> {
  const response = await fetch(`/api/lists/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  
  const data: ApiResponse<List> = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to update list');
  }
  
  return data.data;
}

async function deleteListRequest(id: string): Promise<void> {
  const response = await fetch(`/api/lists/${id}`, {
    method: 'DELETE',
  });
  
  const data: ApiResponse<void> = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to delete list');
  }
}

async function reorderListsRequest(listIds: string[]): Promise<void> {
  const response = await fetch('/api/lists/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ list_ids: listIds }),
  });
  
  const data: ApiResponse<void> = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to reorder lists');
  }
}

// ============================================
// MAIN HOOK
// ============================================

interface UseListsOptions {
  autoFetch?: boolean;
}

interface UseListsReturn {
  lists: List[];
  listsWithCounts: ListResponse[];
  isLoading: boolean;
  error: Error | null;
  selectedListId: string | null;
  
  // CRUD operations
  createList: (list: CreateListRequest) => Promise<List>;
  updateList: (id: string, updates: UpdateListRequest) => Promise<List>;
  deleteList: (id: string) => Promise<void>;
  reorderLists: (listIds: string[]) => Promise<void>;
  
  // Selection
  selectList: (id: string | null) => void;
  
  // Fetch operations
  refetch: () => Promise<void>;
  
  // Helpers
  getListById: (id: string) => List | undefined;
  getDefaultList: () => List | undefined;
}

export function useLists(options: UseListsOptions = {}): UseListsReturn {
  const { autoFetch = true } = options;
  
  const [listsWithCounts, setListsWithCounts] = useState<ListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { 
    lists, 
    setLists, 
    addList, 
    updateList: updateListStore, 
    deleteList: deleteListStore,
    selectedListId,
    setSelectedListId,
    getListById,
    getDefaultList,
  } = useListStore();
  
  // Fetch lists
  const fetchListsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchLists();
      setListsWithCounts(data);
      setLists(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch lists'));
    } finally {
      setIsLoading(false);
    }
  }, [setLists]);
  
  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchListsData();
    }
  }, [autoFetch, fetchListsData]);
  
  // Create list with optimistic update
  const createList = useCallback(async (listData: CreateListRequest): Promise<List> => {
    const tempId = `temp-${Date.now()}`;
    const optimisticList: List = {
      id: tempId,
      name: listData.name,
      color: listData.color || '#3b82f6',
      emoji: listData.emoji || '📋',
      position: lists.length,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Optimistic update
    addList(optimisticList);
    
    try {
      const newList = await createListRequest(listData);
      
      // Replace optimistic list with real one
      useListStore.setState((state) => ({
        lists: state.lists.map((l) => (l.id === tempId ? newList : l)),
      }));
      
      return newList;
    } catch (err) {
      // Revert optimistic update
      useListStore.setState((state) => ({
        lists: state.lists.filter((l) => l.id !== tempId),
      }));
      throw err;
    }
  }, [lists, addList]);
  
  // Update list with optimistic update
  const updateList = useCallback(async (
    id: string, 
    updates: UpdateListRequest
  ): Promise<List> => {
    // Store previous state for rollback
    const previousList = lists.find((l) => l.id === id);
    
    // Optimistic update
    updateListStore(id, updates);
    
    try {
      const updatedList = await updateListRequest(id, updates);
      updateListStore(id, updatedList);
      return updatedList;
    } catch (err) {
      // Revert on error
      if (previousList) {
        updateListStore(id, previousList);
      }
      throw err;
    }
  }, [lists, updateListStore]);
  
  // Delete list with optimistic update
  const deleteList = useCallback(async (id: string): Promise<void> => {
    // Check if it's the default list
    const list = lists.find((l) => l.id === id);
    if (list?.is_default) {
      throw new Error('Cannot delete the default list');
    }
    
    // Store previous state for rollback
    const previousList = lists.find((l) => l.id === id);
    
    // Optimistic update
    deleteListStore(id);
    
    try {
      await deleteListRequest(id);
    } catch (err) {
      // Revert on error
      if (previousList) {
        addList(previousList);
      }
      throw err;
    }
  }, [lists, deleteListStore, addList]);
  
  // Reorder lists
  const reorderLists = useCallback(async (listIds: string[]): Promise<void> => {
    // Store previous state
    const previousLists = [...lists];
    
    // Optimistic update - update positions
    const reorderedLists = listIds.map((id, index) => {
      const list = lists.find((l) => l.id === id);
      return list ? { ...list, position: index } : null;
    }).filter(Boolean) as List[];
    
    setLists(reorderedLists);
    
    try {
      await reorderListsRequest(listIds);
    } catch (err) {
      // Revert on error
      setLists(previousLists);
      throw err;
    }
  }, [lists, setLists]);
  
  // Select list
  const selectList = useCallback((id: string | null) => {
    setSelectedListId(id);
  }, [setSelectedListId]);
  
  return {
    lists,
    listsWithCounts,
    isLoading,
    error,
    selectedListId,
    createList,
    updateList,
    deleteList,
    reorderLists,
    selectList,
    refetch: fetchListsData,
    getListById,
    getDefaultList,
  };
}

// ============================================
// SINGLE LIST HOOK
// ============================================

/**
 * Hook for single list operations
 */
export function useList(listId: string | null) {
  const list = useListStore((state) => 
    state.lists.find((l) => l.id === listId)
  );
  
  const updateListStore = useListStore((state) => state.updateList);
  const deleteListStore = useListStore((state) => state.deleteList);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchList = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/lists/${id}`);
      const data: ApiResponse<ListResponse> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to fetch list');
      }
      
      updateListStore(id, data.data);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch list'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateListStore]);
  
  useEffect(() => {
    if (listId && !list) {
      fetchList(listId);
    }
  }, [listId, list, fetchList]);
  
  return {
    list,
    isLoading,
    error,
    refetch: listId ? () => fetchList(listId) : undefined,
  };
}

// ============================================
// LIST COLORS HOOK
// ============================================

/**
 * Available list colors
 */
export const LIST_COLORS = [
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
 * Hook to get list color utilities
 */
export function useListColors() {
  const getColorByName = (name: string) => 
    LIST_COLORS.find((c) => c.name.toLowerCase() === name.toLowerCase());
  
  const getColorByValue = (value: string) => 
    LIST_COLORS.find((c) => c.value === value);
  
  const getTailwindClass = (colorValue: string) => 
    getColorByValue(colorValue)?.tailwind || 'bg-list-blue';
  
  return {
    colors: LIST_COLORS,
    getColorByName,
    getColorByValue,
    getTailwindClass,
  };
}
