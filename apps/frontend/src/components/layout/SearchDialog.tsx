'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAtom } from 'jotai';
import { BookOpen, Code, FileText, GraduationCap, Loader2, Search } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CONTENT_TYPE } from '@/constants/content.constants';
import { EMPTY_STATE } from '@/constants/messages.constants';
import { globalSearchLoadingAtom, globalSearchOpenAtom, globalSearchQueryAtom } from '@/jotai/atoms';

interface ISearchResult { id: string; title: string; type: string; slug: string; excerpt?: string }

const TYPE_ICONS: Record<string, typeof FileText> = { [CONTENT_TYPE.ARTICLE]: FileText, [CONTENT_TYPE.BLOG]: FileText, [CONTENT_TYPE.TUTORIAL]: BookOpen, [CONTENT_TYPE.CHEATSHEET]: Code, [CONTENT_TYPE.PROJECT]: Code, [CONTENT_TYPE.NOTE]: FileText, COURSE: GraduationCap, SERIES: BookOpen };

export const SearchDialog = () => {
    const router = useRouter();
    const [open, setOpen] = useAtom(globalSearchOpenAtom);
    const [query, setQuery] = useAtom(globalSearchQueryAtom);
    const [loading, setLoading] = useAtom(globalSearchLoadingAtom);
    const [results, setResults] = useState<Array<ISearchResult>>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); } };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [setOpen]);

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) { setResults([]); return; }
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 300)); // TODO: Replace with actual API
        setResults([{ id: '1', title: 'JavaScript Basics', type: 'ARTICLE', slug: 'javascript-basics' }, { id: '2', title: 'React Hooks Tutorial', type: 'TUTORIAL', slug: 'react-hooks' }, { id: '3', title: 'Web Development Course', type: 'COURSE', slug: 'web-dev-course' }]);
        setLoading(false);
    }, [setLoading]);

    useEffect(() => { const timer = setTimeout(() => handleSearch(query), 300); return () => clearTimeout(timer); }, [query, handleSearch]);

    const handleSelect = (result: ISearchResult) => { setOpen(false); setQuery(''); router.push(`/content/${result.slug}`); };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-xl p-0">
                <DialogHeader className="sr-only"><DialogTitle>Search</DialogTitle></DialogHeader>
                <div className="flex items-center border-b px-3">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input placeholder="Search content, courses, tutorials..." value={query} onChange={(e) => setQuery(e.target.value)} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                    {query && results.length === 0 && !loading && <p className="py-6 text-center text-sm text-muted-foreground">{EMPTY_STATE.NO_RESULTS}</p>}
                    {!query && <p className="py-6 text-center text-sm text-muted-foreground">{EMPTY_STATE.START_SEARCH}</p>}
                    {results.map((result) => { const Icon = TYPE_ICONS[result.type] ?? FileText; return (
                        <button key={result.id} onClick={() => handleSelect(result)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="flex-1 overflow-hidden"><p className="truncate font-medium">{result.title}</p><p className="truncate text-xs text-muted-foreground">{result.type}</p></div>
                        </button>
                    ); })}
                </div>
            </DialogContent>
        </Dialog>
    );
};
