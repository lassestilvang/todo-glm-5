/**
 * Root Layout
 * 
 * Main application layout with:
 * - Theme provider
 * - Metadata configuration
 * - Font setup (Inter)
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import './globals.css';

// ============================================
// FONT CONFIGURATION
// ============================================

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// ============================================
// METADATA
// ============================================

export const metadata: Metadata = {
  title: {
    default: 'TaskFlow - Daily Task Planner',
    template: '%s | TaskFlow',
  },
  description: 'A modern, professional daily task planner with lists, priorities, due dates, and multiple views.',
  keywords: [
    'task planner',
    'todo app',
    'productivity',
    'task management',
    'daily planner',
    'organization',
  ],
  authors: [{ name: 'TaskFlow Team' }],
  creator: 'TaskFlow',
  metadataBase: new URL('https://taskflow.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://taskflow.app',
    title: 'TaskFlow - Daily Task Planner',
    description: 'A modern, professional daily task planner with lists, priorities, due dates, and multiple views.',
    siteName: 'TaskFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskFlow - Daily Task Planner',
    description: 'A modern, professional daily task planner with lists, priorities, due dates, and multiple views.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
};

// ============================================
// ROOT LAYOUT COMPONENT
// ============================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={inter.variable}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          defaultTheme="system"
          storageKey="taskflow-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
