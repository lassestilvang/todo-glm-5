/**
 * SearchDialog Component
 * 
 * Command palette style search with:
 * - Cmd+K keyboard shortcut
 * - Fuzzy search across tasks, lists, labels
 * - Keyboard navigation
 */

'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  FileText,
  List,
  Search,
  Tag,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores';
import { useSearch, highlightMatches } from '@/hooks/useSearch';
import { useQuickSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';
import type { SearchResultItem } from '@/hooks/useSearch';

// ============================================
// TYPES
// ============================================

interface SearchDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const { isSearchOpen, closeSearch } = useUIStore();
  const { toggleSearch } = useQuickSearch();
  
  const {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
    selectedIndex,
    selectNext,
    selectPrevious,
    selectedResult,
  } = useSearch({ debounceMs: 150 });
  
  // Use controlled or internal state
  const isOpen = open ?? isSearchOpen;
  const handleOpenChange = onOpenChange ?? ((open: boolean) => {
    if (!open) {
      closeSearch();
    }
  });
  
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedResult) {
            handleSelect(selectedResult);
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectNext, selectPrevious, selectedResult]);
  
  // Clear search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      clearSearch();
    }
  }, [isOpen, clearSearch]);
  
  // Handle result selection
  const handleSelect = useCallback((result: SearchResultItem) => {
    handleOpenChange(false);
    
    switch (result.type) {
      case 'task':
        // Navigate to task detail or open task editor
        router.push(`/today?task=${result.id}`);
        break;
      case 'list':
        router.push(`/list/${result.id}`);
        break;
      case 'label':
        router.push(`/search?label=${result.id}`);
        break;
    }
  }, [router, handleOpenChange]);
  
  // Group results by type
  const groupedResults = useMemo(() => {
    const tasks = results.filter((r) => r.type === 'task');
    const lists = results.filter((r) => r.type === 'list');
    const labels = results.filter((r) => r.type === 'label');
    
    return { tasks, lists, labels };
  }, [results]);
  
  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="max-w-xl"
    >
      <CommandInput
        placeholder="Search tasks, lists, labels..."
        value={query}
        onValueChange={setQuery}
      />
      
      <CommandList className="max-h-[400px]">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : results.length === 0 && query.length >= 2 ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <>
            {/* Tasks */}
            {groupedResults.tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {groupedResults.tasks.map((result, index) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    isSelected={selectedIndex === results.indexOf(result)}
                    onSelect={() => handleSelect(result)}
                    query={query}
                  />
                ))}
              </CommandGroup>
            )}
            
            {groupedResults.tasks.length > 0 && (groupedResults.lists.length > 0 || groupedResults.labels.length > 0) && (
              <CommandSeparator />
            )}
            
            {/* Lists */}
            {groupedResults.lists.length > 0 && (
              <CommandGroup heading="Lists">
                {groupedResults.lists.map((result) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    isSelected={selectedIndex === results.indexOf(result)}
                    onSelect={() => handleSelect(result)}
                    query={query}
                  />
                ))}
              </CommandGroup>
            )}
            
            {groupedResults.lists.length > 0 && groupedResults.labels.length > 0 && (
              <CommandSeparator />
            )}
            
            {/* Labels */}
            {groupedResults.labels.length > 0 && (
              <CommandGroup heading="Labels">
                {groupedResults.labels.map((result) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    isSelected={selectedIndex === results.indexOf(result)}
                    onSelect={() => handleSelect(result)}
                    query={query}
                  />
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
      
      {/* Footer with shortcuts */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">esc</kbd>
            Close
          </span>
        </div>
        <span>{results.length} results</span>
      </div>
    </CommandDialog>
  );
}

// ============================================
// SEARCH RESULT ITEM
// ============================================

interface SearchResultItemProps {
  result: SearchResultItem;
  isSelected: boolean;
  onSelect: () => void;
  query: string;
}

function SearchResultItem({ 
  result, 
  isSelected, 
  onSelect,
  query 
}: SearchResultItemProps) {
  // Get icon based on type
  const getIcon = () => {
    switch (result.type) {
      case 'task':
        return result.isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <FileText className="h-4 w-4" />
        );
      case 'list':
        return (
          <span className="text-base">{result.emoji || '📋'}</span>
        );
      case 'label':
        return (
          <span className="text-base">{result.emoji || '🏷️'}</span>
        );
    }
  };
  
  // Get type badge
  const getTypeBadge = () => {
    switch (result.type) {
      case 'task':
        return result.listName ? (
          <Badge variant="outline" className="text-xs">
            {result.listName}
          </Badge>
        ) : null;
      case 'list':
        return (
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: result.color }}
          />
        );
      case 'label':
        return (
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: result.color }}
          />
        );
    }
  };
  
  return (
    <CommandItem
      onSelect={onSelect}
      className={cn(
        'flex items-center gap-3 px-3 py-2',
        isSelected && 'bg-accent'
      )}
    >
      {/* Icon */}
      <span className="shrink-0">{getIcon()}</span>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">
            {highlightMatches(result.name, result.matches)}
          </span>
          {getTypeBadge()}
        </div>
        
        {/* Additional info for tasks */}
        {result.type === 'task' && result.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Calendar className="h-3 w-3" />
            <span>{result.dueDate}</span>
          </div>
        )}
      </div>
      
      {/* Shortcut hint */}
      {isSelected && (
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">↵</kbd>
      )}
    </CommandItem>
  );
}

// ============================================
// SEARCH BUTTON (for header)
// ============================================

interface SearchButtonProps {
  onClick?: () => void;
  className?: string;
}

export function SearchButton({ onClick, className }: SearchButtonProps) {
  const { toggleSearch } = useQuickSearch();
  
  return (
    <button
      onClick={onClick ?? toggleSearch}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'bg-muted/50 hover:bg-muted transition-colors',
        'text-sm text-muted-foreground',
        className
      )}
    >
      <Search className="h-4 w-4" />
      <span>Search...</span>
      <kbd className="ml-auto px-1.5 py-0.5 rounded bg-background text-xs">
        ⌘K
      </kbd>
    </button>
  );
}

// ============================================
// MOBILE SEARCH
// ============================================

export function MobileSearch() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const { query, setQuery, results, clearSearch } = useSearch();
  const router = useRouter();
  
  const handleSelect = useCallback((result: SearchResultItem) => {
    closeSearch();
    clearSearch();
    
    switch (result.type) {
      case 'task':
        router.push(`/today?task=${result.id}`);
        break;
      case 'list':
        router.push(`/list/${result.id}`);
        break;
      case 'label':
        router.push(`/search?label=${result.id}`);
        break;
    }
  }, [router, closeSearch, clearSearch]);
  
  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Search input */}
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-lg outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  closeSearch();
                  clearSearch();
                }}
                className="text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
          
          {/* Results */}
          <div className="p-4 space-y-2">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors"
              >
                <span className="text-base">
                  {result.type === 'task' ? '📝' : result.type === 'list' ? (result.emoji || '📋') : (result.emoji || '🏷️')}
                </span>
                <span className="flex-1 text-left">{result.name}</span>
              </button>
            ))}
            
            {query.length >= 2 && results.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No results found
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
