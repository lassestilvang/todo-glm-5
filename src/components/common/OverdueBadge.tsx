/**
 * OverdueBadge Component
 * 
 * Animated badge for overdue tasks with:
 * - Subtle pulse animation to draw attention
 * - Days overdue display
 * - Accessible design
 */

'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// ============================================
// TYPES
// ============================================

interface OverdueBadgeProps {
  daysOverdue: number;
  className?: string;
  showIcon?: boolean;
  variant?: 'badge' | 'dot' | 'text';
}

// ============================================
// COMPONENT
// ============================================

export function OverdueBadge({
  daysOverdue,
  className,
  showIcon = true,
  variant = 'badge',
}: OverdueBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const text = daysOverdue === 1 
    ? 'Yesterday' 
    : daysOverdue > 1 
      ? `${daysOverdue} days overdue`
      : 'Overdue';
  
  // Dot variant
  if (variant === 'dot') {
    return (
      <motion.span
        className={cn('relative inline-flex', className)}
        animate={prefersReducedMotion ? undefined : {
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Pulse ring */}
        {!prefersReducedMotion && (
          <motion.span
            className="absolute inset-0 rounded-full bg-red-500"
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
        <span className="relative h-2.5 w-2.5 rounded-full bg-red-500" />
      </motion.span>
    );
  }
  
  // Text variant
  if (variant === 'text') {
    return (
      <motion.span
        className={cn('text-red-500 text-xs font-medium', className)}
        animate={prefersReducedMotion ? undefined : {
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {text}
      </motion.span>
    );
  }
  
  // Badge variant (default)
  return (
    <motion.div
      className={cn('relative', className)}
      animate={prefersReducedMotion ? undefined : {
        scale: [1, 1.02, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Pulse effect behind badge */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-md bg-red-500/20"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
      <Badge
        variant="outline"
        className={cn(
          'relative border-red-300 text-red-600 dark:border-red-800 dark:text-red-400',
          'bg-red-50 dark:bg-red-950/30'
        )}
      >
        {showIcon && (
          <motion.span
            animate={prefersReducedMotion ? undefined : {
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
          </motion.span>
        )}
        {text}
      </Badge>
    </motion.div>
  );
}

// ============================================
// OVERDUE INDICATOR (Minimal)
// ============================================

interface OverdueIndicatorProps {
  className?: string;
}

export function OverdueIndicator({ className }: OverdueIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.span
      className={cn('relative inline-flex items-center justify-center', className)}
      animate={prefersReducedMotion ? undefined : {
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Pulse ring */}
      {!prefersReducedMotion && (
        <motion.span
          className="absolute inset-0 rounded-full bg-red-500"
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
      <Clock className="relative h-3.5 w-3.5 text-red-500" />
    </motion.span>
  );
}
