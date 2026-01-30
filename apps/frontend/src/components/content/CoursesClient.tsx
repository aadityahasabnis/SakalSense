'use client';
// =============================================
// CoursesClient - Browse and filter courses
// =============================================

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    GraduationCap,
    Search,
    SlidersHorizontal,
    Users,
    X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, type DifficultyType } from '@/constants/content.constants';
import { cn } from '@/lib/utils';
import { getPublishedCourses } from '@/server/actions/content/courseActions';

// =============================================
// Types
// =============================================

type SortOption = 'latest' | 'popular' | 'title';

interface ICourse {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    thumbnailUrl: string | null;
    difficulty: string;
    estimatedHours: number | null;
    creator: { fullName: string; avatarLink: string | null };
    _count: { enrollments: number; sections: number };
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

export const CoursesClient = () => {
    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState<DifficultyType | undefined>();
    const [sortBy, setSortBy] = useState<SortOption>('latest');
    const [page, setPage] = useState(1);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const limit = 9;

    const debouncedSearch = useDebounce(search, 300);

    // Fetch courses
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: ['courses', { search: debouncedSearch, difficulty, sortBy, page, limit }],
        queryFn: () =>
            getPublishedCourses({
                search: debouncedSearch,
                difficulty,
                page,
                limit,
                sortBy,
            }),
        staleTime: 60000,
        placeholderData: (prev) => prev,
    });

    const courses = (data?.data ?? []) as unknown as ICourse[];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    const activeFilterCount = [difficulty].filter(Boolean).length;

    const clearFilters = () => {
        setDifficulty(undefined);
        setPage(1);
    };

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, difficulty, sortBy]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
                <p className="text-muted-foreground">
                    Structured learning paths to master new skills
                </p>
            </div>

            {/* Search & Filters */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search courses..."
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
                    {/* Desktop Filters */}
                    <div className="hidden md:flex items-center gap-3">
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
                    </div>

                    {/* Mobile Filter */}
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
                        <SheetContent side="bottom" className="h-[50vh]">
                            <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                                <SheetDescription>Filter courses</SheetDescription>
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
                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" onClick={clearFilters} className="flex-1">
                                        Clear
                                    </Button>
                                    <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

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
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Clear
                            </Button>
                        </div>
                    )}

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
                    {isLoading ? 'Loading...' : `${total} course${total !== 1 ? 's' : ''} found`}
                </p>
                {isFetching && !isLoading && (
                    <span className="text-xs text-muted-foreground">Updating...</span>
                )}
            </div>

            {/* Course Grid */}
            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-72 rounded-lg" />
                    ))}
                </div>
            ) : isError ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
                    <p className="text-destructive font-medium">Failed to load courses</p>
                </div>
            ) : courses.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium text-muted-foreground">No courses found</p>
                    {activeFilterCount > 0 && (
                        <Button variant="outline" onClick={clearFilters} className="mt-4">
                            Clear filters
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <Link key={course.id} href={`/courses/${course.slug}`}>
                                <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
                                    {course.thumbnailUrl && (
                                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                            <img
                                                src={course.thumbnailUrl}
                                                alt={course.title}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge className={cn('text-xs', DIFFICULTY_COLORS[course.difficulty as DifficultyType])}>
                                                {DIFFICULTY_LABELS[course.difficulty as DifficultyType]}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {course._count.sections} sections
                                            </Badge>
                                        </div>
                                        <CardTitle className="line-clamp-2 group-hover:text-primary">
                                            {course.title}
                                        </CardTitle>
                                        {course.description && (
                                            <CardDescription className="line-clamp-2">
                                                {course.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {course.estimatedHours && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{course.estimatedHours}h</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>{course._count.enrollments} enrolled</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <p className="text-xs text-muted-foreground">
                                            By {course.creator.fullName}
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
