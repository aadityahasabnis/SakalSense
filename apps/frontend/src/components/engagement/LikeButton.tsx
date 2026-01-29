'use client';
// =============================================
// LikeButton - Interactive like button with optimistic updates
// =============================================

import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { checkLikeStatus, toggleLike } from '@/server/actions/engagement/likeActions';
import { cn } from '@/lib/utils';

interface ILikeButtonProps {
    contentId: string;
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'sm' | 'default' | 'lg';
    showCount?: boolean;
}

export const LikeButton = ({ contentId, variant = 'ghost', size = 'default', showCount = true }: ILikeButtonProps) => {
    const queryClient = useQueryClient();
    const [isOptimistic, setIsOptimistic] = useState(false);

    // Fetch like status
    const { data: likeData } = useQuery({
        queryKey: ['like-status', contentId],
        queryFn: () => checkLikeStatus(contentId),
        staleTime: 30000, // 30 seconds
    });

    const isLiked = likeData?.data?.isLiked ?? false;
    const likeCount = likeData?.data?.likeCount ?? 0;

    // Toggle like mutation
    const { mutate: handleToggleLike, isPending } = useMutation({
        mutationFn: () => toggleLike(contentId),
        onMutate: async () => {
            // Cancel ongoing queries
            await queryClient.cancelQueries({ queryKey: ['like-status', contentId] });

            // Snapshot the previous value
            const previous = queryClient.getQueryData(['like-status', contentId]);

            // Optimistically update
            queryClient.setQueryData(['like-status', contentId], (old: typeof likeData) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        isLiked: !old.data?.isLiked,
                        likeCount: old.data?.isLiked
                            ? (old.data?.likeCount ?? 0) - 1
                            : (old.data?.likeCount ?? 0) + 1,
                    },
                };
            });

            setIsOptimistic(true);

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
            setIsOptimistic(false);
        },
    });

    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => handleToggleLike()}
            disabled={isPending}
            className={cn('gap-2', isOptimistic && 'opacity-70')}
        >
            <Heart
                className={cn('h-4 w-4 transition-all', isLiked && 'fill-current text-red-500')}
            />
            {showCount && <span>{likeCount.toLocaleString()}</span>}
        </Button>
    );
};
