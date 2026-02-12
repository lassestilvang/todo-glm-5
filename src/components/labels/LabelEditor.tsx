/**
 * LabelEditor Component
 * 
 * Dialog for creating/editing labels with name, color, and emoji fields.
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
import { ColorPicker } from '@/components/lists/ColorPicker';
import { EmojiPicker } from '@/components/lists/EmojiPicker';
import { LabelBadge } from './LabelBadge';
import { LABEL_COLORS } from '@/hooks/useLabels';
import type { Label as LabelType, CreateLabelRequest, UpdateLabelRequest } from '@/types';

export interface LabelEditorProps {
  /** Existing label to edit (undefined for creating new) */
  label?: LabelType;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when saving the label */
  onSave: (data: CreateLabelRequest | UpdateLabelRequest) => void;
}

const DEFAULT_COLOR = LABEL_COLORS[0].value; // Slate
const DEFAULT_EMOJI = '🏷️';

export function LabelEditor({ label, open, onOpenChange, onSave }: LabelEditorProps) {
  const isEditing = !!label;
  
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [emoji, setEmoji] = useState<string>(DEFAULT_EMOJI);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  
  // Reset form when dialog opens/closes or label changes
  useEffect(() => {
    if (open) {
      if (label) {
        setName(label.name);
        setColor(label.color);
        setEmoji(label.emoji || DEFAULT_EMOJI);
      } else {
        setName('');
        setColor(DEFAULT_COLOR);
        setEmoji(DEFAULT_EMOJI);
      }
      setErrors({});
      setShowEmojiPicker(false);
    }
  }, [open, label]);
  
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
      } as UpdateLabelRequest);
    } else {
      onSave({
        name: name.trim(),
        color,
        emoji,
      } as CreateLabelRequest);
    }
    
    onOpenChange(false);
  };
  
  // Preview label object
  const previewLabel: LabelType = {
    id: 'preview',
    name: name || 'Label Name',
    color,
    emoji,
    created_at: new Date().toISOString(),
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Label' : 'Create New Label'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview */}
          <div className="flex items-center justify-center p-4 rounded-lg bg-muted/50">
            <LabelBadge label={previewLabel} size="lg" />
          </div>
          
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="label-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="label-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              placeholder="Enter label name"
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
            <ColorPicker 
              value={color} 
              onChange={setColor}
              colors={LABEL_COLORS}
            />
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
              {isEditing ? 'Save Changes' : 'Create Label'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
