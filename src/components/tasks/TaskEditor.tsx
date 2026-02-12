/**
 * TaskEditor Component
 * 
 * Full-featured task editor dialog/sheet with:
 * - Name, Description, Due date/time, Deadline
 * - Priority, Estimate, Actual time
 * - List, Labels, Recurrence
 * - Form validation with react-hook-form + zod
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Flag,
  List as ListIcon,
  Repeat,
  Tag,
  Timer,
  FileText,
  X,
  Plus,
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label as FormLabel } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PriorityBadge, PRIORITY_CONFIG } from './PriorityBadge';
import { TimePicker } from './TimePicker';
import { DurationPicker } from './DurationPicker';
import { RecurrencePicker } from './RecurrencePicker';
import {
  Priority,
  RecurrenceType,
  type Task,
  type CreateTaskRequest,
  type UpdateTaskRequest,
  type List,
  type Label,
} from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// ============================================
// TYPES & SCHEMA
// ============================================

const taskFormSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(500),
  description: z.string().max(5000).optional().nullable(),
  due_date: z.string().optional().nullable(),
  due_time: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority).optional(),
  estimate_minutes: z.number().min(0).max(1440).optional().nullable(),
  actual_minutes: z.number().min(0).max(1440).optional().nullable(),
  list_id: z.string().min(1, 'List is required'),
  label_ids: z.array(z.string()).optional(),
  recurrence_type: z.nativeEnum(RecurrenceType).optional().nullable(),
  recurrence_config: z
    .object({
      interval: z.number(),
      unit: z.enum(['day', 'week', 'month', 'year']),
      daysOfWeek: z.array(z.number()).optional(),
      dayOfMonth: z.number().optional(),
      endDate: z.string().optional(),
      maxOccurrences: z.number().optional(),
    })
    .optional()
    .nullable(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskEditorProps {
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: CreateTaskRequest | UpdateTaskRequest) => void;
  lists: List[];
  labels: Label[];
  defaultListId?: string;
  onDelete?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function TaskEditor({
  task,
  open,
  onOpenChange,
  onSave,
  lists,
  labels,
  defaultListId,
  onDelete,
}: TaskEditorProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDeadlinePickerOpen, setIsDeadlinePickerOpen] = useState(false);
  
  // Default values
  const defaultValues = useMemo<TaskFormData>(() => ({
    name: task?.name || '',
    description: task?.description || '',
    due_date: task?.due_date || null,
    due_time: task?.due_time || null,
    deadline: task?.deadline || null,
    priority: task?.priority ?? Priority.NONE,
    estimate_minutes: task?.estimate_minutes || null,
    actual_minutes: task?.actual_minutes || null,
    list_id: task?.list_id || defaultListId || lists[0]?.id || '',
    label_ids: [],
    recurrence_type: task?.recurrence_type || RecurrenceType.NONE,
    recurrence_config: task?.recurrence_config || null,
  }), [task, defaultListId, lists]);
  
  // Form
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });
  
  // Reset form when task changes
  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setSelectedLabels(task?.labels?.map((l) => l.id) || []);
    }
  }, [open, task, defaultValues, reset]);
  
  // Watch values
  const watchDueDate = watch('due_date');
  const watchPriority = watch('priority');
  const watchListId = watch('list_id');
  const watchRecurrenceType = watch('recurrence_type');
  const watchRecurrenceConfig = watch('recurrence_config');
  
  // Handle form submit
  const onSubmit = useCallback(
    (data: TaskFormData) => {
      const taskData = {
        ...data,
        label_ids: selectedLabels,
        due_date: data.due_date || undefined,
        due_time: data.due_time || undefined,
        deadline: data.deadline || undefined,
        priority: data.priority === Priority.NONE ? undefined : data.priority,
        estimate_minutes: data.estimate_minutes || undefined,
        actual_minutes: data.actual_minutes || undefined,
        recurrence_type: data.recurrence_type === RecurrenceType.NONE ? undefined : data.recurrence_type,
        recurrence_config: data.recurrence_type === RecurrenceType.NONE ? undefined : data.recurrence_config,
      };
      
      if (task) {
        onSave({ ...taskData } as UpdateTaskRequest);
      } else {
        onSave({ ...taskData } as CreateTaskRequest);
      }
      
      onOpenChange(false);
    },
    [task, selectedLabels, onSave, onOpenChange]
  );
  
  // Handle close
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);
  
  // Toggle label
  const toggleLabel = useCallback((labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  }, []);
  
  // Form content
  const formContent = (
    <div className="space-y-4">
      {/* Task name */}
      <div className="space-y-2">
        <FormLabel htmlFor="name">Task name *</FormLabel>
        <Input
          id="name"
          {...register('name')}
          placeholder="What needs to be done?"
          className={cn(errors.name && 'border-destructive')}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <FormLabel htmlFor="description" className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          Description
        </FormLabel>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Add more details..."
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">Markdown supported</p>
      </div>
      
      <Separator />
      
      {/* List */}
      <div className="space-y-2">
        <FormLabel className="flex items-center gap-1">
          <ListIcon className="h-3.5 w-3.5" />
          List *
        </FormLabel>
        <Controller
          name="list_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a list" />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: list.color }}
                      />
                      {list.emoji && <span>{list.emoji}</span>}
                      {list.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.list_id && (
          <p className="text-xs text-destructive">{errors.list_id.message}</p>
        )}
      </div>
      
      {/* Due date and time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <FormLabel className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Due date
          </FormLabel>
          <Controller
            name="due_date"
            control={control}
            render={({ field }) => (
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {field.value ? (
                      new Date(field.value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    ) : (
                      <span className="text-muted-foreground">Select date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      field.onChange(date?.toISOString().split('T')[0] || null);
                      setIsDatePickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
          />
        </div>
        
        <div className="space-y-2">
          <FormLabel className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Due time
          </FormLabel>
          <Controller
            name="due_time"
            control={control}
            render={({ field }) => (
              <TimePicker
                value={field.value || undefined}
                onChange={field.onChange}
                placeholder="Set time"
              />
            )}
          />
        </div>
      </div>
      
      {/* Deadline */}
      <div className="space-y-2">
        <FormLabel className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Deadline
        </FormLabel>
        <Controller
          name="deadline"
          control={control}
          render={({ field }) => (
            <Popover open={isDeadlinePickerOpen} onOpenChange={setIsDeadlinePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {field.value ? (
                    new Date(field.value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  ) : (
                    <span className="text-muted-foreground">Set deadline</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => {
                    field.onChange(date?.toISOString().split('T')[0] || null);
                    setIsDeadlinePickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
        />
      </div>
      
      {/* Priority */}
      <div className="space-y-2">
        <FormLabel className="flex items-center gap-1">
          <Flag className="h-3.5 w-3.5" />
          Priority
        </FormLabel>
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-1">
              {[Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT].map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={field.value === p ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1"
                  onClick={() => field.onChange(p)}
                >
                  <span className={PRIORITY_CONFIG[p].color}>
                    {PRIORITY_CONFIG[p].icon}
                  </span>
                  {PRIORITY_CONFIG[p].label}
                </Button>
              ))}
            </div>
          )}
        />
      </div>
      
      {/* Time estimates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <FormLabel className="flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            Estimate
          </FormLabel>
          <Controller
            name="estimate_minutes"
            control={control}
            render={({ field }) => (
              <DurationPicker
                value={field.value || undefined}
                onChange={field.onChange}
                placeholder="Set estimate"
              />
            )}
          />
        </div>
        
        <div className="space-y-2">
          <FormLabel className="flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            Actual time
          </FormLabel>
          <Controller
            name="actual_minutes"
            control={control}
            render={({ field }) => (
              <DurationPicker
                value={field.value || undefined}
                onChange={field.onChange}
                placeholder="Set actual"
              />
            )}
          />
        </div>
      </div>
      
      {/* Recurrence */}
      <div className="space-y-2">
        <FormLabel className="flex items-center gap-1">
          <Repeat className="h-3.5 w-3.5" />
          Recurrence
        </FormLabel>
        <Controller
          name="recurrence_type"
          control={control}
          render={({ field }) => (
            <RecurrencePicker
              value={field.value || RecurrenceType.NONE}
              config={watchRecurrenceConfig}
              onChange={(type, config) => {
                field.onChange(type);
                setValue('recurrence_config', config);
              }}
            />
          )}
        />
      </div>
      
      {/* Labels */}
      {labels.length > 0 && (
        <div className="space-y-2">
          <FormLabel className="flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" />
            Labels
          </FormLabel>
          <div className="flex flex-wrap gap-1">
            {labels.map((label) => (
              <Button
                key={label.id}
                type="button"
                variant={selectedLabels.includes(label.id) ? 'default' : 'outline'}
                size="sm"
                className="gap-1"
                style={{
                  backgroundColor: selectedLabels.includes(label.id)
                    ? label.color
                    : undefined,
                  borderColor: label.color,
                  color: selectedLabels.includes(label.id) ? 'white' : undefined,
                }}
                onClick={() => toggleLabel(label.id)}
              >
                {label.emoji && <span>{label.emoji}</span>}
                {label.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Attachments placeholder */}
      <div className="space-y-2">
        <FormLabel className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          Attachments
        </FormLabel>
        <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground text-sm">
          <p>Drag and drop files here or click to upload</p>
          <p className="text-xs mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  );
  
  // Mobile: Sheet, Desktop: Dialog
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>{task ? 'Edit Task' : 'New Task'}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="py-4">
              {formContent}
            </form>
          </ScrollArea>
          <SheetFooter className="flex-row gap-2">
            {task && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                className="flex-1"
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" form="task-form" className="flex-1">
              {task ? 'Save' : 'Create'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
          <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="py-4">
            {formContent}
          </form>
        </ScrollArea>
        <DialogFooter>
          {task && onDelete && (
            <Button type="button" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="task-form">
            {task ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
