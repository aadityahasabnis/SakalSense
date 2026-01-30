// =============================================
// useLikes - React hook for like operations
// =============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';

import {
    addNotificationAtom,
    updateEngagementCacheAtom,
} from '@/jotai/atoms';
import {
    checkLikeStatus,
    getUserLikes,
    toggleLike,
} from '@/server/actions/engagement/likeActions';

// =============================================
// Types
// =============================================

interface IUseLikesOptions {
    page?: number;
    limit?: number;
    enabled?: boolean;
}

// =============================================
// Hook: useLikeStatus - Check if content is liked
// =============================================

export const useLikeStatus = (contentId: string, enabled = true) => {
    return useQuery({
        queryKey: ['like-status', contentId],
        queryFn: () => checkLikeStatus(contentId),
        staleTime: 60000,
        enabled: enabled && !!contentId,
        select: (data) => ({
            isLiked: data.data?.isLiked ?? false,
            likeCount: data.data?.likeCount ?? 0,
        }),
    });
};

// =============================================
// Hook: useToggleLike - Toggle like state
// =============================================

export const useToggleLike = () => {
    const queryClient = useQueryClient();
    const [, addNotification] = useAtom(addNotificationAtom);
    const [, updateEngagementCache] = useAtom(updateEngagementCacheAtom);

    return useMutation({
        mutationFn: (contentId: string) => toggleLike(contentId),
        onMutate: async (contentId) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['like-status', contentId] });

            // Snapshot previous value
            const previousStatus = queryClient.getQueryData(['like-status', contentId]);

            // Optimistically update
            queryClient.setQueryData(['like-status', contentId], (old: unknown) => {
                const prev = old as { data?: { isLiked: boolean; likeCount: number } } | undefined;
                const wasLiked = prev?.data?.isLiked ?? false;
                const prevCount = prev?.data?.likeCount ?? 0;

                return {
                    success: true,
                    data: {
                        isLiked: !wasLiked,
                        likeCount: wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
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
                    data: {
                        isLiked: result.data.isLiked,
                        likeCount: result.data.likeCount,
                    },
                });
            }
        },
        onError: (_error, contentId, context) => {
            // Rollback on error
            if (context?.previousStatus) {
                queryClient.setQueryData(['like-status', contentId], context.previousStatus);
            }

            addNotification({
                type: 'error',
                message: 'Failed to update like',
                duration: 3000,
            });
        },
        onSettled: (_data, _error, contentId) => {
            // Refetch to ensure consistency
            void queryClient.invalidateQueries({ queryKey: ['like-status', contentId] });
            void queryClient.invalidateQueries({ queryKey: ['user-likes'] });
        },
    });
};

// =============================================
// Hook: useUserLikes - Get user's liked content
// =============================================

export const useUserLikes = (options: IUseLikesOptions = {}) => {
    const { page = 1, limit = 20, enabled = true } = options;

    return useQuery({
        queryKey: ['user-likes', { page, limit }],
        queryFn: () => getUserLikes({ page, limit }),
        staleTime: 60000,
        enabled,
    });
};

// =============================================
// Combined Hook: useContentEngagement
// Get like and bookmark status together
// =============================================

export const useContentEngagement = (contentId: string, enabled = true) => {
    const likeStatus = useLikeStatus(contentId, enabled);

    return {
        isLiked: likeStatus.data?.isLiked ?? false,
        likeCount: likeStatus.data?.likeCount ?? 0,
        isLoading: likeStatus.isLoading,
        refetch: likeStatus.refetch,
    };
};
