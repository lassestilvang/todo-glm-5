/**
 * ListEditor Component
 * 
 * Dialog for creating/editing lists with name, color, and emoji fields.
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker } from './ColorPicker';
import { EmojiPicker } from './EmojiPicker';
import { ColorDot } from '@/components/common/ColorDot';
import { LIST_COLORS } from '@/hooks/useLists';
import type { List, CreateListRequest, UpdateListRequest } from '@/types';

export interface ListEditorProps {
  /** Existing list to edit (undefined for creating new) */
  list?: List;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when saving the list */
  onSave: (data: CreateListRequest | UpdateListRequest) => void;
}

const DEFAULT_COLOR = LIST_COLORS[9].value; // Blue
const DEFAULT_EMOJI = '📋';

export function ListEditor({ list, open, onOpenChange, onSave }: ListEditorProps) {
  const isEditing = !!list;
  
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [emoji, setEmoji] = useState<string>(DEFAULT_EMOJI);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  
  // Reset form when dialog opens/closes or list changes
  useEffect(() => {
    if (open) {
      if (list) {
        setName(list.name);
        setColor(list.color);
        setEmoji(list.emoji || DEFAULT_EMOJI);
      } else {
        setName('');
        setColor(DEFAULT_COLOR);
        setEmoji(DEFAULT_EMOJI);
      }
      setErrors({});
      setShowEmojiPicker(false);
    }
  }, [open, list]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Save
    if (isEditing) {
      onSave({
        name: name.trim(),
        color,
        emoji,
      } as UpdateListRequest);
    } else {
      onSave({
        name: name.trim(),
        color,
        emoji,
      } as CreateListRequest);
    }
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit List' : 'Create New List'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: color + '20' }}
            >
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <ColorDot color={color} size="sm" />
                <span className="font-medium truncate">
                  {name || 'List Name'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Preview of your list
              </p>
            </div>
          </div>
          
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="list-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              placeholder="Enter list name"
              className={cn(errors.name && 'border-destructive')}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>
          
          {/* Color Field */}
          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          
          {/* Emoji Field */}
          <div className="space-y-2">
            <Label>Emoji</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn(
                  'w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl',
                  'hover:bg-accent transition-colors',
                  showEmojiPicker ? 'border-ring' : 'border-input'
                )}
              >
                {emoji}
              </button>
              <span className="text-sm text-muted-foreground">
                Click to change emoji
              </span>
            </div>
            
            {showEmojiPicker && (
              <div className="mt-2 p-3 border rounded-lg">
                <EmojiPicker value={emoji} onChange={(e) => {
                  setEmoji(e);
                  setShowEmojiPicker(false);
                }} />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Save Changes' : 'Create List'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
