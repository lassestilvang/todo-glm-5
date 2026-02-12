"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// ============================================
// ANIMATION VARIANTS
// ============================================

const checkVariants = {
  unchecked: {
    pathLength: 0,
    opacity: 0,
  },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: 'spring' as const, stiffness: 400, damping: 25 },
      opacity: { duration: 0.1 },
    },
  },
};

const checkboxVariants = {
  unchecked: { scale: 1 },
  checked: {
    scale: [1, 0.9, 1.1, 1],
    transition: {
      duration: 0.3,
      times: [0, 0.3, 0.6, 1],
    },
  },
};

// ============================================
// ANIMATED CHECK ICON
// ============================================

function AnimatedCheckIcon({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return <CheckIcon className={className} />;
  }
  
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <motion.path
        d="M2 7L5.5 10.5L12 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={checkVariants}
        initial="unchecked"
        animate="checked"
      />
    </motion.svg>
  );
}

// ============================================
// CHECKBOX COMPONENT
// ============================================

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
      >
        <AnimatePresence mode="wait">
          {props.checked === true && (
            <motion.div
              key="checked"
              initial={prefersReducedMotion ? undefined : { scale: 0, opacity: 0 }}
              animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <AnimatedCheckIcon className="size-3.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
