/**
 * ConfirmDialog Component
 * 
 * Reusable confirmation dialog with:
 * - Customizable title and description
 * - Confirm and cancel actions
 * - Destructive variant for dangerous actions
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  icon?: React.ElementType;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  icon,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Reset loading state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsLoading(false);
    }
  }, [open]);
  
  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Confirm action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };
  
  // Get icon based on variant
  const Icon = icon || {
    default: Info,
    destructive: AlertTriangle,
    warning: AlertTriangle,
    success: CheckCircle,
  }[variant];
  
  // Get icon color based on variant
  const iconColor = {
    default: 'text-primary',
    destructive: 'text-destructive',
    warning: 'text-amber-500',
    success: 'text-green-500',
  }[variant];
  
  // Get confirm button variant
  const confirmVariant = variant === 'destructive' ? 'destructive' : 'default';
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', iconColor)} />
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription>
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading || loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || loading}
            className={cn(
              confirmVariant === 'destructive' && 
              'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
          >
            {(isLoading || loading) ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                />
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================
// CONFIRM DIALOG HOOK
// ============================================

interface UseConfirmDialogOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  onConfirm: () => void | Promise<void>;
}

export function useConfirmDialog(options: UseConfirmDialogOptions) {
  const [isOpen, setIsOpen] = useState(false);
  
  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);
  
  const dialog = (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={options.title}
      description={options.description}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      variant={options.variant}
      onConfirm={options.onConfirm}
    />
  );
  
  return { openDialog, closeDialog, dialog };
}

// ============================================
// DELETE CONFIRMATION DIALOG
// ============================================

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = 'Delete item?',
  description,
  itemName,
  onConfirm,
  loading,
}: DeleteConfirmDialogProps) {
  const defaultDescription = itemName
    ? `This will permanently delete "${itemName}". This action cannot be undone.`
    : 'This action cannot be undone.';
  
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description || defaultDescription}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="destructive"
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

// ============================================
// SIMPLE CONFIRM DIALOG
// ============================================

interface SimpleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function SimpleConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
}: SimpleConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================
// UNSAVED CHANGES DIALOG
// ============================================

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSave?: () => void | Promise<void>;
  hasSave?: boolean;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  onSave,
  hasSave = true,
}: UnsavedChangesDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Do you want to save them before leaving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            Discard
          </AlertDialogCancel>
          {hasSave && (
            <AlertDialogAction onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================
// TOAST CONFIRMATION (inline)
// ============================================

interface InlineConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

export function InlineConfirm({
  onConfirm,
  onCancel,
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: InlineConfirmProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        'flex items-center gap-2 rounded-lg border p-2 shadow-lg',
        variant === 'destructive' 
          ? 'border-destructive/50 bg-destructive/10' 
          : 'border-border bg-background'
      )}
    >
      <span className="flex-1 text-sm">{message}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={onCancel}
        className="h-7"
      >
        {cancelLabel}
      </Button>
      <Button
        size="sm"
        variant={variant === 'destructive' ? 'destructive' : 'default'}
        onClick={onConfirm}
        className="h-7"
      >
        {confirmLabel}
      </Button>
    </motion.div>
  );
}
