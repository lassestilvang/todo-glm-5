/**
 * LabelBadge Component
 * 
 * Visual representation of a label with emoji, name, and color.
 */

'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { Label } from '@/types';

export interface LabelBadgeProps {
  /** The label to display */
  label: Label;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show a remove button */
  removable?: boolean;
  /** Callback when remove is clicked */
  onRemove?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-sm px-2 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

export function LabelBadge({
  label,
  size = 'md',
  removable = false,
  onRemove,
  className,
  onClick,
}: LabelBadgeProps) {
  const isClickable = !!onClick;
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium transition-colors',
        sizeClasses[size],
        isClickable && 'cursor-pointer hover:opacity-80',
        className
      )}
      style={{
        backgroundColor: label.color + '20',
        color: label.color,
        border: `1px solid ${label.color}40`,
      }}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {label.emoji && <span>{label.emoji}</span>}
      <span>{label.name}</span>
      
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            'ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10',
            'focus:outline-none focus:ring-1 focus:ring-current'
          )}
          aria-label={`Remove ${label.name}`}
        >
          <X className={iconSizes[size]} />
        </button>
      )}
    </span>
  );
}
