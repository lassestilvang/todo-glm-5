/**
 * NavItem Component
 * 
 * Single navigation item with:
 * - Icon, label, badge support
 * - Active state
 * - Hover effects
 * - Collapsed state support
 */

'use client';

import { forwardRef, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

interface NavItemProps extends WithClassName {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  badge?: number | string;
  badgeVariant?: 'default' | 'destructive' | 'success' | 'warning';
  onClick?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  (
    {
      href,
      icon: Icon,
      label,
      isActive = false,
      isCollapsed = false,
      badge,
      badgeVariant = 'default',
      className,
      onClick,
    },
    ref
  ) => {
    // Badge styles based on variant
    const badgeStyles = useMemo(() => {
      switch (badgeVariant) {
        case 'destructive':
          return 'bg-destructive text-destructive-foreground';
        case 'success':
          return 'bg-green-500 text-white';
        case 'warning':
          return 'bg-amber-500 text-white';
        default:
          return 'bg-muted text-muted-foreground';
      }
    }, [badgeVariant]);
    
    // Collapsed state - icon only
    if (isCollapsed) {
      return (
        <Link
          ref={ref}
          href={href}
          onClick={onClick}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors mx-auto relative',
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'hover:bg-sidebar-accent/50 text-sidebar-foreground',
            className
          )}
          title={label}
          aria-current={isActive ? 'page' : undefined}
        >
          <Icon className="h-5 w-5" />
          
          {/* Badge indicator for collapsed state */}
          {badge !== undefined && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium',
                badgeStyles
              )}
            >
              {typeof badge === 'number' && badge > 99 ? '99+' : badge}
            </span>
          )}
        </Link>
      );
    }
    
    // Expanded state - full item
    return (
      <Link
        ref={ref}
        href={href}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'hover:bg-sidebar-accent/50 text-sidebar-foreground',
          className
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeNavItem"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        
        <Icon className="h-5 w-5 shrink-0" />
        
        <span className="flex-1 truncate">{label}</span>
        
        {/* Badge */}
        {badge !== undefined && (
          <span
            className={cn(
              'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
              badgeStyles
            )}
          >
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    );
  }
);

NavItem.displayName = 'NavItem';

// ============================================
// NAV ITEM BUTTON (for non-link items)
// ============================================

interface NavItemButtonProps extends WithClassName {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  badge?: number | string;
  badgeVariant?: 'default' | 'destructive' | 'success' | 'warning';
  onClick: () => void;
}

export const NavItemButton = forwardRef<HTMLButtonElement, NavItemButtonProps>(
  (
    {
      icon: Icon,
      label,
      isActive = false,
      isCollapsed = false,
      badge,
      badgeVariant = 'default',
      className,
      onClick,
    },
    ref
  ) => {
    // Badge styles based on variant
    const badgeStyles = useMemo(() => {
      switch (badgeVariant) {
        case 'destructive':
          return 'bg-destructive text-destructive-foreground';
        case 'success':
          return 'bg-green-500 text-white';
        case 'warning':
          return 'bg-amber-500 text-white';
        default:
          return 'bg-muted text-muted-foreground';
      }
    }, [badgeVariant]);
    
    // Collapsed state - icon only
    if (isCollapsed) {
      return (
        <button
          ref={ref}
          onClick={onClick}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors mx-auto relative',
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'hover:bg-sidebar-accent/50 text-sidebar-foreground',
            className
          )}
          title={label}
        >
          <Icon className="h-5 w-5" />
          
          {badge !== undefined && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium',
                badgeStyles
              )}
            >
              {typeof badge === 'number' && badge > 99 ? '99+' : badge}
            </span>
          )}
        </button>
      );
    }
    
    // Expanded state - full item
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'hover:bg-sidebar-accent/50 text-sidebar-foreground',
          className
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        
        <span className="flex-1 truncate text-left">{label}</span>
        
        {badge !== undefined && (
          <span
            className={cn(
              'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
              badgeStyles
            )}
          >
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    );
  }
);

NavItemButton.displayName = 'NavItemButton';

// ============================================
// NAV ITEM GROUP
// ============================================

interface NavItemGroupProps extends WithClassName {
  title?: string;
  children: React.ReactNode;
}

export function NavItemGroup({ title, children, className }: NavItemGroupProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {title && (
        <h3 className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

// ============================================
// NAV DIVIDER
// ============================================

export function NavDivider() {
  return <div className="my-2 h-px bg-border" />;
}
