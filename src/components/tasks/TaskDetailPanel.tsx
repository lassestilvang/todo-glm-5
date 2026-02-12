/**
 * TaskDetailPanel Component
 * 
 * Slide-out panel showing full task details with:
 * - All task properties displayed
 * - Task history/change log
 * - Quick actions
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Edit3,
  Flag,
  List as ListIcon,
  Repeat,
  Tag,
  Timer,
  Trash2,
  X,
  CheckCircle2,
  Circle,
  FileText,
  History,
  ExternalLink,
  CalendarPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PriorityBadge, PRIORITY_CONFIG } from './PriorityBadge';
import { DurationDisplay } from './DurationPicker';
import { RecurrenceDisplay } from './RecurrencePicker';
import { TaskHistory } from './TaskHistory';
import { SubtaskList } from './SubtaskList';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type {
  Task,
  Subtask,
  Label,
  List,
  TaskHistory as TaskHistoryType,
  Priority,
} from '@/types';

// ============================================
// TYPES
// ============================================

interface TaskDetailPanelProps {
  task: Task | null;
  subtasks?: Subtask[];
  labels?: Label[];
  list?: List;
  history?: TaskHistoryType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleComplete?: () => void;
  onAddSubtask?: (name: string) => void;
  onToggleSubtask?: (subtaskId: string) => void;
  onUpdateSubtask?: (subtaskId: string, name: string) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
}

// ============================================
// DATE FORMATTING
// ============================================

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatDateTime(dateTimeStr: string): string {
  return new Date(dateTimeStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ============================================
// COMPONENT
// ============================================

export function TaskDetailPanel({
  task,
  subtasks = [],
  labels = [],
  list,
  history = [],
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onToggleComplete,
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}: TaskDetailPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  
  // Handle delete
  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete();
      setShowDeleteConfirm(false);
      onOpenChange(false);
    }
  }, [onDelete, onOpenChange]);
  
  // Calculate overdue status
  const isOverdue = useMemo(() => {
    if (!task || task.is_completed || !task.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }, [task]);
  
  if (!task) return null;
  
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <SheetHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <SheetTitle className="text-left line-clamp-2 pr-8">
                  {task.name}
                </SheetTitle>
              </div>
            </SheetHeader>
            
            {/* Quick actions */}
            <div className="flex items-center gap-2 px-4 pb-3">
              <Button
                variant={task.is_completed ? 'default' : 'outline'}
                size="sm"
                className="gap-1"
                onClick={onToggleComplete}
              >
                {task.is_completed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Completed
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4" />
                    Mark done
                  </>
                )}
              </Button>
              
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Tabs */}
            <div className="flex border-t">
              <button
                className={cn(
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  activeTab === 'details'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                className={cn(
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  activeTab === 'history'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setActiveTab('history')}
              >
                <History className="h-4 w-4 inline mr-1" />
                History
              </button>
            </div>
          </div>
          
          {/* Content */}
          <ScrollArea className="h-[calc(100vh-180px)]">
            <AnimatePresence mode="wait">
              {activeTab === 'details' ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-4 space-y-4"
                >
                  {/* List */}
                  {list && (
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: list.color }}
                      />
                      <span className="text-sm font-medium">{list.name}</span>
                      {list.emoji && <span>{list.emoji}</span>}
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* Due date & time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Due date
                      </h4>
                      {task.due_date ? (
                        <p className={cn('text-sm', isOverdue && 'text-red-500')}>
                          {formatDate(task.due_date)}
                          {isOverdue && <span className="ml-1">(Overdue)</span>}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No due date</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Due time
                      </h4>
                      {task.due_time ? (
                        <p className="text-sm">{formatTime(task.due_time)}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No time set</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Deadline */}
                  {task.deadline && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Deadline
                      </h4>
                      <p className="text-sm">{formatDate(task.deadline)}</p>
                    </div>
                  )}
                  
                  {/* Priority */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Flag className="h-3.5 w-3.5" />
                      Priority
                    </h4>
                    <PriorityBadge priority={task.priority} showLabel />
                  </div>
                  
                  {/* Time estimates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" />
                        Estimate
                      </h4>
                      {task.estimate_minutes ? (
                        <DurationDisplay minutes={task.estimate_minutes} />
                      ) : (
                        <p className="text-sm text-muted-foreground">Not set</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" />
                        Actual
                      </h4>
                      {task.actual_minutes ? (
                        <DurationDisplay minutes={task.actual_minutes} />
                      ) : (
                        <p className="text-sm text-muted-foreground">Not set</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Recurrence */}
                  {task.recurrence_type && task.recurrence_type !== 'NONE' && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Repeat className="h-3.5 w-3.5" />
                        Recurrence
                      </h4>
                      <RecurrenceDisplay
                        type={task.recurrence_type}
                        config={task.recurrence_config}
                      />
                    </div>
                  )}
                  
                  {/* Labels */}
                  {labels.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        Labels
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {labels.map((label) => (
                          <Badge
                            key={label.id}
                            variant="secondary"
                            style={{
                              backgroundColor: `${label.color}20`,
                              color: label.color,
                            }}
                          >
                            {label.emoji && <span className="mr-0.5">{label.emoji}</span>}
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* Subtasks */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Subtasks ({subtasks.filter((s) => s.is_completed).length}/{subtasks.length})
                    </h4>
                    {subtasks.length > 0 || onAddSubtask ? (
                      <SubtaskList
                        taskId={task.id}
                        subtasks={subtasks}
                        onAdd={onAddSubtask || (() => {})}
                        onToggle={onToggleSubtask || (() => {})}
                        onUpdate={onUpdateSubtask || (() => {})}
                        onDelete={onDeleteSubtask || (() => {})}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">No subtasks</p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Created: {formatDateTime(task.created_at)}</p>
                    <p>Updated: {formatDateTime(task.updated_at)}</p>
                    {task.completed_at && (
                      <p>Completed: {formatDateTime(task.completed_at)}</p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="p-4"
                >
                  <TaskHistory taskId={task.id} history={history} />
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      
      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete task?"
        description="This action cannot be undone. The task and all its subtasks will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
