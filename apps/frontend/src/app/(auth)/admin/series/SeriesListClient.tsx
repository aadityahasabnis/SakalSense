'use client';
// =============================================
// SeriesListClient - Series list with DataTable system
// =============================================

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { Edit, Eye, FolderOpen, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/common/PageElements';
import { DataTable } from '@/components/table/DataTable';
import { Badge } from '@/components/ui/badge';
import { CONTENT_STATUS_COLORS, CONTENT_STATUS_LABELS, CONTENT_TYPE_LABELS, type ContentStatusType, type ContentType } from '@/constants/content.constants';
import { BUTTON_LABEL } from '@/constants/messages.constants';
import { useDialog } from '@/hooks/useDialog';
import { deleteSeries, getSeriesList } from '@/server/actions/content/seriesActions';
import { type ISeries } from '@/types/content.types';
import { type ITableColumn, type ITableConfig, type ITableFilter, type ITableQueryParams, type ITableQueryResult, type ITableTab } from '@/types/table.types';

// =============================================
// Query Function Adapter
// =============================================

const fetchSeries = async (params: ITableQueryParams, statusFilter?: ContentStatusType): Promise<ITableQueryResult<ISeries>> => {
    const filters = params.filters as Record<string, string> | undefined;
    const result = await getSeriesList({
        search: params.search,
        contentType: filters?.contentType as ContentType,
        status: statusFilter ?? (filters?.status as ContentStatusType),
        page: params.page,
        limit: params.limit,
    });

    if (!result.success || !result.data) {
        return { data: [], total: 0, page: params.page, totalPages: 0 };
    }

    const total = result.total ?? 0;
    return { data: result.data, total, page: params.page, totalPages: Math.ceil(total / params.limit) };
};

// =============================================
// Main Component
// =============================================

export const SeriesListClient = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openDialog, DialogRenderer } = useDialog();

    // Invalidate all series queries on refresh
    const invalidateQueries = () => queryClient.invalidateQueries({ queryKey: ['series'] });

    // =============================================
    // Row Actions with useDialog
    // =============================================

    const handleDelete = (row: ISeries) => {
        openDialog({
            type: 'confirm',
            title: 'Delete Series?',
            description: `Are you sure you want to delete "${row.title}"? This action cannot be undone. Series items will not be deleted.`,
            confirmLabel: 'Delete',
            variant: 'destructive',
            onConfirm: async () => {
                await deleteSeries(row.id);
                void invalidateQueries();
            },
        });
    };

    // =============================================
    // Table Configuration
    // =============================================

    const columns: Array<ITableColumn<ISeries>> = [
        {
            key: 'title',
            header: 'Title',
            sortable: true,
            render: (row) => (
                <div>
                    <p className='font-medium'>{row.title}</p>
                    <p className='text-sm text-muted-foreground'>{row.slug}</p>
                </div>
            ),
        },
        {
            key: 'contentType',
            header: 'Content Type',
            sortable: true,
            render: (row) => <Badge variant='outline'>{CONTENT_TYPE_LABELS[row.contentType]}</Badge>,
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (row) => <Badge className={CONTENT_STATUS_COLORS[row.status]}>{CONTENT_STATUS_LABELS[row.status]}</Badge>,
        },
        {
            key: 'createdAt',
            header: 'Created',
            sortable: true,
            render: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
    ];

    const config: ITableConfig<ISeries> = {
        rowKey: 'id',
        columns,
        pageSize: 20,
        emptyIcon: FolderOpen,
        emptyTitle: 'No series yet',
        emptyMessage: 'Create your first series to organize related content.',
        onRowClick: (row) => router.push(`/admin/series/${row.id}`),
        rowActions: [
            { key: 'view', label: 'View', icon: Eye, onClick: (row) => router.push(`/admin/series/${row.id}`) },
            { key: 'edit', label: 'Edit', icon: Edit, onClick: (row) => router.push(`/admin/series/${row.id}/edit`) },
            { key: 'delete', label: 'Delete', icon: Trash2, variant: 'destructive', onClick: handleDelete },
        ],
    };

    // =============================================
    // Tabs - Status-based filtering with TanStack Query caching
    // =============================================

    const tabs: Array<ITableTab<ISeries>> = [
        { key: 'all', label: 'All', queryKey: ['series', 'all'], queryFn: (params) => fetchSeries(params) },
        { key: 'draft', label: 'Drafts', queryKey: ['series', 'draft'], queryFn: (params) => fetchSeries(params, 'DRAFT') },
        { key: 'published', label: 'Published', queryKey: ['series', 'published'], queryFn: (params) => fetchSeries(params, 'PUBLISHED') },
    ];

    // =============================================
    // Filters
    // =============================================

    const filters: Array<ITableFilter> = [
        {
            key: 'contentType',
            label: 'Content Type',
            type: 'select',
            options: Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            placeholder: 'All Types',
        },
    ];

    // =============================================
    // Render
    // =============================================

    return (
        <>
            <div className='space-y-6'>
                <PageHeader title='Series' description='Organize related content into collections' action={{ label: BUTTON_LABEL.CREATE, href: '/admin/series/new' }} />
                <DataTable<ISeries>
                    config={config}
                    tabs={tabs}
                    defaultTab='all'
                    filters={filters}
                    searchPlaceholder='Search by title or slug...'
                    showSearch
                    showRefresh
                />
            </div>
            {DialogRenderer()}
        </>
    );
};
