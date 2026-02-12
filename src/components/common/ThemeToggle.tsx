/**
 * ThemeToggle Component
 * 
 * Toggle between light, dark, and system themes with:
 * - Animated sun/moon icon
 * - Dropdown for all three options
 * - Smooth transitions
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// ============================================
// ANIMATION VARIANTS
// ============================================

const iconVariants = {
  initial: { scale: 0, rotate: -90, opacity: 0 },
  animate: { scale: 1, rotate: 0, opacity: 1 },
  exit: { scale: 0, rotate: 90, opacity: 0 },
};

const sunVariants = {
  initial: { scale: 0, rotate: -90, opacity: 0 },
  animate: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 15 }
  },
  exit: { 
    scale: 0, 
    rotate: 90, 
    opacity: 0,
    transition: { duration: 0.15 }
  },
};

const moonVariants = {
  initial: { scale: 0, rotate: 90, opacity: 0 },
  animate: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 15 }
  },
  exit: { 
    scale: 0, 
    rotate: -90, 
    opacity: 0,
    transition: { duration: 0.15 }
  },
};

// ============================================
// COMPONENT
// ============================================

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'icon' | 'dropdown';
}

export function ThemeToggle({ 
  className,
  showLabel = false,
  variant = 'dropdown'
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative', className)}
        disabled
      >
        <div className="h-5 w-5" />
      </Button>
    );
  }
  
  const isDark = resolvedTheme === 'dark';
  
  // Simple icon toggle (no dropdown)
  if (variant === 'icon') {
    return (
      <motion.div
        whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={cn('relative overflow-hidden', className)}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="moon"
                variants={prefersReducedMotion ? undefined : moonVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Moon className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                variants={prefersReducedMotion ? undefined : sunVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Sun className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    );
  }
  
  // Dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? 'default' : 'icon'}
          className={cn('gap-2', className)}
          aria-label="Toggle theme"
        >
          <span className="relative w-5 h-5">
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="moon"
                  variants={prefersReducedMotion ? undefined : moonVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Moon className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  variants={prefersReducedMotion ? undefined : sunVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sun className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </span>
          {showLabel && (
            <>
              <span className="capitalize">{theme}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="gap-2"
        >
          <motion.span
            initial={false}
            animate={{ 
              rotate: theme === 'light' ? 0 : -90,
              scale: theme === 'light' ? 1 : 0.8
            }}
            className="opacity-100"
          >
            <Sun className="h-4 w-4" />
          </motion.span>
          <span>Light</span>
          {theme === 'light' && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto text-primary"
            >
              ✓
            </motion.span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="gap-2"
        >
          <motion.span
            initial={false}
            animate={{ 
              rotate: theme === 'dark' ? 0 : 90,
              scale: theme === 'dark' ? 1 : 0.8
            }}
          >
            <Moon className="h-4 w-4" />
          </motion.span>
          <span>Dark</span>
          {theme === 'dark' && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto text-primary"
            >
              ✓
            </motion.span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="gap-2"
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {theme === 'system' && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto text-primary"
            >
              ✓
            </motion.span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// THEME TOGGLE SKELETON
// ============================================

export function ThemeToggleSkeleton({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        'h-9 w-9 rounded-md bg-muted animate-pulse',
        className
      )} 
    />
  );
}
