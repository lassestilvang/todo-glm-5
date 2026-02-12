/**
 * EmptyState Component
 * 
 * Illustrated empty state for views with:
 * - Customizable icon/illustration
 * - Title and description
 * - Call to action button
 */

'use client';

import { motion } from 'framer-motion';
import { 
  Calendar, 
  CheckCircle2, 
  FileText, 
  Inbox, 
  List, 
  Plus, 
  Search, 
  Tag,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

interface EmptyStateProps extends WithClassName {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'illustrated';
}

// ============================================
// PRESET EMPTY STATES
// ============================================

export const EMPTY_STATE_PRESETS = {
  noTasks: {
    icon: ClipboardList,
    title: 'No tasks yet',
    description: 'Create your first task to get started',
  },
  noTasksToday: {
    icon: Calendar,
    title: 'No tasks for today',
    description: 'Enjoy your free time or plan ahead',
  },
  noTasksWeek: {
    icon: Calendar,
    title: 'No tasks this week',
    description: 'Your week is clear',
  },
  noTasksUpcoming: {
    icon: Calendar,
    title: 'No upcoming tasks',
    description: 'All caught up!',
  },
  noCompletedTasks: {
    icon: CheckCircle2,
    title: 'No completed tasks',
    description: 'Complete some tasks to see them here',
  },
  noLists: {
    icon: List,
    title: 'No lists yet',
    description: 'Create a list to organize your tasks',
  },
  noLabels: {
    icon: Tag,
    title: 'No labels yet',
    description: 'Create labels to categorize your tasks',
  },
  noSearchResults: {
    icon: Search,
    title: 'No results found',
    description: 'Try a different search term',
  },
  inbox: {
    icon: Inbox,
    title: 'Inbox is empty',
    description: 'Tasks without a list will appear here',
  },
} as const;

// ============================================
// COMPONENT
// ============================================

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
  size = 'md',
  variant = 'default',
  className,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-12 w-12',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'h-16 w-16',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'h-24 w-24',
      title: 'text-xl',
      description: 'text-base',
    },
  };
  
  const sizes = sizeClasses[size];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
    >
      {/* Icon */}
      {variant === 'illustrated' ? (
        <IllustratedIcon Icon={Icon} size={size} />
      ) : (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className={cn(
            'flex items-center justify-center rounded-full bg-muted text-muted-foreground mb-4',
            sizes.icon
          )}
        >
          <Icon className={size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-12 w-12'} />
        </motion.div>
      )}
      
      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn('font-semibold text-foreground mb-1', sizes.title)}
      >
        {title}
      </motion.h3>
      
      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn('text-muted-foreground max-w-sm mb-4', sizes.description)}
        >
          {description}
        </motion.p>
      )}
      
      {/* Action */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={action.onClick} className="gap-2">
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// ILLUSTRATED ICON
// ============================================

interface IllustratedIconProps {
  Icon: React.ElementType;
  size?: 'sm' | 'md' | 'lg';
}

function IllustratedIcon({ Icon, size = 'md' }: IllustratedIconProps) {
  const sizeClasses = {
    sm: { container: 'h-16 w-16', icon: 'h-6 w-6', dot: 'h-2 w-2' },
    md: { container: 'h-24 w-24', icon: 'h-10 w-10', dot: 'h-3 w-3' },
    lg: { container: 'h-32 w-32', icon: 'h-14 w-14', dot: 'h-4 w-4' },
  };
  
  const sizes = sizeClasses[size];
  
  return (
    <motion.div
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={cn(
        'relative flex items-center justify-center mb-6',
        sizes.container
      )}
    >
      {/* Background circle */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5" />
      
      {/* Decorative dots */}
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={cn(
          'absolute top-2 right-2 rounded-full bg-primary/30',
          sizes.dot
        )}
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        className={cn(
          'absolute bottom-4 left-2 rounded-full bg-primary/20',
          sizes.dot
        )}
      />
      
      {/* Main icon */}
      <div className="relative z-10 flex items-center justify-center rounded-full bg-background shadow-lg p-4">
        <Icon className={cn('text-primary', sizes.icon)} />
      </div>
    </motion.div>
  );
}

// ============================================
// PRESET EMPTY STATES
// ============================================

interface PresetEmptyStateProps extends WithClassName {
  preset: keyof typeof EMPTY_STATE_PRESETS;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
  size?: 'sm' | 'md' | 'lg';
}

export function PresetEmptyState({ 
  preset, 
  action, 
  size = 'md',
  className 
}: PresetEmptyStateProps) {
  const config = EMPTY_STATE_PRESETS[preset];
  
  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      action={action}
      size={size}
      className={className}
    />
  );
}

// ============================================
// EMPTY STATE WITH ILLUSTRATION
// ============================================

interface IllustratedEmptyStateProps extends WithClassName {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
  illustration?: React.ReactNode;
}

export function IllustratedEmptyState({
  title,
  description,
  action,
  illustration,
  className,
}: IllustratedEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-12',
        className
      )}
    >
      {/* Custom illustration */}
      {illustration && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {illustration}
        </motion.div>
      )}
      
      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-foreground mb-1"
      >
        {title}
      </motion.h3>
      
      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground max-w-sm mb-4"
        >
          {description}
        </motion.p>
      )}
      
      {/* Action */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={action.onClick} className="gap-2">
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// TASK EMPTY STATE
// ============================================

interface TaskEmptyStateProps extends WithClassName {
  view: 'today' | 'week' | 'upcoming' | 'all' | 'list';
  onCreateTask?: () => void;
}

export function TaskEmptyState({ view, onCreateTask, className }: TaskEmptyStateProps) {
  const config = {
    today: EMPTY_STATE_PRESETS.noTasksToday,
    week: EMPTY_STATE_PRESETS.noTasksWeek,
    upcoming: EMPTY_STATE_PRESETS.noTasksUpcoming,
    all: EMPTY_STATE_PRESETS.noTasks,
    list: EMPTY_STATE_PRESETS.noTasks,
  };
  
  const preset = config[view];
  
  return (
    <EmptyState
      icon={preset.icon}
      title={preset.title}
      description={preset.description}
      action={onCreateTask ? {
        label: 'Add task',
        onClick: onCreateTask,
        icon: Plus,
      } : undefined}
      variant="illustrated"
      className={className}
    />
  );
}
