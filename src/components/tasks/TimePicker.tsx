/**
 * TimePicker Component
 * 
 * Hour and minute selection with:
 * - 12/24 hour format support
 * - Keyboard navigation
 * - Quick time presets
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Clock } from 'lucide-react';
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

interface TimePickerProps extends WithClassName {
  value?: string; // HH:mm format
  onChange: (time: string) => void;
  use12Hour?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// ============================================
// TIME UTILITIES
// ============================================

function parseTime(timeStr?: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  
  return { hours, minutes };
}

function formatTime(hours: number, minutes: number, use12Hour: boolean): string {
  if (use12Hour) {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function formatTimeValue(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// ============================================
// COMPONENT
// ============================================

export function TimePicker({
  value,
  onChange,
  use12Hour = false,
  disabled = false,
  placeholder = 'Select time',
  className,
}: TimePickerProps) {
  const parsedTime = useMemo(() => parseTime(value), [value]);
  const [isOpen, setIsOpen] = useState(false);
  
  const [selectedHours, setSelectedHours] = useState(parsedTime?.hours ?? 9);
  const [selectedMinutes, setSelectedMinutes] = useState(parsedTime?.minutes ?? 0);
  const [period, setPeriod] = useState<'AM' | 'PM'>(
    parsedTime && parsedTime.hours >= 12 ? 'PM' : 'AM'
  );
  
  // Generate hours options
  const hoursOptions = useMemo(() => {
    if (use12Hour) {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
    return Array.from({ length: 24 }, (_, i) => i);
  }, [use12Hour]);
  
  // Generate minutes options (every 5 minutes)
  const minutesOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i * 5);
  }, []);
  
  // Handle time confirmation
  const handleConfirm = useCallback(() => {
    let hours = selectedHours;
    
    if (use12Hour) {
      // Convert 12-hour to 24-hour
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
    }
    
    onChange(formatTimeValue(hours, selectedMinutes));
    setIsOpen(false);
  }, [selectedHours, selectedMinutes, period, use12Hour, onChange]);
  
  // Handle clear
  const handleClear = useCallback(() => {
    onChange('');
    setIsOpen(false);
  }, [onChange]);
  
  // Quick time presets
  const quickPresets = useMemo(() => {
    const now = new Date();
    const presets: { label: string; hours: number; minutes: number }[] = [];
    
    // Morning times
    presets.push({ label: '9:00 AM', hours: 9, minutes: 0 });
    presets.push({ label: '12:00 PM', hours: 12, minutes: 0 });
    
    // Afternoon times
    presets.push({ label: '2:00 PM', hours: 14, minutes: 0 });
    presets.push({ label: '5:00 PM', hours: 17, minutes: 0 });
    
    // Current time rounded to nearest 30 min
    const roundedMinutes = Math.round(now.getMinutes() / 30) * 30;
    const adjustedHours = roundedMinutes === 60 ? now.getHours() + 1 : now.getHours();
    presets.push({
      label: 'Now',
      hours: adjustedHours % 24,
      minutes: roundedMinutes % 60,
    });
    
    return presets;
  }, []);
  
  // Handle quick preset click
  const handlePresetClick = useCallback((hours: number, minutes: number) => {
    onChange(formatTimeValue(hours, minutes));
    setIsOpen(false);
  }, [onChange]);
  
  // Display value
  const displayValue = useMemo(() => {
    if (!parsedTime) return placeholder;
    return formatTime(parsedTime.hours, parsedTime.minutes, use12Hour);
  }, [parsedTime, use12Hour, placeholder]);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !parsedTime && 'text-muted-foreground',
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          {/* Time selectors */}
          <div className="flex items-center gap-2">
            {/* Hours */}
            <Select
              value={selectedHours.toString()}
              onValueChange={(val) => setSelectedHours(parseInt(val, 10))}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hoursOptions.map((hour) => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hour.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <span className="text-lg font-bold">:</span>
            
            {/* Minutes */}
            <Select
              value={selectedMinutes.toString()}
              onValueChange={(val) => setSelectedMinutes(parseInt(val, 10))}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {minutesOptions.map((minute) => (
                  <SelectItem key={minute} value={minute.toString()}>
                    {minute.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* AM/PM for 12-hour format */}
            {use12Hour && (
              <Select
                value={period}
                onValueChange={(val) => setPeriod(val as 'AM' | 'PM')}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1">
            {quickPresets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePresetClick(preset.hours, preset.minutes)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          {/* Actions */}
          <div className="flex justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
            >
              Set time
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// SIMPLE TIME INPUT
// ============================================

interface TimeInputProps extends WithClassName {
  value?: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimeInput({
  value,
  onChange,
  disabled = false,
  placeholder = 'HH:mm',
  className,
}: TimeInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow empty value
      if (!inputValue) {
        onChange('');
        return;
      }
      
      // Validate format
      const match = inputValue.match(/^(\d{1,2}):?(\d{0,2})$/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = match[2] ? parseInt(match[2], 10) : 0;
        
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          onChange(formatTimeValue(hours, minutes));
        }
      }
    },
    [onChange]
  );
  
  return (
    <div className="relative">
      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="time"
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn('pl-9', className)}
      />
    </div>
  );
}
