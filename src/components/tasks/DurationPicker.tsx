/**
 * DurationPicker Component
 * 
 * Hours and minutes selection for time estimates with:
 * - Quick presets
 * - Manual input
 * - Formatted display
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

interface DurationPickerProps extends WithClassName {
  value?: number; // minutes
  onChange: (minutes: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

// ============================================
// DURATION UTILITIES
// ============================================

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

function parseDurationToHoursMinutes(minutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  };
}

function hoursMinutesToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

// ============================================
// QUICK PRESETS
// ============================================

const QUICK_PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
  { label: '4h', minutes: 240 },
] as const;

// ============================================
// COMPONENT
// ============================================

export function DurationPicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'Set duration',
  className,
}: DurationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { hours: selectedHours, minutes: selectedMinutes } = useMemo(
    () => parseDurationToHoursMinutes(value ?? 0),
    [value]
  );
  
  // Generate hours options (0-12)
  const hoursOptions = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => i);
  }, []);
  
  // Generate minutes options (0, 5, 10, 15, ... 55)
  const minutesOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i * 5);
  }, []);
  
  // Handle hours change
  const handleHoursChange = useCallback(
    (newHours: string) => {
      const hours = parseInt(newHours, 10);
      onChange(hoursMinutesToMinutes(hours, selectedMinutes));
    },
    [selectedMinutes, onChange]
  );
  
  // Handle minutes change
  const handleMinutesChange = useCallback(
    (newMinutes: string) => {
      const minutes = parseInt(newMinutes, 10);
      onChange(hoursMinutesToMinutes(selectedHours, minutes));
    },
    [selectedHours, onChange]
  );
  
  // Handle preset click
  const handlePresetClick = useCallback(
    (minutes: number) => {
      onChange(minutes);
      setIsOpen(false);
    },
    [onChange]
  );
  
  // Handle clear
  const handleClear = useCallback(() => {
    onChange(0);
    setIsOpen(false);
  }, [onChange]);
  
  // Display value
  const displayValue = useMemo(() => {
    if (!value || value === 0) return placeholder;
    return formatDuration(value);
  }, [value, placeholder]);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <Timer className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1">
            {QUICK_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant={value === preset.minutes ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePresetClick(preset.minutes)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          {/* Custom duration */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Custom duration</p>
            <div className="flex items-center gap-2">
              {/* Hours */}
              <Select
                value={selectedHours.toString()}
                onValueChange={handleHoursChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Hours" />
                </SelectTrigger>
                <SelectContent>
                  {hoursOptions.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-lg font-bold">:</span>
              
              {/* Minutes */}
              <Select
                value={selectedMinutes.toString()}
                onValueChange={handleMinutesChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {minutesOptions.map((minute) => (
                    <SelectItem key={minute} value={minute.toString()}>
                      {minute.toString().padStart(2, '0')}m
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// DURATION DISPLAY
// ============================================

interface DurationDisplayProps extends WithClassName {
  minutes?: number | null;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DurationDisplay({
  minutes,
  showIcon = true,
  size = 'md',
  className,
}: DurationDisplayProps) {
  if (!minutes || minutes === 0) return null;
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-muted-foreground',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Timer className={iconSizes[size]} />}
      {formatDuration(minutes)}
    </span>
  );
}

// ============================================
// DURATION INPUT
// ============================================

interface DurationInputProps extends WithClassName {
  value?: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function DurationInput({
  value,
  onChange,
  disabled = false,
  placeholder = '0h 0m',
  className,
}: DurationInputProps) {
  const { hours, minutes } = parseDurationToHoursMinutes(value ?? 0);
  
  const handleHoursChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newHours = parseInt(e.target.value || '0', 10);
      if (newHours >= 0 && newHours <= 99) {
        onChange(hoursMinutesToMinutes(newHours, minutes));
      }
    },
    [minutes, onChange]
  );
  
  const handleMinutesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMinutes = parseInt(e.target.value || '0', 10);
      if (newMinutes >= 0 && newMinutes <= 59) {
        onChange(hoursMinutesToMinutes(hours, newMinutes));
      }
    },
    [hours, onChange]
  );
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Timer className="h-4 w-4 text-muted-foreground mr-1" />
      <Input
        type="number"
        min={0}
        max={99}
        value={hours || ''}
        onChange={handleHoursChange}
        disabled={disabled}
        placeholder="0"
        className="w-14 text-center"
        aria-label="Hours"
      />
      <span className="text-sm text-muted-foreground">h</span>
      <Input
        type="number"
        min={0}
        max={59}
        value={minutes || ''}
        onChange={handleMinutesChange}
        disabled={disabled}
        placeholder="0"
        className="w-14 text-center"
        aria-label="Minutes"
      />
      <span className="text-sm text-muted-foreground">m</span>
    </div>
  );
}
