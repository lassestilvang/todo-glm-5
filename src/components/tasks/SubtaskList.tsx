/**
 * SubtaskList Component
 * 
 * List of subtasks within an expanded task with:
 * - Inline editing
 * - Checkbox for each subtask
 * - Add new subtask inline
 * - Drag to reorder
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, GripVertical, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Subtask } from '@/types';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

interface SubtaskListProps extends WithClassName {
  taskId: string;
  subtasks: Subtask[];
  onAdd: (name: string) => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onReorder?: (subtasks: Subtask[]) => void;
  readOnly?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function SubtaskList({
  taskId,
  subtasks,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  onReorder,
  readOnly = false,
  className,
}: SubtaskListProps) {
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle add subtask
  const handleAdd = useCallback(() => {
    const name = newSubtaskName.trim();
    if (name) {
      onAdd(name);
      setNewSubtaskName('');
      inputRef.current?.focus();
    }
  }, [newSubtaskName, onAdd]);
  
  // Handle key down for add input
  const handleAddKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      } else if (e.key === 'Escape') {
        setNewSubtaskName('');
      }
    },
    [handleAdd]
  );
  
  // Start editing
  const startEditing = useCallback((subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditValue(subtask.name);
  }, []);
  
  // Save edit
  const saveEdit = useCallback(() => {
    const name = editValue.trim();
    if (editingId && name) {
      onUpdate(editingId, name);
    }
    setEditingId(null);
    setEditValue('');
  }, [editingId, editValue, onUpdate]);
  
  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue('');
  }, []);
  
  // Handle key down for edit input
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit]
  );
  
  // Handle reorder
  const handleReorder = useCallback(
    (newOrder: Subtask[]) => {
      if (onReorder) {
        onReorder(newOrder);
      }
    },
    [onReorder]
  );
  
  // Progress
  const completedCount = subtasks.filter((s) => s.is_completed).length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  return (
    <div className={cn('space-y-1', className)}>
      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Subtasks</span>
            <span>{completedCount}/{totalCount}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}
      
      {/* Subtask list */}
      {onReorder ? (
        <Reorder.Group
          axis="y"
          values={subtasks}
          onReorder={handleReorder}
          className="space-y-0.5"
        >
          {subtasks.map((subtask) => (
            <Reorder.Item
              key={subtask.id}
              value={subtask}
              className="list-none"
            >
              <SubtaskItem
                subtask={subtask}
                isEditing={editingId === subtask.id}
                editValue={editValue}
                onToggle={() => onToggle(subtask.id)}
                onStartEdit={() => startEditing(subtask)}
                onEditValueChange={setEditValue}
                onEditKeyDown={handleEditKeyDown}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onDelete={() => onDelete(subtask.id)}
                readOnly={readOnly}
                showDragHandle
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="space-y-0.5">
          {subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              isEditing={editingId === subtask.id}
              editValue={editValue}
              onToggle={() => onToggle(subtask.id)}
              onStartEdit={() => startEditing(subtask)}
              onEditValueChange={setEditValue}
              onEditKeyDown={handleEditKeyDown}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              onDelete={() => onDelete(subtask.id)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
      
      {/* Add new subtask */}
      {!readOnly && (
        <div className="flex items-center gap-2 mt-2">
          <div className="h-4 w-4" /> {/* Spacer for checkbox alignment */}
          <Input
            ref={inputRef}
            value={newSubtaskName}
            onChange={(e) => setNewSubtaskName(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="Add subtask..."
            className="h-8 text-sm border-none shadow-none focus-visible:ring-0 px-0"
          />
          {newSubtaskName.trim() && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleAdd}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// SUBTASK ITEM
// ============================================

interface SubtaskItemProps {
  subtask: Subtask;
  isEditing: boolean;
  editValue: string;
  onToggle: () => void;
  onStartEdit: () => void;
  onEditValueChange: (value: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
  showDragHandle?: boolean;
}

function SubtaskItem({
  subtask,
  isEditing,
  editValue,
  onToggle,
  onStartEdit,
  onEditValueChange,
  onEditKeyDown,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  readOnly = false,
  showDragHandle = false,
}: SubtaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        'group flex items-center gap-2 py-1 px-1 rounded',
        'hover:bg-muted/50 transition-colors',
        subtask.is_completed && 'opacity-60'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag handle */}
      {showDragHandle && !readOnly && (
        <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}
      
      {/* Checkbox */}
      <Checkbox
        checked={subtask.is_completed}
        onCheckedChange={onToggle}
        disabled={readOnly}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        aria-label={subtask.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
      />
      
      {/* Name */}
      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={onEditKeyDown}
          onBlur={onSaveEdit}
          className="h-7 text-sm flex-1"
          autoFocus
        />
      ) : (
        <span
          className={cn(
            'flex-1 text-sm cursor-pointer',
            subtask.is_completed && 'line-through text-muted-foreground'
          )}
          onClick={readOnly ? undefined : onStartEdit}
        >
          {subtask.name}
        </span>
      )}
      
      {/* Actions */}
      <AnimatePresence>
        {isHovered && !readOnly && !isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-0.5"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onDelete}
              aria-label="Delete subtask"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// SUBTASK LIST SKELETON
// ============================================

export function SubtaskListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 py-1 animate-pulse"
        >
          <div className="h-4 w-4 rounded border bg-muted" />
          <div className="h-4 bg-muted rounded flex-1" />
        </div>
      ))}
    </div>
  );
}
