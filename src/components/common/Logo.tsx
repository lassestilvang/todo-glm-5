/**
 * Logo Component
 * 
 * App logo with animation
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { List, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WithClassName } from '@/types';

// ============================================
// TYPES
// ============================================

interface LogoProps extends WithClassName {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
  href?: string;
}

// ============================================
// COMPONENT
// ============================================

export function Logo({
  size = 'md',
  showText = true,
  animated = true,
  href = '/today',
  className,
}: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', text: 'text-lg', container: 'gap-1.5' },
    md: { icon: 'h-8 w-8', text: 'text-xl', container: 'gap-2' },
    lg: { icon: 'h-10 w-10', text: 'text-2xl', container: 'gap-2.5' },
  };
  
  const sizes = sizeClasses[size];
  
  const content = (
    <div className={cn('flex items-center', sizes.container, className)}>
      {/* Icon container */}
      <motion.div
        className={cn(
          'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
          sizes.icon
        )}
        initial={animated ? { scale: 0, rotate: -180 } : false}
        animate={animated ? { scale: 1, rotate: 0 } : false}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        <List className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
      </motion.div>
      
      {/* Text */}
      {showText && (
        <motion.span
          className={cn('font-semibold tracking-tight', sizes.text)}
          initial={animated ? { opacity: 0, x: -10 } : false}
          animate={animated ? { opacity: 1, x: 0 } : false}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          TaskFlow
        </motion.span>
      )}
    </div>
  );
  
  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }
  
  return content;
}

// ============================================
// ANIMATED LOGO (with check animation)
// ============================================

interface AnimatedLogoProps extends WithClassName {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function AnimatedLogo({ 
  size = 'md', 
  showText = true,
  className 
}: AnimatedLogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', text: 'text-lg', container: 'gap-1.5' },
    md: { icon: 'h-8 w-8', text: 'text-xl', container: 'gap-2' },
    lg: { icon: 'h-10 w-10', text: 'text-2xl', container: 'gap-2.5' },
  };
  
  const sizes = sizeClasses[size];
  
  return (
    <div className={cn('flex items-center', sizes.container, className)}>
      {/* Animated icon */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
          sizes.icon
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        <List className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
        
        {/* Check mark that animates in */}
        <motion.div
          className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 500, damping: 20 }}
        >
          <CheckCircle2 className="h-3 w-3" />
        </motion.div>
      </motion.div>
      
      {/* Text */}
      {showText && (
        <motion.span
          className={cn('font-semibold tracking-tight', sizes.text)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          TaskFlow
        </motion.span>
      )}
    </div>
  );
}

// ============================================
// LOGO ICON ONLY
// ============================================

interface LogoIconProps extends WithClassName {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function LogoIcon({ size = 'md', animated = true, className }: LogoIconProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };
  
  return (
    <motion.div
      className={cn(
        'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
        sizeClasses[size],
        className
      )}
      initial={animated ? { scale: 0, rotate: -180 } : false}
      animate={animated ? { scale: 1, rotate: 0 } : false}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
    >
      <List className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
    </motion.div>
  );
}

// ============================================
// LOADING LOGO
// ============================================

interface LoadingLogoProps extends WithClassName {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingLogo({ size = 'md', className }: LoadingLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };
  
  return (
    <motion.div
      className={cn(
        'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
        sizeClasses[size],
        className
      )}
      animate={{
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <List className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
    </motion.div>
  );
}

// ============================================
// LOGO MARK (for splash/loading screens)
// ============================================

export function LogoMark({ className }: WithClassName) {
  return (
    <motion.div
      className={cn(
        'relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground',
        className
      )}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
    >
      <List className="h-10 w-10" />
      
      {/* Decorative elements */}
      <motion.div
        className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-green-500"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      />
      <motion.div
        className="absolute -bottom-2 -left-2 h-3 w-3 rounded-full bg-blue-500"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      />
    </motion.div>
  );
}
