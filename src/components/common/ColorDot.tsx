/**
 * ColorDot Component
 * 
 * A small colored dot indicator used for list colors throughout the app.
 */

import { cn } from '@/lib/utils';

export interface ColorDotProps {
  /** The color value (hex code) */
  color: string;
  /** Size of the dot */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function ColorDot({ color, size = 'md', className }: ColorDotProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full flex-shrink-0',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}
