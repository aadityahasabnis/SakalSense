// =============================================
// useBookmarks - React hook for bookmark operations
// =============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';

import {
    addLocalBookmarkAtom,
    addNotificationAtom,
    removeLocalBookmarkAtom,
    updateEngagementCacheAtom,
} from '@/jotai/atoms';
import {
    checkBookmarkStatus,
    getUserBookmarks,
    removeBookmarks,
    toggleBookmark,
} from '@/server/actions/engagement/bookmarkActions';

// =============================================
// Types
// =============================================

interface IUseBookmarksOptions {
    page?: number;
    limit?: number;
    enabled?: boolean;
}

interface IBookmarkContent {
    contentId: string;
    slug: string;
    title: string;
    type: string;
}

// =============================================
// Hook: useBookmarkStatus - Check if content is bookmarked
// =============================================

export const useBookmarkStatus = (contentId: string, enabled = true) => {
    return useQuery({
        queryKey: ['bookmark-status', contentId],
        queryFn: () => checkBookmarkStatus(contentId),
        staleTime: 60000,
        enabled: enabled && !!contentId,
        select: (data) => ({
            isBookmarked: data.data?.isBookmarked ?? false,
            bookmarkId: data.data?.bookmarkId,
        }),
    });
};

// =============================================
// Hook: useToggleBookmark - Toggle bookmark state
// =============================================

export const useToggleBookmark = (content?: IBookmarkContent) => {
    const queryClient = useQueryClient();
    const [, addNotification] = useAtom(addNotificationAtom);
    const [, addLocalBookmark] = useAtom(addLocalBookmarkAtom);
    const [, removeLocalBookmark] = useAtom(removeLocalBookmarkAtom);
    const [, updateEngagementCache] = useAtom(updateEngagementCacheAtom);

    return useMutation({
        mutationFn: (contentId: string) => toggleBookmark(contentId),
        onMutate: async (contentId) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['bookmark-status', contentId] });

            // Snapshot previous value
            const previousStatus = queryClient.getQueryData(['bookmark-status', contentId]);

            // Optimistically update
            queryClient.setQueryData(['bookmark-status', contentId], (old: unknown) => {
                const prev = old as { data?: { isBookmarked: boolean } } | undefined;
                return {
                    success: true,
                    data: {
                        isBookmarked: !prev?.data?.isBookmarked,
                    },
                };
            });

            return { previousStatus };
        },
        onSuccess: (result, contentId) => {
            if (result.success && result.data) {
                // Update engagement cache
                updateEngagementCache({
                    contentId,
                    data: { isBookmarked: result.data.isBookmarked },
                });

                // Update local bookmarks for quick access
                if (result.data.isBookmarked && content) {
                    addLocalBookmark(content);
                } else {
                    removeLocalBookmark(contentId);
                }

                // Show notification
                addNotification({
                    type: 'success',
                    message: result.data.isBookmarked ? 'Added to bookmarks' : 'Removed from bookmarks',
                    duration: 2000,
                });
            }
        },
        onError: (_error, contentId, context) => {
            // Rollback on error
            if (context?.previousStatus) {
                queryClient.setQueryData(['bookmark-status', contentId], context.previousStatus);
            }

            addNotification({
                type: 'error',
                message: 'Failed to update bookmark',
                duration: 3000,
            });
        },
        onSettled: (_data, _error, contentId) => {
            // Refetch to ensure consistency
            void queryClient.invalidateQueries({ queryKey: ['bookmark-status', contentId] });
            void queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
        },
    });
};

// =============================================
// Hook: useUserBookmarks - Get user's bookmarked content
// =============================================

export const useUserBookmarks = (options: IUseBookmarksOptions = {}) => {
    const { page = 1, limit = 20, enabled = true } = options;

    return useQuery({
        queryKey: ['user-bookmarks', { page, limit }],
        queryFn: () => getUserBookmarks({ page, limit }),
        staleTime: 60000,
        enabled,
    });
};

// =============================================
// Hook: useRemoveBookmarks - Remove multiple bookmarks
// =============================================

export const useRemoveBookmarks = () => {
    const queryClient = useQueryClient();
    const [, addNotification] = useAtom(addNotificationAtom);

    return useMutation({
        mutationFn: (bookmarkIds: Array<string>) => removeBookmarks(bookmarkIds),
        onSuccess: (result, bookmarkIds) => {
            if (result.success) {
                // Remove from local bookmarks (we'd need content IDs, which we don't have here)
                // The query invalidation will refresh the list

                addNotification({
                    type: 'success',
                    message: `Removed ${bookmarkIds.length} bookmark${bookmarkIds.length > 1 ? 's' : ''}`,
                    duration: 2000,
                });
            }
        },
        onError: () => {
            addNotification({
                type: 'error',
                message: 'Failed to remove bookmarks',
                duration: 3000,
            });
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
        },
    });
};
