// Jotai Atoms — Global State Management

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Table State
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
