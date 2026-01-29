'use client';
// =============================================
// BookmarksClient - User bookmarked content page
// =============================================

import { useState } from 'react';

import Link from 'next/link';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, Trash2 } from 'lucide-react';

import { ContentCard } from '@/components/content/ContentCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserBookmarks, removeBookmarks } from '@/server/actions/engagement/bookmarkActions';
import { type IContentListItem } from '@/types/content.types';

interface IBookmarksClientProps {
    userId: string;
}

export const BookmarksClient = ({ userId }: IBookmarksClientProps) => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
    const pageSize = 12;

    // Fetch bookmarks
    const { data: bookmarksData, isLoading } = useQuery({
        queryKey: ['user-bookmarks', page, pageSize],
        queryFn: () => getUserBookmarks({ page, limit: pageSize }),
        staleTime: 30000, // 30 seconds
    });

    const bookmarks = (bookmarksData?.data?.map(b => b.content) ?? []) as unknown as IContentListItem[];
    const total = bookmarksData?.total ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    // Remove bookmarks mutation
    const removeMutation = useMutation({
        mutationFn: (bookmarkIds: string[]) => removeBookmarks(bookmarkIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
            queryClient.invalidateQueries({ queryKey: ['bookmark-status'] });
            setSelectedBookmarks([]);
        },
    });

    const handleSelectAll = () => {
        if (selectedBookmarks.length === bookmarks.length) {
            setSelectedBookmarks([]);
        } else {
            setSelectedBookmarks(bookmarks.map((b) => b.id));
        }
    };

    const handleToggleSelect = (contentId: string) => {
        setSelectedBookmarks((prev) =>
            prev.includes(contentId) ? prev.filter((id) => id !== contentId) : [...prev, contentId]
        );
    };

    const handleRemoveSelected = () => {
        if (selectedBookmarks.length > 0) {
            if (confirm(`Are you sure you want to remove ${selectedBookmarks.length} ${selectedBookmarks.length === 1 ? 'bookmark' : 'bookmarks'}?`)) {
                removeMutation.mutate(selectedBookmarks);
            }
        }
    };

    if (isLoading) {
        return (
            <div className='min-h-screen bg-background'>
                <div className='mx-auto max-w-7xl px-4 py-8'>
                    <Skeleton className='mb-4 h-10 w-64' />
                    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className='h-64 w-full' />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-background'>
            <div className='mx-auto max-w-7xl px-4 py-8'>
                {/* Header */}
                <div className='mb-8'>
                    <div className='mb-4'>
                        <Button variant='ghost' size='sm' asChild>
                            <Link href='/explore'>
                                <ArrowLeft className='mr-2 h-4 w-4' />
                                Back to Explore
                            </Link>
                        </Button>
                    </div>

                    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='flex items-center gap-3'>
                            <Bookmark className='h-8 w-8 text-primary' />
                            <div>
                                <h1 className='text-3xl font-bold'>My Bookmarks</h1>
                                <p className='text-sm text-muted-foreground'>
                                    {total} {total === 1 ? 'bookmark' : 'bookmarks'}
                                </p>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {bookmarks.length > 0 && (
                            <div className='flex items-center gap-2'>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={handleSelectAll}
                                >
                                    {selectedBookmarks.length === bookmarks.length
                                        ? 'Deselect All'
                                        : 'Select All'}
                                </Button>
                                {selectedBookmarks.length > 0 && (
                                    <Button
                                        variant='destructive'
                                        size='sm'
                                        onClick={handleRemoveSelected}
                                    >
                                        <Trash2 className='mr-2 h-4 w-4' />
                                        Remove ({selectedBookmarks.length})
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {bookmarks.length === 0 ? (
                    <div className='rounded-lg border border-dashed bg-muted/50 p-12 text-center'>
                        <Bookmark className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                        <h3 className='mb-2 text-lg font-semibold'>No bookmarks yet</h3>
                        <p className='mb-6 text-sm text-muted-foreground'>
                            Start bookmarking content to save it for later
                        </p>
                        <Button asChild>
                            <Link href='/explore'>Explore Content</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Grid */}
                        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                            {bookmarks.map((content) => (
                                <div key={content.id} className='relative'>
                                    {/* Selection Checkbox */}
                                    <div className='absolute right-2 top-2 z-10'>
                                        <input
                                            type='checkbox'
                                            checked={selectedBookmarks.includes(content.id)}
                                            onChange={() => handleToggleSelect(content.id)}
                                            className='h-5 w-5 cursor-pointer rounded border-gray-300'
                                        />
                                    </div>
                                    <ContentCard content={content} />
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className='mt-8 flex items-center justify-center gap-2'>
                                <Button
                                    variant='outline'
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <span className='text-sm text-muted-foreground'>
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant='outline'
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
