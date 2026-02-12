/**
 * AppLayout Component
 * 
 * Main layout wrapper with sidebar and content area.
 * Features:
 * - Responsive design (sidebar becomes drawer on mobile)
 * - Framer Motion page transitions
 * - Collapsible sidebar
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useUIStore } from '@/stores';
import { useIsMobile, usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

// ============================================
// ANIMATION VARIANTS
// ============================================

const sidebarVariants = {
  expanded: { width: 280 },
  collapsed: { width: 72 },
};

const contentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 25,
};

// ============================================
// COMPONENT
// ============================================

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const { 
    sidebarCollapsed, 
    isMobileMenuOpen, 
    closeMobileMenu 
  } = useUIStore();
  
  const [mounted, setMounted] = useState(false);
  
  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);
  
  // Don't render until mounted (SSR safety)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }
  
  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header with mobile menu */}
        <Header />
        
        {/* Mobile navigation drawer */}
        <MobileNav isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
        
        {/* Main content */}
        <main className="min-h-[calc(100vh-4rem)] pt-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={prefersReducedMotion ? undefined : 'initial'}
              animate="animate"
              exit={prefersReducedMotion ? undefined : 'exit'}
              variants={contentVariants}
              transition={pageTransition}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }
  
  // Desktop layout
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
          variants={prefersReducedMotion ? {} : sidebarVariants}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'fixed left-0 top-0 z-40 h-screen',
            'border-r border-border bg-sidebar',
            'flex flex-col'
          )}
        >
          <Sidebar />
        </motion.aside>
        
        {/* Main content area */}
        <div
          className={cn(
            'flex flex-1 flex-col transition-all duration-300',
            sidebarCollapsed ? 'ml-[72px]' : 'ml-[280px]'
          )}
        >
          {/* Header */}
          <Header />
          
          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={prefersReducedMotion ? undefined : 'initial'}
                animate="animate"
                exit={prefersReducedMotion ? undefined : 'exit'}
                variants={contentVariants}
                transition={pageTransition}
                className="h-full p-6"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

export function AppLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="w-[280px] border-r border-border bg-sidebar animate-pulse">
          <div className="p-4">
            <div className="h-8 w-32 bg-muted rounded" />
          </div>
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="flex-1 p-6">
          <div className="h-8 w-48 bg-muted rounded mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
