'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from 'next-themes';

/**
 * Professional toast notification component using Sonner
 * Matches SakalSense theme with OKLCH colors
 * Auto-adapts to light/dark mode
 */
export const Toaster = (): React.ReactElement => {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark' | 'system'}
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'group toast',
          title: 'text-sm font-medium',
          description: 'text-sm opacity-90',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: 'bg-background border-border text-foreground hover:bg-muted',
          success: 'bg-card text-card-foreground border border-border',
          error: 'bg-destructive/10 text-destructive border border-destructive/20',
          warning: 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800',
          info: 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800',
        },
        style: {
          borderRadius: 'var(--radius)',
          fontSize: '14px',
          padding: '12px 16px',
        },
      }}
    />
  );
};
