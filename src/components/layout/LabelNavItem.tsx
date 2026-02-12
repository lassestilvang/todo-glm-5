/**
 * LabelNavItem Component
 * 
 * Label navigation item with:
 * - Emoji and color
 * - Task count badge
 * - Edit/Delete context menu
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
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
import { useUIStore } from '@/stores';
import { useLabels } from '@/hooks/useLabels';
import { cn } from '@/lib/utils';
import type { Label } from '@/types';

// ============================================
// TYPES
// ============================================

interface LabelNavItemProps {
  label: Label;
  isActive?: boolean;
  isCollapsed?: boolean;
  taskCount?: number;
}

// ============================================
// COMPONENT
// ============================================

export function LabelNavItem({
  label,
  isActive = false,
  isCollapsed = false,
  taskCount = 0,
}: LabelNavItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // We'll need a label editor in the UI store
  // For now, we'll use a placeholder
  const { deleteLabel } = useLabels();
  
  // Handle delete
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteLabel(label.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete label:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [label.id, deleteLabel]);
  
  // Collapsed state - icon only
  if (isCollapsed) {
    return (
      <Link
        href={`/search?label=${label.id}`}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg transition-colors mx-auto relative group',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'hover:bg-sidebar-accent/50'
        )}
        title={label.name}
      >
        <span className="text-lg">{label.emoji || '🏷️'}</span>
        
        {/* Task count indicator */}
        {taskCount > 0 && (
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
            : 'hover:bg-sidebar-accent/50'
        )}
      >
        {/* Color indicator */}
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: label.color }}
        />
        
        {/* Emoji */}
        <span className="text-base shrink-0">
          {label.emoji || '🏷️'}
        </span>
        
        {/* Name */}
        <Link
          href={`/search?label=${label.id}`}
          className="flex-1 truncate"
        >
          {label.name}
        </Link>
        
        {/* Task count */}
        {taskCount > 0 && (
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
            <DropdownMenuItem disabled>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete label?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the label "{label.name}". Tasks with this label
              will not be deleted. This action cannot be undone.
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
// LABEL NAV ITEM SKELETON
// ============================================

export function LabelNavItemSkeleton() {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
      <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
      <div className="h-4 w-4 rounded bg-muted animate-pulse" />
      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
    </div>
  );
}

// ============================================
// LABEL BADGE (for use in task items)
// ============================================

interface LabelBadgeProps {
  label: Label;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

export function LabelBadge({ label, size = 'sm', onClick }: LabelBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
        'bg-muted/50 hover:bg-muted',
        sizeClasses[size]
      )}
      style={{ 
        borderLeft: `2px solid ${label.color}`,
      }}
    >
      {label.emoji && <span>{label.emoji}</span>}
      <span>{label.name}</span>
    </button>
  );
}

// ============================================
// LABEL BADGE LIST
// ============================================

interface LabelBadgeListProps {
  labels: Label[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  onLabelClick?: (label: Label) => void;
}

export function LabelBadgeList({ 
  labels, 
  maxVisible = 3,
  size = 'sm',
  onLabelClick 
}: LabelBadgeListProps) {
  const visibleLabels = labels.slice(0, maxVisible);
  const remainingCount = labels.length - maxVisible;
  
  if (labels.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleLabels.map((label) => (
        <LabelBadge
          key={label.id}
          label={label}
          size={size}
          onClick={() => onLabelClick?.(label)}
        />
      ))}
      
      {remainingCount > 0 && (
        <span className={cn(
          'inline-flex items-center rounded-full bg-muted/50',
          size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'
        )}>
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

// ============================================
// LABEL PICKER (for selecting labels)
// ============================================

interface LabelPickerProps {
  labels: Label[];
  selectedIds: string[];
  onToggle: (labelId: string) => void;
  onCreate?: (name: string) => void;
}

export function LabelPicker({ 
  labels, 
  selectedIds, 
  onToggle,
  onCreate 
}: LabelPickerProps) {
  return (
    <div className="space-y-1">
      {labels.map((label) => {
        const isSelected = selectedIds.includes(label.id);
        
        return (
          <button
            key={label.id}
            onClick={() => onToggle(label.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
              isSelected
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted'
            )}
          >
            {/* Checkbox indicator */}
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded border',
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground'
              )}
            >
              {isSelected && (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
            
            {/* Color dot */}
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            
            {/* Emoji */}
            {label.emoji && (
              <span className="text-base">{label.emoji}</span>
            )}
            
            {/* Name */}
            <span className="flex-1 truncate text-left">{label.name}</span>
          </button>
        );
      })}
      
      {labels.length === 0 && (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">
          No labels available
        </p>
      )}
    </div>
  );
}
