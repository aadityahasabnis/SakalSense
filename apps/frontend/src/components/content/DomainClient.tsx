'use client';
// =============================================
// DomainClient - Browse content within a domain
// =============================================

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import {
    ChevronLeft,
    ChevronRight,
    Eye,
    FileText,
    Heart,
    Search,
    X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { Skeleton } from '@/components/ui/skeleton';
import { CONTENT_TYPE_LABELS, DIFFICULTY_COLORS, DIFFICULTY_LABELS, type ContentType, type DifficultyType } from '@/constants/content.constants';
import { cn } from '@/lib/utils';
import { getContentByDomain } from '@/server/actions/content/taxonomyActions';

// =============================================
// Types
// =============================================

interface ICategory {
    id: string;
    name: string;
    slug: string;
    _count: { contents: number };
}

interface IDomain {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    categories: ICategory[];
}

interface IContentItem {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    type: string;
    difficulty: string;
    thumbnailUrl: string | null;
    viewCount: number;
    likeCount: number;
    publishedAt: Date;
    creator: { fullName: string; avatarLink: string | null };
    category: { name: string; slug: string } | null;
}

interface IDomainClientProps {
    domain: IDomain;
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

export const DomainClient = ({ domain }: IDomainClientProps) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [page, setPage] = useState(1);
    const limit = 12;

    const debouncedSearch = useDebounce(search, 300);

    // Fetch content for this domain
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: ['domain-content', domain.slug, { search: debouncedSearch, categoryId: selectedCategory, page, limit }],
        queryFn: () =>
            getContentByDomain(domain.slug, {
                search: debouncedSearch,
                categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
                page,
                limit,
            }),
        staleTime: 60000,
        placeholderData: (prev) => prev,
    });

    const contents = (data?.data ?? []) as IContentItem[];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedCategory]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{domain.name}</h1>
                {domain.description && (
                    <p className="text-muted-foreground mt-1">{domain.description}</p>
                )}
            </div>

            {/* Category Pills */}
            {domain.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('all')}
                    >
                        All
                    </Button>
                    {domain.categories.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={selectedCategory === cat.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.name}
                            <Badge variant="secondary" className="ml-2 text-xs">
                                {cat._count.contents}
                            </Badge>
                        </Button>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder={`Search in ${domain.name}...`}
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

            {/* Results */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {isLoading ? 'Loading...' : `${total} item${total !== 1 ? 's' : ''} found`}
                </p>
                {isFetching && !isLoading && (
                    <span className="text-xs text-muted-foreground">Updating...</span>
                )}
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-52 rounded-lg" />
                    ))}
                </div>
            ) : isError ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
                    <p className="text-destructive font-medium">Failed to load content</p>
                </div>
            ) : contents.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium text-muted-foreground">No content found</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Try adjusting your search or category filter
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {contents.map((content) => (
                            <Link key={content.id} href={`/content/${content.slug}`}>
                                <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
                                    {content.thumbnailUrl && (
                                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                            <img
                                                src={content.thumbnailUrl}
                                                alt={content.title}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <Badge variant="outline" className="text-xs">
                                                {CONTENT_TYPE_LABELS[content.type as ContentType] ?? content.type}
                                            </Badge>
                                            <Badge className={cn('text-xs', DIFFICULTY_COLORS[content.difficulty as DifficultyType])}>
                                                {DIFFICULTY_LABELS[content.difficulty as DifficultyType] ?? content.difficulty}
                                            </Badge>
                                        </div>
                                        <CardTitle className="line-clamp-2 group-hover:text-primary">
                                            {content.title}
                                        </CardTitle>
                                        {content.description && (
                                            <CardDescription className="line-clamp-2">
                                                {content.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardFooter className="pt-0 flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground">
                                            {content.creator.fullName}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {content.viewCount}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Heart className="h-3 w-3" />
                                                {content.likeCount}
                                            </span>
                                        </div>
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
