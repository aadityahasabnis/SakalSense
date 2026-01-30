'use client';

// =============================================
// SearchDialog - Global search with keyboard shortcut
// =============================================

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAtom } from 'jotai';
import { BookOpen, Code, FileText, GraduationCap, Loader2, Search } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CONTENT_TYPE } from '@/constants/content.constants';
import { EMPTY_STATE } from '@/constants/messages.constants';
import { globalSearchLoadingAtom, globalSearchOpenAtom, globalSearchQueryAtom } from '@/jotai/atoms';
import { globalSearch, type ISearchResult } from '@/server/actions/search/searchActions';

// =============================================
// Icon Mapping
// =============================================

const TYPE_ICONS: Record<string, typeof FileText> = {
    [CONTENT_TYPE.ARTICLE]: FileText,
    [CONTENT_TYPE.BLOG]: FileText,
    [CONTENT_TYPE.TUTORIAL]: BookOpen,
    [CONTENT_TYPE.CHEATSHEET]: Code,
    [CONTENT_TYPE.PROJECT]: Code,
    [CONTENT_TYPE.NOTE]: FileText,
    COURSE: GraduationCap,
    SERIES: BookOpen,
};

// =============================================
// Component
// =============================================

export const SearchDialog = () => {
    const router = useRouter();
    const [open, setOpen] = useAtom(globalSearchOpenAtom);
    const [query, setQuery] = useAtom(globalSearchQueryAtom);
    const [loading, setLoading] = useAtom(globalSearchLoadingAtom);
    const [results, setResults] = useState<Array<ISearchResult>>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // =============================================
    // Keyboard Shortcuts
    // =============================================

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(true);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [setOpen]);

    // Arrow key navigation
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && results[selectedIndex]) {
                e.preventDefault();
                handleSelect(results[selectedIndex]);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, results, selectedIndex]);

    // =============================================
    // Search Handler
    // =============================================

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);

        try {
            const response = await globalSearch(searchQuery, { limit: 10 });
            if (response.success && response.data) {
                setResults(response.data.results);
                setSelectedIndex(0);
            } else {
                setResults([]);
            }
        } catch {
            setResults([]);
        }

        setLoading(false);
    }, [setLoading]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => void handleSearch(query), 300);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    // =============================================
    // Select Handler
    // =============================================

    const handleSelect = (result: ISearchResult) => {
        setOpen(false);
        setQuery('');
        setResults([]);

        // Route based on type
        if (result.type === 'COURSE') {
            router.push(`/courses/${result.slug}`);
        } else if (result.type === 'SERIES') {
            router.push(`/series/${result.slug}`);
        } else {
            router.push(`/content/${result.slug}`);
        }
    };

    // Reset when dialog closes
    useEffect(() => {
        if (!open) {
            setResults([]);
            setSelectedIndex(0);
        }
    }, [open]);

    // =============================================
    // Render
    // =============================================

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 sm:max-w-xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Search</DialogTitle>
                </DialogHeader>

                {/* Search Input */}
                <div className="flex items-center border-b px-3">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                        placeholder="Search content, courses, tutorials..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto p-2">
                    {/* Empty States */}
                    {query && results.length === 0 && !loading && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            {EMPTY_STATE.NO_RESULTS}
                        </p>
                    )}
                    {!query && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            {EMPTY_STATE.START_SEARCH}
                        </p>
                    )}

                    {/* Results List */}
                    {results.map((result, index) => {
                        const Icon = TYPE_ICONS[result.type] ?? FileText;
                        const isSelected = index === selectedIndex;

                        return (
                            <button
                                key={result.id}
                                onClick={() => handleSelect(result)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                    isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                                }`}
                            >
                                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate font-medium">{result.title}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {result.type}
                                        </span>
                                        {result.excerpt && (
                                            <>
                                                <span className="text-xs text-muted-foreground">·</span>
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {result.excerpt.slice(0, 50)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Keyboard Hints */}
                {results.length > 0 && (
                    <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                        <span className="mr-3">
                            <kbd className="rounded border bg-muted px-1">↑</kbd>
                            <kbd className="rounded border bg-muted px-1">↓</kbd> to navigate
                        </span>
                        <span>
                            <kbd className="rounded border bg-muted px-1">↵</kbd> to select
                        </span>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
