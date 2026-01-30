'use client';
// =============================================
// GlobalSearch - Command palette style search dialog
// Accessible via Cmd+K / Ctrl+K
// =============================================

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAtom } from 'jotai';
import {
    ArrowRight,
    BookOpen,
    Code,
    FileText,
    GraduationCap,
    Loader2,
    Search,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { CONTENT_TYPE_LABELS, type ContentType } from '@/constants/content.constants';
import { globalSearchOpenAtom } from '@/jotai/atoms';
import { getPublicContentList } from '@/server/actions/content/publicContentActions';
import { type IContentListItem } from '@/types/content.types';

// =============================================
// Content Type Icon Mapping
// =============================================

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'ARTICLE':
        case 'BLOG':
        case 'NOTE':
            return FileText;
        case 'TUTORIAL':
        case 'CHEATSHEET':
            return BookOpen;
        case 'PROJECT':
            return Code;
        default:
            return FileText;
    }
};

// =============================================
// Quick Links Configuration
// =============================================

const quickLinks = [
    { href: '/articles', label: 'Browse Articles', icon: FileText },
    { href: '/tutorials', label: 'Browse Tutorials', icon: BookOpen },
    { href: '/courses', label: 'Browse Courses', icon: GraduationCap },
    { href: '/practice', label: 'Practice Problems', icon: Code },
];

// =============================================
// GlobalSearch Component
// =============================================

export const GlobalSearch = () => {
    const router = useRouter();
    const [open, setOpen] = useAtom(globalSearchOpenAtom);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<IContentListItem[]>([]);
    const [trendingContent, setTrendingContent] = useState<IContentListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Keyboard shortcut (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [setOpen]);

    // Load trending content when dialog opens
    useEffect(() => {
        if (open && trendingContent.length === 0) {
            void loadTrendingContent();
        }
    }, [open]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults([]);
            setHasSearched(false);
        }
    }, [open]);

    // Load trending content
    const loadTrendingContent = async () => {
        try {
            const response = await getPublicContentList({
                page: 1,
                limit: 5,
                sortField: 'viewCount',
                sortDir: 'desc',
            });
            if (response.success && response.data) {
                setTrendingContent(response.data);
            }
        } catch (error) {
            console.error('Failed to load trending content:', error);
        }
    };

    // Debounced search
    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.trim().length < 2) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        try {
            const response = await getPublicContentList({
                search: searchQuery.trim(),
                page: 1,
                limit: 8,
                sortField: 'publishedAt',
                sortDir: 'desc',
            });

            if (response.success && response.data) {
                setResults(response.data);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            void performSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    // Navigate to content
    const handleSelect = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Search articles, tutorials, courses..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                {isLoading && (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!isLoading && hasSearched && results.length === 0 && (
                    <CommandEmpty>
                        <div className="py-6 text-center">
                            <Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                                No results found for &quot;{query}&quot;
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Try different keywords or browse categories below
                            </p>
                        </div>
                    </CommandEmpty>
                )}

                {/* Search Results */}
                {!isLoading && results.length > 0 && (
                    <CommandGroup heading="Search Results">
                        {results.map((content) => {
                            const TypeIcon = getTypeIcon(content.type);
                            return (
                                <CommandItem
                                    key={content.id}
                                    value={content.title}
                                    onSelect={() => handleSelect(`/content/${content.slug}`)}
                                    className="flex items-center gap-3 py-3"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <TypeIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{content.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="secondary" className="text-xs">
                                                {CONTENT_TYPE_LABELS[content.type as ContentType]}
                                            </Badge>
                                            {content.category && (
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {content.category.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                )}

                {/* Show trending when no search query */}
                {!isLoading && !hasSearched && trendingContent.length > 0 && (
                    <>
                        <CommandGroup heading="Trending">
                            {trendingContent.map((content) => {
                                const ContentTypeIcon = getTypeIcon(content.type);
                                return (
                                    <CommandItem
                                        key={content.id}
                                        value={content.title}
                                        onSelect={() => handleSelect(`/content/${content.slug}`)}
                                        className="flex items-center gap-3 py-3"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                            <ContentTypeIcon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{content.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="secondary" className="text-xs">
                                                    {CONTENT_TYPE_LABELS[content.type as ContentType]}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {content.viewCount.toLocaleString()} views
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {/* Quick Links */}
                <CommandGroup heading="Quick Links">
                    {quickLinks.map((link) => (
                        <CommandItem
                            key={link.href}
                            value={link.label}
                            onSelect={() => handleSelect(link.href)}
                            className="flex items-center gap-3 py-2"
                        >
                            <link.icon className="h-4 w-4 text-muted-foreground" />
                            <span>{link.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
};
