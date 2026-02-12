/**
 * Header Component
 * 
 * Top navigation header with:
 * - Page title
 * - Search button
 * - Theme toggle
 * - Settings menu
 */

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Menu,
  Search,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useUIStore } from '@/stores';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

// ============================================
// PAGE TITLES
// ============================================

const pageTitles: Record<string, string> = {
  '/today': 'Today',
  '/week': 'This Week',
  '/upcoming': 'Upcoming',
  '/all': 'All Tasks',
  '/search': 'Search',
};

// ============================================
// COMPONENT
// ============================================

export function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  
  const { 
    toggleMobileMenu, 
    toggleSearch,
    openSettings,
  } = useUIStore();
  
  // Get page title from pathname
  const getPageTitle = () => {
    // Check for list page
    if (pathname.startsWith('/list/')) {
      return 'List'; // Will be replaced with actual list name
    }
    
    return pageTitles[pathname] || 'Tasks';
  };
  
  return (
    <header className={cn(
      'sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4',
      isMobile && 'px-4'
    )}>
      {/* Left side - Menu button (mobile) and title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="h-9 w-9"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Page title */}
        <motion.h1
          key={pathname}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-xl font-semibold"
        >
          {getPageTitle()}
        </motion.h1>
      </div>
      
      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSearch}
          className="h-9 w-9"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
        
        {/* Theme toggle */}
        <ThemeToggle />
        
        {/* Settings menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openSettings}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">Keyboard shortcuts</span>
              <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ============================================
// COMPACT HEADER (for mobile)
// ============================================

export function CompactHeader() {
  const { toggleMobileMenu, toggleSearch } = useUIStore();
  
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobileMenu}
        className="h-8 w-8"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <span className="font-semibold">TaskFlow</span>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSearch}
        className="h-8 w-8"
      >
        <Search className="h-5 w-5" />
      </Button>
    </header>
  );
}

// ============================================
// FLOATING SEARCH BUTTON
// ============================================

export function FloatingSearchButton() {
  const { toggleSearch } = useUIStore();
  
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleSearch}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex h-14 w-14 items-center justify-center',
        'rounded-full bg-primary text-primary-foreground shadow-lg',
        'hover:bg-primary/90 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
      aria-label="Search"
    >
      <Search className="h-6 w-6" />
    </motion.button>
  );
}
