/**
 * PriorityBadge Component
 * 
 * Visual indicator for task priority with:
 * - Color-coded display
 * - Multiple sizes
 * - Optional label display
 * - Animated pulse for urgent tasks
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Priority } from '@/types';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

interface PriorityBadgeProps extends WithClassName {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
}

// ============================================
// PRIORITY CONFIG
// ============================================

export const PRIORITY_CONFIG = {
  [Priority.NONE]: {
    label: 'None',
    color: 'text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-200 dark:border-slate-700',
    icon: '○',
    dotColor: 'bg-slate-400',
  },
  [Priority.LOW]: {
    label: 'Low',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: '◇',
    dotColor: 'bg-blue-500',
  },
  [Priority.MEDIUM]: {
    label: 'Medium',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: '◆',
    dotColor: 'bg-yellow-500',
  },
  [Priority.HIGH]: {
    label: 'High',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: '▲',
    dotColor: 'bg-orange-500',
  },
  [Priority.URGENT]: {
    label: 'Urgent',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: '⚠',
    dotColor: 'bg-red-500',
  },
} as const;

// ============================================
// COMPONENT
// ============================================

export function PriorityBadge({
  priority,
  size = 'md',
  showLabel = false,
  showIcon = true,
  className,
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[Priority.NONE];
  
  const sizeClasses = {
    sm: {
      badge: 'px-1.5 py-0.5 text-xs',
      icon: 'text-xs',
      label: 'text-xs',
      dot: 'h-2 w-2',
    },
    md: {
      badge: 'px-2 py-1 text-sm',
      icon: 'text-sm',
      label: 'text-sm',
      dot: 'h-2.5 w-2.5',
    },
    lg: {
      badge: 'px-3 py-1.5 text-base',
      icon: 'text-base',
      label: 'text-base',
      dot: 'h-3 w-3',
    },
  };
  
  const sizes = sizeClasses[size];
  
  // If no label and no icon, just show a dot indicator
  if (!showLabel && !showIcon) {
    return (
      <span
        className={cn(
          'rounded-full',
          config.dotColor,
          sizes.dot,
          className
        )}
        title={config.label}
        aria-label={`Priority: ${config.label}`}
      />
    );
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium',
        config.bgColor,
        config.borderColor,
        config.color,
        sizes.badge,
        className
      )}
      aria-label={`Priority: ${config.label}`}
    >
      {showIcon && (
        <span className={sizes.icon} aria-hidden="true">
          {config.icon}
        </span>
      )}
      {showLabel && (
        <span className={sizes.label}>
          {config.label}
        </span>
      )}
    </span>
  );
}

// ============================================
// PRIORITY DOT COMPONENT
// ============================================

interface PriorityDotProps extends WithClassName {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function PriorityDot({ priority, size = 'md', animate = true, className }: PriorityDotProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[Priority.NONE];
  const prefersReducedMotion = useReducedMotion();
  const isUrgent = priority === Priority.URGENT;
  
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };
  
  // Show pulse animation for urgent tasks
  if (isUrgent && animate && !prefersReducedMotion) {
    return (
      <span className={cn('relative', className)}>
        {/* Pulse ring */}
        <motion.span
          className={cn(
            'absolute inset-0 rounded-full',
            config.dotColor
          )}
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        {/* Main dot */}
        <motion.span
          className={cn(
            'relative block rounded-full',
            config.dotColor,
            sizeClasses[size]
          )}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          title={config.label}
          aria-label={`Priority: ${config.label}`}
        />
      </span>
    );
  }
  
  return (
    <motion.span
      className={cn(
        'rounded-full',
        config.dotColor,
        sizeClasses[size],
        className
      )}
      initial={prefersReducedMotion ? undefined : { scale: 0 }}
      animate={prefersReducedMotion ? undefined : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      title={config.label}
      aria-label={`Priority: ${config.label}`}
    />
  );
}

// ============================================
// PRIORITY ICON COMPONENT
// ============================================

interface PriorityIconProps extends WithClassName {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
}

export function PriorityIcon({ priority, size = 'md', className }: PriorityIconProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[Priority.NONE];
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  return (
    <span
      className={cn(
        config.color,
        sizeClasses[size],
        className
      )}
      title={config.label}
      aria-label={`Priority: ${config.label}`}
    >
      {config.icon}
    </span>
  );
}

// ============================================
// PRIORITY SELECT TRIGGER
// ============================================

interface PrioritySelectValueProps extends WithClassName {
  priority: Priority;
}

export function PrioritySelectValue({ priority, className }: PrioritySelectValueProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[Priority.NONE];
  
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className={config.color}>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
