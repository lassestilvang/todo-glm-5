/**
 * Toast Component
 * 
 * Animated toast notifications with:
 * - Slide in/out animations
 * - Success, error, warning, info variants
 * - Auto-dismiss with progress bar
 * - Manual dismiss option
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// ============================================
// TYPES
// ============================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ============================================
// CONTEXT
// ============================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const toastVariants = {
  initial: (isTop: boolean) => ({
    y: isTop ? -100 : 100,
    opacity: 0,
    scale: 0.9,
  }),
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: (isTop: boolean) => ({
    y: isTop ? -100 : 100,
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  }),
};

// ============================================
// TOAST CONFIG
// ============================================

const toastConfig = {
  success: {
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
    iconClassName: 'text-green-500',
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    iconClassName: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    iconClassName: 'text-yellow-500',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
    iconClassName: 'text-blue-500',
  },
};

// ============================================
// TOAST ITEM COMPONENT
// ============================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
  position?: 'top' | 'bottom';
}

function ToastItem({ toast, onDismiss, position = 'bottom' }: ToastItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const config = toastConfig[toast.type];
  const Icon = config.icon;
  const duration = toast.duration || 5000;
  
  return (
    <motion.div
      custom={position === 'top'}
      variants={prefersReducedMotion ? undefined : toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md w-full',
        config.className
      )}
    >
      {/* Progress bar */}
      {duration > 0 && !prefersReducedMotion && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
      
      {/* Icon */}
      <motion.div
        initial={prefersReducedMotion ? undefined : { scale: 0 }}
        animate={prefersReducedMotion ? undefined : { scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Icon className={cn('h-5 w-5 shrink-0', config.iconClassName)} />
      </motion.div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.description && (
          <p className="text-sm opacity-80 mt-0.5">{toast.description}</p>
        )}
      </div>
      
      {/* Dismiss button */}
      <motion.button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
}

// ============================================
// TOAST PROVIDER
// ============================================

interface ToastProviderProps {
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export function ToastProvider({ children, position = 'bottom' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto dismiss
    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      
      {/* Toast container */}
      <div
        className={cn(
          'fixed z-50 flex flex-col gap-2 p-4 pointer-events-none',
          position === 'top' ? 'top-0 left-1/2 -translate-x-1/2' : 'bottom-0 left-1/2 -translate-x-1/2',
          'max-h-screen overflow-hidden'
        )}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={removeToast} position={position} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ============================================
// CONVENIENCE HOOKS
// ============================================

export function useToastActions() {
  const { addToast } = useToast();
  
  return {
    success: (title: string, description?: string) => 
      addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) => 
      addToast({ type: 'error', title, description }),
    warning: (title: string, description?: string) => 
      addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) => 
      addToast({ type: 'info', title, description }),
  };
}
