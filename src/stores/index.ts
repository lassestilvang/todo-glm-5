/**
 * Global State Management
 * 
 * Zustand stores for managing application state:
 * - Task Store: Tasks CRUD, filters, view modes
 * - UI Store: Sidebar, theme, modals, search
 * - List Store: Lists management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, List, Label, ViewType, Priority, SortBy, SortOrder } from '@/types';

// ============================================
// TASK STORE
// ============================================

interface TaskFilter {
  isCompleted?: boolean;
  priority?: Priority;
  dueDateFrom?: string;
  dueDateTo?: string;
  labelIds?: string[];
}

interface TaskStore {
  // Data
  tasks: Task[];
  selectedTaskId: string | null;
  
  // Filters
  filters: TaskFilter;
  sortBy: SortBy;
  sortOrder: SortOrder;
  
  // View
  viewMode: ViewType;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  setSelectedTaskId: (id: string | null) => void;
  
  setFilters: (filters: Partial<TaskFilter>) => void;
  clearFilters: () => void;
  
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  
  setViewMode: (viewMode: ViewType) => void;
}

const initialTaskFilters: TaskFilter = {
  isCompleted: undefined,
  priority: undefined,
  dueDateFrom: undefined,
  dueDateTo: undefined,
  labelIds: undefined,
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      // Initial state
      tasks: [],
      selectedTaskId: null,
      filters: initialTaskFilters,
      sortBy: 'DUE_DATE' as SortBy,
      sortOrder: 'ASC' as SortOrder,
      viewMode: 'TODAY' as ViewType,
      
      // Actions
      setTasks: (tasks) => set({ tasks }),
      
      addTask: (task) => set((state) => ({ 
        tasks: [...state.tasks, task] 
      })),
      
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        ),
      })),
      
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
      })),
      
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),
      
      clearFilters: () => set({ filters: initialTaskFilters }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: 'task-store',
      partialize: (state) => ({
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        viewMode: state.viewMode,
      }),
    }
  )
);

// ============================================
// UI STORE
// ============================================

interface UIStore {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Modals
  isTaskEditorOpen: boolean;
  isListEditorOpen: boolean;
  isSettingsOpen: boolean;
  
  // Search
  isSearchOpen: boolean;
  
  // Mobile
  isMobileMenuOpen: boolean;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  openTaskEditor: () => void;
  closeTaskEditor: () => void;
  
  openListEditor: () => void;
  closeListEditor: () => void;
  
  openSettings: () => void;
  closeSettings: () => void;
  
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      sidebarWidth: 280,
      theme: 'system',
      
      isTaskEditorOpen: false,
      isListEditorOpen: false,
      isSettingsOpen: false,
      isSearchOpen: false,
      isMobileMenuOpen: false,
      
      // Actions
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      
      setTheme: (theme) => set({ theme }),
      
      openTaskEditor: () => set({ isTaskEditorOpen: true }),
      closeTaskEditor: () => set({ isTaskEditorOpen: false }),
      
      openListEditor: () => set({ isListEditorOpen: true }),
      closeListEditor: () => set({ isListEditorOpen: false }),
      
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      
      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),
      toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
      
      openMobileMenu: () => set({ isMobileMenuOpen: true }),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
      toggleMobileMenu: () => set((state) => ({ 
        isMobileMenuOpen: !state.isMobileMenuOpen 
      })),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        theme: state.theme,
      }),
    }
  )
);

// ============================================
// LIST STORE
// ============================================

interface ListStore {
  // Data
  lists: List[];
  selectedListId: string | null;
  
  // Actions
  setLists: (lists: List[]) => void;
  addList: (list: List) => void;
  updateList: (id: string, updates: Partial<List>) => void;
  deleteList: (id: string) => void;
  
  setSelectedListId: (id: string | null) => void;
  
  // Helpers
  getListById: (id: string) => List | undefined;
  getDefaultList: () => List | undefined;
}

export const useListStore = create<ListStore>()(
  persist(
    (set, get) => ({
      // Initial state
      lists: [],
      selectedListId: null,
      
      // Actions
      setLists: (lists) => set({ lists }),
      
      addList: (list) => set((state) => ({
        lists: [...state.lists, list],
      })),
      
      updateList: (id, updates) => set((state) => ({
        lists: state.lists.map((list) =>
          list.id === id ? { ...list, ...updates } : list
        ),
      })),
      
      deleteList: (id) => set((state) => ({
        lists: state.lists.filter((list) => list.id !== id),
        selectedListId: state.selectedListId === id ? null : state.selectedListId,
      })),
      
      setSelectedListId: (id) => set({ selectedListId: id }),
      
      // Helpers
      getListById: (id) => get().lists.find((list) => list.id === id),
      getDefaultList: () => get().lists.find((list) => list.is_default),
    }),
    {
      name: 'list-store',
    }
  )
);

// ============================================
// LABEL STORE
// ============================================

interface LabelStore {
  // Data
  labels: Label[];
  selectedLabelIds: string[];
  
  // Actions
  setLabels: (labels: Label[]) => void;
  addLabel: (label: Label) => void;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  deleteLabel: (id: string) => void;
  
  setSelectedLabelIds: (ids: string[]) => void;
  toggleLabelSelection: (id: string) => void;
  clearLabelSelection: () => void;
  
  // Helpers
  getLabelById: (id: string) => Label | undefined;
}

export const useLabelStore = create<LabelStore>()(
  persist(
    (set, get) => ({
      // Initial state
      labels: [],
      selectedLabelIds: [],
      
      // Actions
      setLabels: (labels) => set({ labels }),
      
      addLabel: (label) => set((state) => ({
        labels: [...state.labels, label],
      })),
      
      updateLabel: (id, updates) => set((state) => ({
        labels: state.labels.map((label) =>
          label.id === id ? { ...label, ...updates } : label
        ),
      })),
      
      deleteLabel: (id) => set((state) => ({
        labels: state.labels.filter((label) => label.id !== id),
        selectedLabelIds: state.selectedLabelIds.filter((labelId) => labelId !== id),
      })),
      
      setSelectedLabelIds: (ids) => set({ selectedLabelIds: ids }),
      
      toggleLabelSelection: (id) => set((state) => ({
        selectedLabelIds: state.selectedLabelIds.includes(id)
          ? state.selectedLabelIds.filter((labelId) => labelId !== id)
          : [...state.selectedLabelIds, id],
      })),
      
      clearLabelSelection: () => set({ selectedLabelIds: [] }),
      
      // Helpers
      getLabelById: (id) => get().labels.find((label) => label.id === id),
    }),
    {
      name: 'label-store',
    }
  )
);

// ============================================
// COMBINED STORE HOOKS
// ============================================

/**
 * Hook to get overdue task count
 */
export function useOverdueCount() {
  const tasks = useTaskStore((state) => state.tasks);
  const today = new Date().toISOString().split('T')[0];
  
  return tasks.filter(
    (task) => !task.is_completed && task.due_date && task.due_date < today
  ).length;
}

/**
 * Hook to get task counts by list
 */
export function useListTaskCounts() {
  const tasks = useTaskStore((state) => state.tasks);
  
  const counts: Record<string, { total: number; completed: number }> = {};
  
  tasks.forEach((task) => {
    if (!counts[task.list_id]) {
      counts[task.list_id] = { total: 0, completed: 0 };
    }
    counts[task.list_id].total++;
    if (task.is_completed) {
      counts[task.list_id].completed++;
    }
  });
  
  return counts;
}

/**
 * Hook to get today's task count
 */
export function useTodayTaskCount() {
  const tasks = useTaskStore((state) => state.tasks);
  const today = new Date().toISOString().split('T')[0];
  
  return tasks.filter(
    (task) => !task.is_completed && task.due_date === today
  ).length;
}

/**
 * Hook to get week's task count
 */
export function useWeekTaskCount() {
  const tasks = useTaskStore((state) => state.tasks);
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  
  const todayStr = today.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  
  return tasks.filter(
    (task) => !task.is_completed && task.due_date && 
      task.due_date >= todayStr && task.due_date <= weekEndStr
  ).length;
}
