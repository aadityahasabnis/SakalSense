'use client';

import { type JSX, type ReactNode, useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
