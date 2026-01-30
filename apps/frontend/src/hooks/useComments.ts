// =============================================
// useComments - React hook for comment operations
// =============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';

import { addNotificationAtom } from '@/jotai/atoms';
import {
    createComment,
    deleteComment,
    getContentComments,
    toggleCommentLike,
    updateComment,
} from '@/server/actions/engagement/commentActions';

// =============================================
// Types
// =============================================

interface IUseCommentsOptions {
    page?: number;
    limit?: number;
    enabled?: boolean;
}

interface ICreateCommentInput {
    contentId: string;
    body: string;
    parentId?: string;
}

interface IUpdateCommentInput {
    commentId: string;
    body: string;
}

// =============================================
// Hook: useContentComments - Get comments for content
// =============================================

export const useContentComments = (contentId: string, options: IUseCommentsOptions = {}) => {
    const { page = 1, limit = 20, enabled = true } = options;

    return useQuery({
        queryKey: ['comments', contentId, { page, limit }],
        queryFn: () => getContentComments(contentId, { page, limit }),
        staleTime: 30000, // Comments should refresh more frequently
        enabled: enabled && !!contentId,
    });
};

// =============================================
// Hook: useCreateComment - Create a new comment
// =============================================

export const useCreateComment = () => {
    const queryClient = useQueryClient();
    const [, addNotification] = useAtom(addNotificationAtom);

    return useMutation({
        mutationFn: (input: ICreateCommentInput) => createComment(input),
        onSuccess: (result, input) => {
            if (result.success) {
                addNotification({
                    type: 'success',
                    message: input.parentId ? 'Reply posted' : 'Comment posted',
                    duration: 2000,
                });
            } else {
                addNotification({
                    type: 'error',
                    message: result.error ?? 'Failed to post comment',
                    duration: 3000,
                });
            }
        },
        onError: () => {
            addNotification({
                type: 'error',
                message: 'Failed to post comment',
                duration: 3000,
            });
        },
        onSettled: (_data, _error, input) => {
            // Refetch comments for this content
            void queryClient.invalidateQueries({ queryKey: ['comments', input.contentId] });
        },
    });
};

// =============================================
// Hook: useUpdateComment - Update an existing comment
// =============================================

export const useUpdateComment = (contentId: string) => {
    const queryClient = useQueryClient();
    const [, addNotification] = useAtom(addNotificationAtom);

    return useMutation({
        mutationFn: (input: IUpdateCommentInput) => updateComment(input.commentId, input.body),
        onSuccess: (result) => {
            if (result.success) {
                addNotification({
                    type: 'success',
                    message: 'Comment updated',
                    duration: 2000,
                });
            } else {
                addNotification({
                    type: 'error',
                    message: result.error ?? 'Failed to update comment',
                    duration: 3000,
                });
            }
        },
        onError: () => {
            addNotification({
                type: 'error',
                message: 'Failed to update comment',
                duration: 3000,
            });
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ['comments', contentId] });
        },
    });
};

// =============================================
// Hook: useDeleteComment - Delete a comment
// =============================================

export const useDeleteComment = (contentId: string) => {
    const queryClient = useQueryClient();
    const [, addNotification] = useAtom(addNotificationAtom);

    return useMutation({
        mutationFn: (commentId: string) => deleteComment(commentId),
        onSuccess: (result) => {
            if (result.success) {
                addNotification({
                    type: 'success',
                    message: 'Comment deleted',
                    duration: 2000,
                });
            } else {
                addNotification({
                    type: 'error',
                    message: result.error ?? 'Failed to delete comment',
                    duration: 3000,
                });
            }
        },
        onError: () => {
            addNotification({
                type: 'error',
                message: 'Failed to delete comment',
                duration: 3000,
            });
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ['comments', contentId] });
        },
    });
};

// =============================================
// Hook: useToggleCommentLike - Toggle like on a comment
// =============================================

export const useToggleCommentLike = (contentId: string) => {
    const queryClient = useQueryClient();
    const [, addNotification] = useAtom(addNotificationAtom);

    return useMutation({
        mutationFn: (commentId: string) => toggleCommentLike(commentId),
        onError: () => {
            addNotification({
                type: 'error',
                message: 'Failed to update like',
                duration: 3000,
            });
        },
        onSettled: () => {
            // Refetch comments to get updated like counts
            void queryClient.invalidateQueries({ queryKey: ['comments', contentId] });
        },
    });
};

// =============================================
// Combined Hook: useCommentActions
// Provides all comment-related actions for a content
// =============================================

export const useCommentActions = (contentId: string) => {
    const createMutation = useCreateComment();
    const updateMutation = useUpdateComment(contentId);
    const deleteMutation = useDeleteComment(contentId);
    const likeMutation = useToggleCommentLike(contentId);

    return {
        create: createMutation.mutate,
        update: updateMutation.mutate,
        remove: deleteMutation.mutate,
        toggleLike: likeMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isLiking: likeMutation.isPending,
    };
};
