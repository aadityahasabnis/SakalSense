'use client';
// =============================================
// LikeButton - Interactive like button with no flickering
// =============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { checkLikeStatus, toggleLike } from '@/server/actions/engagement/likeActions';
import { cn } from '@/lib/utils';

interface ILikeButtonProps {
    contentId: string;
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'sm' | 'default' | 'lg';
    showCount?: boolean;
    // Initial state from server to prevent flickering
    initialIsLiked?: boolean;
    initialLikeCount?: number;
}

export const LikeButton = ({
    contentId,
    variant = 'ghost',
    size = 'default',
    showCount = true,
    initialIsLiked,
    initialLikeCount,
}: ILikeButtonProps) => {
    const queryClient = useQueryClient();

    // Fetch like status with placeholderData to prevent flickering
    const { data: likeData, isLoading } = useQuery({
        queryKey: ['like-status', contentId],
        queryFn: () => checkLikeStatus(contentId),
        staleTime: 60000, // 1 minute
        gcTime: 300000, // 5 minutes
        // Use placeholderData if initial values provided
        placeholderData: initialIsLiked !== undefined || initialLikeCount !== undefined
            ? {
                success: true,
                data: {
                    isLiked: initialIsLiked ?? false,
                    likeCount: initialLikeCount ?? 0,
                },
            }
            : undefined,
    });

    const isLiked = likeData?.data?.isLiked ?? false;
    const likeCount = likeData?.data?.likeCount ?? 0;

    // Toggle like mutation with optimistic updates
    const { mutate: handleToggleLike, isPending } = useMutation({
        mutationFn: () => toggleLike(contentId),
        onMutate: async () => {
            // Cancel ongoing queries
            await queryClient.cancelQueries({ queryKey: ['like-status', contentId] });

            // Snapshot the previous value
            const previous = queryClient.getQueryData(['like-status', contentId]);

            // Optimistically update
            queryClient.setQueryData(['like-status', contentId], (old: typeof likeData) => ({
                success: true,
                data: {
                    isLiked: !old?.data?.isLiked,
                    likeCount: old?.data?.isLiked
                        ? (old?.data?.likeCount ?? 0) - 1
                        : (old?.data?.likeCount ?? 0) + 1,
                },
            }));

            return { previous };
        },
        onError: (_err, _vars, context) => {
            // Rollback on error
            if (context?.previous) {
                queryClient.setQueryData(['like-status', contentId], context.previous);
            }
        },
        onSettled: () => {
            // Refetch after mutation
            void queryClient.invalidateQueries({ queryKey: ['like-status', contentId] });
        },
    });

    // Show skeleton while initial loading (only if no placeholder)
    if (isLoading && initialIsLiked === undefined && initialLikeCount === undefined) {
        return (
            <Button variant={variant} size={size} disabled className='gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                {showCount && <span className='text-muted-foreground'>...</span>}
            </Button>
        );
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => handleToggleLike()}
            disabled={isPending}
            className={cn('gap-2', isPending && 'opacity-70')}
        >
            <Heart
                className={cn(
                    'h-4 w-4 transition-all',
                    isLiked && 'fill-current text-red-500',
                    isPending && 'scale-110'
                )}
            />
            {showCount && (
                <span className={cn(isPending && 'opacity-50')}>
                    {likeCount.toLocaleString()}
                </span>
            )}
        </Button>
    );
};
