/**
 * LabelManager Component
 * 
 * Full label management interface with list of all labels,
 * usage counts, edit/delete functionality, and create new label.
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { LabelBadge } from './LabelBadge';
import { LabelEditor } from './LabelEditor';
import { useLabels } from '@/hooks/useLabels';
import { useTaskStore } from '@/stores';
import { Plus, Search, Pencil, Trash2, Tag } from 'lucide-react';
import type { Label, CreateLabelRequest, UpdateLabelRequest } from '@/types';

export interface LabelManagerProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

export function LabelManager({ open, onOpenChange }: LabelManagerProps) {
  const [search, setSearch] = useState('');
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  const [deletingLabel, setDeletingLabel] = useState<Label | null>(null);
  
  const {
    labels,
    createLabel,
    updateLabel,
    deleteLabel,
  } = useLabels({ autoFetch: true });
  
  const tasks = useTaskStore((state) => state.tasks);
  
  // Calculate usage counts for each label
  const labelUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    tasks.forEach((task) => {
      task.labels?.forEach((label) => {
        counts[label.id] = (counts[label.id] || 0) + 1;
      });
    });
    
    return counts;
  }, [tasks]);
  
  // Filter labels by search
  const filteredLabels = useMemo(() => {
    if (!search.trim()) {
      return labels;
    }
    
    const searchLower = search.toLowerCase();
    return labels.filter(
      (label) =>
        label.name.toLowerCase().includes(searchLower) ||
        (label.emoji && label.emoji.includes(search))
    );
  }, [labels, search]);
  
  // Handle create new label
  const handleCreateLabel = async (data: CreateLabelRequest) => {
    await createLabel(data);
    setShowLabelEditor(false);
  };
  
  // Handle update label
  const handleUpdateLabel = async (data: UpdateLabelRequest) => {
    if (editingLabel) {
      await updateLabel(editingLabel.id, data);
      setEditingLabel(null);
      setShowLabelEditor(false);
    }
  };
  
  // Handle save (create or update)
  const handleSave = (data: CreateLabelRequest | UpdateLabelRequest) => {
    if (editingLabel) {
      handleUpdateLabel(data);
    } else {
      handleCreateLabel(data as CreateLabelRequest);
    }
  };
  
  // Handle delete label
  const handleDeleteLabel = async () => {
    if (deletingLabel) {
      await deleteLabel(deletingLabel.id);
      setDeletingLabel(null);
    }
  };
  
  // Open editor for creating
  const openCreateEditor = () => {
    setEditingLabel(null);
    setShowLabelEditor(true);
  };
  
  // Open editor for editing
  const openEditEditor = (label: Label) => {
    setEditingLabel(label);
    setShowLabelEditor(true);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Manage Labels
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search and Create */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search labels..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button onClick={openCreateEditor}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            
            {/* Label List */}
            <ScrollArea className="h-80">
              {filteredLabels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Tag className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {search ? 'No labels found' : 'No labels yet'}
                  </p>
                  {!search && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={openCreateEditor}
                      className="mt-1"
                    >
                      Create your first label
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLabels.map((label) => {
                    const usageCount = labelUsageCounts[label.id] || 0;
                    
                    return (
                      <div
                        key={label.id}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-lg',
                          'hover:bg-accent/50 transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <LabelBadge label={label} />
                          <span className="text-xs text-muted-foreground">
                            {usageCount} {usageCount === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openEditEditor(label)}
                          >
                            <Pencil className="h-3 w-3" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeletingLabel(label)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            
            <Separator />
            
            <p className="text-xs text-muted-foreground text-center">
              {labels.length} label{labels.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Label Editor Dialog */}
      <LabelEditor
        label={editingLabel || undefined}
        open={showLabelEditor}
        onOpenChange={(open) => {
          setShowLabelEditor(open);
          if (!open) {
            setEditingLabel(null);
          }
        }}
        onSave={handleSave}
      />
      
      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingLabel}
        onOpenChange={(open) => !open && setDeletingLabel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Label</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingLabel?.name}"? This will
              remove the label from all tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLabel}
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
