/**
 * MobileNav Component
 * 
 * Mobile navigation drawer with:
 * - Hamburger menu trigger
 * - Full navigation menu
 * - Lists and labels
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
  List,
  Plus,
  Settings,
  Tag,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useUIStore, useOverdueCount } from '@/stores';
import { useLists } from '@/hooks/useLists';
import { useLabels } from '@/hooks/useLabels';
import { cn } from '@/lib/utils';
import type { ViewType, List as ListType, Label } from '@/types';

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
// ANIMATION VARIANTS
// ============================================

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.2,
    },
  }),
};

// ============================================
// COMPONENT
// ============================================

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const overdueCount = useOverdueCount();
  
  const { openListEditor, openSettings } = useUIStore();
  const { lists } = useLists();
  const { labels } = useLabels();
  
  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="left" 
        className="w-[300px] p-0 bg-sidebar"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <List className="h-4 w-4" />
              </div>
              <span>TaskFlow</span>
            </SheetTitle>
          </div>
        </SheetHeader>
        
        {/* Content */}
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-4 space-y-6">
            {/* View Navigation */}
            <nav className="space-y-1">
              <AnimatePresence>
                {viewItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        pathname === item.href || pathname === `/${item.id.toLowerCase()}`
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'hover:bg-sidebar-accent/50'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      {item.id === 'TODAY' && overdueCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground">
                          {overdueCount}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </nav>
            
            <Separator />
            
            {/* Lists Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Lists
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    openListEditor();
                    onClose();
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <nav className="space-y-0.5">
                {lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/list/${list.id}`}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      pathname === `/list/${list.id}`
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'hover:bg-sidebar-accent/50'
                    )}
                  >
                    <span className="text-base">{list.emoji || '📋'}</span>
                    <span className="flex-1 truncate">{list.name}</span>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: list.color }}
                    />
                  </Link>
                ))}
              </nav>
            </div>
            
            <Separator />
            
            {/* Labels Section */}
            <div className="space-y-2">
              <div className="px-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Labels
                </span>
              </div>
              
              <nav className="space-y-0.5">
                {labels.length > 0 ? (
                  labels.map((label) => (
                    <Link
                      key={label.id}
                      href={`/search?label=${label.id}`}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        'hover:bg-sidebar-accent/50'
                      )}
                    >
                      <span className="text-base">{label.emoji || '🏷️'}</span>
                      <span className="flex-1 truncate">{label.name}</span>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                    </Link>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    No labels yet
                  </p>
                )}
              </nav>
            </div>
            
            <Separator />
            
            {/* Settings */}
            <nav className="space-y-1">
              <button
                onClick={() => {
                  openSettings();
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent/50 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ============================================
// MOBILE NAV TRIGGER
// ============================================

interface MobileNavTriggerProps {
  onClick: () => void;
}

export function MobileNavTrigger({ onClick }: MobileNavTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="h-9 w-9"
      aria-label="Open menu"
    >
      <List className="h-5 w-5" />
    </Button>
  );
}

// ============================================
// MOBILE BOTTOM NAV (Alternative)
// ============================================

export function MobileBottomNav() {
  const pathname = usePathname();
  const overdueCount = useOverdueCount();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur">
      <div className="flex items-center justify-around h-16">
        {viewItems.slice(0, 4).map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 flex-1 h-full',
              'text-muted-foreground transition-colors',
              (pathname === item.href || pathname === `/${item.id.toLowerCase()}`)
                ? 'text-primary'
                : 'hover:text-foreground'
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.id === 'TODAY' && overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                  {overdueCount}
                </span>
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
