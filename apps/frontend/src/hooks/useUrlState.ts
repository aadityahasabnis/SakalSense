// =============================================
// useUrlState Hook - URL-synced state management
// =============================================
// Hooks for syncing state with URL search params

'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * Manage tabs via URL search params
 * @param defaultTab - The default tab value
 * @param paramName - The URL param name (default: 'tab')
 * @returns [currentTab, setTab] tuple
 *
 * @example
 * const [tab, setTab] = useUrlTabs<'overview' | 'activity'>('overview');
 *
 * <Tabs value={tab} onValueChange={setTab}>
 *   <TabsTrigger value="overview">Overview</TabsTrigger>
 *   <TabsTrigger value="activity">Activity</TabsTrigger>
 * </Tabs>
 */
export function useUrlTabs<T extends string>(
    defaultTab: T,
    paramName: string = 'tab'
): [T, (tab: T) => void] {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentTab = (searchParams.get(paramName) as T) ?? defaultTab;

    const setTab = useCallback(
        (tab: T) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(paramName, tab);
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams, paramName]
    );

    return [currentTab, setTab];
}

/**
 * Manage pagination via URL search params
 * @param defaultPage - The default page number (default: 1)
 * @param paramName - The URL param name (default: 'page')
 * @returns [page, setPage] tuple
 *
 * @example
 * const [page, setPage] = useUrlPage();
 *
 * <Pagination page={page} onPageChange={setPage} totalPages={10} />
 */
export function useUrlPage(
    defaultPage: number = 1,
    paramName: string = 'page'
): [number, (page: number) => void] {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentPage = Number(searchParams.get(paramName)) || defaultPage;

    const setPage = useCallback(
        (page: number) => {
            const params = new URLSearchParams(searchParams.toString());
            if (page === 1) {
                params.delete(paramName);
            } else {
                params.set(paramName, String(page));
            }
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams, paramName]
    );

    return [currentPage, setPage];
}

/**
 * Generic URL search param state management
 * @param paramName - The URL param name
 * @param defaultValue - The default value
 * @returns [value, setValue] tuple
 *
 * @example
 * const [sort, setSort] = useUrlParam('sort', 'newest');
 * const [filter, setFilter] = useUrlParam('filter', '');
 */
export function useUrlParam<T extends string>(
    paramName: string,
    defaultValue: T
): [T, (value: T) => void] {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentValue = (searchParams.get(paramName) as T) ?? defaultValue;

    const setValue = useCallback(
        (value: T) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === defaultValue || value === '') {
                params.delete(paramName);
            } else {
                params.set(paramName, value);
            }
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams, paramName, defaultValue]
    );

    return [currentValue, setValue];
}

/**
 * Manage multiple URL params at once
 * @returns Object with getParam, setParam, setParams functions
 *
 * @example
 * const { getParam, setParams } = useUrlParams();
 *
 * const sort = getParam('sort', 'newest');
 * setParams({ sort: 'oldest', page: '2' });
 */
export function useUrlParams() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const getParam = useCallback(
        <T extends string>(key: string, defaultValue: T): T => {
            return (searchParams.get(key) as T) ?? defaultValue;
        },
        [searchParams]
    );

    const setParam = useCallback(
        (key: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === null || value === '') {
                params.delete(key);
            } else {
                params.set(key, value);
            }
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams]
    );

    const setParams = useCallback(
        (updates: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString());
            Object.entries(updates).forEach(([key, value]) => {
                if (value === null || value === '') {
                    params.delete(key);
                } else {
                    params.set(key, value);
                }
            });
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams]
    );

    return { getParam, setParam, setParams, searchParams };
}
