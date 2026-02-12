/**
 * TaskQuickAdd Component
 * 
 * Inline quick add input at top of task list with:
 * - Natural language parsing hint
 * - Quick date picker
 * - Quick priority selector
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronDown,
  Plus,
  Send,
  X,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Priority, type CreateTaskRequest, type Priority as PriorityType } from '@/types';
import { PriorityBadge, PRIORITY_CONFIG } from './PriorityBadge';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

interface TaskQuickAddProps extends WithClassName {
  listId?: string;
  onAdd: (task: CreateTaskRequest) => void;
  defaultListId?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

// ============================================
// QUICK DATE OPTIONS
// ============================================

const QUICK_DATES = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'Next week', value: 'nextWeek' },
  { label: 'No date', value: 'none' },
] as const;

function getQuickDate(value: string): string | undefined {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (value) {
    case 'today':
      return today.toISOString().split('T')[0];
    case 'tomorrow': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    case 'nextWeek': {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }
    case 'none':
      return undefined;
    default:
      return undefined;
  }
}

function formatDateLabel(date: string | undefined): string {
  if (!date) return '';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  if (targetDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (targetDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }
  
  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================
// COMPONENT
// ============================================

export function TaskQuickAdd({
  listId,
  onAdd,
  defaultListId,
  placeholder = 'Add a task...',
  autoFocus = false,
  className,
}: TaskQuickAddProps) {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [priority, setPriority] = useState<Priority>(Priority.NONE);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Handle submit
  const handleSubmit = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    
    onAdd({
      list_id: listId || defaultListId || '',
      name: trimmedName,
      due_date: dueDate,
      priority: priority === Priority.NONE ? undefined : priority,
    });
    
    // Reset form
    setName('');
    setDueDate(undefined);
    setPriority(Priority.NONE);
    setIsExpanded(false);
    
    // Keep focus on input
    inputRef.current?.focus();
  }, [name, listId, defaultListId, dueDate, priority, onAdd]);
  
  // Handle key down
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        setName('');
        setDueDate(undefined);
        setPriority(Priority.NONE);
        setIsExpanded(false);
      }
    },
    [handleSubmit]
  );
  
  // Handle quick date select
  const handleQuickDateSelect = useCallback((value: string) => {
    setDueDate(getQuickDate(value));
    setIsDatePickerOpen(false);
  }, []);
  
  // Handle calendar date select
  const handleCalendarSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setDueDate(date.toISOString().split('T')[0]);
    } else {
      setDueDate(undefined);
    }
    setIsDatePickerOpen(false);
  }, []);
  
  // Handle priority select
  const handlePrioritySelect = useCallback((value: Priority) => {
    setPriority(value);
    setIsPriorityOpen(false);
  }, []);
  
  // Clear date
  const clearDate = useCallback(() => {
    setDueDate(undefined);
  }, []);
  
  // Clear priority
  const clearPriority = useCallback(() => {
    setPriority(Priority.NONE);
  }, []);
  
  // Expand on focus
  const handleFocus = useCallback(() => {
    setIsExpanded(true);
  }, []);
  
  const hasOptions = dueDate || priority !== Priority.NONE;
  
  return (
    <motion.div
      initial={false}
      animate={{ height: isExpanded ? 'auto' : 'auto' }}
      className={cn(
        'bg-background border rounded-lg',
        isExpanded && 'shadow-sm',
        className
      )}
    >
      {/* Main input row */}
      <div className="flex items-center gap-2 p-2">
        <div className="flex-1 flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
          
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            className="border-none shadow-none focus-visible:ring-0 px-0 h-8"
          />
        </div>
        
        {/* Quick actions */}
        <AnimatePresence>
          {name.trim() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1"
            >
              {/* Date picker */}
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 gap-1',
                      dueDate && 'text-primary'
                    )}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {dueDate && (
                      <span className="text-xs">{formatDateLabel(dueDate)}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="space-y-2">
                    {/* Quick dates */}
                    <div className="flex flex-wrap gap-1">
                      {QUICK_DATES.map((option) => (
                        <Button
                          key={option.value}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleQuickDateSelect(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Calendar */}
                    <CalendarComponent
                      mode="single"
                      selected={dueDate ? new Date(dueDate) : undefined}
                      onSelect={handleCalendarSelect}
                      className="rounded-md border"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Priority picker */}
              <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 gap-1',
                      priority !== Priority.NONE && 'text-primary'
                    )}
                  >
                    <span className="text-sm">
                      {PRIORITY_CONFIG[priority].icon}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1" align="end">
                  <div className="space-y-0.5">
                    {[Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT].map((p) => (
                      <Button
                        key={p}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'w-full justify-start gap-2',
                          priority === p && 'bg-muted'
                        )}
                        onClick={() => handlePrioritySelect(p)}
                      >
                        <span className={PRIORITY_CONFIG[p].color}>
                          {PRIORITY_CONFIG[p].icon}
                        </span>
                        <span className="text-xs">{PRIORITY_CONFIG[p].label}</span>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Submit button */}
              <Button
                size="sm"
                className="h-7 gap-1"
                onClick={handleSubmit}
              >
                <Send className="h-3.5 w-3.5" />
                <span className="sr-only">Add task</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Selected options display */}
      <AnimatePresence>
        {isExpanded && hasOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-1 px-2 pb-2">
              {dueDate && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {formatDateLabel(dueDate)}
                  <button
                    onClick={clearDate}
                    className="ml-1 hover:text-destructive"
                    aria-label="Clear date"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {priority !== Priority.NONE && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <span className={PRIORITY_CONFIG[priority].color}>
                    {PRIORITY_CONFIG[priority].icon}
                  </span>
                  {PRIORITY_CONFIG[priority].label}
                  <button
                    onClick={clearPriority}
                    className="ml-1 hover:text-destructive"
                    aria-label="Clear priority"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// COMPACT QUICK ADD
// ============================================

interface TaskQuickAddCompactProps extends WithClassName {
  listId?: string;
  onAdd: (task: CreateTaskRequest) => void;
  defaultListId?: string;
  placeholder?: string;
}

export function TaskQuickAddCompact({
  listId,
  onAdd,
  defaultListId,
  placeholder = 'Add task...',
  className,
}: TaskQuickAddCompactProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    
    onAdd({
      list_id: listId || defaultListId || '',
      name: trimmedName,
    });
    
    setName('');
    inputRef.current?.focus();
  }, [name, listId, defaultListId, onAdd]);
  
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="border-none shadow-none focus-visible:ring-0 px-0 h-8 flex-1"
      />
      {name.trim() && (
        <Button size="sm" className="h-7" onClick={handleSubmit}>
          Add
        </Button>
      )}
    </div>
  );
}
