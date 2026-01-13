'use client';
// =============================================
// ContentListClient - Content list with new DataTable system
// =============================================

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { Archive, Edit, Eye, FileText, Send, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/common/PageElements';
import { DataTable } from '@/components/table/DataTable';
import { Badge } from '@/components/ui/badge';
import { CONTENT_STATUS_COLORS, CONTENT_STATUS_LABELS, CONTENT_TYPE_LABELS, type ContentStatusType, type ContentType, DIFFICULTY_COLORS, DIFFICULTY_LABELS, type DifficultyType } from '@/constants/content.constants';
import { BUTTON_LABEL } from '@/constants/messages.constants';
import { useDialog } from '@/hooks/useDialog';
import { archiveContent, deleteContent, getContentList, publishContent } from '@/server/actions/content/contentActions';
import { type IContentListItem } from '@/types/content.types';
import { type ITableColumn, type ITableConfig, type ITableFilter, type ITableQueryParams, type ITableQueryResult, type ITableTab } from '@/types/table.types';

// =============================================
// Query Function Adapter
// =============================================

const fetchContent = async (params: ITableQueryParams, statusFilter?: ContentStatusType): Promise<ITableQueryResult<IContentListItem>> => {
    const filters = params.filters as Record<string, string> | undefined;
    const result = await getContentList({
        search: params.search,
        type: filters?.type as ContentType,
        status: statusFilter ?? (filters?.status as ContentStatusType),
        difficulty: filters?.difficulty as DifficultyType,
        page: params.page,
        limit: params.limit,
        sortField: params.sortBy,
        sortDir: params.sortOrder,
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

export const ContentListClient = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { openDialog, DialogRenderer } = useDialog();

    // Invalidate all content queries on refresh
    const invalidateQueries = () => queryClient.invalidateQueries({ queryKey: ['content'] });

    // =============================================
    // Row Actions with useDialog
    // =============================================

    const handlePublish = (row: IContentListItem) => {
        openDialog({
            type: 'confirm',
            title: 'Publish Content?',
            description: `This will make "${row.title}" publicly visible.`,
            confirmLabel: 'Publish',
            variant: 'default',
            onConfirm: async () => {
                await publishContent(row.id);
                void invalidateQueries();
            },
        });
    };

    const handleArchive = (row: IContentListItem) => {
        openDialog({
            type: 'confirm',
            title: 'Archive Content?',
            description: `This will archive "${row.title}" and hide it from public view.`,
            confirmLabel: 'Archive',
            variant: 'default',
            onConfirm: async () => {
                await archiveContent(row.id);
                void invalidateQueries();
            },
        });
    };

    const handleDelete = (row: IContentListItem) => {
        openDialog({
            type: 'confirm',
            title: 'Delete Content?',
            description: `Are you sure you want to delete "${row.title}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'destructive',
            onConfirm: async () => {
                await deleteContent(row.id);
                void invalidateQueries();
            },
        });
    };

    // =============================================
    // Table Configuration
    // =============================================

    const columns: Array<ITableColumn<IContentListItem>> = [
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
            key: 'type',
            header: 'Type',
            sortable: true,
            render: (row) => <Badge variant='outline'>{CONTENT_TYPE_LABELS[row.type]}</Badge>,
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (row) => <Badge className={CONTENT_STATUS_COLORS[row.status]}>{CONTENT_STATUS_LABELS[row.status]}</Badge>,
        },
        {
            key: 'difficulty',
            header: 'Difficulty',
            render: (row) => <Badge className={DIFFICULTY_COLORS[row.difficulty]}>{DIFFICULTY_LABELS[row.difficulty]}</Badge>,
        },
        {
            key: 'viewCount',
            header: 'Views',
            sortable: true,
            className: 'text-right',
            render: (row) => row.viewCount.toLocaleString(),
        },
    ];

    const config: ITableConfig<IContentListItem> = {
        rowKey: 'id',
        columns,
        pageSize: 20,
        emptyIcon: FileText,
        emptyTitle: 'No content yet',
        emptyMessage: 'Create your first article, tutorial, or project.',
        onRowClick: (row) => router.push(`/admin/content/${row.id}`),
        rowActions: [
            { key: 'view', label: 'View', icon: Eye, onClick: (row) => router.push(`/admin/content/${row.id}`) },
            { key: 'edit', label: 'Edit', icon: Edit, onClick: (row) => router.push(`/admin/content/${row.id}/edit`) },
            { key: 'publish', label: 'Publish', icon: Send, visible: (row) => row.status !== 'PUBLISHED', onClick: handlePublish },
            { key: 'archive', label: 'Archive', icon: Archive, visible: (row) => row.status !== 'ARCHIVED', onClick: handleArchive },
            { key: 'delete', label: 'Delete', icon: Trash2, variant: 'destructive', onClick: handleDelete },
        ],
    };

    // =============================================
    // Tabs - Status-based filtering with TanStack Query caching
    // =============================================

    const tabs: Array<ITableTab<IContentListItem>> = [
        { key: 'all', label: 'All', queryKey: ['content', 'all'], queryFn: (params) => fetchContent(params) },
        { key: 'draft', label: 'Drafts', queryKey: ['content', 'draft'], queryFn: (params) => fetchContent(params, 'DRAFT') },
        { key: 'published', label: 'Published', queryKey: ['content', 'published'], queryFn: (params) => fetchContent(params, 'PUBLISHED') },
        { key: 'archived', label: 'Archived', queryKey: ['content', 'archived'], queryFn: (params) => fetchContent(params, 'ARCHIVED') },
    ];

    // =============================================
    // Filters
    // =============================================

    const filters: Array<ITableFilter> = [
        {
            key: 'type',
            label: 'Type',
            type: 'select',
            options: Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            placeholder: 'All Types',
        },
        {
            key: 'difficulty',
            label: 'Difficulty',
            type: 'select',
            options: Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({ value, label })),
            placeholder: 'All Levels',
        },
    ];

    // =============================================
    // Render
    // =============================================

    return (
        <>
            <div className='space-y-6'>
                <PageHeader title='Content' description='Manage your articles, tutorials, projects, and more' action={{ label: BUTTON_LABEL.CREATE, href: '/admin/content/new' }} />
                <DataTable<IContentListItem>
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
