// =============================================
// Table Configuration Types - For reusable DataTable system
// =============================================

import { type ReactNode } from 'react';

import { type LucideIcon } from 'lucide-react';

// =============================================
// Column Definitions
// =============================================

export interface ITableColumn<TData> {
    key: string;
    header: string;
    sortable?: boolean;
    className?: string;
    width?: string;
    render?: (row: TData, rowIndex: number) => ReactNode;
}

// =============================================
// Tab Configuration (for lazy-loaded tabs)
// =============================================

export interface ITableTab<TData> {
    key: string;
    label: string;
    count?: number;
    queryKey: Array<unknown>;
    queryFn: (params: ITableQueryParams) => Promise<ITableQueryResult<TData>>;
}

// =============================================
// Query Parameters & Results
// =============================================

export interface ITableQueryParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, unknown>;
}

export interface ITableQueryResult<TData> {
    data: Array<TData>;
    total: number;
    page: number;
    totalPages: number;
}

// =============================================
// Row Actions (Dropdown Menu)
// =============================================

export interface IRowAction<TData> {
    key: string;
    label: string;
    icon?: LucideIcon;
    variant?: 'default' | 'destructive';
    visible?: (row: TData) => boolean;
    disabled?: (row: TData) => boolean;
    onClick: (row: TData) => void | Promise<void>;
}

// =============================================
// Inline Actions (Column-level, e.g., toggle switch)
// =============================================

export interface IInlineAction<TData> {
    key: string;
    type: 'toggle' | 'button';
    render: (row: TData, isLoading: boolean) => ReactNode;
    onAction: (row: TData) => Promise<void>;
}

// =============================================
// Filter Configuration
// =============================================

export interface ITableFilter {
    key: string;
    label: string;
    type: 'select' | 'search';
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
}

// =============================================
// Table Configuration (Main Config Object)
// =============================================

export interface ITableConfig<TData> {
    // Identity
    rowKey: keyof TData;

    // Columns
    columns: Array<ITableColumn<TData>>;

    // Query Configuration
    staleTime?: number; // default: 30s
    gcTime?: number;    // default: 5min

    // Pagination
    pageSize?: number;  // default: 10

    // Empty State
    emptyIcon?: LucideIcon;
    emptyTitle?: string;
    emptyMessage?: string;

    // Row Actions (3 dots menu)
    rowActions?: Array<IRowAction<TData>>;

    // Inline Actions (column-level controls)
    inlineActions?: Array<IInlineAction<TData>>;

    // Row click handler
    onRowClick?: (row: TData) => void;
}

// =============================================
// DataTable Props
// =============================================

export interface IDataTableProps<TData> {
    config: ITableConfig<TData>;

    // Tab Support (optional)
    tabs?: Array<ITableTab<TData>>;
    defaultTab?: string;

    // Single Query Mode (when no tabs)
    queryKey?: Array<unknown>;
    queryFn?: (params: ITableQueryParams) => Promise<ITableQueryResult<TData>>;

    // Filters (optional)
    filters?: Array<ITableFilter>;

    // Header
    title?: string;
    description?: string;
    headerActions?: ReactNode;

    // Search
    searchPlaceholder?: string;
    showSearch?: boolean;

    // Refresh
    showRefresh?: boolean;
}

// =============================================
// Constants
// =============================================

export const TABLE_DEFAULTS = {
    PAGE_SIZE: 10,
    SKELETON_ROWS: 10,
    STALE_TIME: 30 * 1000,      // 30 seconds
    GC_TIME: 5 * 60 * 1000,     // 5 minutes
    EMPTY_TITLE: 'No data',
    EMPTY_MESSAGE: 'No items to display.',
} as const;
