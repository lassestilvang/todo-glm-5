/**
 * useMediaQuery Hook
 * 
 * Custom hook for responsive breakpoint detection with:
 * - SSR-safe implementation
 * - Multiple breakpoint support
 * - Debounced resize handling
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================
// BREAKPOINTS
// ============================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// ============================================
// MAIN HOOK
// ============================================

/**
 * Hook to check if a media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      return;
    }
    
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);
    
    // Create event handler
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add listener
    mediaQuery.addEventListener('change', handler);
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);
  
  return matches;
}

// ============================================
// BREAKPOINT HOOKS
// ============================================

/**
 * Hook to check if screen is at least a certain breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const query = useMemo(
    () => `(min-width: ${BREAKPOINTS[breakpoint]}px)`,
    [breakpoint]
  );
  
  return useMediaQuery(query);
}

/**
 * Hook to check if screen is smaller than a certain breakpoint
 */
export function useBreakpointDown(breakpoint: Breakpoint): boolean {
  const query = useMemo(
    () => `(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`,
    [breakpoint]
  );
  
  return useMediaQuery(query);
}

/**
 * Hook to check if screen is between two breakpoints
 */
export function useBreakpointBetween(
  minBreakpoint: Breakpoint, 
  maxBreakpoint: Breakpoint
): boolean {
  const query = useMemo(
    () => `(min-width: ${BREAKPOINTS[minBreakpoint]}px) and (max-width: ${BREAKPOINTS[maxBreakpoint] - 1}px)`,
    [minBreakpoint, maxBreakpoint]
  );
  
  return useMediaQuery(query);
}

// ============================================
// RESPONSIVE HOOKS
// ============================================

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  
  // Specific breakpoints
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  
  // Current breakpoint
  currentBreakpoint: Breakpoint;
  
  // Screen dimensions
  screenWidth: number;
  screenHeight: number;
}

/**
 * Hook to get all responsive states at once
 */
export function useResponsive(): ResponsiveState {
  // Initialize with safe defaults for SSR
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Set initial dimensions
    handleResize();
    
    // Add resize listener with debounce
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);
  
  // Calculate breakpoint states
  const { width } = dimensions;
  
  const isSm = width >= BREAKPOINTS.sm;
  const isMd = width >= BREAKPOINTS.md;
  const isLg = width >= BREAKPOINTS.lg;
  const isXl = width >= BREAKPOINTS.xl;
  const is2xl = width >= BREAKPOINTS['2xl'];
  
  // Determine current breakpoint
  const currentBreakpoint: Breakpoint = useMemo(() => {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'sm';
  }, [width]);
  
  return {
    isMobile: width > 0 && width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isLargeDesktop: width >= BREAKPOINTS.xl,
    
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    
    currentBreakpoint,
    
    screenWidth: width,
    screenHeight: dimensions.height,
  };
}

/**
 * Hook to check if device is mobile
 */
export function useIsMobile(): boolean {
  return useBreakpointDown('md');
}

/**
 * Hook to check if device is tablet
 */
export function useIsTablet(): boolean {
  return useBreakpointBetween('md', 'lg');
}

/**
 * Hook to check if device is desktop
 */
export function useIsDesktop(): boolean {
  return useBreakpoint('lg');
}

// ============================================
// ORIENTATION HOOKS
// ============================================

/**
 * Hook to check device orientation
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
}

/**
 * Hook to check if device is in portrait mode
 */
export function useIsPortrait(): boolean {
  return useMediaQuery('(orientation: portrait)');
}

/**
 * Hook to check if device is in landscape mode
 */
export function useIsLandscape(): boolean {
  return useMediaQuery('(orientation: landscape)');
}

// ============================================
// PREFERENCE HOOKS
// ============================================

/**
 * Hook to check if user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook to check if user prefers light mode
 */
export function usePrefersLightMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: light)');
}

/**
 * Hook to check if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to check if user prefers high contrast
 */
export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: more)');
}

// ============================================
// INPUT HOOKS
// ============================================

/**
 * Hook to check if device supports touch
 */
export function useHasTouch(): boolean {
  const [hasTouch, setHasTouch] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    const checkTouch = () => {
      setHasTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );
    };
    
    checkTouch();
  }, []);
  
  return hasTouch;
}

/**
 * Hook to check if primary input is pointer (mouse)
 */
export function useIsPointer(): boolean {
  return useMediaQuery('(pointer: fine)');
}

/**
 * Hook to check if primary input is coarse (touch)
 */
export function useIsCoarse(): boolean {
  return useMediaQuery('(pointer: coarse)');
}

/**
 * Hook to check if device can hover
 */
export function useCanHover(): boolean {
  return useMediaQuery('(hover: hover)');
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook to get a value based on current breakpoint
 */
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T {
  const { currentBreakpoint } = useResponsive();
  
  // Check from largest to smallest
  const breakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
  
  const currentIndex = breakpoints.indexOf(currentBreakpoint);
  
  for (let i = currentIndex; i < breakpoints.length; i++) {
    const bp = breakpoints[i];
    if (values[bp] !== undefined) {
      return values[bp] as T;
    }
  }
  
  return defaultValue;
}

/**
 * Hook to get responsive props based on breakpoint
 */
export function useResponsiveProps<T extends Record<string, unknown>>(
  props: T & Partial<Record<Breakpoint, Partial<T>>>
): T {
  const { currentBreakpoint } = useResponsive();
  
  const breakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
  const currentIndex = breakpoints.indexOf(currentBreakpoint);
  
  let result = { ...props };
  
  // Apply breakpoint props from smallest to largest
  for (let i = breakpoints.length - 1; i >= currentIndex; i--) {
    const bp = breakpoints[i];
    const bpProps = props[bp];
    if (bpProps) {
      result = { ...result, ...bpProps };
    }
  }
  
  // Remove breakpoint keys from result
  breakpoints.forEach((bp) => {
    delete result[bp];
  });
  
  return result;
}
