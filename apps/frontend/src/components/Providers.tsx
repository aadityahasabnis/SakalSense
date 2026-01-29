'use client';

import { type JSX, type ReactNode, useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Toaster } from '@/components/notifications/Toaster';

interface ProvidersProps {
    children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps): JSX.Element => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        gcTime: 10 * 60 * 1000, // 10 minutes
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster />
                <SpeedInsights />
            </QueryClientProvider>
        </ThemeProvider>
    );
};
