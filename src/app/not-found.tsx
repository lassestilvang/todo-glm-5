/**
 * 404 Not Found Page
 * 
 * Custom not found page with:
 * - Animated illustration
 * - Link back to home
 * - Helpful suggestions
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const floatVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

// ============================================
// COMPONENT
// ============================================

export default function NotFound() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full text-center"
      >
        {/* Illustration */}
        <motion.div
          variants={prefersReducedMotion ? undefined : floatVariants}
          animate={prefersReducedMotion ? undefined : 'animate'}
          className="mb-8"
        >
          <div className="relative inline-block">
            {/* 404 Text */}
            <motion.h1
              variants={itemVariants}
              className="text-[120px] md:text-[160px] font-bold leading-none text-muted-foreground/20 select-none"
            >
              404
            </motion.h1>
            
            {/* Floating elements */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ rotate: 0 }}
              animate={prefersReducedMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <div className="relative w-32 h-32">
                <motion.div
                  className="absolute top-0 left-1/2 -translate-x-1/2"
                  animate={prefersReducedMotion ? undefined : { scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Calendar className="h-8 w-8 text-primary" />
                </motion.div>
                <motion.div
                  className="absolute bottom-0 left-0"
                  animate={prefersReducedMotion ? undefined : { scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                >
                  <Search className="h-6 w-6 text-muted-foreground" />
                </motion.div>
                <motion.div
                  className="absolute bottom-0 right-0"
                  animate={prefersReducedMotion ? undefined : { scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                >
                  <Home className="h-7 w-7 text-primary/60" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Content */}
        <motion.div variants={itemVariants} className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
        </motion.div>
        
        {/* Actions */}
        <motion.div variants={itemVariants} className="space-y-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/today">
              <Home className="h-4 w-4 mr-2" />
              Go to Today
            </Link>
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="/all">
                <Calendar className="h-4 w-4 mr-2" />
                All Tasks
              </Link>
            </Button>
            
            <Button asChild variant="outline">
              <Link href="/search">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Link>
            </Button>
          </div>
        </motion.div>
        
        {/* Back link */}
        <motion.div variants={itemVariants} className="mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
