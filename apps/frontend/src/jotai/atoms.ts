// Jotai Atoms — Global State Management

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// =============================================
// Current User State (Hydrated from server)
// =============================================

export interface ICurrentUserState {
    userId: string;
    fullName: string;
    email?: string;
    avatarLink?: string | null;
    isVerified?: boolean;
    stakeholder: 'USER' | 'ADMIN' | 'ADMINISTRATOR';
}

// Current logged-in user (set by layout, not persisted to localStorage)
export const currentUserAtom = atom<ICurrentUserState | null>(null);

// Derived atoms for quick access
export const isLoggedInAtom = atom((get) => get(currentUserAtom) !== null);
export const userIdAtom = atom((get) => get(currentUserAtom)?.userId ?? null);
export const userNameAtom = atom((get) => get(currentUserAtom)?.fullName ?? null);
export const userAvatarAtom = atom((get) => get(currentUserAtom)?.avatarLink ?? null);

// =============================================
// Table State
// =============================================
export interface ITableFilters { search: string; category: string; type: string; status: string; difficulty: string; domain: string; topic: string }
export interface ITableSort { field: string; direction: 'asc' | 'desc' }
export interface ITablePagination { page: number; limit: number; total: number }

const DEFAULT_FILTERS: ITableFilters = { search: '', category: '', type: '', status: '', difficulty: '', domain: '', topic: '' };
const DEFAULT_SORT: ITableSort = { field: 'createdAt', direction: 'desc' };
const DEFAULT_PAGINATION: ITablePagination = { page: 1, limit: 20, total: 0 };

export const tableFiltersAtom = atom<ITableFilters>(DEFAULT_FILTERS);
export const tableSortAtom = atom<ITableSort>(DEFAULT_SORT);
export const tablePaginationAtom = atom<ITablePagination>(DEFAULT_PAGINATION);
export const tableQueryAtom = atom((get) => ({ ...get(tableFiltersAtom), sortField: get(tableSortAtom).field, sortDir: get(tableSortAtom).direction, page: get(tablePaginationAtom).page, limit: get(tablePaginationAtom).limit }));
export const resetTableFiltersAtom = atom(null, (_get, set) => { set(tableFiltersAtom, DEFAULT_FILTERS); set(tableSortAtom, DEFAULT_SORT); set(tablePaginationAtom, DEFAULT_PAGINATION); });

// UI State (Persisted)
export const sidebarOpenAtom = atomWithStorage('sidebarOpen', true);
export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light');
export const compactModeAtom = atomWithStorage('compactMode', false);

// Search
export interface ISearchResult { id: string; title: string; type: string; slug: string; excerpt?: string }
export const globalSearchQueryAtom = atom('');
export const globalSearchResultsAtom = atom<Array<ISearchResult>>([]);
export const globalSearchLoadingAtom = atom(false);
export const globalSearchOpenAtom = atom(false);

// Editor State
export interface IEditorState { isDirty: boolean; isSaving: boolean; lastSavedAt?: Date }
export const editorStateAtom = atom<IEditorState>({ isDirty: false, isSaving: false });

// Navigation
export interface INavigationContext { currentId?: string; previousId?: string; nextId?: string; parentType?: 'series' | 'course' | 'path'; parentId?: string; position?: number; total?: number }
export const navigationContextAtom = atom<INavigationContext>({});

// Notifications
export interface INotification { id: string; type: 'success' | 'error' | 'info' | 'warning'; message: string; duration?: number }
export const notificationsAtom = atom<Array<INotification>>([]);
export const addNotificationAtom = atom(null, (get, set, notification: Omit<INotification, 'id'>) => { const id = crypto.randomUUID(); set(notificationsAtom, [...get(notificationsAtom), { ...notification, id }]); if (notification.duration !== 0) setTimeout(() => set(notificationsAtom, get(notificationsAtom).filter((n) => n.id !== id)), notification.duration ?? 5000); });
export const removeNotificationAtom = atom(null, (get, set, id: string) => set(notificationsAtom, get(notificationsAtom).filter((n) => n.id !== id)));

// =============================================
// User Preferences (Persisted to localStorage)
// =============================================

// Reading Preferences
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type CodeTheme = 'github-dark' | 'github-light' | 'dracula' | 'monokai' | 'one-dark' | 'vs-code';
export type LineHeight = 'compact' | 'normal' | 'relaxed';

export const fontSizeAtom = atomWithStorage<FontSize>('userPref_fontSize', 'medium');
export const codeThemeAtom = atomWithStorage<CodeTheme>('userPref_codeTheme', 'github-dark');
export const lineHeightAtom = atomWithStorage<LineHeight>('userPref_lineHeight', 'normal');
export const showLineNumbersAtom = atomWithStorage('userPref_showLineNumbers', true);
export const enableCodeCopyAtom = atomWithStorage('userPref_enableCodeCopy', true);

// Reading History (recent content IDs for "Continue Reading")
export interface IReadingHistoryItem {
    contentId: string;
    slug: string;
    title: string;
    progress: number;
    lastReadAt: number; // timestamp
}
export const readingHistoryAtom = atomWithStorage<Array<IReadingHistoryItem>>('userPref_readingHistory', []);

// Add to reading history (keeps last 20 items)
export const addToReadingHistoryAtom = atom(
    null,
    (get, set, item: Omit<IReadingHistoryItem, 'lastReadAt'>) => {
        const history = get(readingHistoryAtom);
        const filtered = history.filter((h) => h.contentId !== item.contentId);
        const newItem: IReadingHistoryItem = { ...item, lastReadAt: Date.now() };
        set(readingHistoryAtom, [newItem, ...filtered].slice(0, 20));
    }
);

// Update reading progress in history
export const updateReadingProgressAtom = atom(
    null,
    (get, set, { contentId, progress }: { contentId: string; progress: number }) => {
        const history = get(readingHistoryAtom);
        set(
            readingHistoryAtom,
            history.map((h) =>
                h.contentId === contentId ? { ...h, progress, lastReadAt: Date.now() } : h
            )
        );
    }
);

// Clear reading history
export const clearReadingHistoryAtom = atom(null, (_get, set) => {
    set(readingHistoryAtom, []);
});

// Bookmarks (client-side cache for quick access)
export interface IBookmarkItem {
    contentId: string;
    slug: string;
    title: string;
    type: string;
    addedAt: number;
}
export const localBookmarksAtom = atomWithStorage<Array<IBookmarkItem>>('userPref_bookmarks', []);

export const addLocalBookmarkAtom = atom(
    null,
    (get, set, item: Omit<IBookmarkItem, 'addedAt'>) => {
        const bookmarks = get(localBookmarksAtom);
        if (!bookmarks.find((b) => b.contentId === item.contentId)) {
            set(localBookmarksAtom, [{ ...item, addedAt: Date.now() }, ...bookmarks].slice(0, 50));
        }
    }
);

export const removeLocalBookmarkAtom = atom(null, (get, set, contentId: string) => {
    set(localBookmarksAtom, get(localBookmarksAtom).filter((b) => b.contentId !== contentId));
});

// Content Engagement Cache (likes, bookmarks status for current session)
export interface IEngagementCache {
    [contentId: string]: {
        isLiked?: boolean;
        isBookmarked?: boolean;
        likeCount?: number;
    };
}
export const engagementCacheAtom = atom<IEngagementCache>({});

export const updateEngagementCacheAtom = atom(
    null,
    (get, set, { contentId, data }: { contentId: string; data: Partial<IEngagementCache[string]> }) => {
        const cache = get(engagementCacheAtom);
        set(engagementCacheAtom, {
            ...cache,
            [contentId]: { ...cache[contentId], ...data },
        });
    }
);

// Accessibility Preferences
export const reducedMotionAtom = atomWithStorage('userPref_reducedMotion', false);
export const highContrastAtom = atomWithStorage('userPref_highContrast', false);

// Font size CSS mapping (for easy use in components)
export const fontSizeClassMap: Record<FontSize, string> = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
};

// Line height CSS mapping
export const lineHeightClassMap: Record<LineHeight, string> = {
    compact: 'leading-snug',
    normal: 'leading-relaxed',
    relaxed: 'leading-loose',
};
