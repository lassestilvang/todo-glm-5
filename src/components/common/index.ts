/**
 * Common Components
 * 
 * Export all shared/common components.
 */

export { ColorDot } from './ColorDot';
export type { ColorDotProps } from './ColorDot';

export { ConfirmDialog } from './ConfirmDialog';

export { EmptyState } from './EmptyState';

export { LoadingSpinner } from './LoadingSpinner';

export { Logo } from './Logo';

export { SearchDialog } from './SearchDialog';

// Page Transition Components
export {
  PageTransition,
  PageTransitionWrapper,
  StaggerContainer,
  StaggerItem,
  FadeIn,
  SlideIn,
  ScaleIn,
  PresenceWrapper,
} from './PageTransition';

// Skeleton Components
export {
  Skeleton,
  TaskSkeleton,
  TaskListSkeleton,
  ListSkeleton,
  SidebarSkeleton,
} from './Skeleton';

// Theme Toggle
export { ThemeToggle, ThemeToggleSkeleton } from './ThemeToggle';

// Overdue Badge
export { OverdueBadge, OverdueIndicator } from './OverdueBadge';

// Toast
export { ToastProvider, useToast, useToastActions } from './Toast';
