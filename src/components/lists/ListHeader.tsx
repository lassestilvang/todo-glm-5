/**
 * ListHeader Component
 * 
 * Header shown at top of list view with list info and actions.
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColorDot } from '@/components/common/ColorDot';
import { MoreHorizontal, Settings, Trash2 } from 'lucide-react';
import type { List } from '@/types';

export interface ListHeaderProps {
  /** The list to display */
  list: List;
  /** Number of tasks in the list */
  taskCount: number;
  /** Callback when settings is clicked */
  onSettings: () => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function ListHeader({
  list,
  taskCount,
  onSettings,
  onDelete,
  className,
}: ListHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* List Info */}
      <div className="flex items-center gap-3">
        {/* Emoji Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: list.color + '20' }}
        >
          {list.emoji || '📋'}
        </div>
        
        {/* Name and Count */}
        <div>
          <div className="flex items-center gap-2">
            <ColorDot color={list.color} size="sm" />
            <h1 className="text-xl font-semibold">{list.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </p>
        </div>
      </div>
      
      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">List actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
          
          {!list.is_default && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete List
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
