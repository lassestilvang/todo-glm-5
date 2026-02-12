/**
 * Skeleton Components
 * 
 * Loading skeleton components for various UI elements.
 * Uses shimmer animation for loading states.
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================
// BASE SKELETON
// ============================================

interface SkeletonProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

export function Skeleton({ className, animate = true, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted',
        animate && 'animate-pulse',
        className
      )}
      style={style}
    />
  );
}

// ============================================
// TASK SKELETON
// ============================================

interface TaskSkeletonProps {
  className?: string;
  showMeta?: boolean;
}

export function TaskSkeleton({ className, showMeta = true }: TaskSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'flex items-start gap-3 px-3 py-3 rounded-lg border border-border',
        className
      )}
    >
      {/* Checkbox skeleton */}
      <Skeleton className="h-5 w-5 rounded shrink-0 mt-0.5" />
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />
        
        {/* Meta row */}
        {showMeta && (
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        )}
      </div>
      
      {/* Actions */}
      <Skeleton className="h-6 w-6 rounded" />
    </motion.div>
  );
}

// ============================================
// TASK LIST SKELETON
// ============================================

interface TaskListSkeletonProps {
  count?: number;
  className?: string;
  showGroupHeader?: boolean;
}

export function TaskListSkeleton({
  count = 5,
  className,
  showGroupHeader = false,
}: TaskListSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {showGroupHeader && (
        <div className="flex items-center gap-2 px-2 py-1">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
      )}
      
      {Array.from({ length: count }).map((_, i) => (
        <TaskSkeleton
          key={i}
          showMeta={i % 2 === 0}
        />
      ))}
    </div>
  );
}

// ============================================
// LIST SKELETON
// ============================================

export function ListSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('flex items-center gap-3 px-3 py-2 rounded-lg', className)}
    >
      {/* Emoji/icon */}
      <Skeleton className="h-6 w-6 rounded" />
      
      {/* List name */}
      <Skeleton className="h-4 flex-1" />
      
      {/* Task count */}
      <Skeleton className="h-5 w-8 rounded-full" />
    </motion.div>
  );
}

// ============================================
// SIDEBAR SKELETON
// ============================================

export function SidebarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Logo area */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-24" />
      </div>
      
      {/* View navigation */}
      <div className="space-y-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
          >
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      
      {/* Lists section */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-2 py-1">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-12" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <ListSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// CARD SKELETON
// ============================================

interface CardSkeletonProps {
  className?: string;
  lines?: number;
}

export function CardSkeleton({ className, lines = 3 }: CardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('rounded-lg border border-border p-4 space-y-3', className)}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      
      {/* Content lines */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3"
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// TABLE ROW SKELETON
// ============================================

interface TableRowSkeletonProps {
  columns?: number;
  className?: string;
}

export function TableRowSkeleton({ columns = 4, className }: TableRowSkeletonProps) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={className}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4" style={{ width: `${80 - i * 10}%` }} />
        </td>
      ))}
    </motion.tr>
  );
}

// ============================================
// TEXT SKELETON
// ============================================

interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

export function TextSkeleton({ lines = 3, className }: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

// ============================================
// AVATAR SKELETON
// ============================================

interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const avatarSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function AvatarSkeleton({ size = 'md', className }: AvatarSkeletonProps) {
  return (
    <Skeleton className={cn('rounded-full', avatarSizes[size], className)} />
  );
}

// ============================================
// BUTTON SKELETON
// ============================================

interface ButtonSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const buttonSizes = {
  sm: 'h-8 w-16',
  md: 'h-10 w-24',
  lg: 'h-12 w-32',
};

export function ButtonSkeleton({ size = 'md', className }: ButtonSkeletonProps) {
  return (
    <Skeleton className={cn('rounded-md', buttonSizes[size], className)} />
  );
}

export default Skeleton;
