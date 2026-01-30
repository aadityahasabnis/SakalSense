'use client';
// =============================================
// GlobalSearch - Professional command palette with enhanced UX
// Features: Recent searches, Quick Links, Trending, Keyboard navigation
// =============================================

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAtom } from 'jotai';
import {
    ArrowRight,
    BookOpen,
    Clock,
    Code,
    FileText,
    GraduationCap,
    Home,
    Loader2,
    Search,
    Sparkles,
    TrendingUp,
    X,
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
// Recent Searches Helper
// =============================================

interface IRecentSearch {
    query: string;
    timestamp: number;
}

const RECENT_SEARCHES_KEY = 'sakalsense_recent_searches';

const loadRecentSearches = (): IRecentSearch[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        return stored ? JSON.parse(stored) as IRecentSearch[] : [];
    } catch {
        return [];
    }
};

const persistRecentSearches = (searches: IRecentSearch[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch {
        // Ignore localStorage errors
    }
};

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

const getTypeColor = (type: string): string => {
    switch (type) {
        case 'ARTICLE':
        case 'BLOG':
            return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
        case 'TUTORIAL':
            return 'bg-green-500/10 text-green-600 dark:text-green-400';
        case 'CHEATSHEET':
            return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
        case 'PROJECT':
            return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
        case 'NOTE':
            return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
        default:
            return 'bg-muted text-muted-foreground';
    }
};

// =============================================
// Quick Links Configuration
// =============================================

const publicQuickLinks = [
    { href: '/', label: 'Home', icon: Home, description: 'Go to homepage' },
    { href: '/articles', label: 'Articles', icon: FileText, description: 'Browse all articles' },
    { href: '/tutorials', label: 'Tutorials', icon: BookOpen, description: 'Step-by-step guides' },
    { href: '/courses', label: 'Courses', icon: GraduationCap, description: 'Structured learning' },
    { href: '/practice', label: 'Practice', icon: Code, description: 'Coding challenges' },
];

// =============================================
// GlobalSearch Component
// =============================================

export const GlobalSearch = () => {
    const router = useRouter();
    const [open, setOpen] = useAtom(globalSearchOpenAtom);
    
    const [recentSearches, setRecentSearches] = useState<IRecentSearch[]>([]);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<IContentListItem[]>([]);
    const [trendingContent, setTrendingContent] = useState<IContentListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Load recent searches on mount
    useEffect(() => {
        setRecentSearches(loadRecentSearches());
    }, []);

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
    }, [open, trendingContent.length]);

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

    // Save to recent searches
    const saveToRecentSearches = useCallback((searchQuery: string) => {
        const trimmed = searchQuery.trim();
        if (trimmed.length < 2) return;
        
        setRecentSearches((prev) => {
            const filtered = prev.filter((s) => s.query.toLowerCase() !== trimmed.toLowerCase());
            const updated = [{ query: trimmed, timestamp: Date.now() }, ...filtered].slice(0, 5);
            persistRecentSearches(updated);
            return updated;
        });
    }, []);

    // Clear recent search
    const clearRecentSearch = useCallback((queryToRemove: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setRecentSearches((prev) => {
            const updated = prev.filter((s) => s.query !== queryToRemove);
            persistRecentSearches(updated);
            return updated;
        });
    }, []);

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
                // Save successful search to recent
                if (response.data.length > 0) {
                    saveToRecentSearches(searchQuery);
                }
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [saveToRecentSearches]);

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

    // Use recent search
    const handleUseRecentSearch = (recentQuery: string) => {
        setQuery(recentQuery);
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Search articles, tutorials, courses..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList className="max-h-[70vh]">
                {isLoading && (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                    </div>
                )}

                {!isLoading && hasSearched && results.length === 0 && (
                    <CommandEmpty>
                        <div className="py-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <Search className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                                No results for &quot;{query}&quot;
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
                                    className="flex items-center gap-3 py-3 cursor-pointer"
                                >
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getTypeColor(content.type)}`}>
                                        <TypeIcon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{content.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                                {CONTENT_TYPE_LABELS[content.type as ContentType]}
                                            </Badge>
                                            {content.category && (
                                                <span className="text-xs text-muted-foreground truncate">
                                                    in {content.category.name}
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

                {/* Show content when no search query */}
                {!isLoading && !hasSearched && (
                    <>
                        {/* Trending Content - Show at TOP */}
                        {trendingContent.length > 0 && (
                            <CommandGroup heading={
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-orange-500" />
                                    <span>Trending</span>
                                </div>
                            }>
                                {trendingContent.map((content) => {
                                    const ContentTypeIcon = getTypeIcon(content.type);
                                    return (
                                        <CommandItem
                                            key={content.id}
                                            value={`trending:${content.title}`}
                                            onSelect={() => handleSelect(`/content/${content.slug}`)}
                                            className="flex items-center gap-3 py-2.5 cursor-pointer"
                                        >
                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${getTypeColor(content.type)}`}>
                                                <ContentTypeIcon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{content.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Sparkles className="h-3 w-3 text-orange-500" />
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
                        )}

                        {/* Quick Links */}
                        {trendingContent.length > 0 && <CommandSeparator />}
                        <CommandGroup heading="Quick Links">
                            {publicQuickLinks.map((link) => (
                                <CommandItem
                                    key={link.href}
                                    value={link.label}
                                    onSelect={() => handleSelect(link.href)}
                                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <link.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{link.label}</p>
                                        <p className="text-xs text-muted-foreground">{link.description}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Recent Searches">
                                    {recentSearches.map((recent) => (
                                        <CommandItem
                                            key={recent.query}
                                            value={`recent:${recent.query}`}
                                            onSelect={() => handleUseRecentSearch(recent.query)}
                                            className="flex items-center gap-3 py-2 cursor-pointer group"
                                        >
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="flex-1 text-sm">{recent.query}</span>
                                            <button
                                                onClick={(e) => clearRecentSearch(recent.query, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                                            >
                                                <X className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </>
                )}
            </CommandList>
            
            {/* Footer with keyboard hints */}
            <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
                        <span>navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
                        <span>select</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">esc</kbd>
                        <span>close</span>
                    </span>
                </div>
                <span>Powered by SakalSense</span>
            </div>
        </CommandDialog>
    );
};
