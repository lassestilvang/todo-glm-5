'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'taskflow-theme'
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure theme is applied after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange={false}
      storageKey={storageKey}
      nonce={typeof window !== 'undefined' ? undefined : undefined}
    >
      {children}
    </NextThemesProvider>
  );
}
