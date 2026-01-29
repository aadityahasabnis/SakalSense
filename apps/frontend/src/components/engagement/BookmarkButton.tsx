'use client';
// =============================================
// BookmarkButton - Interactive bookmark button
// =============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { checkBookmarkStatus, toggleBookmark } from '@/server/actions/engagement/bookmarkActions';
import { cn } from '@/lib/utils';

interface IBookmarkButtonProps {
    contentId: string;
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'sm' | 'default' | 'lg';
    showLabel?: boolean;
}

export const BookmarkButton = ({
    contentId,
    variant = 'ghost',
    size = 'default',
    showLabel = false,
}: IBookmarkButtonProps) => {
    const queryClient = useQueryClient();

    // Fetch bookmark status
    const { data: bookmarkData } = useQuery({
        queryKey: ['bookmark-status', contentId],
        queryFn: () => checkBookmarkStatus(contentId),
        staleTime: 30000, // 30 seconds
    });

    const isBookmarked = bookmarkData?.data?.isBookmarked ?? false;

    // Toggle bookmark mutation
    const { mutate: handleToggleBookmark, isPending } = useMutation({
        mutationFn: () => toggleBookmark(contentId),
        onMutate: async () => {
            // Cancel ongoing queries
            await queryClient.cancelQueries({ queryKey: ['bookmark-status', contentId] });

            // Snapshot the previous value
            const previous = queryClient.getQueryData(['bookmark-status', contentId]);

            // Optimistically update
            queryClient.setQueryData(['bookmark-status', contentId], (old: typeof bookmarkData) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        isBookmarked: !old.data?.isBookmarked,
                    },
                };
            });

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

    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => handleToggleBookmark()}
            disabled={isPending}
            className='gap-2'
        >
            <Bookmark
                className={cn('h-4 w-4 transition-all', isBookmarked && 'fill-current text-primary')}
            />
            {showLabel && <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>}
        </Button>
    );
};
