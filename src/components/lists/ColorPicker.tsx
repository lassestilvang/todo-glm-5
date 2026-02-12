/**
 * ColorPicker Component
 * 
 * A grid of preset color options for selecting list/label colors.
 */

'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { LIST_COLORS } from '@/hooks/useLists';

export interface ColorPickerProps {
  /** Currently selected color value */
  value: string;
  /** Callback when a color is selected */
  onChange: (color: string) => void;
  /** Optional custom color palette */
  colors?: readonly { name: string; value: string; tailwind: string }[];
  /** Additional CSS classes */
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  colors = LIST_COLORS,
  className,
}: ColorPickerProps) {
  return (
    <div className={cn('grid grid-cols-5 gap-2', className)} role="radiogroup" aria-label="Select color">
      {colors.map((color) => {
        const isSelected = value === color.value;
        
        return (
          <button
            key={color.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={color.name}
            className={cn(
              'relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200',
              'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              isSelected && 'ring-2 ring-ring ring-offset-2'
            )}
            style={{ backgroundColor: color.value }}
            onClick={() => onChange(color.value)}
          >
            {isSelected && (
              <Check className="w-4 h-4 text-white drop-shadow-sm" />
            )}
          </button>
        );
      })}
    </div>
  );
}
