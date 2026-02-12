/**
 * LabelSelector Component
 * 
 * Multi-select dropdown for assigning labels to tasks.
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LabelBadge } from './LabelBadge';
import { LabelEditor } from './LabelEditor';
import { useLabels, LABEL_COLORS } from '@/hooks/useLabels';
import { Check, Plus, Search, X } from 'lucide-react';
import type { Label, CreateLabelRequest, UpdateLabelRequest } from '@/types';

export interface LabelSelectorProps {
  /** IDs of currently selected labels */
  selectedLabelIds: string[];
  /** Callback when selection changes */
  onChange: (labelIds: string[]) => void;
  /** Optional pre-loaded labels */
  labels?: Label[];
  /** Additional CSS classes */
  className?: string;
  /** Whether to show create option */
  showCreate?: boolean;
}

export function LabelSelector({
  selectedLabelIds,
  onChange,
  labels: propLabels,
  className,
  showCreate = true,
}: LabelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  
  const { 
    labels: hookLabels, 
    createLabel,
    getLabelById,
  } = useLabels();
  
  const labels = propLabels || hookLabels;
  
  // Get selected label objects
  const selectedLabels = useMemo(() => {
    return selectedLabelIds
      .map((id) => getLabelById(id))
      .filter(Boolean) as Label[];
  }, [selectedLabelIds, getLabelById]);
  
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
  
  // Toggle label selection
  const toggleLabel = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      onChange(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      onChange([...selectedLabelIds, labelId]);
    }
  };
  
  // Remove label from selection
  const removeLabel = (labelId: string) => {
    onChange(selectedLabelIds.filter((id) => id !== labelId));
  };
  
  // Handle create new label
  const handleCreateLabel = (data: CreateLabelRequest | UpdateLabelRequest) => {
    // When creating from LabelSelector, data is always CreateLabelRequest
    const createData = data as CreateLabelRequest;
    createLabel(createData).then((newLabel) => {
      onChange([...selectedLabelIds, newLabel.id]);
      setShowLabelEditor(false);
      setSearch('');
    });
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected Labels Display */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLabels.map((label) => (
            <LabelBadge
              key={label.id}
              label={label}
              size="sm"
              removable
              onRemove={() => removeLabel(label.id)}
            />
          ))}
        </div>
      )}
      
      {/* Selector Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start text-muted-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            {selectedLabels.length > 0
              ? 'Manage labels...'
              : 'Add labels...'}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-72 p-0" align="start">
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search labels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {/* Label List */}
          <ScrollArea className="h-48">
            {filteredLabels.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {search ? 'No labels found' : 'No labels available'}
              </div>
            ) : (
              <div className="p-1">
                {filteredLabels.map((label) => {
                  const isSelected = selectedLabelIds.includes(label.id);
                  
                  return (
                    <button
                      key={label.id}
                      type="button"
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
                        'hover:bg-accent transition-colors',
                        isSelected && 'bg-accent/50'
                      )}
                      onClick={() => toggleLabel(label.id)}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <LabelBadge label={label} size="sm" />
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          {/* Create New */}
          {showCreate && (
            <>
              <Separator />
              <div className="p-1">
                <button
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
                    'hover:bg-accent transition-colors text-muted-foreground'
                  )}
                  onClick={() => setShowLabelEditor(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create new label
                </button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
      
      {/* Label Editor Dialog */}
      <LabelEditor
        open={showLabelEditor}
        onOpenChange={setShowLabelEditor}
        onSave={handleCreateLabel}
      />
    </div>
  );
}
