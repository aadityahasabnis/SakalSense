// =============================================
// usePagination Hook - Pagination state management
// =============================================
// Hook for managing local pagination state

'use client';

import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
    initialPage?: number;
    pageSize?: number;
}

interface UsePaginationReturn<T> {
    // Current state
    page: number;
    pageSize: number;
    totalPages: number;
    total: number;

    // Derived data
    paginatedData: T[];
    startIndex: number;
    endIndex: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;

    // Actions
    setPage: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    firstPage: () => void;
    lastPage: () => void;
    setPageSize: (size: number) => void;

    // Page numbers for UI
    pageNumbers: number[];
}

/**
 * Client-side pagination for in-memory data
 * @param data - The full array of data to paginate
 * @param options - Pagination options
 * @returns Pagination state and controls
 *
 * @example
 * const { paginatedData, page, totalPages, setPage, hasNextPage } = usePagination(users, {
 *   initialPage: 1,
 *   pageSize: 10
 * });
 */
export function usePagination<T>(
    data: T[],
    options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
    const { initialPage = 1, pageSize: initialPageSize = 10 } = options;

    const [page, setPageState] = useState(initialPage);
    const [pageSize, setPageSizeState] = useState(initialPageSize);

    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);

    // Ensure page is within bounds
    const boundedPage = useMemo(() => {
        if (totalPages === 0) return 1;
        if (page > totalPages) return totalPages;
        if (page < 1) return 1;
        return page;
    }, [page, totalPages]);

    // Update page if it goes out of bounds
    if (boundedPage !== page) {
        setPageState(boundedPage);
    }

    const startIndex = (boundedPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);

    const paginatedData = useMemo(() => {
        return data.slice(startIndex, endIndex);
    }, [data, startIndex, endIndex]);

    const hasNextPage = boundedPage < totalPages;
    const hasPreviousPage = boundedPage > 1;

    const setPage = useCallback(
        (newPage: number) => {
            const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
            setPageState(validPage);
        },
        [totalPages]
    );

    const nextPage = useCallback(() => {
        if (hasNextPage) {
            setPageState((p) => p + 1);
        }
    }, [hasNextPage]);

    const previousPage = useCallback(() => {
        if (hasPreviousPage) {
            setPageState((p) => p - 1);
        }
    }, [hasPreviousPage]);

    const firstPage = useCallback(() => {
        setPageState(1);
    }, []);

    const lastPage = useCallback(() => {
        setPageState(totalPages || 1);
    }, [totalPages]);

    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setPageState(1); // Reset to first page when changing page size
    }, []);

    // Generate page numbers for UI (max 5 pages shown)
    const pageNumbers = useMemo(() => {
        const maxVisible = 5;
        const pages: number[] = [];

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else if (boundedPage <= 3) {
            for (let i = 1; i <= maxVisible; i++) {
                pages.push(i);
            }
        } else if (boundedPage >= totalPages - 2) {
            for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            for (let i = boundedPage - 2; i <= boundedPage + 2; i++) {
                pages.push(i);
            }
        }

        return pages;
    }, [totalPages, boundedPage]);

    return {
        page: boundedPage,
        pageSize,
        totalPages,
        total,
        paginatedData,
        startIndex,
        endIndex,
        hasNextPage,
        hasPreviousPage,
        setPage,
        nextPage,
        previousPage,
        firstPage,
        lastPage,
        setPageSize,
        pageNumbers,
    };
}

interface UseInfiniteScrollOptions {
    initialLimit?: number;
    step?: number;
}

interface UseInfiniteScrollReturn<T> {
    visibleData: T[];
    hasMore: boolean;
    loadMore: () => void;
    reset: () => void;
    limit: number;
    total: number;
}

/**
 * Infinite scroll / load more for in-memory data
 * @param data - The full array of data
 * @param options - Options for initial limit and step size
 * @returns Visible data slice and controls
 *
 * @example
 * const { visibleData, hasMore, loadMore } = useInfiniteScroll(activities, {
 *   initialLimit: 10,
 *   step: 10
 * });
 *
 * {hasMore && <Button onClick={loadMore}>Load More</Button>}
 */
export function useInfiniteScroll<T>(
    data: T[],
    options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn<T> {
    const { initialLimit = 10, step = 10 } = options;

    const [limit, setLimit] = useState(initialLimit);
    const total = data.length;

    const visibleData = useMemo(() => {
        return data.slice(0, limit);
    }, [data, limit]);

    const hasMore = limit < total;

    const loadMore = useCallback(() => {
        setLimit((prev) => Math.min(prev + step, total));
    }, [step, total]);

    const reset = useCallback(() => {
        setLimit(initialLimit);
    }, [initialLimit]);

    return {
        visibleData,
        hasMore,
        loadMore,
        reset,
        limit,
        total,
    };
}
