'use client';
// =============================================
// DataTable - Reusable table with tabs, caching, row actions, and internal skeleton
// =============================================

import { useCallback, useMemo, useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox, MoreHorizontal, RefreshCw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { type IDataTableProps, type ITableQueryParams, TABLE_DEFAULTS } from '@/types/table.types';

// =============================================
// Internal Skeleton Component
// =============================================

const TableSkeleton = ({ columns, rowCount = TABLE_DEFAULTS.SKELETON_ROWS }: { columns: Array<{ key: string; header: string; className?: string }>; rowCount?: number }) => (
    <Table>
        <TableHeader>
            <TableRow>
                {columns.map((col) => (
                    <TableHead key={col.key} className={col.className}>
                        {col.header}
                    </TableHead>
                ))}
            </TableRow>
        </TableHeader>
        <TableBody>
            {Array.from({ length: rowCount }).map((_, i) => (
                <TableRow key={i}>
                    {columns.map((col) => (
                        <TableCell key={col.key} className={col.className}>
                            <Skeleton className='h-4 w-full max-w-[200px]' />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

// =============================================
// Empty State Component
// =============================================

const EmptyState = ({ icon: Icon = Inbox, title, message }: { icon?: typeof Inbox; title: string; message: string }) => (
    <div className='flex flex-col items-center justify-center py-16 text-center'>
        <Icon className='h-12 w-12 text-muted-foreground/50 mb-4' />
        <h3 className='text-lg font-medium text-foreground'>{title}</h3>
        <p className='text-sm text-muted-foreground mt-1'>{message}</p>
    </div>
);

// =============================================
// Tab Button Component
// =============================================

const TabButton = ({ label, count, isActive, onClick }: { label: string; count?: number; isActive: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
    >
        {label}
        {count !== undefined && <span className={cn('ml-2 rounded-full px-2 py-0.5 text-xs', isActive ? 'bg-primary-foreground/20' : 'bg-background')}>{count}</span>}
    </button>
);

// =============================================
// Row Actions Menu Component
// =============================================

const RowActionsMenu = <TData,>({ row, actions, processingRowKey }: { row: TData; actions: IDataTableProps<TData>['config']['rowActions']; processingRowKey: string | undefined }) => {
    if (!actions?.length) return null;

    const visibleActions = actions.filter((action) => !action.visible || action.visible(row));
    if (!visibleActions.length) return null;

    const rowKey = String((row as Record<string, unknown>)['id'] ?? '');
    const isProcessing = processingRowKey === rowKey;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon-sm' disabled={isProcessing}>
                    <MoreHorizontal className='h-4 w-4' />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                {visibleActions.map((action, index) => {
                    const isDisabled = action.disabled?.(row) ?? isProcessing;
                    const showSeparator = action.variant === 'destructive' && index > 0;

                    return (
                        <div key={action.key}>
                            {showSeparator && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                                onClick={() => void action.onClick(row)}
                                disabled={isDisabled}
                                variant={action.variant}
                                className='gap-2'
                            >
                                {action.icon && <action.icon className='h-4 w-4' />}
                                {action.label}
                            </DropdownMenuItem>
                        </div>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

// =============================================
// Main DataTable Component
// =============================================

export const DataTable = <TData,>({
    config,
    tabs,
    defaultTab,
    queryKey: singleQueryKey,
    queryFn: singleQueryFn,
    filters,
    title,
    description,
    headerActions,
    searchPlaceholder = 'Search...',
    showSearch = true,
    showRefresh = true,
}: IDataTableProps<TData>) => {
    const queryClient = useQueryClient();

    // State
    const [activeTab, setActiveTab] = useState(defaultTab ?? tabs?.[0]?.key ?? 'default');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<string | undefined>();
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [search, setSearch] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [processingRowKey, _setProcessingRowKey] = useState<string | undefined>();

    // Get active tab config
    const activeTabConfig = useMemo(() => tabs?.find((t) => t.key === activeTab), [tabs, activeTab]);

    // Build query params
    const queryParams: ITableQueryParams = useMemo(
        () => ({
            page,
            limit: config.pageSize ?? TABLE_DEFAULTS.PAGE_SIZE,
            sortBy,
            sortOrder,
            search,
            filters: filterValues,
        }),
        [page, config.pageSize, sortBy, sortOrder, search, filterValues],
    );

    // Determine query key and function
    const finalQueryKey = useMemo(() => {
        if (activeTabConfig) return [...activeTabConfig.queryKey, queryParams];
        return [...(singleQueryKey ?? ['table']), queryParams];
    }, [activeTabConfig, singleQueryKey, queryParams]);

    const finalQueryFn = activeTabConfig?.queryFn ?? singleQueryFn;

    // Fetch data with TanStack Query
    const { data: result, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: finalQueryKey,
        queryFn: () => finalQueryFn?.(queryParams) ?? Promise.resolve({ data: [], total: 0, page: 1, totalPages: 1 }),
        staleTime: config.staleTime ?? TABLE_DEFAULTS.STALE_TIME,
        gcTime: config.gcTime ?? TABLE_DEFAULTS.GC_TIME,
        enabled: Boolean(finalQueryFn),
    });

    const data = result?.data ?? [];
    const totalPages = result?.totalPages ?? 1;
    const total = result?.total ?? 0;

    // Handlers
    const handleSort = useCallback((key: string) => {
        setSortBy((prev) => {
            if (prev === key) {
                setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                return prev;
            }
            setSortOrder('desc');
            return key;
        });
        setPage(1);
    }, []);

    const handleTabChange = useCallback((key: string) => {
        setActiveTab(key);
        setPage(1);
        setSearch('');
    }, []);

    const handleRefresh = useCallback(() => {
        void refetch();
        // Also invalidate counts if tabs have counts
        if (tabs?.some((t) => t.count !== undefined)) {
            void queryClient.invalidateQueries({ queryKey: ['counts'] });
        }
    }, [refetch, queryClient, tabs]);

    const handleSearch = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    // Sort icon renderer
    const getSortIcon = (key: string) => {
        if (sortBy !== key) return <ArrowUpDown className='ml-2 h-4 w-4' />;
        return sortOrder === 'asc' ? <ArrowUp className='ml-2 h-4 w-4' /> : <ArrowDown className='ml-2 h-4 w-4' />;
    };

    // Columns with actions column if needed
    const columnsWithActions = useMemo(() => {
        if (!config.rowActions?.length) return config.columns;
        return [
            ...config.columns,
            {
                key: '_actions',
                header: '',
                className: 'w-[50px]',
                render: (row: TData) => <RowActionsMenu row={row} actions={config.rowActions} processingRowKey={processingRowKey} />,
            },
        ];
    }, [config.columns, config.rowActions, processingRowKey]);

    return (
        <div className='space-y-4'>
            {/* Header */}
            {(title ?? headerActions) && (
                <div className='flex items-center justify-between'>
                    <div>
                        {title && <h2 className='text-lg font-semibold'>{title}</h2>}
                        {description && <p className='text-sm text-muted-foreground'>{description}</p>}
                    </div>
                    <div className='flex items-center gap-2'>
                        {headerActions}
                        {showRefresh && (
                            <Button variant='outline' size='sm' onClick={handleRefresh} disabled={isFetching}>
                                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Tabs */}
            {tabs && tabs.length > 0 && (
                <div className='flex gap-2 flex-wrap'>
                    {tabs.map((tab) => (
                        <TabButton key={tab.key} label={tab.label} count={tab.count} isActive={activeTab === tab.key} onClick={() => handleTabChange(tab.key)} />
                    ))}
                </div>
            )}

            {/* Filters Row */}
            <div className='flex flex-wrap items-center gap-2'>
                {showSearch && (
                    <div className='relative flex-1 max-w-sm'>
                        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                        <Input
                            type='text'
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className='pl-10'
                        />
                    </div>
                )}
                {filters?.map((filter) => (
                    <Select
                        key={filter.key}
                        value={filterValues[filter.key] ?? ''}
                        onValueChange={(value) => {
                            setFilterValues((prev) => ({ ...prev, [filter.key]: value === '__all__' ? '' : value }));
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className='w-[160px]'>
                            <SelectValue placeholder={filter.placeholder ?? filter.label} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='__all__'>{filter.placeholder ?? `All ${filter.label}`}</SelectItem>
                            {filter.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ))}
            </div>

            {/* Table */}
            <div className='rounded-md border'>
                {isLoading ? (
                    <TableSkeleton columns={columnsWithActions} />
                ) : isError ? (
                    <div className='p-8 text-center text-destructive'>Error loading data. Please try again.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columnsWithActions.map((col) => (
                                    <TableHead key={col.key} className={col.className}>
                                        {'sortable' in col && col.sortable ? (
                                            <Button variant='ghost' size='sm' className='-ml-3 h-8' onClick={() => handleSort(col.key)}>
                                                {col.header}
                                                {getSortIcon(col.key)}
                                            </Button>
                                        ) : (
                                            col.header
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columnsWithActions.length} className='h-32'>
                                        <EmptyState
                                            icon={config.emptyIcon}
                                            title={config.emptyTitle ?? TABLE_DEFAULTS.EMPTY_TITLE}
                                            message={config.emptyMessage ?? TABLE_DEFAULTS.EMPTY_MESSAGE}
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, rowIndex) => {
                                    const rowKeyValue = String((row as Record<string, unknown>)[config.rowKey as string]);
                                    return (
                                        <TableRow
                                            key={rowKeyValue}
                                            className={cn(config.onRowClick && 'cursor-pointer hover:bg-muted/50')}
                                            onClick={() => config.onRowClick?.(row)}
                                        >
                                            {columnsWithActions.map((col) => (
                                                <TableCell key={col.key} className={col.className}>
                                                    {col.render ? col.render(row, rowIndex) : String((row as Record<string, unknown>)[col.key] ?? '-')}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className='flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>
                        Showing {(page - 1) * (config.pageSize ?? TABLE_DEFAULTS.PAGE_SIZE) + 1} to{' '}
                        {Math.min(page * (config.pageSize ?? TABLE_DEFAULTS.PAGE_SIZE), total)} of {total}
                    </p>
                    <div className='flex items-center gap-2'>
                        <Button variant='outline' size='sm' onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                            <ChevronLeft className='h-4 w-4' />
                            Previous
                        </Button>
                        <span className='text-sm'>
                            Page {page} of {totalPages}
                        </span>
                        <Button variant='outline' size='sm' onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                            Next
                            <ChevronRight className='h-4 w-4' />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Re-export types for convenience
export type { IDataTableProps, ITableColumn, ITableConfig, ITableTab, IRowAction, ITableFilter } from '@/types/table.types';
