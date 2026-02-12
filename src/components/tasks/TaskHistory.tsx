/**
 * TaskHistory Component
 * 
 * Timeline of task changes with:
 * - Action type display
 * - What changed
 * - When
 * - User-friendly diff
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Edit3,
  Plus,
  Trash2,
  RotateCcw,
  History,
  Calendar,
  Flag,
  Tag,
  List,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskAction, type TaskHistory as TaskHistoryType } from '@/types';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

interface TaskHistoryProps extends WithClassName {
  taskId: string;
  history: TaskHistoryType[];
}

// ============================================
// ACTION CONFIG
// ============================================

const ACTION_CONFIG = {
  [TaskAction.CREATED]: {
    label: 'Created',
    icon: Plus,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  [TaskAction.UPDATED]: {
    label: 'Updated',
    icon: Edit3,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  [TaskAction.COMPLETED]: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  [TaskAction.UNCOMPLETED]: {
    label: 'Reopened',
    icon: Circle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  [TaskAction.DELETED]: {
    label: 'Deleted',
    icon: Trash2,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  [TaskAction.RESTORED]: {
    label: 'Restored',
    icon: RotateCcw,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
} as const;

// ============================================
// FIELD LABELS
// ============================================

const FIELD_LABELS: Record<string, { label: string; icon?: React.ElementType }> = {
  name: { label: 'Name', icon: Edit3 },
  description: { label: 'Description', icon: Edit3 },
  due_date: { label: 'Due date', icon: Calendar },
  due_time: { label: 'Due time', icon: Clock },
  deadline: { label: 'Deadline', icon: Calendar },
  priority: { label: 'Priority', icon: Flag },
  estimate_minutes: { label: 'Estimate', icon: Clock },
  actual_minutes: { label: 'Actual time', icon: Clock },
  list_id: { label: 'List', icon: List },
  recurrence_type: { label: 'Recurrence', icon: Calendar },
  is_completed: { label: 'Status', icon: CheckCircle2 },
};

// ============================================
// TIME FORMATTING
// ============================================

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ============================================
// FORMAT VALUE
// ============================================

function formatValue(value: unknown, field: string): string {
  if (value === null || value === undefined) {
    return 'None';
  }
  
  switch (field) {
    case 'priority':
      const priorityMap: Record<number, string> = {
        0: 'None',
        1: 'Low',
        2: 'Medium',
        3: 'High',
        4: 'Urgent',
      };
      return priorityMap[value as number] || String(value);
      
    case 'is_completed':
      return value ? 'Completed' : 'Active';
      
    case 'due_date':
    case 'deadline':
      if (typeof value === 'string') {
        return new Date(value).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return String(value);
      
    case 'estimate_minutes':
    case 'actual_minutes':
      const mins = value as number;
      if (mins < 60) return `${mins}m`;
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
      
    default:
      return String(value);
  }
}

// ============================================
// COMPONENT
// ============================================

export function TaskHistory({ taskId, history, className }: TaskHistoryProps) {
  // Sort history by date (newest first)
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [history]
  );
  
  // Empty state
  if (sortedHistory.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No history yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Changes to this task will appear here
        </p>
      </div>
    );
  }
  
  return (
    <ScrollArea className={cn('h-[400px]', className)}>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        
        {/* History items */}
        <div className="space-y-4">
          {sortedHistory.map((item, index) => {
            const config = ACTION_CONFIG[item.action] || ACTION_CONFIG[TaskAction.UPDATED];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-10"
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-2 top-1 h-4 w-4 rounded-full flex items-center justify-center',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('h-2.5 w-2.5', config.color)} />
                </div>
                
                {/* Content */}
                <div className="bg-muted/30 rounded-lg p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {config.label}
                    </Badge>
                    <span
                      className="text-xs text-muted-foreground"
                      title={formatDateTime(item.created_at)}
                    >
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                  
                  {/* Changes */}
                  {item.changes && Object.keys(item.changes).length > 0 && (
                    <div className="space-y-1 mt-2">
                      {Object.entries(item.changes).map(([field, change]) => {
                        const fieldConfig = FIELD_LABELS[field] || { label: field };
                        const FieldIcon = fieldConfig.icon;
                        
                        return (
                          <div
                            key={field}
                            className="text-xs bg-background/50 rounded p-2"
                          >
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              {FieldIcon && <FieldIcon className="h-3 w-3" />}
                              <span>{fieldConfig.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-red-500/80 line-through">
                                {formatValue((change as { old: unknown }).old, field)}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-green-500/80">
                                {formatValue((change as { new: unknown }).new, field)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================
// HISTORY ITEM COMPONENT
// ============================================

interface HistoryItemProps {
  action: TaskAction;
  changes?: Record<string, { old: unknown; new: unknown }> | null;
  createdAt: string;
}

export function HistoryItem({ action, changes, createdAt }: HistoryItemProps) {
  const config = ACTION_CONFIG[action] || ACTION_CONFIG[TaskAction.UPDATED];
  const Icon = config.icon;
  
  return (
    <div className="relative pl-10">
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-2 top-1 h-4 w-4 rounded-full flex items-center justify-center',
          config.bgColor
        )}
      >
        <Icon className={cn('h-2.5 w-2.5', config.color)} />
      </div>
      
      {/* Content */}
      <div className="bg-muted/30 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {config.label}
          </Badge>
          <span
            className="text-xs text-muted-foreground"
            title={formatDateTime(createdAt)}
          >
            {formatRelativeTime(createdAt)}
          </span>
        </div>
        
        {changes && Object.keys(changes).length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {Object.keys(changes).length} field(s) changed
          </div>
        )}
      </div>
    </div>
  );
}
