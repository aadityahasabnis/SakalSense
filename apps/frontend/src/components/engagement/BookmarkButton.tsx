'use client';
// =============================================
// BookmarkButton - Interactive bookmark button with no flickering
// =============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { checkBookmarkStatus, toggleBookmark } from '@/server/actions/engagement/bookmarkActions';
import { cn } from '@/lib/utils';

interface IBookmarkButtonProps {
    contentId: string;
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'sm' | 'default' | 'lg';
    showLabel?: boolean;
    // Initial state from server to prevent flickering
    initialIsBookmarked?: boolean;
}

export const BookmarkButton = ({
    contentId,
    variant = 'ghost',
    size = 'default',
    showLabel = false,
    initialIsBookmarked,
}: IBookmarkButtonProps) => {
    const queryClient = useQueryClient();

    // Fetch bookmark status with placeholderData to prevent flickering
    const { data: bookmarkData, isLoading } = useQuery({
        queryKey: ['bookmark-status', contentId],
        queryFn: () => checkBookmarkStatus(contentId),
        staleTime: 60000, // 1 minute - longer stale time to reduce refetches
        gcTime: 300000, // 5 minutes
        // Use placeholderData instead of showing false while loading
        placeholderData: initialIsBookmarked !== undefined
            ? { success: true, data: { isBookmarked: initialIsBookmarked } }
            : undefined,
    });

    const isBookmarked = bookmarkData?.data?.isBookmarked ?? false;

    // Toggle bookmark mutation with optimistic updates
    const { mutate: handleToggleBookmark, isPending } = useMutation({
        mutationFn: () => toggleBookmark(contentId),
        onMutate: async () => {
            // Cancel ongoing queries
            await queryClient.cancelQueries({ queryKey: ['bookmark-status', contentId] });

            // Snapshot the previous value
            const previous = queryClient.getQueryData(['bookmark-status', contentId]);

            // Optimistically update
            queryClient.setQueryData(['bookmark-status', contentId], (old: typeof bookmarkData) => ({
                success: true,
                data: {
                    isBookmarked: !old?.data?.isBookmarked,
                },
            }));

            return { previous };
        },
        onError: (_err, _vars, context) => {
            // Rollback on error
            if (context?.previous) {
                queryClient.setQueryData(['bookmark-status', contentId], context.previous);
            }
        },
        onSettled: () => {
            // Refetch after mutation
            void queryClient.invalidateQueries({ queryKey: ['bookmark-status', contentId] });
            void queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
        },
    });

    // Show skeleton while initial loading (only if no placeholder)
    if (isLoading && initialIsBookmarked === undefined) {
        return (
            <Button variant={variant} size={size} disabled className='gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                {showLabel && <span className='text-muted-foreground'>...</span>}
            </Button>
        );
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => handleToggleBookmark()}
            disabled={isPending}
            className='gap-2'
        >
            <Bookmark
                className={cn(
                    'h-4 w-4 transition-all',
                    isBookmarked && 'fill-current text-primary',
                    isPending && 'opacity-50'
                )}
            />
            {showLabel && (
                <span className={cn(isPending && 'opacity-50')}>
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </span>
            )}
        </Button>
    );
};
