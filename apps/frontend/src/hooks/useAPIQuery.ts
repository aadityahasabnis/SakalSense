// =============================================
// useAPIQuery - React Query hook for GET requests
// =============================================

'use client';

import { type IApiResponse, type FormDataType } from '@sakalsense/core';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiCall } from '@/lib/api';

// =============================================
// Configuration
// =============================================

const QUERY_CONFIG = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    maxRetries: 3,
    retryDelay: 1000,
} as const;

// =============================================
// Types & Interfaces
// =============================================

interface IWithFetcher<TFetcher extends (..._args: ReadonlyArray<never>) => Promise<unknown>> {
    url: string | undefined;
    fetcher: TFetcher;
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
}

interface IWithoutFetcher {
    url: string | undefined;
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
}

type InferQueryResult<TOptions, T> =
    TOptions extends IWithFetcher<infer TFetcher> ? (TFetcher extends (...args: ReadonlyArray<never>) => Promise<infer TReturn> ? UseQueryResult<TReturn, Error> : never) : UseQueryResult<T, Error>;

// =============================================
// Hook Implementation
// =============================================

export const useAPIQuery = <T extends FormDataType = FormDataType, TOptions extends IWithFetcher<(...args: ReadonlyArray<never>) => Promise<unknown>> | IWithoutFetcher = IWithoutFetcher>(
    options: TOptions,
): InferQueryResult<TOptions, T> => {
    const { url, staleTime, gcTime, enabled = true } = options;
    const hasFetcher = 'fetcher' in options;

    return useQuery({
        queryKey: hasFetcher ? [String(url)] : [url],
        queryFn: hasFetcher
            ? async () => (options as Extract<TOptions, { fetcher: unknown }>).fetcher()
            : async () => {
                  if (!url) return undefined;
                  const response: IApiResponse<T> = await apiCall<T>({ method: 'GET', url });
                  if (!response.success) throw new Error(response.error ?? 'Request failed');
                  return response.data;
              },
        enabled: enabled && !!url,
        staleTime: staleTime ?? QUERY_CONFIG.staleTime,
        gcTime: gcTime ?? QUERY_CONFIG.gcTime,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: (failureCount) => failureCount < QUERY_CONFIG.maxRetries,
        retryDelay: QUERY_CONFIG.retryDelay,
    }) as InferQueryResult<TOptions, T>;
};
