'use client';
// =============================================
// PracticeClient - Browse and filter practice problems
// =============================================

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import {
    ChevronLeft,
    ChevronRight,
    Code2,
    Filter,
    Layers,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getPublishedPractices } from '@/server/actions/content/practiceActions';

// =============================================
// Types
// =============================================

type SortOption = 'latest' | 'popular' | 'title';

interface IPractice {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    creator: { fullName: string; avatarLink: string | null };
    _count: { sections: number };
    problemCount: number;
    createdAt: Date;
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

export const PracticeClient = () => {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('latest');
    const [page, setPage] = useState(1);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const limit = 9;

    const debouncedSearch = useDebounce(search, 300);

    // Fetch practices
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: ['practices', { search: debouncedSearch, sortBy, page, limit }],
        queryFn: () =>
            getPublishedPractices({
                search: debouncedSearch,
                page,
                limit,
                sortBy,
            }),
        staleTime: 60000,
        placeholderData: (prev) => prev,
    });

    const practices = (data?.data ?? []) as IPractice[];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, sortBy]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Practice Problems</h1>
                <p className="text-muted-foreground">
                    Sharpen your skills with hands-on coding challenges
                </p>
            </div>

            {/* Search & Filters */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search practice sets..."
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

                <div className="flex flex-wrap items-center gap-3">
                    {/* Mobile Filter */}
                    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="md:hidden">
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[40vh]">
                            <SheetHeader>
                                <SheetTitle>Sort</SheetTitle>
                                <SheetDescription>Sort practice problems</SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Sort By</label>
                                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="latest">Latest</SelectItem>
                                            <SelectItem value="popular">Popular</SelectItem>
                                            <SelectItem value="title">A-Z</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={() => setFiltersOpen(false)} className="w-full">
                                    Apply
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="ml-auto">
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                            <SelectTrigger className="w-[130px]">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="latest">Latest</SelectItem>
                                <SelectItem value="popular">Popular</SelectItem>
                                <SelectItem value="title">A-Z</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {isLoading ? 'Loading...' : `${total} practice set${total !== 1 ? 's' : ''} found`}
                </p>
                {isFetching && !isLoading && (
                    <span className="text-xs text-muted-foreground">Updating...</span>
                )}
            </div>

            {/* Practice Grid */}
            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-52 rounded-lg" />
                    ))}
                </div>
            ) : isError ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
                    <p className="text-destructive font-medium">Failed to load practice sets</p>
                </div>
            ) : practices.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <Code2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium text-muted-foreground">No practice sets found</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Check back later for new practice problems
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {practices.map((practice) => (
                            <Link key={practice.id} href={`/practice/${practice.slug}`}>
                                <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
                                    <CardHeader>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary" className="gap-1">
                                                <Code2 className="h-3 w-3" />
                                                {practice.problemCount} problems
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                <Layers className="mr-1 h-3 w-3" />
                                                {practice._count.sections} sections
                                            </Badge>
                                        </div>
                                        <CardTitle className="line-clamp-2 group-hover:text-primary">
                                            {practice.title}
                                        </CardTitle>
                                        {practice.description && (
                                            <CardDescription className="line-clamp-2">
                                                {practice.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardFooter className="pt-0">
                                        <p className="text-xs text-muted-foreground">
                                            By {practice.creator.fullName}
                                        </p>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            <p className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
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
