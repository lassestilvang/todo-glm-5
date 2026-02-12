/**
 * ListNavItem Component
 * 
 * List navigation item with:
 * - Color dot and emoji
 * - Edit/Delete context menu
 * - Task count badge
 * - Drag and drop support
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUIStore, useListTaskCounts } from '@/stores';
import { useLists } from '@/hooks/useLists';
import { cn } from '@/lib/utils';
import type { List } from '@/types';

// ============================================
// TYPES
// ============================================

interface ListNavItemProps {
  list: List;
  isActive?: boolean;
  isCollapsed?: boolean;
  showTaskCount?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, list: List) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, list: List) => void;
}

// ============================================
// COMPONENT
// ============================================

export function ListNavItem({
  list,
  isActive = false,
  isCollapsed = false,
  showTaskCount = true,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
}: ListNavItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { openListEditor } = useUIStore();
  const { deleteList } = useLists();
  const taskCounts = useListTaskCounts();
  
  const count = taskCounts[list.id];
  const taskCount = count ? count.total - count.completed : 0;
  
  // Handle delete
  const handleDelete = useCallback(async () => {
    if (list.is_default) {
      return; // Can't delete default list
    }
    
    setIsDeleting(true);
    try {
      await deleteList(list.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete list:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [list.id, list.is_default, deleteList]);
  
  // Handle edit
  const handleEdit = useCallback(() => {
    openListEditor();
  }, [openListEditor]);
  
  // Collapsed state - icon only
  if (isCollapsed) {
    return (
      <Link
        href={`/list/${list.id}`}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg transition-colors mx-auto relative group',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'hover:bg-sidebar-accent/50'
        )}
        title={list.name}
      >
        <span className="text-lg">{list.emoji || '📋'}</span>
        
        {/* Task count indicator */}
        {showTaskCount && taskCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
            {taskCount > 99 ? '99+' : taskCount}
          </span>
        )}
      </Link>
    );
  }
  
  // Expanded state - full item
  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'hover:bg-sidebar-accent/50',
          draggable && 'cursor-grab active:cursor-grabbing'
        )}
        draggable={draggable}
        onDragStart={(e) => onDragStart?.(e, list)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(e, list)}
      >
        {/* Drag handle */}
        {draggable && (
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
        )}
        
        {/* Color dot */}
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: list.color }}
        />
        
        {/* Emoji */}
        <span className="text-base shrink-0">
          {list.emoji || '📋'}
        </span>
        
        {/* Name */}
        <Link
          href={`/list/${list.id}`}
          className="flex-1 truncate"
        >
          {list.name}
        </Link>
        
        {/* Task count */}
        {showTaskCount && taskCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {taskCount}
          </span>
        )}
        
        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            
            {!list.is_default && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete list?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the list "{list.name}" and all its tasks.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================
// LIST NAV ITEM SKELETON
// ============================================

export function ListNavItemSkeleton() {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
      <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
      <div className="h-4 w-4 rounded bg-muted animate-pulse" />
      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
    </div>
  );
}

// ============================================
// ADD LIST BUTTON
// ============================================

interface AddListButtonProps {
  onClick: () => void;
  isCollapsed?: boolean;
}

export function AddListButton({ onClick, isCollapsed = false }: AddListButtonProps) {
  if (isCollapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className="h-9 w-9 mx-auto"
        title="Add list"
      >
        <span className="text-lg">+</span>
      </Button>
    );
  }
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
        'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50',
        'transition-colors'
      )}
    >
      <span className="h-2 w-2 rounded-full border border-dashed border-muted-foreground" />
      <span>Add list</span>
    </button>
  );
}

// ============================================
// DRAGGABLE LIST NAV
// ============================================

interface DraggableListNavProps {
  lists: List[];
  activeListId?: string | null;
  onReorder?: (listIds: string[]) => void;
}

export function DraggableListNav({ 
  lists, 
  activeListId,
  onReorder 
}: DraggableListNavProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  
  const handleDragStart = useCallback((e: React.DragEvent, list: List) => {
    setDraggedId(list.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent, targetList: List) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetList.id) {
      return;
    }
    
    // Reorder lists
    const newLists = [...lists];
    const draggedIndex = newLists.findIndex((l) => l.id === draggedId);
    const targetIndex = newLists.findIndex((l) => l.id === targetList.id);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedList] = newLists.splice(draggedIndex, 1);
      newLists.splice(targetIndex, 0, draggedList);
      
      onReorder?.(newLists.map((l) => l.id));
    }
    
    setDraggedId(null);
    setDragOverId(null);
  }, [draggedId, lists, onReorder]);
  
  return (
    <div className="space-y-0.5">
      {lists.map((list) => (
        <motion.div
          key={list.id}
          layout
          layoutId={list.id}
          className={cn(
            dragOverId === list.id && 'ring-2 ring-primary ring-offset-1'
          )}
        >
          <ListNavItem
            list={list}
            isActive={activeListId === list.id}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </motion.div>
      ))}
    </div>
  );
}
