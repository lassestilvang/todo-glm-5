/**
 * TaskFilters Component
 * 
 * Filter dropdown for task list with:
 * - Filter by: Priority, Labels, Date range, Completion status
 * - Sort by: Due date, Priority, Created date, Name
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  X,
  ChevronDown,
  SortAsc,
  SortDesc,
  Calendar,
  Flag,
  Tag,
  CheckCircle2,
  Circle,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label as FormLabel } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Priority, SortBy, SortOrder, type Priority as PriorityType, type Label } from '@/types';
import { PRIORITY_CONFIG } from './PriorityBadge';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

export interface TaskFilterOptions {
  priority?: Priority;
  labelIds?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  isCompleted?: boolean;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

interface TaskFiltersProps extends WithClassName {
  filters: TaskFilterOptions;
  onFiltersChange: (filters: TaskFilterOptions) => void;
  labels?: Label[];
  showSort?: boolean;
  showCompletionFilter?: boolean;
}

// ============================================
// SORT OPTIONS
// ============================================

const SORT_OPTIONS = [
  { value: SortBy.DUE_DATE, label: 'Due date' },
  { value: SortBy.PRIORITY, label: 'Priority' },
  { value: SortBy.CREATED_AT, label: 'Created date' },
  { value: SortBy.NAME, label: 'Name' },
] as const;

// ============================================
// COMPONENT
// ============================================

export function TaskFilters({
  filters,
  onFiltersChange,
  labels = [],
  showSort = true,
  showCompletionFilter = true,
  className,
}: TaskFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  
  // Update a single filter
  const updateFilter = useCallback(
    <K extends keyof TaskFilterOptions>(key: K, value: TaskFilterOptions[K]) => {
      onFiltersChange({
        ...filters,
        [key]: value,
      });
    },
    [filters, onFiltersChange]
  );
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    onFiltersChange({
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
  }, [filters.sortBy, filters.sortOrder, onFiltersChange]);
  
  // Toggle label
  const toggleLabel = useCallback(
    (labelId: string) => {
      const currentLabelIds = filters.labelIds || [];
      const newLabelIds = currentLabelIds.includes(labelId)
        ? currentLabelIds.filter((id) => id !== labelId)
        : [...currentLabelIds, labelId];
      
      updateFilter('labelIds', newLabelIds.length > 0 ? newLabelIds : undefined);
    },
    [filters.labelIds, updateFilter]
  );
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priority !== undefined) count++;
    if (filters.labelIds && filters.labelIds.length > 0) count++;
    if (filters.dueDateFrom || filters.dueDateTo) count++;
    if (filters.isCompleted !== undefined) count++;
    return count;
  }, [filters]);
  
  // Format date range
  const dateRangeLabel = useMemo(() => {
    if (!filters.dueDateFrom && !filters.dueDateTo) return null;
    
    if (filters.dueDateFrom && filters.dueDateTo) {
      return `${filters.dueDateFrom} - ${filters.dueDateTo}`;
    }
    
    if (filters.dueDateFrom) {
      return `From ${filters.dueDateFrom}`;
    }
    
    return `Until ${filters.dueDateTo}`;
  }, [filters.dueDateFrom, filters.dueDateTo]);
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Sort dropdown */}
      {showSort && (
        <div className="flex items-center gap-1">
          <Select
            value={filters.sortBy || SortBy.DUE_DATE}
            onValueChange={(value) => updateFilter('sortBy', value as SortBy)}
          >
            <SelectTrigger size="sm" className="w-32">
              <SortAsc className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              updateFilter(
                'sortOrder',
                filters.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
              )
            }
            aria-label={filters.sortOrder === SortOrder.ASC ? 'Sort descending' : 'Sort ascending'}
          >
            {filters.sortOrder === SortOrder.ASC ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
      
      {/* Filter button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Filters</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={clearFilters}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            
            {/* Priority filter */}
            <div className="space-y-2">
              <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                <Flag className="h-3 w-3" />
                Priority
              </FormLabel>
              <div className="flex flex-wrap gap-1">
                {[Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT].map((p) => (
                  <Button
                    key={p}
                    variant={filters.priority === p ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() =>
                      updateFilter('priority', filters.priority === p ? undefined : p)
                    }
                  >
                    <span className={PRIORITY_CONFIG[p].color}>
                      {PRIORITY_CONFIG[p].icon}
                    </span>
                    {PRIORITY_CONFIG[p].label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Completion status filter */}
            {showCompletionFilter && (
              <div className="space-y-2">
                <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Status
                </FormLabel>
                <div className="flex gap-1">
                  <Button
                    variant={filters.isCompleted === undefined ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateFilter('isCompleted', undefined)}
                  >
                    All
                  </Button>
                  <Button
                    variant={filters.isCompleted === false ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => updateFilter('isCompleted', false)}
                  >
                    <Circle className="h-3 w-3" />
                    Active
                  </Button>
                  <Button
                    variant={filters.isCompleted === true ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => updateFilter('isCompleted', true)}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Done
                  </Button>
                </div>
              </div>
            )}
            
            {/* Labels filter */}
            {labels.length > 0 && (
              <div className="space-y-2">
                <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Labels
                </FormLabel>
                <div className="flex flex-wrap gap-1">
                  {labels.map((label) => (
                    <Button
                      key={label.id}
                      variant={
                        filters.labelIds?.includes(label.id) ? 'default' : 'outline'
                      }
                      size="sm"
                      className="h-7 text-xs"
                      style={{
                        backgroundColor: filters.labelIds?.includes(label.id)
                          ? label.color
                          : undefined,
                        borderColor: label.color,
                        color: filters.labelIds?.includes(label.id)
                          ? 'white'
                          : undefined,
                      }}
                      onClick={() => toggleLabel(label.id)}
                    >
                      {label.emoji && <span className="mr-0.5">{label.emoji}</span>}
                      {label.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Date range filter */}
            <div className="space-y-2">
              <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due Date
              </FormLabel>
              <div className="flex gap-2">
                <Popover open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 justify-start text-xs">
                      {dateRangeLabel || 'Select date range'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">From</div>
                      <CalendarComponent
                        mode="single"
                        selected={
                          filters.dueDateFrom ? new Date(filters.dueDateFrom) : undefined
                        }
                        onSelect={(date) =>
                          updateFilter(
                            'dueDateFrom',
                            date ? date.toISOString().split('T')[0] : undefined
                          )
                        }
                        className="rounded-md border"
                      />
                      <div className="text-xs text-muted-foreground">To</div>
                      <CalendarComponent
                        mode="single"
                        selected={
                          filters.dueDateTo ? new Date(filters.dueDateTo) : undefined
                        }
                        onSelect={(date) =>
                          updateFilter(
                            'dueDateTo',
                            date ? date.toISOString().split('T')[0] : undefined
                          )
                        }
                        className="rounded-md border"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                
                {(filters.dueDateFrom || filters.dueDateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      updateFilter('dueDateFrom', undefined);
                      updateFilter('dueDateTo', undefined);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Active filter badges */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-1"
          >
            {filters.priority !== undefined && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Flag className="h-3 w-3" />
                {PRIORITY_CONFIG[filters.priority].label}
                <button
                  onClick={() => updateFilter('priority', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filters.isCompleted !== undefined && (
              <Badge variant="secondary" className="gap-1 text-xs">
                {filters.isCompleted ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Done
                  </>
                ) : (
                  <>
                    <Circle className="h-3 w-3" />
                    Active
                  </>
                )}
                <button
                  onClick={() => updateFilter('isCompleted', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// COMPACT FILTERS
// ============================================

interface TaskFiltersCompactProps extends WithClassName {
  filters: TaskFilterOptions;
  onFiltersChange: (filters: TaskFilterOptions) => void;
}

export function TaskFiltersCompact({
  filters,
  onFiltersChange,
  className,
}: TaskFiltersCompactProps) {
  const updateFilter = useCallback(
    <K extends keyof TaskFilterOptions>(key: K, value: TaskFilterOptions[K]) => {
      onFiltersChange({
        ...filters,
        [key]: value,
      });
    },
    [filters, onFiltersChange]
  );
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Completion toggle */}
      <Button
        variant={filters.isCompleted === false ? 'default' : 'ghost'}
        size="sm"
        className="h-7"
        onClick={() =>
          updateFilter(
            'isCompleted',
            filters.isCompleted === false ? undefined : false
          )
        }
      >
        Active
      </Button>
      <Button
        variant={filters.isCompleted === true ? 'default' : 'ghost'}
        size="sm"
        className="h-7"
        onClick={() =>
          updateFilter(
            'isCompleted',
            filters.isCompleted === true ? undefined : true
          )
        }
      >
        Done
      </Button>
    </div>
  );
}
