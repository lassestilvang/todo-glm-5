/**
 * ListSettings Component
 * 
 * Settings panel for managing a list including rename, color/emoji change,
 * delete, and sort options.
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ColorPicker } from './ColorPicker';
import { EmojiPicker } from './EmojiPicker';
import { ColorDot } from '@/components/common/ColorDot';
import { Settings, Trash2, Palette, Smile, SortAsc } from 'lucide-react';
import type { List, UpdateListRequest } from '@/types';
import { SortBy } from '@/types';

export interface ListSettingsProps {
  /** The list to manage */
  list: List;
  /** Callback when the list is updated */
  onUpdate: (data: UpdateListRequest) => void;
  /** Callback when the list is deleted */
  onDelete: () => void;
  /** Whether the settings dialog is open */
  open?: boolean;
  /** Callback when dialog open state changes */
  onOpenChange?: (open: boolean) => void;
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: SortBy.DUE_DATE, label: 'Due Date' },
  { value: SortBy.PRIORITY, label: 'Priority' },
  { value: SortBy.NAME, label: 'Name' },
  { value: SortBy.CREATED_AT, label: 'Created Date' },
];

export function ListSettings({
  list,
  onUpdate,
  onDelete,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ListSettingsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  
  const [name, setName] = useState(list.name);
  const [color, setColor] = useState(list.color);
  const [emoji, setEmoji] = useState(list.emoji || '📋');
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.DUE_DATE);
  
  // Reset state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(list.name);
      setColor(list.color);
      setEmoji(list.emoji || '📋');
      setShowEmojiPicker(false);
    }
    setOpen(newOpen);
  };
  
  const handleSaveChanges = () => {
    onUpdate({
      name: name.trim() || list.name,
      color,
      emoji,
    });
    setOpen(false);
  };
  
  const handleDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
    setOpen(false);
  };
  
  const hasChanges = 
    name !== list.name || 
    color !== list.color || 
    emoji !== list.emoji;
  
  return (
    <>
      {/* Trigger Button (if uncontrolled) */}
      {controlledOpen === undefined && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => handleOpenChange(true)}
          className="h-6 w-6"
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="sr-only">List settings</span>
        </Button>
      )}
      
      {/* Settings Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ColorDot color={list.color} />
              List Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* List Preview */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: color + '20' }}
              >
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate">{name}</span>
              </div>
            </div>
            
            {/* Rename */}
            <div className="space-y-2">
              <Label htmlFor="list-name">Name</Label>
              <Input
                id="list-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name"
              />
            </div>
            
            {/* Color */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Color
              </Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            
            {/* Emoji */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Smile className="h-4 w-4" />
                Emoji
              </Label>
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
                  Click to change
                </span>
              </div>
              
              {showEmojiPicker && (
                <div className="mt-2 p-3 border rounded-lg">
                  <EmojiPicker
                    value={emoji}
                    onChange={(e) => {
                      setEmoji(e);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Sort By */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                Default Sort
              </Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sort order" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            {/* Delete */}
            {!list.is_default && (
              <div className="space-y-2">
                <Label className="text-destructive">Danger Zone</Label>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete List
                </Button>
                <p className="text-xs text-muted-foreground">
                  This will delete the list and all its tasks. This action cannot be undone.
                </p>
              </div>
            )}
            
            {list.is_default && (
              <p className="text-xs text-muted-foreground italic">
                The default list cannot be deleted.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={!hasChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{list.name}"? This will permanently
              delete all tasks in this list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
