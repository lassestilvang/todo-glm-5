/**
 * RecurrencePicker Component
 * 
 * Select recurrence type with:
 * - Preset options (Daily, Weekly, etc.)
 * - Custom recurrence configuration
 * - End condition options
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Repeat, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { RecurrenceType, type RecurrenceConfig } from '@/types';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

interface RecurrencePickerProps extends WithClassName {
  value: RecurrenceType;
  config?: RecurrenceConfig | null;
  onChange: (type: RecurrenceType, config?: RecurrenceConfig) => void;
  disabled?: boolean;
}

// ============================================
// RECURRENCE OPTIONS
// ============================================

const RECURRENCE_OPTIONS = [
  { value: RecurrenceType.NONE, label: 'No repeat', icon: '○' },
  { value: RecurrenceType.DAILY, label: 'Daily', icon: '📅' },
  { value: RecurrenceType.WEEKLY, label: 'Weekly', icon: '📆' },
  { value: RecurrenceType.WEEKDAYS, label: 'Weekdays', icon: '🗓️' },
  { value: RecurrenceType.MONTHLY, label: 'Monthly', icon: '📅' },
  { value: RecurrenceType.YEARLY, label: 'Yearly', icon: '🎂' },
  { value: RecurrenceType.CUSTOM, label: 'Custom...', icon: '⚙️' },
] as const;

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', short: 'S' },
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
] as const;

const RECURRENCE_UNITS = [
  { value: 'day', label: 'day(s)' },
  { value: 'week', label: 'week(s)' },
  { value: 'month', label: 'month(s)' },
  { value: 'year', label: 'year(s)' },
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

function getRecurrenceLabel(type: RecurrenceType, config?: RecurrenceConfig | null): string {
  if (type === RecurrenceType.NONE) return 'No repeat';
  
  if (type === RecurrenceType.CUSTOM && config) {
    const unitLabel = config.unit === 'day' ? 'day' : 
                      config.unit === 'week' ? 'week' :
                      config.unit === 'month' ? 'month' : 'year';
    return `Every ${config.interval} ${unitLabel}${config.interval > 1 ? 's' : ''}`;
  }
  
  const option = RECURRENCE_OPTIONS.find(opt => opt.value === type);
  return option?.label || 'Custom';
}

// ============================================
// COMPONENT
// ============================================

export function RecurrencePicker({
  value,
  config,
  onChange,
  disabled = false,
  className,
}: RecurrencePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customConfig, setCustomConfig] = useState<RecurrenceConfig>(
    config || {
      interval: 1,
      unit: 'day',
    }
  );
  
  // Handle type selection
  const handleTypeChange = useCallback(
    (type: RecurrenceType) => {
      if (type === RecurrenceType.NONE) {
        onChange(RecurrenceType.NONE);
      } else if (type === RecurrenceType.CUSTOM) {
        // Keep custom config open
        onChange(RecurrenceType.CUSTOM, customConfig);
      } else {
        onChange(type);
      }
      
      if (type !== RecurrenceType.CUSTOM) {
        setIsOpen(false);
      }
    },
    [onChange, customConfig]
  );
  
  // Handle custom config change
  const handleCustomConfigChange = useCallback(
    (updates: Partial<RecurrenceConfig>) => {
      const newConfig = { ...customConfig, ...updates };
      setCustomConfig(newConfig);
      onChange(RecurrenceType.CUSTOM, newConfig);
    },
    [customConfig, onChange]
  );
  
  // Toggle day of week
  const toggleDayOfWeek = useCallback(
    (day: number) => {
      const currentDays = customConfig.daysOfWeek || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day].sort();
      
      handleCustomConfigChange({ daysOfWeek: newDays });
    },
    [customConfig, handleCustomConfigChange]
  );
  
  // Display value
  const displayValue = useMemo(
    () => getRecurrenceLabel(value, config),
    [value, config]
  );
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            value === RecurrenceType.NONE && 'text-muted-foreground',
            className
          )}
        >
          <Repeat className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          {/* Preset options */}
          <div className="space-y-1">
            {RECURRENCE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={value === option.value ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => handleTypeChange(option.value)}
              >
                <span className="mr-2">{option.icon}</span>
                {option.label}
              </Button>
            ))}
          </div>
          
          {/* Custom configuration */}
          {value === RecurrenceType.CUSTOM && (
            <div className="pt-3 border-t space-y-3">
              <p className="text-sm font-medium">Custom recurrence</p>
              
              {/* Interval */}
              <div className="flex items-center gap-2">
                <span className="text-sm">Every</span>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={customConfig.interval}
                  onChange={(e) =>
                    handleCustomConfigChange({
                      interval: parseInt(e.target.value || '1', 10),
                    })
                  }
                  className="w-16 text-center"
                />
                <Select
                  value={customConfig.unit}
                  onValueChange={(val) =>
                    handleCustomConfigChange({ unit: val as RecurrenceConfig['unit'] })
                  }
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Days of week (for weekly) */}
              {customConfig.unit === 'week' && (
                <div className="space-y-2">
                  <Label className="text-sm">On days</Label>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={
                          customConfig.daysOfWeek?.includes(day.value)
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleDayOfWeek(day.value)}
                      >
                        {day.short}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* End condition */}
              <div className="space-y-2">
                <Label className="text-sm">Ends</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="endCondition"
                      id="never"
                      checked={!customConfig.endDate && !customConfig.maxOccurrences}
                      onChange={() =>
                        handleCustomConfigChange({
                          endDate: undefined,
                          maxOccurrences: undefined,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="never" className="text-sm font-normal">
                      Never
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="endCondition"
                      id="onDate"
                      checked={!!customConfig.endDate}
                      onChange={() =>
                        handleCustomConfigChange({
                          endDate: new Date().toISOString().split('T')[0],
                          maxOccurrences: undefined,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="onDate" className="text-sm font-normal">
                      On
                    </Label>
                    {customConfig.endDate && (
                      <Input
                        type="date"
                        value={customConfig.endDate}
                        onChange={(e) =>
                          handleCustomConfigChange({ endDate: e.target.value })
                        }
                        className="w-36 h-8 text-sm"
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="endCondition"
                      id="afterOccurrences"
                      checked={!!customConfig.maxOccurrences}
                      onChange={() =>
                        handleCustomConfigChange({
                          endDate: undefined,
                          maxOccurrences: 10,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="afterOccurrences" className="text-sm font-normal">
                      After
                    </Label>
                    {customConfig.maxOccurrences && (
                      <>
                        <Input
                          type="number"
                          min={1}
                          max={999}
                          value={customConfig.maxOccurrences}
                          onChange={(e) =>
                            handleCustomConfigChange({
                              maxOccurrences: parseInt(e.target.value || '1', 10),
                            })
                          }
                          className="w-16 h-8 text-sm text-center"
                        />
                        <span className="text-sm">times</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Clear button */}
          {value !== RecurrenceType.NONE && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => {
                  onChange(RecurrenceType.NONE);
                  setIsOpen(false);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Remove recurrence
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// RECURRENCE DISPLAY
// ============================================

interface RecurrenceDisplayProps extends WithClassName {
  type: RecurrenceType;
  config?: RecurrenceConfig | null;
  showIcon?: boolean;
}

export function RecurrenceDisplay({
  type,
  config,
  showIcon = true,
  className,
}: RecurrenceDisplayProps) {
  if (type === RecurrenceType.NONE) return null;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm text-muted-foreground',
        className
      )}
    >
      {showIcon && <Repeat className="h-4 w-4" />}
      {getRecurrenceLabel(type, config)}
    </span>
  );
}

// ============================================
// RECURRENCE BADGE
// ============================================

interface RecurrenceBadgeProps extends WithClassName {
  type: RecurrenceType;
  config?: RecurrenceConfig | null;
}

export function RecurrenceBadge({ type, config, className }: RecurrenceBadgeProps) {
  if (type === RecurrenceType.NONE) return null;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        className
      )}
    >
      <Repeat className="h-3 w-3" />
      {getRecurrenceLabel(type, config)}
    </span>
  );
}
