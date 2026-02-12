/**
 * Sidebar Component
 * 
 * Collapsible sidebar with:
 * - Logo
 * - Views (Today, Week, Upcoming, All)
 * - Lists section
 * - Labels section
 * - Add list button
 * - Overdue badge count
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  Tag,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NavItem } from './NavItem';
import { ListNavItem } from './ListNavItem';
import { LabelNavItem } from './LabelNavItem';
import { ListEditor } from '@/components/lists';
import { LabelManager } from '@/components/labels';
import { useUIStore, useListStore, useLabelStore, useOverdueCount } from '@/stores';
import { useLists } from '@/hooks/useLists';
import { useLabels } from '@/hooks/useLabels';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import type { ViewType, CreateListRequest, UpdateListRequest } from '@/types';

// ============================================
// ANIMATION VARIANTS
// ============================================

const sidebarVariants = {
  expanded: { width: '16rem' },
  collapsed: { width: '4rem' },
};

const sectionVariants = {
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.1 },
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  }),
};

// ============================================
// VIEW NAVIGATION ITEMS
// ============================================

const viewItems: { 
  id: ViewType; 
  label: string; 
  href: string; 
  icon: React.ElementType;
}[] = [
  { id: 'TODAY' as ViewType, label: 'Today', href: '/today', icon: Calendar },
  { id: 'WEEK' as ViewType, label: 'Week', href: '/week', icon: CalendarDays },
  { id: 'UPCOMING' as ViewType, label: 'Upcoming', href: '/upcoming', icon: CalendarRange },
  { id: 'ALL' as ViewType, label: 'All Tasks', href: '/all', icon: CheckCircle2 },
];

// ============================================
// COMPONENT
// ============================================

export function Sidebar() {
  const pathname = usePathname();
  const overdueCount = useOverdueCount();
  const prefersReducedMotion = useReducedMotion();
  
  const { 
    sidebarCollapsed, 
    toggleSidebar,
    isListEditorOpen,
    openListEditor,
    closeListEditor,
  } = useUIStore();
  
  const { lists, isLoading: listsLoading, createList } = useLists();
  const { labels, isLoading: labelsLoading } = useLabels();
  
  const [listsExpanded, setListsExpanded] = useState(true);
  const [labelsExpanded, setLabelsExpanded] = useState(true);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  
  // Determine active view from pathname
  const activeView = pathname.split('/')[1]?.toUpperCase() as ViewType || 'TODAY';
  
  // Collapse sections when sidebar is collapsed
  useEffect(() => {
    if (sidebarCollapsed) {
      setListsExpanded(false);
      setLabelsExpanded(false);
    }
  }, [sidebarCollapsed]);
  
  // Handle creating a new list
  const handleCreateList = (data: CreateListRequest | UpdateListRequest) => {
    // When creating from Sidebar, data is always CreateListRequest
    createList(data as CreateListRequest).then(() => {
      closeListEditor();
    });
  };
  
  return (
    <motion.div
      initial={false}
      animate={prefersReducedMotion ? undefined : (sidebarCollapsed ? 'collapsed' : 'expanded')}
      variants={prefersReducedMotion ? undefined : sidebarVariants}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex h-full flex-col overflow-hidden"
      style={{ width: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      {/* Header with logo and collapse button */}
      <div className="flex items-center justify-between p-4">
        <motion.div
          initial={false}
          animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'flex items-center gap-2',
            sidebarCollapsed && 'pointer-events-none absolute'
          )}
        >
          <Link href="/today" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <List className="h-4 w-4" />
            </div>
            <span className="font-semibold text-lg">TaskFlow</span>
          </Link>
        </motion.div>
        
        {/* Collapsed state - icon only */}
        <AnimatePresence>
          {sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex justify-center w-full"
            >
              <Link href="/today">
                <motion.div 
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                >
                  <List className="h-4 w-4" />
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Collapse toggle */}
        <motion.div
          whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 shrink-0"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </motion.div>
          </Button>
        </motion.div>
      </div>
      
      <Separator />
      
      {/* Scrollable content */}
      <ScrollArea className="flex-1 px-2 py-4">
        {/* View Navigation */}
        <nav className="space-y-1">
          {viewItems.map((item, index) => (
            <motion.div
              key={item.id}
              variants={prefersReducedMotion ? undefined : itemVariants}
              initial="hidden"
              animate="visible"
              custom={index}
            >
              <NavItem
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href || pathname === `/${item.id.toLowerCase()}`}
                isCollapsed={sidebarCollapsed}
                badge={item.id === 'TODAY' && overdueCount > 0 ? overdueCount : undefined}
                badgeVariant="destructive"
              />
            </motion.div>
          ))}
        </nav>
        
        <Separator className="my-4" />
        
        {/* Lists Section */}
        <div className="space-y-1">
          <motion.button
            onClick={() => setListsExpanded(!listsExpanded)}
            className={cn(
              'flex w-full items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors',
              sidebarCollapsed && 'justify-center'
            )}
            whileHover={prefersReducedMotion ? undefined : { backgroundColor: 'rgba(0,0,0,0.05)' }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          >
            <motion.div
              animate={{ rotate: listsExpanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className={cn('h-4 w-4', sidebarCollapsed && 'hidden')} />
            </motion.div>
            <span className={cn(sidebarCollapsed && 'hidden')}>Lists</span>
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  openListEditor();
                }}
                aria-label="Add list"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </motion.button>
          
          <AnimatePresence initial={false}>
            {listsExpanded && !sidebarCollapsed && (
              <motion.div
                variants={prefersReducedMotion ? undefined : sectionVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="space-y-0.5 overflow-hidden"
              >
                {listsLoading ? (
                  <div className="space-y-1 px-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="h-9 rounded-md bg-muted"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                ) : (
                  lists.map((list, index) => (
                    <motion.div
                      key={list.id}
                      variants={prefersReducedMotion ? undefined : itemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                    >
                      <ListNavItem
                        list={list}
                        isActive={pathname === `/list/${list.id}`}
                      />
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Collapsed state - show list icons */}
          {sidebarCollapsed && (
            <div className="space-y-1">
              {lists.slice(0, 5).map((list, index) => (
                <motion.div
                  key={list.id}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/list/${list.id}`}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-colors mx-auto',
                      pathname === `/list/${list.id}`
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'hover:bg-sidebar-accent/50'
                    )}
                    title={list.name}
                  >
                    <motion.span 
                      className="text-lg"
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.2 }}
                    >
                      {list.emoji || '📋'}
                    </motion.span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        <Separator className="my-4" />
        
        {/* Labels Section */}
        <div className="space-y-1">
          <motion.button
            onClick={() => setLabelsExpanded(!labelsExpanded)}
            className={cn(
              'flex w-full items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors',
              sidebarCollapsed && 'justify-center'
            )}
            whileHover={prefersReducedMotion ? undefined : { backgroundColor: 'rgba(0,0,0,0.05)' }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          >
            <Tag className="h-4 w-4 shrink-0" />
            <motion.div
              animate={{ rotate: labelsExpanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className={cn('h-4 w-4', sidebarCollapsed && 'hidden')} />
            </motion.div>
            <span className={cn(sidebarCollapsed && 'hidden')}>Labels</span>
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLabelManagerOpen(true);
                }}
                aria-label="Manage labels"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            )}
          </motion.button>
          
          <AnimatePresence initial={false}>
            {labelsExpanded && !sidebarCollapsed && (
              <motion.div
                variants={prefersReducedMotion ? undefined : sectionVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="space-y-0.5 overflow-hidden"
              >
                {labelsLoading ? (
                  <div className="space-y-1 px-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="h-9 rounded-md bg-muted"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                ) : labels.length > 0 ? (
                  labels.map((label, index) => (
                    <motion.div
                      key={label.id}
                      variants={prefersReducedMotion ? undefined : itemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                    >
                      <LabelNavItem label={label} />
                    </motion.div>
                  ))
                ) : (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No labels yet
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Collapsed state - show label icons */}
          {sidebarCollapsed && labels.length > 0 && (
            <div className="space-y-1">
              {labels.slice(0, 5).map((label, index) => (
                <motion.div
                  key={label.id}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/search?label=${label.id}`}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-colors mx-auto',
                      'hover:bg-sidebar-accent/50'
                    )}
                    title={label.name}
                  >
                    <motion.span 
                      className="text-lg"
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.2 }}
                    >
                      {label.emoji || '🏷️'}
                    </motion.span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border p-4"
          >
            <p className="text-xs text-muted-foreground text-center">
              TaskFlow v1.0.0
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* List Editor Dialog */}
      <ListEditor
        open={isListEditorOpen}
        onOpenChange={(open) => !open && closeListEditor()}
        onSave={handleCreateList}
      />
      
      {/* Label Manager Dialog */}
      <LabelManager
        open={isLabelManagerOpen}
        onOpenChange={setIsLabelManagerOpen}
      />
    </motion.div>
  );
}

// ============================================
// MINI SIDEBAR (for mobile or compact mode)
// ============================================

export function MiniSidebar() {
  const pathname = usePathname();
  
  return (
    <div className="flex h-full w-16 flex-col items-center border-r border-border bg-sidebar py-4">
      {/* Logo */}
      <Link href="/today" className="mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <List className="h-5 w-5" />
        </div>
      </Link>
      
      <Separator className="w-8 mb-4" />
      
      {/* View icons */}
      <nav className="flex flex-col gap-2">
        {viewItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
              pathname === item.href || pathname === `/${item.id.toLowerCase()}`
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'hover:bg-sidebar-accent/50'
            )}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
