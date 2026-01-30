'use client';
// =============================================
// ContentListClient - Reusable content listing component
// Used for /articles, /tutorials, /cheatsheets, etc.
// =============================================

import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
    ChevronLeft,
    ChevronRight,
    Filter,
    Grid,
    List,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';

import { ContentCard } from '@/components/content/ContentCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    type ContentType,
    DIFFICULTY_LABELS,
    type DifficultyType,
} from '@/constants/content.constants';
import { cn } from '@/lib/utils';
import { getPublicContentList } from '@/server/actions/content/publicContentActions';
import { getAllCategories } from '@/server/actions/content/taxonomyActions';

// =============================================
// Types
// =============================================

type SortOption = 'latest' | 'popular' | 'mostLiked' | 'oldest';

interface ICategory {
    id: string;
    name: string;
    slug: string;
    domain?: { name: string };
}

interface IContentListClientProps {
    contentType: ContentType;
    title: string;
    description: string;
}

// =============================================
// Custom Hooks
// =============================================

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

// =============================================
// Main Component
// =============================================

export const ContentListClient = ({ contentType, title, description }: IContentListClientProps) => {
    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState<DifficultyType | undefined>();
    const [categoryId, setCategoryId] = useState<string | undefined>();
    const [sortBy, setSortBy] = useState<SortOption>('latest');
    const [page, setPage] = useState(1);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const limit = 12;

    // Debounce search for better UX
    const debouncedSearch = useDebounce(search, 300);

    // Fetch categories for filter
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: getAllCategories,
        staleTime: 5 * 60 * 1000,
    });
    const categories = (categoriesData?.data ?? []) as ICategory[];

    // Get sort params
    const getSortParams = (sort: SortOption) => {
        switch (sort) {
            case 'latest':
                return { sortField: 'publishedAt' as const, sortDir: 'desc' as const };
            case 'oldest':
                return { sortField: 'publishedAt' as const, sortDir: 'asc' as const };
            case 'popular':
                return { sortField: 'viewCount' as const, sortDir: 'desc' as const };
            case 'mostLiked':
                return { sortField: 'likeCount' as const, sortDir: 'desc' as const };
            default:
                return { sortField: 'publishedAt' as const, sortDir: 'desc' as const };
        }
    };

    // Fetch content
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: ['content-list', contentType, { search: debouncedSearch, difficulty, categoryId, sortBy, page, limit }],
        queryFn: () =>
            getPublicContentList({
                search: debouncedSearch,
                type: contentType,
                difficulty,
                categoryId,
                page,
                limit,
                ...getSortParams(sortBy),
            }),
        staleTime: 60000,
        placeholderData: (prev) => prev,
    });

    const contents = data?.data ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Count active filters
    const activeFilterCount = [difficulty, categoryId].filter(Boolean).length;

    // Clear all filters
    const clearFilters = () => {
        setDifficulty(undefined);
        setCategoryId(undefined);
        setPage(1);
    };

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, difficulty, categoryId, sortBy]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
            </div>

            {/* Search & Filters */}
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder={`Search ${title.toLowerCase()}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-10"
                    />
                    {search && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                            onClick={() => setSearch('')}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Filter Row */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Desktop Filters */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Difficulty */}
                        <Select
                            value={difficulty ?? 'all'}
                            onValueChange={(value) => setDifficulty(value === 'all' ? undefined : (value as DifficultyType))}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="All Levels" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Category */}
                        {categories.length > 0 && (
                            <Select
                                value={categoryId ?? 'all'}
                                onValueChange={(value) => setCategoryId(value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.domain ? `${cat.domain.name} / ` : ''}{cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Mobile Filter Button */}
                    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="md:hidden">
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[60vh]">
                            <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                                <SheetDescription>Refine your search results</SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Difficulty</label>
                                    <Select
                                        value={difficulty ?? 'all'}
                                        onValueChange={(value) => setDifficulty(value === 'all' ? undefined : (value as DifficultyType))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Levels" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Levels</SelectItem>
                                            {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {categories.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Category</label>
                                        <Select
                                            value={categoryId ?? 'all'}
                                            onValueChange={(value) => setCategoryId(value === 'all' ? undefined : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Categories" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Categories</SelectItem>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.domain ? `${cat.domain.name} / ` : ''}{cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" onClick={clearFilters} className="flex-1">
                                        Clear All
                                    </Button>
                                    <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Active Filter Badges */}
                    {activeFilterCount > 0 && (
                        <div className="hidden md:flex items-center gap-2">
                            {difficulty && (
                                <Badge variant="secondary" className="gap-1">
                                    {DIFFICULTY_LABELS[difficulty]}
                                    <button onClick={() => setDifficulty(undefined)}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {categoryId && (
                                <Badge variant="secondary" className="gap-1">
                                    {categories.find((c) => c.id === categoryId)?.name ?? 'Category'}
                                    <button onClick={() => setCategoryId(undefined)}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Clear all
                            </Button>
                        </div>
                    )}

                    {/* Sort & View Toggle */}
                    <div className="ml-auto flex items-center gap-3">
                        {/* Sort */}
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                            <SelectTrigger className="w-[130px]">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="latest">Latest</SelectItem>
                                <SelectItem value="oldest">Oldest</SelectItem>
                                <SelectItem value="popular">Most Viewed</SelectItem>
                                <SelectItem value="mostLiked">Most Liked</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* View Toggle */}
                        <Tabs value={view} onValueChange={(v) => setView(v as 'grid' | 'list')}>
                            <TabsList className="h-9">
                                <TabsTrigger value="grid" className="h-7 px-2">
                                    <Grid className="h-4 w-4" />
                                </TabsTrigger>
                                <TabsTrigger value="list" className="h-7 px-2">
                                    <List className="h-4 w-4" />
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {isLoading ? (
                        'Loading...'
                    ) : (
                        <>
                            {total} result{total !== 1 ? 's' : ''} found
                            {debouncedSearch && ` for "${debouncedSearch}"`}
                        </>
                    )}
                </p>
                {isFetching && !isLoading && (
                    <span className="text-xs text-muted-foreground">Updating...</span>
                )}
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
                        <Skeleton key={i} className="h-80 rounded-lg" />
                    ))}
                </div>
            ) : isError ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
                    <p className="text-destructive font-medium">Failed to load content</p>
                    <p className="mt-1 text-sm text-muted-foreground">Please try again later</p>
                </div>
            ) : contents.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <Search className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium text-muted-foreground">No {title.toLowerCase()} found</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Try adjusting your filters or search terms
                    </p>
                    {activeFilterCount > 0 && (
                        <Button variant="outline" onClick={clearFilters} className="mt-4">
                            Clear filters
                        </Button>
                    )}
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
                        <div className="flex items-center justify-between pt-4">
                            <p className="text-sm text-muted-foreground">
                                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => p - 1)}
                                    disabled={page <= 1 || isFetching}
                                >
                                    <ChevronLeft className="mr-1 h-4 w-4" />
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum: number;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={page === pageNum ? 'default' : 'ghost'}
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => setPage(pageNum)}
                                                disabled={isFetching}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page >= totalPages || isFetching}
                                >
                                    Next
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
