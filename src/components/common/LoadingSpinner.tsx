/**
 * LoadingSpinner Component
 * 
 * Animated loading indicator with multiple variants
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

interface LoadingSpinnerProps extends WithClassName {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'bars' | 'pulse' | 'ring';
  color?: 'primary' | 'muted' | 'white';
}

// ============================================
// COMPONENT
// ============================================

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  color = 'primary',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };
  
  const colorClasses = {
    primary: 'text-primary',
    muted: 'text-muted-foreground',
    white: 'text-white',
  };
  
  const spinnerSize = sizeClasses[size];
  const spinnerColor = colorClasses[color];
  
  // Default spinner (rotating circle)
  if (variant === 'default') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={cn(
          'border-2 border-current border-t-transparent rounded-full',
          spinnerSize,
          spinnerColor,
          className
        )}
        role="status"
        aria-label="Loading"
      />
    );
  }
  
  // Dots spinner
  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-1', className)} role="status" aria-label="Loading">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
            }}
            className={cn(
              'rounded-full bg-current',
              size === 'sm' && 'h-1.5 w-1.5',
              size === 'md' && 'h-2 w-2',
              size === 'lg' && 'h-3 w-3',
              size === 'xl' && 'h-4 w-4',
              spinnerColor
            )}
          />
        ))}
      </div>
    );
  }
  
  // Bars spinner
  if (variant === 'bars') {
    return (
      <div className={cn('flex items-end gap-0.5', className)} role="status" aria-label="Loading">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{
              scaleY: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
            }}
            className={cn(
              'w-1 bg-current rounded-full origin-bottom',
              size === 'sm' && 'h-3',
              size === 'md' && 'h-4',
              size === 'lg' && 'h-6',
              size === 'xl' && 'h-8',
              spinnerColor
            )}
          />
        ))}
      </div>
    );
  }
  
  // Pulse spinner
  if (variant === 'pulse') {
    return (
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
        className={cn(
          'rounded-full bg-current',
          spinnerSize,
          spinnerColor,
          className
        )}
        role="status"
        aria-label="Loading"
      />
    );
  }
  
  // Ring spinner
  if (variant === 'ring') {
    return (
      <div className={cn('relative', spinnerSize, className)} role="status" aria-label="Loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className={cn(
            'absolute inset-0 rounded-full border-2 border-current border-t-transparent',
            spinnerColor
          )}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className={cn(
            'absolute inset-1 rounded-full border border-current border-b-transparent',
            spinnerColor,
            'opacity-50'
          )}
        />
      </div>
    );
  }
  
  return null;
}

// ============================================
// LOADING OVERLAY
// ============================================

interface LoadingOverlayProps extends WithClassName {
  message?: string;
}

export function LoadingOverlay({ message, className }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <LoadingSpinner size="lg" />
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-sm text-muted-foreground"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
}

// ============================================
// LOADING CARD
// ============================================

interface LoadingCardProps extends WithClassName {
  lines?: number;
}

export function LoadingCard({ lines = 3, className }: LoadingCardProps) {
  return (
    <div className={cn('rounded-lg border border-border p-4 space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        </div>
      </div>
      
      {/* Content lines */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-muted animate-pulse rounded"
            style={{ width: `${100 - (i * 15)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// LOADING LIST
// ============================================

interface LoadingListProps extends WithClassName {
  count?: number;
}

export function LoadingList({ count = 5, className }: LoadingListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 rounded-lg border border-border p-3"
        >
          <div className="h-5 w-5 rounded border-2 border-muted animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// LOADING PAGE
// ============================================

interface LoadingPageProps extends WithClassName {
  message?: string;
}

export function LoadingPage({ message = 'Loading...', className }: LoadingPageProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[400px]', className)}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center"
      >
        <LoadingSpinner size="xl" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-sm text-muted-foreground"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

interface SkeletonProps extends WithClassName {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  variant = 'rectangular', 
  width, 
  height,
  className 
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  
  return (
    <div
      className={cn(
        'bg-muted animate-pulse',
        variantClasses[variant],
        className
      )}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1em' : undefined),
      }}
    />
  );
}

// ============================================
// BUTTON LOADING SPINNER
// ============================================

export function ButtonSpinner({ className }: WithClassName) {
  return (
    <LoadingSpinner
      size="sm"
      variant="default"
      color="white"
      className={cn('mr-2', className)}
    />
  );
}
