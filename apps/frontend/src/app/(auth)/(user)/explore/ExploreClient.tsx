'use client';
// =============================================
// ExploreClient - Public content browsing with filters
// =============================================

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Grid, List, Search } from 'lucide-react';

import { ContentCard } from '@/components/content/ContentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    CONTENT_TYPE_LABELS,
    DIFFICULTY_LABELS,
    type ContentType,
    type DifficultyType,
} from '@/constants/content.constants';
import { getPublicContentList } from '@/server/actions/content/publicContentActions';
import { cn } from '@/lib/utils';

export const ExploreClient = () => {
    const [search, setSearch] = useState('');
    const [type, setType] = useState<ContentType | undefined>();
    const [difficulty, setDifficulty] = useState<DifficultyType | undefined>();
    const [page, setPage] = useState(1);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const limit = 12;

    // Fetch content
    const { data, isLoading, isError } = useQuery({
        queryKey: ['public-content', { search, type, difficulty, page, limit }],
        queryFn: () =>
            getPublicContentList({
                search,
                type,
                difficulty,
                page,
                limit,
                sortField: 'publishedAt',
                sortDir: 'desc',
            }),
        staleTime: 60000, // 1 minute
    });

    const contents = data?.data ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return (
        <div className='min-h-screen bg-background'>
            <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
                {/* Header */}
                <div className='mb-8'>
                    <h1 className='mb-2 text-4xl font-bold'>Explore Content</h1>
                    <p className='text-muted-foreground'>
                        Discover articles, tutorials, projects, and more from our community
                    </p>
                </div>

                {/* Filters */}
                <div className='mb-6 space-y-4'>
                    {/* Search Bar */}
                    <div className='relative'>
                        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                        <Input
                            type='text'
                            placeholder='Search content...'
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className='pl-10'
                        />
                    </div>

                    {/* Filter Row */}
                    <div className='flex flex-wrap items-center gap-3'>
                        {/* Content Type */}
                        <Select
                            value={type ?? 'all'}
                            onValueChange={(value) => {
                                setType(value === 'all' ? undefined : (value as ContentType));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className='w-[180px]'>
                                <SelectValue placeholder='All Types' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>All Types</SelectItem>
                                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Difficulty */}
                        <Select
                            value={difficulty ?? 'all'}
                            onValueChange={(value) => {
                                setDifficulty(value === 'all' ? undefined : (value as DifficultyType));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className='w-[180px]'>
                                <SelectValue placeholder='All Levels' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>All Levels</SelectItem>
                                {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* View Toggle */}
                        <div className='ml-auto'>
                            <Tabs value={view} onValueChange={(v) => setView(v as 'grid' | 'list')}>
                                <TabsList>
                                    <TabsTrigger value='grid'>
                                        <Grid className='h-4 w-4' />
                                    </TabsTrigger>
                                    <TabsTrigger value='list'>
                                        <List className='h-4 w-4' />
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className='mb-4 text-sm text-muted-foreground'>
                    {isLoading ? 'Loading...' : `${total} results found`}
                </div>

                {/* Content Grid/List */}
                {isLoading ? (
                    <div
                        className={cn(
                            'grid gap-6',
                            view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                        )}
                    >
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className='h-96' />
                        ))}
                    </div>
                ) : isError ? (
                    <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center'>
                        <p className='text-destructive'>Failed to load content. Please try again.</p>
                    </div>
                ) : contents.length === 0 ? (
                    <div className='rounded-lg border border-dashed p-12 text-center'>
                        <p className='text-lg font-medium text-muted-foreground'>No content found</p>
                        <p className='mt-2 text-sm text-muted-foreground'>
                            Try adjusting your filters or search terms
                        </p>
                    </div>
                ) : (
                    <>
                        <div
                            className={cn(
                                'grid gap-6',
                                view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                            )}
                        >
                            {contents.map((content) => (
                                <ContentCard
                                    key={content.id}
                                    content={content}
                                    variant={view === 'list' ? 'compact' : 'default'}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className='mt-8 flex items-center justify-between'>
                                <p className='text-sm text-muted-foreground'>
                                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                                </p>
                                <div className='flex items-center gap-2'>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={() => setPage((p) => p - 1)}
                                        disabled={page <= 1}
                                    >
                                        <ChevronLeft className='h-4 w-4' />
                                        Previous
                                    </Button>
                                    <span className='text-sm'>
                                        Page {page} of {totalPages}
                                    </span>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page >= totalPages}
                                    >
                                        Next
                                        <ChevronRight className='h-4 w-4' />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
